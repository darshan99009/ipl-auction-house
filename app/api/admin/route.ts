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

function requireAdmin(caller: { role: string } | null) {
  if (!caller || !['super_admin', 'curator'].includes(caller.role)) return false
  return true
}

function requireSuperAdmin(caller: { role: string } | null) {
  if (!caller || caller.role !== 'super_admin') return false
  return true
}

// ── GET /api/admin — dashboard stats ────────────────────────
export async function GET(req: NextRequest) {
  const caller = getCaller(req)
  if (!requireAdmin(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServiceClient()

  const [users, rooms, players, bids, activeAuctions, recentLogs] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).neq('status', 'completed'),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bids').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'auction'),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    stats: {
      total_users:     users.count     ?? 0,
      active_rooms:    rooms.count     ?? 0,
      total_players:   players.count   ?? 0,
      total_bids:      bids.count      ?? 0,
      active_auctions: activeAuctions.count ?? 0,
    },
    recent_logs: recentLogs.data ?? [],
  })
}
