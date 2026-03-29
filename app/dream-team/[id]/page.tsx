'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, ArrowLeft, Loader2, Crown, Globe2, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { FranchiseCode, PlayerRole } from '@/types'

const ROLE_SLOTS: Record<PlayerRole, number> = {
  'WK-Batter':   1,
  'Batter':      4,
  'All-Rounder': 2,
  'Bowler':      4,
}

const ROLE_COLORS: Record<PlayerRole, string> = {
  'Batter':      'badge-sky',
  'Bowler':      'badge-flame',
  'All-Rounder': 'badge-emerald',
  'WK-Batter':   'badge-gold',
}

export default function DreamTeamPage() {
  const params  = useParams()
  const router  = useRouter()
  const roomId  = params.id as string
  const { user } = useAuthStore()

  const [allPlayers, setAllPlayers] = useState<any[]>([])
  const [dreamTeam, setDreamTeam]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'All'>('All')
  const [communityTeam, setCommunityTeam] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/auction/${roomId}/results`)
      const json = await res.json()

      // Flatten all squad players with franchise info
      const flat: any[] = []
      Object.entries(json.results?.squads ?? {}).forEach(([franchise, squad]: [string, any]) => {
        squad.forEach((sp: any) => {
          flat.push({ ...sp, franchise })
        })
      })

      // Sort by price paid desc (proxy for auction value)
      flat.sort((a, b) => b.price_paid - a.price_paid)
      setAllPlayers(flat)

      // Auto-generate suggested dream team
      const suggested = autoSelectDreamTeam(flat)
      setDreamTeam(suggested)

      // Community team: most expensive 11 by role quota
      setCommunityTeam(suggested)
    } finally { setLoading(false) }
  }, [roomId])

  useEffect(() => { fetchData() }, [fetchData])

  const autoSelectDreamTeam = (players: any[]): any[] => {
    const team: any[] = []
    const slots = { ...ROLE_SLOTS }

    // Sort by price paid
    const sorted = [...players].sort((a, b) => b.price_paid - a.price_paid)

    for (const p of sorted) {
      const role = p.players?.role as PlayerRole
      if (role && slots[role] > 0) {
        team.push(p)
        slots[role]--
        if (team.length === 11) break
      }
    }
    return team
  }

  const togglePlayer = (sp: any) => {
    const role = sp.players?.role as PlayerRole
    const inTeam = dreamTeam.some(p => (p.player_id ?? p.id) === (sp.player_id ?? sp.id))

    if (inTeam) {
      setDreamTeam(prev => prev.filter(p => (p.player_id ?? p.id) !== (sp.player_id ?? sp.id)))
      return
    }

    if (dreamTeam.length >= 11) return

    // Check role quota
    const roleCount = dreamTeam.filter(p => p.players?.role === role).length
    const maxForRole = ROLE_SLOTS[role] ?? 0
    if (roleCount >= maxForRole) return

    setDreamTeam(prev => [...prev, sp])
  }

  const roleCount = (role: PlayerRole) => dreamTeam.filter(p => p.players?.role === role).length
  const totalCost = dreamTeam.reduce((sum, p) => sum + p.price_paid, 0)

  const filteredPlayers = roleFilter === 'All'
    ? allPlayers
    : allPlayers.filter(p => p.players?.role === roleFilter)

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pb-16">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-text-muted hover:text-text-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-display text-2xl text-text-primary">DREAM TEAM</div>
              <div className="text-text-muted text-xs">Build your best XI from all squads</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl text-gold">{dreamTeam.length}/11</div>
            <div className="text-text-muted text-xs">₹{totalCost.toFixed(2)}Cr total</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── DREAM TEAM SLOTS ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl text-text-primary">Your XI</h2>

            {/* Role quota indicators */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_SLOTS) as [PlayerRole, number][]).map(([role, max]) => (
                <div key={role} className={clsx(
                  'flex items-center justify-between p-2.5 rounded-xl border text-xs',
                  roleCount(role) === max ? 'border-emerald/30 bg-emerald/10' : 'border-border bg-surface/50'
                )}>
                  <span className={clsx('badge text-xs', ROLE_COLORS[role])}>{role.split('-')[0]}</span>
                  <span className={clsx('font-bold', roleCount(role) === max ? 'text-emerald' : 'text-text-muted')}>
                    {roleCount(role)}/{max}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected players */}
            <div className="space-y-2">
              <AnimatePresence>
                {dreamTeam.map((sp, i) => {
                  const fc = FRANCHISES[sp.franchise as FranchiseCode]
                  return (
                    <motion.div key={sp.player_id ?? sp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: fc?.color_primary + '33' }}>
                        {fc?.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary text-sm truncate">{sp.players?.name}</div>
                        <div className="text-text-muted text-xs">{sp.franchise} · ₹{sp.price_paid}Cr</div>
                      </div>
                      <button onClick={() => togglePlayer(sp)}
                        className="p-1 rounded-lg text-text-muted hover:text-crimson hover:bg-crimson/10 transition-all flex-shrink-0">
                        ✕
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {dreamTeam.length < 11 && (
                Array(11 - dreamTeam.length).fill(0).map((_, i) => (
                  <div key={i} className="glass rounded-xl p-3 border-dashed text-center text-text-muted text-sm">
                    Empty slot
                  </div>
                ))
              )}
            </div>

            {dreamTeam.length === 11 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-xl p-4 border-gold/30 bg-gold/5 text-center space-y-1">
                <div className="text-gold font-semibold">🏆 Dream Team Complete!</div>
                <div className="text-text-muted text-sm">Total cost: ₹{totalCost.toFixed(2)}Cr</div>
              </motion.div>
            )}
          </div>

          {/* ── PLAYER PICKER ────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-text-primary">All Players</h2>
              {/* Reset to suggested */}
              <button onClick={() => setDreamTeam(autoSelectDreamTeam(allPlayers))}
                className="btn-ghost px-3 py-1.5 text-xs gap-1.5">
                <Star className="w-3.5 h-3.5" /> Auto-Select
              </button>
            </div>

            {/* Role filter */}
            <div className="flex gap-2 flex-wrap">
              {(['All', 'WK-Batter', 'Batter', 'All-Rounder', 'Bowler'] as const).map(r => (
                <button key={r} onClick={() => setRoleFilter(r as any)}
                  className={clsx(
                    'badge text-xs cursor-pointer transition-all',
                    roleFilter === r
                      ? r === 'All' ? 'badge-gold' : ROLE_COLORS[r as PlayerRole]
                      : 'badge-muted'
                  )}>
                  {r}
                </button>
              ))}
            </div>

            {/* Player list */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filteredPlayers.map(sp => {
                const fc        = FRANCHISES[sp.franchise as FranchiseCode]
                const inTeam    = dreamTeam.some(p => (p.player_id ?? p.id) === (sp.player_id ?? sp.id))
                const role      = sp.players?.role as PlayerRole
                const canAdd    = !inTeam && dreamTeam.length < 11 &&
                                  roleCount(role) < (ROLE_SLOTS[role] ?? 0)

                return (
                  <button key={sp.player_id ?? sp.id}
                    onClick={() => togglePlayer(sp)}
                    disabled={!inTeam && !canAdd}
                    className={clsx(
                      'w-full glass rounded-xl p-3 flex items-center gap-3 text-left transition-all',
                      inTeam ? 'border-gold/40 bg-gold/8' :
                      canAdd ? 'hover:border-border/80 hover:bg-surface/80' :
                      'opacity-40 cursor-not-allowed'
                    )}>
                    {/* Franchise */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: fc?.color_primary + '33' }}>
                      {fc?.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary text-sm truncate">{sp.players?.name}</span>
                        {sp.players?.nationality === 'Overseas' && <Globe2 className="w-3 h-3 text-sky flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span style={{ color: fc?.color_primary }}>{sp.franchise}</span>
                        <span className={clsx('badge text-xs', ROLE_COLORS[role])}>{role?.split('-')[0]}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-display text-gold">₹{sp.price_paid}Cr</span>
                      {inTeam && <Check className="w-4 h-4 text-gold" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
