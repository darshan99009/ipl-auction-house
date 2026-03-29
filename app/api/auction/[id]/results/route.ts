import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'
import { calculateGrade, calculatePowerScore } from '@/backend/engine/AuctionEngine'

function getCaller(req: NextRequest) {
  const token = req.cookies.get('ipl_token')?.value
  if (!token) return null
  try { return jwt.verify(token, process.env.JWT_SECRET!) as { id: string } }
  catch { return null }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = getCaller(req)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const [squadsRes, membersRes, roomRes] = await Promise.all([
    supabase.from('squads').select('*, players(*)').eq('room_id', params.id),
    supabase.from('room_members').select('*').eq('room_id', params.id),
    supabase.from('rooms').select('settings').eq('id', params.id).single(),
  ])

  const squads   = squadsRes.data  ?? []
  const members  = membersRes.data ?? []
  const settings = roomRes.data?.settings ?? {}

  // Group squads by franchise
  const squadsByFranchise: Record<string, typeof squads> = {}
  squads.forEach(s => {
    if (!squadsByFranchise[s.franchise]) squadsByFranchise[s.franchise] = []
    squadsByFranchise[s.franchise].push(s)
  })

  // Build analytics
  const analytics = Object.entries(squadsByFranchise).map(([franchise, squad]) => {
    const member  = members.find(m => m.franchise === franchise)
    const spent   = squad.reduce((sum, s) => sum + s.price_paid, 0)
    const tierMap = { Icon: 0, Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 } as Record<string, number>
    squad.forEach(s => { if (s.players?.stock_tier) tierMap[s.players.stock_tier]++ })

    const sortedByValue = [...squad].sort((a, b) =>
      (a.price_paid / (a.players?.base_price ?? 1)) - (b.price_paid / (b.players?.base_price ?? 1))
    )
    const sortedByPrice = [...squad].sort((a, b) => b.price_paid - a.price_paid)

    const grade = calculateGrade(squad, spent, settings)
    const score = calculatePowerScore(squad)

    return {
      franchise,
      grade,
      score,
      budget_spent:     spent,
      budget_remaining: member?.budget_remaining ?? 0,
      overseas_count:   member?.overseas_count ?? 0,
      squad_count:      squad.length,
      tier_breakdown:   tierMap,
      best_buy:         sortedByValue[0]?.players ?? null,
      biggest_splurge:  sortedByPrice[0]?.players ?? null,
    }
  })

  const sortedAnalytics = [...analytics].sort((a, b) => b.score - a.score)
  const powerRankings   = sortedAnalytics.map((a, i) => ({ franchise: a.franchise, rank: i + 1, score: a.score }))

  // MVP (most bids)
  const { data: allBids } = await supabase
    .from('bids').select('room_player_id').eq('room_id', params.id)
  const playerBids: Record<string, number> = {}
  allBids?.forEach(b => { playerBids[b.room_player_id] = (playerBids[b.room_player_id] ?? 0) + 1 })
  const mvpRpId = Object.entries(playerBids).sort((a, b) => b[1] - a[1])[0]?.[0]
  const { data: mvpRp } = mvpRpId
    ? await supabase.from('room_players').select('players(*)').eq('id', mvpRpId).single()
    : { data: null }

  return NextResponse.json({
    results: {
      room_id:        params.id,
      squads:         squadsByFranchise,
      analytics,
      power_rankings: powerRankings,
      mvp_player:     (mvpRp as any)?.players ?? null,
    },
  })
}
