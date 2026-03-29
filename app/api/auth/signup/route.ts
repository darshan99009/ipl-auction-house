import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const VALID_FRANCHISES = ['MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR']

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, franchise } = await req.json()

    // Validate
    if (!name || !email || !password || !franchise) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (!VALID_FRANCHISES.includes(franchise)) {
      return NextResponse.json({ error: 'Invalid franchise' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check email not taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name:          name.trim(),
        email:         email.toLowerCase().trim(),
        password_hash,
        franchise,
        role:          'team_owner',
      })
      .select('id, name, email, role, franchise')
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, franchise: user.franchise },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({ user })

    response.cookies.set('ipl_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
