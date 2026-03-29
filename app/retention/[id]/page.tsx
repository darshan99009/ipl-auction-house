'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Trophy, Check, X, ChevronRight,
  Loader2, Crown, Info, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES, RETENTION_COSTS } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { Player, FranchiseCode, Retention } from '@/types'

const COST_SLOTS = [
  { slot: 1, cost: 18, label: '1st Retention' },
  { slot: 2, cost: 14, label: '2nd Retention' },
  { slot: 3, cost: 11, label: '3rd Retention' },
]

export default function RetentionPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const { user } = useAuthStore()

  const [players, setPlayers]         = useState<Player[]>([])
  const [retentions, setRetentions]   = useState<Retention[]>([])
  const [selected, setSelected]       = useState<Array<{ player: Player; cost: number }>>([])
  const [iconPlayer, setIconPlayer]   = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [roomSettings, setRoomSettings] = useState<any>(null)
  const [isHost, setIsHost]           = useState(false)
  const [allSaved, setAllSaved]       = useState(false)
  const [starting, setStarting]       = useState(false)

  // Reveal ceremony state
  const [showCeremony, setShowCeremony] = useState(false)
  const [revealedIdx, setRevealedIdx]   = useState(-1)
  const [allRetentions, setAllRetentions] = useState<Retention[]>([])

  const myFranchise = user?.franchise as FranchiseCode | undefined
  const fc          = myFranchise ? FRANCHISES[myFranchise] : null
  const maxRet      = roomSettings?.max_retentions ?? 3
  const budgetCr    = roomSettings?.budget_cr ?? 120
  const retCost     = selected.reduce((s, r) => s + r.cost, 0)
  const remaining   = budgetCr - retCost

  // Load eligible players (from room pool)
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [poolRes, roomRes, retRes] = await Promise.all([
        fetch(`/api/players?room_id=${roomId}`),
        fetch(`/api/rooms/${roomId}`),
        fetch(`/api/rooms/${roomId}/retentions`),
      ])
      const [poolJson, roomJson, retJson] = await Promise.all([
        poolRes.json(), roomRes.json(), retRes.json(),
      ])

      setPlayers(poolJson.players?.map((rp: any) => rp.players).filter(Boolean) ?? [])
      setRoomSettings(roomJson.room?.settings)
      setIsHost(roomJson.room?.host_id === user?.id)
      setAllRetentions(retJson.retentions ?? [])

      // Check if my franchise already saved
      const myRet = (retJson.retentions ?? []).filter((r: Retention) => r.franchise === myFranchise)
      if (myRet.length > 0) {
        setSaved(true)
        setSelected(myRet.map((r: any) => ({ player: r.players, cost: r.cost })))
        setIconPlayer(myRet.find((r: Retention) => r.is_icon)?.player_id ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [roomId, user?.id, myFranchise])

  useEffect(() => { loadData() }, [loadData])

  // Check if all human teams have saved
  useEffect(() => {
    // Simplified check — if retentions exist for all non-bot franchises
    setAllSaved(allRetentions.length > 0)
  }, [allRetentions])

  const togglePlayer = (player: Player) => {
    if (saved) return
    const isSelected = selected.some(s => s.player.id === player.id)

    if (isSelected) {
      const newSel = selected.filter(s => s.player.id !== player.id)
      setSelected(newSel)
      if (iconPlayer === player.id) setIconPlayer(null)
    } else {
      if (selected.length >= maxRet) {
        toast.error(`Max ${maxRet} retentions allowed`)
        return
      }
      const slot = selected.length + 1
      const cost = COST_SLOTS[slot - 1]?.cost ?? 11
      setSelected(prev => [...prev, { player, cost }])
    }
  }

  const setIcon = (playerId: string) => {
    if (!selected.some(s => s.player.id === playerId)) return
    setIconPlayer(prev => prev === playerId ? null : playerId)
    toast(`${iconPlayer === playerId ? 'Icon removed' : '⭐ Icon player set!'}`)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/retentions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          retentions:     selected.map(s => ({ player_id: s.player.id, cost: s.cost })),
          icon_player_id: iconPlayer,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      setSaved(true)
      toast.success('Retentions confirmed! 🏏')
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const handleStartAuction = async () => {
    setStarting(true)
    // Show reveal ceremony first
    setShowCeremony(true)
    // Reveal one by one
    for (let i = 0; i < allRetentions.length; i++) {
      await new Promise(r => setTimeout(r, 1800))
      setRevealedIdx(i)
    }
    await new Promise(r => setTimeout(r, 2000))

    try {
      const res = await fetch(`/api/rooms/${roomId}/retentions`, { method: 'PATCH' })
      if (!res.ok) { toast.error('Failed to start auction'); return }
      router.push(`/auction/${roomId}`)
    } finally {
      setStarting(false)
    }
  }

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    )
  }

  // ── Reveal Ceremony ─────────────────────────────────────────
  if (showCeremony) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-display text-5xl text-gold text-glow-gold">RETENTION REVEAL</h1>
            <p className="text-text-secondary">Franchises reveal their retained stars</p>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {allRetentions.slice(0, revealedIdx + 1).map((ret, i) => {
                const retFc = FRANCHISES[ret.franchise]
                return (
                  <motion.div key={ret.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="glass rounded-2xl p-5 flex items-center gap-4"
                    style={{ borderColor: retFc.color_primary + '44' }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: retFc.color_primary + '33' }}>
                      {retFc.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-2xl" style={{ color: retFc.color_primary }}>
                        {ret.franchise}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary truncate">
                          {(ret as any).players?.name ?? 'Unknown'}
                        </span>
                        {ret.is_icon && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-display text-2xl text-gold">₹{ret.cost}Cr</div>
                      {ret.is_icon && <div className="badge badge-gold text-xs">ICON</div>}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {revealedIdx < allRetentions.length - 1 && (
              <div className="glass rounded-2xl p-5 flex items-center justify-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
                <span className="text-text-secondary">Revealing next retention…</span>
              </div>
            )}
          </div>

          {revealedIdx >= allRetentions.length - 1 && !starting && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-center">
              <p className="text-emerald text-lg font-semibold mb-4">All retentions revealed! Starting auction…</p>
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // ── Main Retention UI ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-void">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <div>
              <div className="font-semibold text-text-primary">Retention Phase</div>
              <div className="text-text-muted text-xs">Select up to {maxRet} players to retain</div>
            </div>
          </div>

          {/* Budget bar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="font-display text-2xl text-gold">₹{remaining}Cr</div>
              <div className="text-text-muted text-xs">remaining budget</div>
            </div>
            {fc && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: fc.color_primary + '33' }}>
                {fc.emoji}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Selected retentions ───────────────────── */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-text-primary">Your Retentions</h2>

            {/* Slots */}
            <div className="space-y-3">
              {COST_SLOTS.slice(0, maxRet).map((slot, i) => {
                const sel = selected[i]
                const isIcon = sel && iconPlayer === sel.player.id

                return (
                  <div key={slot.slot}
                    className={clsx(
                      'glass rounded-2xl p-4 transition-all duration-300',
                      sel ? 'border-gold/30' : 'border-dashed'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted text-xs">{slot.label}</span>
                      <span className="font-display text-lg text-gold">₹{slot.cost}Cr</span>
                    </div>

                    {sel ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary truncate flex items-center gap-2">
                            {sel.player.name}
                            {isIcon && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}
                          </div>
                          <div className="text-text-muted text-xs">{sel.player.role} · {sel.player.nationality}</div>
                        </div>
                        {!saved && (
                          <div className="flex gap-1">
                            <button onClick={() => setIcon(sel.player.id)}
                              className={clsx(
                                'p-1.5 rounded-lg transition-all',
                                isIcon ? 'bg-gold/20 text-gold' : 'text-text-muted hover:text-gold'
                              )}
                              title="Set as Icon Player">
                              <Star className="w-4 h-4" />
                            </button>
                            <button onClick={() => togglePlayer(sel.player)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-crimson transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-text-muted text-sm text-center py-2">
                        Click a player to retain →
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Info */}
            {iconPlayer && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20">
                <Crown className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <p className="text-gold text-xs">
                  Icon player is your franchise's star — revealed dramatically during the ceremony!
                </p>
              </div>
            )}

            {/* Save button */}
            {!saved ? (
              <button onClick={handleSave} disabled={saving}
                className="btn-gold w-full py-3">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Check className="w-4 h-4" /> Confirm Retentions</>
                }
              </button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald/10 border border-emerald/30">
                <Check className="w-4 h-4 text-emerald" />
                <span className="text-emerald text-sm font-medium">Retentions confirmed!</span>
              </div>
            )}

            {/* Host: start auction */}
            {isHost && saved && (
              <button onClick={handleStartAuction} disabled={starting}
                className="btn-flame w-full py-3 gap-2">
                {starting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Revealing…</>
                  : <><ChevronRight className="w-4 h-4" /> Start Auction</>
                }
              </button>
            )}

            {/* Other teams status */}
            <div className="space-y-2">
              <div className="text-text-muted text-xs font-medium">Team Status</div>
              {Object.values(FRANCHISES).map(f => {
                const hasRet = allRetentions.some(r => r.franchise === f.code)
                return (
                  <div key={f.code} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: hasRet ? '#00E676' : '#2A3A5A' }} />
                    <span className="text-text-secondary">{f.code}</span>
                    {hasRet && <span className="text-emerald text-xs ml-auto">✓ Saved</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right: Player list ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl text-text-primary flex-1">Player Pool</h2>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…" className="input-field py-2 w-48 text-sm" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <AnimatePresence>
                {filteredPlayers.map((player, i) => {
                  const isSelected = selected.some(s => s.player.id === player.id)
                  const selIdx     = selected.findIndex(s => s.player.id === player.id)
                  const isIcon     = iconPlayer === player.id

                  return (
                    <motion.button key={player.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => togglePlayer(player)}
                      disabled={saved}
                      className={clsx(
                        'glass rounded-xl p-4 text-left transition-all duration-200 w-full',
                        isSelected
                          ? 'border-gold/40 bg-gold/8'
                          : 'hover:border-border/80 hover:bg-surface/80',
                        saved && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary truncate">{player.name}</span>
                            {isIcon && <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-muted text-xs">{player.role}</span>
                            {player.nationality === 'Overseas' && (
                              <span className="badge badge-sky text-xs">Overseas</span>
                            )}
                            <span className="text-text-muted text-xs">{player.stock_tier}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {isSelected ? (
                            <div className="space-y-1">
                              <div className="font-display text-lg text-gold">
                                ₹{COST_SLOTS[selIdx]?.cost}Cr
                              </div>
                              <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center ml-auto">
                                <Check className="w-3 h-3 text-void" />
                              </div>
                            </div>
                          ) : (
                            <div className="text-text-muted text-sm">
                              ₹{player.base_price}Cr
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
