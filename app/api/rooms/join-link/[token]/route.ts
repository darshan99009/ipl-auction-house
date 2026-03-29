import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string; franchise: string } }
  catch { return null }
}

// POST /api/rooms/join-link/[token]
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL!
  const linkUrl  = `${appUrl}/join/${params.token}`

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('invite_link', linkUrl)
    .single()

  if (!room) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })
  if (room.status === 'completed') return NextResponse.json({ error: 'This auction has ended' }, { status: 400 })

  // Check already joined
  const { data: existing } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', room.id)
    .eq('user_id', caller.id)
    .single()

  if (existing) return NextResponse.json({ room, already_joined: true })

  // Find first available bot slot
  const { data: botSlot } = await supabase
    .from('room_members')
    .select('id, franchise')
    .eq('room_id', room.id)
    .eq('is_bot', true)
    .limit(1)
    .single()

  if (!botSlot) return NextResponse.json({ error: 'Room is full' }, { status: 409 })

  await supabase.from('room_members')
    .update({ user_id: caller.id, is_bot: false, role: 'team_owner' })
    .eq('id', botSlot.id)

  return NextResponse.json({ room })
}
