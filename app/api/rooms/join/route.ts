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

// POST /api/rooms/join
export async function POST(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, franchise } = await req.json()

  if (!code?.trim())     return NextResponse.json({ error: 'Room code required' }, { status: 400 })
  if (!franchise)        return NextResponse.json({ error: 'Franchise required' }, { status: 400 })

  const supabase = createServiceClient()

  // Find room by code
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found. Check the code.' }, { status: 404 })
  if (room.status === 'completed') return NextResponse.json({ error: 'This auction has ended' }, { status: 400 })
  if (room.status === 'auction')   return NextResponse.json({ error: 'Auction already in progress — join as spectator' }, { status: 400 })

  // Check if already a member
  const { data: existing } = await supabase
    .from('room_members')
    .select('id, franchise')
    .eq('room_id', room.id)
    .eq('user_id', caller.id)
    .single()

  if (existing) {
    return NextResponse.json({ room, member: existing, already_joined: true })
  }

  // Check if franchise is available (not taken by human)
  const { data: franchiseTaken } = await supabase
    .from('room_members')
    .select('id, is_bot')
    .eq('room_id', room.id)
    .eq('franchise', franchise as FranchiseCode)
    .single()

  if (franchiseTaken && !franchiseTaken.is_bot) {
    return NextResponse.json({ error: 'This franchise is already taken by another player' }, { status: 409 })
  }

  // Replace bot slot or add new member
  if (franchiseTaken?.is_bot) {
    await supabase.from('room_members')
      .update({ user_id: caller.id, is_bot: false, role: 'team_owner' })
      .eq('id', franchiseTaken.id)
  } else {
    await supabase.from('room_members').insert({
      room_id:          room.id,
      user_id:          caller.id,
      franchise:        franchise as FranchiseCode,
      role:             'team_owner',
      budget_remaining: room.settings?.budget_cr ?? 120,
    })
  }

  const { data: member } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', caller.id)
    .single()

  return NextResponse.json({ room, member })
}
