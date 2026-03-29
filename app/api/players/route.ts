import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// GET /api/players?role=Batter&tier=Gold&nationality=Indian&search=Kohli&room_id=xxx
export async function GET(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const role        = searchParams.get('role')
  const tier        = searchParams.get('tier')
  const nationality = searchParams.get('nationality')
  const search      = searchParams.get('search')
  const room_id     = searchParams.get('room_id')

  const supabase = createServiceClient()

  // If room_id provided — return room's player pool with status
  if (room_id) {
    let q = supabase
      .from('room_players')
      .select('*, players(*)')
      .eq('room_id', room_id)

    if (role)   q = q.eq('players.role', role)
    if (tier)   q = q.eq('players.stock_tier', tier)

    const { data, error } = await q.order('reveal_order')
    if (error) return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
    return NextResponse.json({ players: data })
  }

  // Otherwise return global player list
  let q = supabase.from('players').select('*').eq('is_active', true)

  if (role)        q = q.eq('role', role)
  if (tier)        q = q.eq('stock_tier', tier)
  if (nationality) q = q.eq('nationality', nationality)
  if (search)      q = q.ilike('name', `%${search}%`)

  q = q.order('stock_tier').order('name')

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })

  return NextResponse.json({ players: data ?? [] })
}
