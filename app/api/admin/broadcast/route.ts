import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// POST /api/admin/broadcast
export async function POST(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || !['super_admin', 'curator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { message, room_id } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const io = (global as any).__io
  if (!io) return NextResponse.json({ error: 'Socket server not available' }, { status: 503 })

  if (room_id) {
    io.to(room_id).emit('admin:broadcast', { message, from: 'Admin' })
  } else {
    io.emit('admin:broadcast', { message, from: 'Admin' })
  }

  return NextResponse.json({ success: true })
}
