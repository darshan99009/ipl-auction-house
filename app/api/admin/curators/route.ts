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

// GET /api/admin/curators — list all curators
export async function GET(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email, role, is_active, created_at')
    .eq('role', 'curator')
    .order('created_at', { ascending: false })

  return NextResponse.json({ curators: data ?? [] })
}

// POST /api/admin/curators — create new curator account
export async function POST(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Check email not taken
  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email.toLowerCase()).single()
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 12)

  const { data: curator, error } = await supabase
    .from('users')
    .insert({ name: name.trim(), email: email.toLowerCase(), password_hash, role: 'curator' })
    .select('id, name, email, role')
    .single()

  if (error || !curator) return NextResponse.json({ error: 'Failed to create curator' }, { status: 500 })

  await supabase.from('audit_logs').insert({
    admin_id:   caller.id,
    admin_name: caller.id,
    action:     'create_curator',
    target:     curator.id,
    level:      'info',
    meta:       { name, email },
  })

  return NextResponse.json({ curator }, { status: 201 })
}

// DELETE /api/admin/curators — remove curator role
export async function DELETE(req: NextRequest) {
  const caller = getCaller(req)
  if (!caller || caller.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const { curator_id } = await req.json()
  const supabase        = createServiceClient()

  // Downgrade to team_owner instead of deleting
  await supabase.from('users')
    .update({ role: 'team_owner', updated_at: new Date().toISOString() })
    .eq('id', curator_id)

  await supabase.from('audit_logs').insert({
    admin_id:   caller.id,
    admin_name: caller.id,
    action:     'remove_curator',
    target:     curator_id,
    level:      'warning',
  })

  return NextResponse.json({ success: true })
}
