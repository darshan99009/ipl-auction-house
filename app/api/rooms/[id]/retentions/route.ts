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

// GET /api/rooms/[id]/retentions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('retentions')
    .select('*, players(*)')
    .eq('room_id', params.id)
    .order('created_at')

  return NextResponse.json({ retentions: data ?? [] })
}

// POST /api/rooms/[id]/retentions  — save a team's retentions
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Verify room + member
  const { data: room } = await supabase
    .from('rooms')
    .select('status, settings')
    .eq('id', params.id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'retention') return NextResponse.json({ error: 'Not in retention phase' }, { status: 400 })

  const { data: member } = await supabase
    .from('room_members')
    .select('franchise, budget_remaining')
    .eq('room_id', params.id)
    .eq('user_id', caller.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Not in this room' }, { status: 403 })

  const { retentions, icon_player_id } = await req.json() as {
    retentions: Array<{ player_id: string; cost: number }>
    icon_player_id?: string
  }

  const maxRetentions = room.settings?.max_retentions ?? 3
  if (retentions.length > maxRetentions) {
    return NextResponse.json({ error: `Max ${maxRetentions} retentions allowed` }, { status: 400 })
  }

  const franchise = member.franchise as FranchiseCode

  // Delete existing retentions for this franchise (allow re-saving)
  await supabase.from('retentions')
    .delete()
    .eq('room_id', params.id)
    .eq('franchise', franchise)

  // Calculate total retention cost
  const totalCost = retentions.reduce((sum, r) => sum + r.cost, 0)
  const newBudget = (room.settings?.budget_cr ?? 120) - totalCost

  if (newBudget < 0) {
    return NextResponse.json({ error: 'Retention cost exceeds budget' }, { status: 400 })
  }

  if (retentions.length > 0) {
    const rows = retentions.map((r, i) => ({
      room_id:   params.id,
      franchise,
      player_id: r.player_id,
      cost:      r.cost,
      is_icon:   r.player_id === icon_player_id,
      revealed:  false,
    }))

    const { error } = await supabase.from('retentions').insert(rows)
    if (error) return NextResponse.json({ error: 'Failed to save retentions' }, { status: 500 })
  }

  // Update member budget and icon player
  await supabase.from('room_members').update({
    budget_remaining: newBudget,
    icon_player_id:   icon_player_id ?? null,
  }).eq('room_id', params.id).eq('franchise', franchise)

  // Also add retained players to squads immediately
  if (retentions.length > 0) {
    const squadRows = retentions.map(r => ({
      room_id:      params.id,
      franchise,
      player_id:    r.player_id,
      price_paid:   r.cost,
      is_retention: true,
      is_icon:      r.player_id === icon_player_id,
    }))
    await supabase.from('squads').upsert(squadRows)

    // Remove retained players from room_players pool
    const playerIds = retentions.map(r => r.player_id)
    const { data: roomPlayers } = await supabase
      .from('room_players')
      .select('id')
      .eq('room_id', params.id)
      .in('player_id', playerIds)

    if (roomPlayers?.length) {
      await supabase.from('room_players')
        .update({ status: 'sold', sold_to: franchise })
        .in('id', roomPlayers.map(rp => rp.id))
    }
  }

  return NextResponse.json({ success: true, budget_remaining: newBudget })
}

// PATCH /api/rooms/[id]/retentions/confirm — all teams confirmed, start auction
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('host_id, status')
    .eq('id', params.id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const canConfirm = room.host_id === caller.id || ['super_admin', 'curator'].includes(caller.role)
  if (!canConfirm) return NextResponse.json({ error: 'Host only' }, { status: 403 })

  await supabase.from('rooms')
    .update({ status: 'auction', updated_at: new Date().toISOString() })
    .eq('id', params.id)

  const io = (global as any).__io
  if (io) io.to(params.id).emit('retention:all_revealed')

  return NextResponse.json({ success: true })
}
