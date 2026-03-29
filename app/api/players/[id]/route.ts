import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller || !['super_admin', 'curator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  await supabase.from('players').update({ is_active: false }).eq('id', params.id)

  return NextResponse.json({ success: true })
}
