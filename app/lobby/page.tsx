'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Hash, Users, Clock, ChevronRight,
  Copy, Check, Globe, Lock, Link2, Loader2, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES, FRANCHISE_CODES } from '@/lib/utils/constants'
import type { FranchiseCode } from '@/types'
import clsx from 'clsx'

// ── Tabs ─────────────────────────────────────────────────────
type Tab = 'join' | 'create' | 'browse'

// ── Auction speed labels ──────────────────────────────────────
const SPEED_OPTIONS = [
  { value: 'blitz',   label: 'Blitz',   desc: '5s timer',  color: 'text-crimson' },
  { value: 'normal',  label: 'Normal',  desc: '10s timer', color: 'text-gold'    },
  { value: 'relaxed', label: 'Relaxed', desc: '20s timer', color: 'text-sky'     },
]

export default function LobbyPage() {
  const router    = useRouter()
  const { user }  = useAuthStore()
  const [tab, setTab]       = useState<Tab>('join')
  const [loading, setLoading] = useState(false)

  // Join state
  const [code, setCode]             = useState('')
  const [joinFranchise, setJoinFranchise] = useState<FranchiseCode | null>(null)

  // Create state
  const [roomName, setRoomName]     = useState('')
  const [accessType, setAccessType] = useState<'code' | 'link' | 'public'>('code')
  const [speed, setSpeed]           = useState('normal')
  const [budget, setBudget]         = useState(120)
  const [dynastyMode, setDynasty]   = useState(false)
  const [secretBudget, setSecret]   = useState(false)
  const [createdRoom, setCreatedRoom] = useState<{ code: string; invite_link?: string } | null>(null)

  // Browse state
  const [publicRooms, setPublicRooms] = useState<any[]>([])
  const [browsing, setBrowsing]       = useState(false)

  const canCreate = ['auctioneer', 'super_admin', 'curator'].includes(user?.role ?? '')

  // ── Fetch public rooms ──────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setBrowsing(true)
    try {
      const res  = await fetch('/api/rooms')
      const json = await res.json()
      setPublicRooms(json.rooms ?? [])
    } finally {
      setBrowsing(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'browse') fetchRooms()
  }, [tab, fetchRooms])

  // ── Join ────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!code.trim())    return toast.error('Enter a room code')
    if (!joinFranchise)  return toast.error('Pick your franchise')

    setLoading(true)
    try {
      const res  = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.toUpperCase(), franchise: joinFranchise }),
      })
      const json = await res.json()
      if (!res.ok) return toast.error(json.error ?? 'Failed to join')
      toast.success(`Joined ${json.room.name}! 🏏`)
      router.push(`/room/${json.room.id}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Create ──────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!roomName.trim()) return toast.error('Enter a room name')

    setLoading(true)
    try {
      const res  = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        roomName.trim(),
          access_type: accessType,
          settings: {
            auction_speed: speed,
            budget_cr:     budget,
            dynasty_mode:  dynastyMode,
            secret_budget: secretBudget,
            timer_seconds: speed === 'blitz' ? 5 : speed === 'relaxed' ? 20 : 10,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) return toast.error(json.error ?? 'Failed to create')

      setCreatedRoom(json.room)
      toast.success(`Room "${json.room.name}" created! 🎉`)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-void">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <span className="font-display text-xl text-gold tracking-wide">IPL AUCTION HOUSE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-sm hidden sm:block">{user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-gold">
              {user?.franchise ?? user?.name?.[0] ?? '?'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="font-display text-5xl sm:text-6xl text-text-primary tracking-wide">
            AUCTION <span className="text-gold text-glow-gold">LOBBY</span>
          </h1>
          <p className="text-text-secondary">Join an existing room or create your own auction</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-abyss rounded-2xl border border-border w-fit mx-auto">
          {[
            { id: 'join',   label: 'Join Room',    icon: Hash  },
            ...(canCreate ? [{ id: 'create', label: 'Create Room', icon: Plus  }] : []),
            { id: 'browse', label: 'Browse',       icon: Globe },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                tab === t.id
                  ? 'bg-gold text-void shadow-gold'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ─── JOIN TAB ─────────────────────────────────────── */}
          {tab === 'join' && (
            <motion.div key="join"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="max-w-lg mx-auto space-y-6"
            >
              <div className="glass rounded-2xl p-6 space-y-5">
                {/* Code input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Room Code</label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABCD12"
                    className="input-field text-center text-2xl font-display tracking-[0.3em] uppercase"
                    maxLength={6}
                  />
                </div>

                {/* Franchise picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Your Franchise</label>
                  <div className="grid grid-cols-5 gap-2">
                    {FRANCHISE_CODES.map(fc => {
                      const f = FRANCHISES[fc]
                      const selected = joinFranchise === fc
                      return (
                        <button key={fc} onClick={() => setJoinFranchise(fc)}
                          className={clsx(
                            'relative p-2 rounded-xl border text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1',
                            selected ? 'border-current' : 'border-border bg-surface/50 hover:border-border/80 text-text-secondary'
                          )}
                          style={selected ? { borderColor: f.color_primary, color: f.color_primary, backgroundColor: f.color_primary + '22' } : {}}
                        >
                          <span className="text-lg">{f.emoji}</span>
                          <span>{fc}</span>
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center">
                              <Check className="w-2 h-2 text-void" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading || code.length < 4 || !joinFranchise}
                  className="btn-gold w-full py-3.5"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</>
                    : <><span>Join Auction</span><ChevronRight className="w-5 h-5" /></>
                  }
                </button>
              </div>

              {/* Spectator option */}
              <p className="text-center text-text-muted text-sm">
                Want to watch only?{' '}
                <button className="text-sky hover:text-sky-400 transition-colors font-medium"
                  onClick={() => toast('Enter the room code above and join as spectator')}>
                  Join as spectator
                </button>
              </p>
            </motion.div>
          )}

          {/* ─── CREATE TAB ───────────────────────────────────── */}
          {tab === 'create' && canCreate && (
            <motion.div key="create"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              {createdRoom ? (
                // Success state
                <div className="glass rounded-2xl p-8 text-center space-y-6 animate-scale-in">
                  <div className="w-20 h-20 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center mx-auto shadow-gold">
                    <Trophy className="w-10 h-10 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-4xl text-text-primary">Room Created!</h3>
                    <p className="text-text-secondary mt-1">{roomName}</p>
                  </div>

                  {/* Room Code */}
                  <div className="bg-surface rounded-2xl p-5 space-y-3">
                    <p className="text-text-muted text-sm">Share this code with your friends</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-display text-5xl text-gold tracking-[0.4em] text-glow-gold">
                        {createdRoom.code}
                      </span>
                      <button onClick={() => copyCode(createdRoom.code)} className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors">
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                    {createdRoom.invite_link && (
                      <div className="flex items-center gap-2 bg-abyss rounded-xl p-3">
                        <Link2 className="w-4 h-4 text-sky flex-shrink-0" />
                        <span className="text-sky text-xs truncate flex-1">{createdRoom.invite_link}</span>
                        <button onClick={() => copyCode(createdRoom.invite_link!)} className="text-sky hover:text-sky-400 transition-colors flex-shrink-0">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/room/${createdRoom.code}`)}
                    className="btn-gold w-full py-3.5 text-base"
                  >
                    Enter Room <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                // Create form
                <div className="glass rounded-2xl p-6 space-y-6">
                  <h3 className="font-display text-2xl text-text-primary">New Auction Room</h3>

                  {/* Room name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Room Name</label>
                    <input value={roomName} onChange={e => setRoomName(e.target.value)}
                      placeholder="Weekend IPL Draft 2025"
                      className="input-field" maxLength={50} />
                  </div>

                  {/* Access type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Access Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'code',   label: 'Code Only',   icon: Hash,  desc: '6-char code' },
                        { value: 'link',   label: 'Invite Link', icon: Link2, desc: 'Shareable URL' },
                        { value: 'public', label: 'Public',      icon: Globe, desc: 'Listed lobby'  },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setAccessType(opt.value as typeof accessType)}
                          className={clsx(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all',
                            accessType === opt.value
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border bg-surface/50 text-text-secondary hover:border-border/80'
                          )}>
                          <opt.icon className="w-4 h-4" />
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-text-muted">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Auction Speed</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SPEED_OPTIONS.map(s => (
                        <button key={s.value} onClick={() => setSpeed(s.value)}
                          className={clsx(
                            'p-3 rounded-xl border text-sm transition-all text-center',
                            speed === s.value
                              ? 'border-gold bg-gold/10'
                              : 'border-border bg-surface/50 hover:border-border/80'
                          )}>
                          <span className={clsx('font-bold', speed === s.value ? 'text-gold' : s.color)}>{s.label}</span>
                          <span className="block text-text-muted text-xs mt-0.5">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      Budget per team: <span className="text-gold">₹{budget}Cr</span>
                    </label>
                    <input type="range" min={50} max={200} step={10} value={budget}
                      onChange={e => setBudget(Number(e.target.value))}
                      className="w-full accent-gold" />
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>₹50Cr</span><span>₹200Cr</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Dynasty Mode',   desc: 'Track across seasons', value: dynastyMode, set: setDynasty },
                      { label: 'Secret Budgets', desc: 'Hide team budgets',     value: secretBudget, set: setSecret },
                    ].map(toggle => (
                      <button key={toggle.label} onClick={() => toggle.set(!toggle.value)}
                        className={clsx(
                          'flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                          toggle.value ? 'border-gold bg-gold/10' : 'border-border bg-surface/50'
                        )}>
                        <div>
                          <div className={clsx('text-sm font-medium', toggle.value ? 'text-gold' : 'text-text-primary')}>{toggle.label}</div>
                          <div className="text-text-muted text-xs">{toggle.desc}</div>
                        </div>
                        <div className={clsx('w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
                          toggle.value ? 'bg-gold' : 'bg-muted')}>
                          <div className={clsx('absolute top-0.5 w-4 h-4 bg-void rounded-full transition-all',
                            toggle.value ? 'left-4' : 'left-0.5')} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <button onClick={handleCreate} disabled={loading || !roomName.trim()} className="btn-gold w-full py-3.5 text-base">
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                      : <><Plus className="w-5 h-5" /><span>Create Room</span></>
                    }
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── BROWSE TAB ───────────────────────────────────── */}
          {tab === 'browse' && (
            <motion.div key="browse"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl text-text-primary">Public Rooms</h3>
                <button onClick={fetchRooms} disabled={browsing}
                  className="btn-ghost px-3 py-2 text-sm gap-2">
                  <RefreshCw className={clsx('w-4 h-4', browsing && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              {browsing ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton h-20 rounded-2xl" />
                  ))}
                </div>
              ) : publicRooms.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Globe className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary">No public rooms open right now</p>
                  <p className="text-text-muted text-sm mt-1">Ask your friend to share the room code</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicRooms.map((room: any) => (
                    <button key={room.id} onClick={() => {
                      setCode(room.code)
                      setTab('join')
                    }} className="glass-hover rounded-2xl p-4 w-full flex items-center justify-between text-left">
                      <div className="space-y-1">
                        <div className="font-semibold text-text-primary">{room.name}</div>
                        <div className="flex items-center gap-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {room.room_members?.[0]?.count ?? 0} / 10
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(room.created_at).toLocaleDateString()}
                          </span>
                          <span className={clsx(
                            'badge text-xs',
                            room.status === 'waiting'   ? 'badge-emerald' :
                            room.status === 'retention' ? 'badge-gold' :
                            room.status === 'auction'   ? 'badge-flame' : 'badge-muted'
                          )}>
                            {room.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-gold tracking-widest">{room.code}</span>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
