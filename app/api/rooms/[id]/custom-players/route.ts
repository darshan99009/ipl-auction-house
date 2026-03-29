import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import type { PlayerRole, PlayerNationality, PlayerStatus, StockTier } from '@/types'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// POST /api/rooms/[id]/custom-players  — add custom players to a room
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  // Verify room exists and caller is a member
  const { data: room } = await supabase
    .from('rooms')
    .select('id, status, host_id, settings')
    .eq('id', params.id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Room already started' }, { status: 400 })

  const { data: member } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', params.id)
    .eq('user_id', caller.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Not in this room' }, { status: 403 })

  const { players } = await req.json() as {
    players: Array<{
      name: string
      role: PlayerRole
      nationality: PlayerNationality
      status: PlayerStatus
      stock_tier: StockTier
      base_price: number
      bowler_type?: string
      country?: string
      age?: number
    }>
  }

  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: 'No players provided' }, { status: 400 })
  }

  if (players.length > 30) {
    return NextResponse.json({ error: 'Max 30 custom players per request' }, { status: 400 })
  }

  // Validate each player
  const validRoles = ['Batter', 'Bowler', 'All-Rounder', 'WK-Batter']
  const validTiers = ['Icon', 'Platinum', 'Gold', 'Silver', 'Bronze']

  for (const p of players) {
    if (!p.name?.trim())              return NextResponse.json({ error: `Player name required` }, { status: 400 })
    if (!validRoles.includes(p.role)) return NextResponse.json({ error: `Invalid role: ${p.role}` }, { status: 400 })
    if (!validTiers.includes(p.stock_tier)) return NextResponse.json({ error: `Invalid tier: ${p.stock_tier}` }, { status: 400 })
    if (p.base_price < 0.20)          return NextResponse.json({ error: `Min base price is ₹0.20Cr` }, { status: 400 })
  }

  // Insert into global players table as custom
  const { data: inserted, error } = await supabase
    .from('players')
    .insert(players.map(p => ({
      name:         p.name.trim(),
      role:         p.role,
      nationality:  p.nationality ?? 'Indian',
      status:       p.status ?? 'Uncapped',
      stock_tier:   p.stock_tier,
      base_price:   p.base_price,
      bowler_type:  p.bowler_type ?? null,
      country:      p.country ?? 'India',
      age:          p.age ?? null,
      is_custom:    true,
      is_active:    true,
      created_by:   caller.id,
    })))
    .select()

  if (error || !inserted) return NextResponse.json({ error: 'Failed to add players' }, { status: 500 })

  // Add to room pool
  const { data: existingPool } = await supabase
    .from('room_players')
    .select('reveal_order')
    .eq('room_id', params.id)
    .order('reveal_order', { ascending: false })
    .limit(1)

  const lastOrder = existingPool?.[0]?.reveal_order ?? -1

  const roomPlayerInserts = inserted.map((p, i) => ({
    room_id:      params.id,
    player_id:    p.id,
    set_number:   1,
    reveal_order: lastOrder + i + 1,
    status:       'pending',
  }))

  await supabase.from('room_players').insert(roomPlayerInserts)

  return NextResponse.json({ added: inserted.length, players: inserted }, { status: 201 })
}
