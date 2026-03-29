import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// POST /api/rooms/[id]/start
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('host_id, status, settings')
    .eq('id', params.id)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const canStart = room.host_id === caller.id || ['super_admin', 'curator'].includes(caller.role)
  if (!canStart) return NextResponse.json({ error: 'Only the host can start' }, { status: 403 })

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'Room already started' }, { status: 400 })
  }

  // Move to retention phase if retentions allowed
  const maxRetentions = room.settings?.max_retentions ?? 3
  const nextStatus    = maxRetentions > 0 ? 'retention' : 'auction'

  await supabase.from('rooms')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  // Notify via Socket.IO
  const io = (global as any).__io
  if (io) {
    io.to(params.id).emit('room:status_changed', { status: nextStatus })
  }

  return NextResponse.json({ success: true, status: nextStatus })
}
