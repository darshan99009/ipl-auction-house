import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated
    const token = req.cookies.get('ipl_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let caller: { id: string; role: string }
    try {
      caller = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { user_id, new_password } = await req.json()

    // Users can only change their own password
    // Admins/curators can change anyone's password
    const canChangeOthers = ['super_admin', 'curator'].includes(caller.role)
    if (user_id !== caller.id && !canChangeOthers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!new_password || new_password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(new_password, 12)
    const supabase      = createServiceClient()

    const { error } = await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', user_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
