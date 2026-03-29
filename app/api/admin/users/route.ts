import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string } }
  catch { return null }
}

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || !['super_admin', 'curator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')
  const role   = searchParams.get('role')

  let q = supabase
    .from('users')
    .select('id, name, email, role, franchise, is_active, created_at')
    .order('created_at', { ascending: false })

  if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  if (role)   q = q.eq('role', role)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

// PATCH /api/admin/users — update role or reset password
export async function PATCH(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || !['super_admin', 'curator'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id, role, new_password } = await req.json()
  const supabase = createServiceClient()

  // Curators can only reset passwords, not change roles
  if (role && caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admin can change roles' }, { status: 403 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (role)         updates.role          = role
  if (new_password) updates.password_hash = await bcrypt.hash(new_password, 12)

  const { error } = await supabase.from('users').update(updates).eq('id', user_id)
  if (error) return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })

  // Log action
  await supabase.from('audit_logs').insert({
    admin_id:   caller.id,
    admin_name: caller.id,
    action:     new_password ? 'reset_user_password' : 'update_user_role',
    target:     user_id,
    level:      'info',
    meta:       { new_role: role },
  })

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/users
export async function DELETE(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const { user_id } = await req.json()
  const supabase    = createServiceClient()

  await supabase.from('users').delete().eq('id', user_id)

  await supabase.from('audit_logs').insert({
    admin_id:   caller.id,
    admin_name: caller.id,
    action:     'delete_user',
    target:     user_id,
    level:      'warning',
  })

  return NextResponse.json({ success: true })
}
