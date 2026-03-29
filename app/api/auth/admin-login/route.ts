import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 })
    }

    // Check against env vars (super admin)
    const envUsername     = process.env.ADMIN_USERNAME
    const envPasswordHash = process.env.ADMIN_PASSWORD_HASH

    if (envUsername && envPasswordHash && username === envUsername) {
      const valid = await bcrypt.compare(password, envPasswordHash)
      if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

      const token = jwt.sign(
        { id: 'env_admin', role: 'super_admin', username },
        process.env.JWT_SECRET!,
        { expiresIn: '12h' }
      )

      const response = NextResponse.json({ role: 'super_admin' })
      response.cookies.set('ipl_token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   60 * 60 * 12,
        path:     '/',
      })
      return response
    }

    // Check DB for curator admins
    const supabase = createServiceClient()
    const { data: user } = await supabase
      .from('users')
      .select('id, role, password_hash')
      .eq('email', username.toLowerCase())
      .in('role', ['super_admin', 'curator'])
      .single()

    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '12h' }
    )

    const response = NextResponse.json({ role: user.role })
    response.cookies.set('ipl_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 12,
      path:     '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
