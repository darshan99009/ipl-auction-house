import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('ipl_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let caller: { id: string; role: string }
    try {
      caller = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!['super_admin', 'curator'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, new_password } = await req.json()

    // Admins can only change their own password via this route
    // (changing others is via /api/admin/users PATCH)
    if (user_id !== caller.id) {
      return NextResponse.json({ error: 'Use /api/admin/users to change other users passwords' }, { status: 400 })
    }

    if (!new_password || new_password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(new_password, 12)

    // For env-based admin (id === 'env_admin'), we can't update DB
    if (caller.id === 'env_admin') {
      return NextResponse.json({
        error: 'Env-based admin password must be updated via ADMIN_PASSWORD_HASH environment variable on Railway',
      }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', user_id)

    if (error) return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })

    // Log it
    await supabase.from('audit_logs').insert({
      admin_id:   caller.id,
      admin_name: caller.id,
      action:     'admin_changed_own_password',
      target:     user_id,
      level:      'info',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
