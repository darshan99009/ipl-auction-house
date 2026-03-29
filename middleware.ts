import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Routes that never need auth
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/admin-login']

// Role → allowed dashboard prefixes
const ROLE_HOME: Record<string, string> = {
  super_admin: '/dashboard/admin',
  curator:     '/dashboard/curator',
  auctioneer:  '/dashboard/auctioneer',
  team_owner:  '/dashboard/owner',
  spectator:   '/dashboard/spectator',
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes, static files, API, join links
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/join/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Read our JWT from the cookie
  const token = req.cookies.get('ipl_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const role = (payload as any).role as string

    // Redirect to correct dashboard if hitting /dashboard without sub-path
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/owner', req.url))
    }

    // Block wrong role accessing wrong dashboard
    if (pathname.startsWith('/dashboard/admin') && role !== 'super_admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/owner', req.url))
    }
    if (pathname.startsWith('/dashboard/curator') && !['super_admin', 'curator'].includes(role)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/dashboard/owner', req.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/auth/login', req.url))
    response.cookies.delete('ipl_token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
