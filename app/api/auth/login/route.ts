import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role, franchise, avatar_url')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, franchise: user.franchise },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Set cookie + return user
    const response = NextResponse.json({
      user: {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        franchise: user.franchise,
      },
    })

    response.cookies.set('ipl_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
