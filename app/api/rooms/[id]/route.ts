import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// GET /api/rooms/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const { data: members } = await supabase
    .from('room_members')
    .select('*, users(name, avatar_url)')
    .eq('room_id', params.id)

  return NextResponse.json({ room, members: members ?? [] })
}

// DELETE /api/rooms/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: room } = await supabase.from('rooms').select('host_id').eq('id', params.id).single()
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const canDelete = room.host_id === caller.id || ['super_admin', 'curator'].includes(caller.role)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('rooms').delete().eq('id', params.id)
  return NextResponse.json({ success: true })
}
