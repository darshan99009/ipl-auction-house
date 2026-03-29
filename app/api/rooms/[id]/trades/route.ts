import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import type { FranchiseCode } from '@/types'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string; franchise: string } }
  catch { return null }
}

// GET /api/rooms/[id]/trades
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('trades')
    .select(`
      *,
      offered_player:players!trades_offered_player_id_fkey(id, name, role, stock_tier),
      requested_player:players!trades_requested_player_id_fkey(id, name, role, stock_tier)
    `)
    .eq('room_id', params.id)
    .order('proposed_at', { ascending: false })

  return NextResponse.json({ trades: data ?? [] })
}

// POST /api/rooms/[id]/trades — propose a trade
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Verify room is completed
  const { data: room } = await supabase
    .from('rooms').select('status').eq('id', params.id).single()
  if (!room || room.status !== 'completed') {
    return NextResponse.json({ error: 'Trades only available after auction ends' }, { status: 400 })
  }

  const { offered_player_id, requested_player_id, receiver_franchise } = await req.json()
  const proposerFranchise = caller.franchise as FranchiseCode

  if (!offered_player_id || !requested_player_id || !receiver_franchise) {
    return NextResponse.json({ error: 'Missing trade details' }, { status: 400 })
  }
  if (proposerFranchise === receiver_franchise) {
    return NextResponse.json({ error: 'Cannot trade with yourself' }, { status: 400 })
  }

  // Verify proposer owns offered player
  const { data: offeredOwn } = await supabase
    .from('squads')
    .select('id')
    .eq('room_id', params.id)
    .eq('franchise', proposerFranchise)
    .eq('player_id', offered_player_id)
    .single()
  if (!offeredOwn) return NextResponse.json({ error: 'You do not own this player' }, { status: 400 })

  // Verify receiver owns requested player
  const { data: requestedOwn } = await supabase
    .from('squads')
    .select('id')
    .eq('room_id', params.id)
    .eq('franchise', receiver_franchise)
    .eq('player_id', requested_player_id)
    .single()
  if (!requestedOwn) return NextResponse.json({ error: 'They do not own that player' }, { status: 400 })

  // Check no pending trade for same players
  const { data: existing } = await supabase
    .from('trades')
    .select('id')
    .eq('room_id', params.id)
    .eq('offered_player_id', offered_player_id)
    .eq('status', 'pending')
    .single()
  if (existing) return NextResponse.json({ error: 'A pending trade already exists for this player' }, { status: 409 })

  const { data: trade, error } = await supabase
    .from('trades')
    .insert({
      room_id:              params.id,
      proposer_franchise:   proposerFranchise,
      receiver_franchise,
      offered_player_id,
      requested_player_id,
      status:               'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to propose trade' }, { status: 500 })

  // Notify via socket
  const io = (global as any).__io
  if (io) io.to(params.id).emit('trade:proposed', trade)

  return NextResponse.json({ trade }, { status: 201 })
}

// PATCH /api/rooms/[id]/trades — accept or reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trade_id, action } = await req.json() as { trade_id: string; action: 'accept' | 'reject' | 'cancel' }
  const supabase = createServiceClient()

  const { data: trade } = await supabase
    .from('trades').select('*').eq('id', trade_id).single()
  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
  if (trade.status !== 'pending') return NextResponse.json({ error: 'Trade already resolved' }, { status: 400 })

  const myFranchise = caller.franchise

  // Cancel: proposer only
  if (action === 'cancel' && trade.proposer_franchise !== myFranchise) {
    return NextResponse.json({ error: 'Only proposer can cancel' }, { status: 403 })
  }
  // Accept/reject: receiver only
  if ((action === 'accept' || action === 'reject') && trade.receiver_franchise !== myFranchise) {
    return NextResponse.json({ error: 'Only receiver can accept or reject' }, { status: 403 })
  }

  await supabase.from('trades').update({
    status:      action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled',
    resolved_at: new Date().toISOString(),
  }).eq('id', trade_id)

  if (action === 'accept') {
    // Swap players in squads
    await Promise.all([
      supabase.from('squads')
        .update({ franchise: trade.receiver_franchise })
        .eq('room_id', params.id)
        .eq('franchise', trade.proposer_franchise)
        .eq('player_id', trade.offered_player_id),
      supabase.from('squads')
        .update({ franchise: trade.proposer_franchise })
        .eq('room_id', params.id)
        .eq('franchise', trade.receiver_franchise)
        .eq('player_id', trade.requested_player_id),
    ])

    const io = (global as any).__io
    if (io) io.to(params.id).emit('trade:accepted', { trade_id, trade })
  }

  return NextResponse.json({ success: true, action })
}
