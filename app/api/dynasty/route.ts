import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string } }
  catch { return null }
}

// GET /api/dynasty?user_id=xxx
export async function GET(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId  = req.nextUrl.searchParams.get('user_id') ?? caller.id
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('dynasty')
    .select('*')
    .eq('user_id', userId)
    .order('season', { ascending: false })

  return NextResponse.json({ records: data ?? [] })
}
