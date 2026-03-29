'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, Globe2, Flag, Star, X, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FRANCHISES } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { Player, PlayerRole, StockTier, FranchiseCode } from '@/types'

const ROLES: PlayerRole[]  = ['Batter', 'Bowler', 'All-Rounder', 'WK-Batter']
const TIERS: StockTier[]   = ['Icon', 'Platinum', 'Gold', 'Silver', 'Bronze']
const TIER_COLORS: Record<StockTier, string> = {
  Icon:     'text-yellow-300 border-yellow-300/40 bg-yellow-300/10',
  Platinum: 'text-slate-300 border-slate-300/40 bg-slate-300/10',
  Gold:     'text-gold border-gold/40 bg-gold/10',
  Silver:   'text-gray-400 border-gray-400/40 bg-gray-400/10',
  Bronze:   'text-amber-600 border-amber-600/40 bg-amber-600/10',
}
const ROLE_COLORS: Record<PlayerRole, string> = {
  'Batter':      'badge-sky',
  'Bowler':      'badge-flame',
  'All-Rounder': 'badge-emerald',
  'WK-Batter':   'badge-gold',
}

interface AddPlayerModal {
  show:     boolean
  roomId:   string | null
}

function PlayerCard({ player, onAdd, roomId }: { player: Player; onAdd?: () => void; roomId?: string }) {
  const fc = FRANCHISES[player.ipl_team as FranchiseCode]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-hover rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Player info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar placeholder */}
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-display text-lg font-bold"
            style={fc ? { backgroundColor: fc.color_primary + '33', color: fc.color_primary } : { backgroundColor: '#1E2A40', color: '#8899BB' }}>
            {player.name[0]}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-text-primary truncate">{player.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {player.nationality === 'Overseas' && (
                <Globe2 className="w-3 h-3 text-sky flex-shrink-0" />
              )}
              <span className="text-text-muted text-xs truncate">{player.country}</span>
              {player.ipl_team && (
                <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ backgroundColor: fc?.color_primary + '33', color: fc?.color_primary }}>
                  {player.ipl_team}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Base price */}
        <div className="text-right flex-shrink-0">
          <div className="font-display text-xl text-gold">₹{player.base_price}Cr</div>
          <div className="text-text-muted text-xs">Base</div>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx('badge text-xs', ROLE_COLORS[player.role])}>{player.role}</span>
        {player.bowler_type && (
          <span className="badge badge-muted text-xs">{player.bowler_type}</span>
        )}
        <span className={clsx('badge text-xs border', TIER_COLORS[player.stock_tier])}>{player.stock_tier}</span>
        <span className={clsx('badge text-xs', player.status === 'Capped' ? 'badge-emerald' : 'badge-muted')}>
          {player.status}
        </span>
        {player.age && <span className="badge badge-muted text-xs">{player.age}y</span>}
      </div>

      {/* Add to custom pool */}
      {roomId && onAdd && (
        <button onClick={onAdd} className="btn-ghost w-full py-2 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add to Pool
        </button>
      )}
    </motion.div>
  )
}

function PlayerPoolContent() {
  const searchParams    = useSearchParams()
  const roomId          = searchParams.get('room_id')

  const [players, setPlayers]   = useState<Player[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState<PlayerRole | ''>('')
  const [tierFilter, setTier]   = useState<StockTier | ''>('')
  const [natFilter, setNat]     = useState<'Indian' | 'Overseas' | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  // Custom player add modal
  const [addModal, setAddModal] = useState(false)
  const [newPlayer, setNewPlayer] = useState({
    name: '', role: 'Batter' as PlayerRole, nationality: 'Indian' as 'Indian'|'Overseas',
    status: 'Uncapped' as 'Capped'|'Uncapped', stock_tier: 'Silver' as StockTier,
    base_price: 0.50, country: 'India',
  })
  const [addLoading, setAddLoading] = useState(false)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)     params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (tierFilter) params.set('tier', tierFilter)
    if (natFilter)  params.set('nationality', natFilter)
    if (roomId)     params.set('room_id', roomId)

    try {
      const res  = await fetch(`/api/players?${params}`)
      const json = await res.json()
      setPlayers(json.players ?? [])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, tierFilter, natFilter, roomId])

  useEffect(() => {
    const t = setTimeout(fetchPlayers, 300)
    return () => clearTimeout(t)
  }, [fetchPlayers])

  const activeFilters = [roleFilter, tierFilter, natFilter].filter(Boolean).length

  const handleAddCustom = async () => {
    if (!newPlayer.name.trim()) return toast.error('Player name required')
    if (!roomId) return

    setAddLoading(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/custom-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: [newPlayer] }),
      })
      const json = await res.json()
      if (!res.ok) return toast.error(json.error)
      toast.success(`${newPlayer.name} added to pool!`)
      setAddModal(false)
      setNewPlayer({ name: '', role: 'Batter', nationality: 'Indian', status: 'Uncapped', stock_tier: 'Silver', base_price: 0.50, country: 'India' })
      fetchPlayers()
    } finally {
      setAddLoading(false)
    }
  }

  // Stats
  const overseas  = players.filter(p => p.nationality === 'Overseas').length
  const byTier    = TIERS.reduce((acc, t) => { acc[t] = players.filter(p => p.stock_tier === t).length; return acc }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-void pb-16">
      {/* Sticky header */}
      <div className="border-b border-border bg-abyss/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search players…"
                className="input-field pl-9 py-2.5" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={clsx('btn-ghost gap-2 py-2.5 flex-shrink-0',
                activeFilters > 0 && 'border-gold text-gold')}>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold text-void text-xs font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Add custom player (room context only) */}
            {roomId && (
              <button onClick={() => setAddModal(true)} className="btn-flame gap-2 py-2.5 flex-shrink-0">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Player</span>
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden mt-3 pt-3 border-t border-border space-y-3">
              <div className="flex flex-wrap gap-2">
                {/* Role */}
                <div className="flex gap-1.5 flex-wrap">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(roleFilter === r ? '' : r)}
                      className={clsx('badge text-xs cursor-pointer transition-all',
                        roleFilter === r ? ROLE_COLORS[r] : 'badge-muted')}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="w-px bg-border mx-1" />
                {/* Tier */}
                <div className="flex gap-1.5 flex-wrap">
                  {TIERS.map(t => (
                    <button key={t} onClick={() => setTier(tierFilter === t ? '' : t)}
                      className={clsx('badge text-xs border cursor-pointer transition-all',
                        tierFilter === t ? TIER_COLORS[t] : 'badge-muted')}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="w-px bg-border mx-1" />
                {/* Nationality */}
                <div className="flex gap-1.5">
                  {(['Indian', 'Overseas'] as const).map(n => (
                    <button key={n} onClick={() => setNat(natFilter === n ? '' : n)}
                      className={clsx('badge text-xs cursor-pointer transition-all',
                        natFilter === n ? (n === 'Overseas' ? 'badge-sky' : 'badge-emerald') : 'badge-muted')}>
                      {n === 'Overseas' ? <><Globe2 className="w-3 h-3" />{n}</> : <><Flag className="w-3 h-3" />{n}</>}
                    </button>
                  ))}
                </div>

                {activeFilters > 0 && (
                  <button onClick={() => { setRole(''); setTier(''); setNat('') }}
                    className="badge badge-crimson cursor-pointer text-xs">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Stats bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-text-muted text-sm">{loading ? '…' : players.length} players</span>
          <span className="text-text-muted text-xs">|</span>
          <span className="flex items-center gap-1 text-sky text-sm">
            <Globe2 className="w-3.5 h-3.5" /> {overseas} overseas
          </span>
          {TIERS.map(t => byTier[t] > 0 && (
            <span key={t} className={clsx('badge text-xs border', TIER_COLORS[t])}>
              {byTier[t]} {t}
            </span>
          ))}
        </div>

        {/* Player grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Search className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No players found</p>
            <p className="text-text-muted text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map(p => (
              <PlayerCard key={p.id} player={p} roomId={roomId ?? undefined} />
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Player Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-text-primary">Add Custom Player</h3>
              <button onClick={() => setAddModal(false)} className="text-text-muted hover:text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input value={newPlayer.name} onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
                placeholder="Player name" className="input-field" />

              <div className="grid grid-cols-2 gap-3">
                <select value={newPlayer.role} onChange={e => setNewPlayer(p => ({ ...p, role: e.target.value as PlayerRole }))}
                  className="input-field">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={newPlayer.stock_tier} onChange={e => setNewPlayer(p => ({ ...p, stock_tier: e.target.value as StockTier }))}
                  className="input-field">
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newPlayer.nationality} onChange={e => setNewPlayer(p => ({ ...p, nationality: e.target.value as 'Indian'|'Overseas' }))}
                  className="input-field">
                  <option value="Indian">Indian</option>
                  <option value="Overseas">Overseas</option>
                </select>
                <input type="number" min={0.20} step={0.20} value={newPlayer.base_price}
                  onChange={e => setNewPlayer(p => ({ ...p, base_price: Number(e.target.value) }))}
                  placeholder="Base price Cr"
                  className="input-field" />
              </div>

              <input value={newPlayer.country} onChange={e => setNewPlayer(p => ({ ...p, country: e.target.value }))}
                placeholder="Country" className="input-field" />
            </div>

            <button onClick={handleAddCustom} disabled={addLoading} className="btn-gold w-full">
              {addLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add to Pool'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default function PlayerPoolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>}>
      <PlayerPoolContent />
    </Suspense>
  )
}
