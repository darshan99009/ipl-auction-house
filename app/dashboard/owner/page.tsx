'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, History, User, KeyRound, LogOut,
  Plus, Hash, ChevronRight, Star, Crown,
  Globe2, Loader2, Calendar, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import ChangePassword from '@/components/auth/ChangePassword'
import clsx from 'clsx'
import type { FranchiseCode } from '@/types'

type Tab = 'home' | 'dynasty' | 'profile' | 'password'

export default function OwnerDashboard() {
  const router = useRouter()
  const { user, clearUser } = useAuthStore()
  const [tab, setTab]       = useState<Tab>('home')
  const [dynasty, setDynasty] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const myFranchise = user?.franchise as FranchiseCode | undefined
  const fc          = myFranchise ? FRANCHISES[myFranchise] : null

  const fetchDynasty = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/dynasty?user_id=${user?.id}`)
      const json = await res.json()
      setDynasty(json.records ?? [])
    } finally { setLoading(false) }
  }, [user?.id])

  useEffect(() => {
    if (tab === 'dynasty') fetchDynasty()
  }, [tab, fetchDynasty])

  const handleQuickJoin = async () => {
    if (joinCode.length < 4) return toast.error('Enter a valid room code')
    router.push(`/lobby?code=${joinCode.toUpperCase()}`)
  }

  const TABS = [
    { id: 'home',     label: 'Home',     icon: Trophy   },
    { id: 'dynasty',  label: 'Dynasty',  icon: History  },
    { id: 'profile',  label: 'Profile',  icon: User     },
    { id: 'password', label: 'Password', icon: KeyRound },
  ]

  return (
    <div className="min-h-screen bg-void">
      {/* Top nav */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Franchise badge */}
          {fc && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: fc.color_primary + '22', border: `1px solid ${fc.color_primary}44` }}>
              <span className="text-2xl">{fc.emoji}</span>
              <div>
                <div className="font-display text-lg leading-none" style={{ color: fc.color_primary }}>
                  {myFranchise}
                </div>
                <div className="text-text-muted text-xs">{user?.name}</div>
              </div>
            </div>
          )}

          {/* Tab nav */}
          <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as Tab)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tab === t.id ? 'bg-gold text-void' : 'text-text-secondary hover:text-text-primary'
                )}>
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <button onClick={() => { clearUser(); router.push('/') }}
            className="p-2 text-text-muted hover:text-crimson transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* ── HOME ────────────────────────────────────── */}
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6">

              {/* Welcome */}
              <div className="glass rounded-2xl p-6 space-y-2"
                style={{ borderColor: fc?.color_primary + '44' }}>
                <h1 className="font-display text-5xl text-text-primary">
                  Welcome back,
                </h1>
                <h1 className="font-display text-5xl" style={{ color: fc?.color_primary }}>
                  {myFranchise}!
                </h1>
                <p className="text-text-secondary">{fc?.full_name}</p>
              </div>

              {/* Quick actions */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Quick join */}
                <div className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                    <Hash className="w-4 h-4" /> Quick Join
                  </div>
                  <div className="flex gap-2">
                    <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Room code" maxLength={6}
                      className="input-field font-display tracking-widest text-center text-xl uppercase flex-1" />
                    <button onClick={handleQuickJoin} className="btn-gold px-4">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Browse rooms */}
                <div className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                    <Trophy className="w-4 h-4" /> Lobby
                  </div>
                  <p className="text-text-secondary text-sm">Browse public rooms or create your own auction.</p>
                  <button onClick={() => router.push('/lobby')} className="btn-gold w-full gap-2">
                    Open Lobby <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Franchise info */}
              {fc && (
                <div className="glass rounded-2xl p-5 space-y-4">
                  <h2 className="font-display text-2xl text-text-primary">Your Franchise</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Aggression',  value: `${fc.aggression}%` },
                      { label: 'Max Bid',     value: `${fc.max_multiplier}x base` },
                      { label: 'Preferred',   value: fc.preferred_role },
                      { label: 'Role',        value: user?.role ?? 'team_owner' },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-xl p-3 text-center">
                        <div className="font-display text-xl" style={{ color: fc.color_primary }}>{s.value}</div>
                        <div className="text-text-muted text-xs mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── DYNASTY ─────────────────────────────────── */}
          {tab === 'dynasty' && (
            <motion.div key="dynasty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              <h1 className="font-display text-4xl text-text-primary">Dynasty History</h1>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
              ) : dynasty.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center space-y-3">
                  <History className="w-12 h-12 text-text-muted mx-auto" />
                  <p className="text-text-secondary">No dynasty records yet</p>
                  <p className="text-text-muted text-sm">Play an auction with Dynasty Mode enabled</p>
                  <button onClick={() => router.push('/lobby')} className="btn-gold mt-2">
                    Find a Room
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dynasty.map((record: any, i: number) => (
                    <motion.div key={record.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-2xl p-5 space-y-4">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 badge badge-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            Season {record.season}
                          </div>
                          <div className="flex items-center gap-1.5 badge badge-muted">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Rank #{record.power_rank}
                          </div>
                        </div>
                        <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center font-display text-2xl',
                          record.grade === 'A+' ? 'bg-yellow-300/20 border-yellow-300/30 text-yellow-300' :
                          record.grade === 'A'  ? 'bg-gold/20 border-gold/30 text-gold' :
                          record.grade === 'B'  ? 'bg-sky/20 border-sky/30 text-sky' :
                          record.grade === 'C'  ? 'bg-flame/20 border-flame/30 text-flame' :
                                                  'bg-crimson/20 border-crimson/30 text-crimson'
                        )}>
                          {record.grade}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Points',  value: record.dynasty_points },
                          { label: 'Spent',   value: `₹${record.budget_spent}Cr` },
                          { label: 'Players', value: record.squad_json?.length ?? 0 },
                        ].map(s => (
                          <div key={s.label} className="glass rounded-xl p-3 text-center">
                            <div className="font-display text-2xl text-gold">{s.value}</div>
                            <div className="text-text-muted text-xs">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Squad preview */}
                      <div className="flex gap-1.5 flex-wrap">
                        {(record.squad_json ?? []).slice(0, 8).map((sp: any) => (
                          <span key={sp.id} className="badge badge-muted text-xs">
                            {sp.players?.name?.split(' ').pop()}
                            {sp.is_icon && <Crown className="w-2.5 h-2.5 text-gold ml-1" />}
                          </span>
                        ))}
                        {(record.squad_json ?? []).length > 8 && (
                          <span className="badge badge-muted text-xs">+{(record.squad_json ?? []).length - 8} more</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PROFILE ─────────────────────────────────── */}
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-md">
              <h1 className="font-display text-4xl text-text-primary">Profile</h1>
              <div className="glass rounded-2xl p-6 space-y-4">
                {[
                  { label: 'Name',      value: user?.name },
                  { label: 'Email',     value: user?.email },
                  { label: 'Role',      value: user?.role },
                  { label: 'Franchise', value: user?.franchise ?? '—' },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-text-muted text-sm">{f.label}</span>
                    <span className="text-text-primary font-medium">{f.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── PASSWORD ────────────────────────────────── */}
          {tab === 'password' && (
            <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-md">
              <h1 className="font-display text-4xl text-text-primary">Change Password</h1>
              <ChangePassword type="user" userId={user?.id ?? ''} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
