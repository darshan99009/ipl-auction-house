'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, TrendingUp, TrendingDown, Globe2,
  Share2, Download, Crown, BarChart2, Users,
  ChevronDown, ChevronUp, Award, Loader2, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import { useAuctionStore } from '@/lib/store/auctionStore'
import clsx from 'clsx'
import type { FranchiseCode, SquadGrade } from '@/types'

const GRADE_COLORS: Record<SquadGrade, string> = {
  'A+': 'text-yellow-300',
  'A':  'text-gold',
  'B':  'text-sky',
  'C':  'text-flame',
  'D':  'text-crimson',
}

const GRADE_BG: Record<SquadGrade, string> = {
  'A+': 'bg-yellow-300/20 border-yellow-300/30',
  'A':  'bg-gold/20 border-gold/30',
  'B':  'bg-sky/20 border-sky/30',
  'C':  'bg-flame/20 border-flame/30',
  'D':  'bg-crimson/20 border-crimson/30',
}

export default function ResultsPage() {
  const params  = useParams()
  const router  = useRouter()
  const roomId  = params.id as string
  const { user } = useAuthStore()
  const store    = useAuctionStore()

  const [results, setResults]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'squads' | 'analytics'>('overview')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [sharing, setSharing]     = useState(false)
  const squadCardRef = useRef<HTMLDivElement>(null)

  const myFranchise = user?.franchise as FranchiseCode | undefined

  const fetchResults = useCallback(async () => {
    try {
      const res  = await fetch(`/api/auction/${roomId}/results`)
      const json = await res.json()
      setResults(json.results ?? store.results)
    } finally {
      setLoading(false)
    }
  }, [roomId, store.results])

  useEffect(() => {
    if (store.results) {
      setResults(store.results)
      setLoading(false)
    } else {
      fetchResults()
    }
  }, [store.results, fetchResults])

  const shareSquadCard = async () => {
    setSharing(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      if (!squadCardRef.current) return

      const canvas = await html2canvas(squadCardRef.current, {
        backgroundColor: '#060810',
        scale: 2,
      })

      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
      const url  = URL.createObjectURL(blob)

      const wa  = `https://wa.me/?text=${encodeURIComponent(`🏏 Check out my IPL Auction squad! Playing at ipl-auction-house.vercel.app`)}`

      // Download image
      const a = document.createElement('a')
      a.href  = url
      a.download = `${myFranchise}-squad.png`
      a.click()

      // Open WhatsApp
      window.open(wa, '_blank')
      toast.success('Squad card saved! Share on WhatsApp 🏏')
    } catch {
      toast.error('Failed to generate card')
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    )
  }

  if (!results) return null

  const { analytics = [], power_rankings = [], mvp_player, best_value, biggest_splurge } = results
  const myAnalytics = analytics.find((a: any) => a.franchise === myFranchise)
  const mySquad     = results.squads?.[myFranchise ?? ''] ?? []

  return (
    <div className="min-h-screen bg-void pb-16">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/lobby')} className="p-2 text-text-muted hover:text-text-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-display text-2xl text-gold">AUCTION COMPLETE</div>
              <div className="text-text-muted text-xs">Final Results & Analytics</div>
            </div>
          </div>
          <button onClick={shareSquadCard} disabled={sharing} className="btn-gold px-4 py-2 text-sm gap-2">
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share Squad
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-abyss rounded-2xl border border-border w-fit">
          {[
            { id: 'overview',  label: 'Overview'   },
            { id: 'squads',    label: 'Squads'     },
            { id: 'analytics', label: 'Analytics'  },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                'px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-gold text-void' : 'text-text-secondary hover:text-text-primary'
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ──────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Power Rankings */}
              <div className="space-y-3">
                <h2 className="font-display text-3xl text-text-primary">🏆 Power Rankings</h2>
                <div className="space-y-2">
                  {power_rankings.map((pr: any, i: number) => {
                    const prFc      = FRANCHISES[pr.franchise as FranchiseCode]
                    const prAnalytic = analytics.find((a: any) => a.franchise === pr.franchise)
                    const grade      = prAnalytic?.grade ?? 'C'
                    const isMe       = pr.franchise === myFranchise

                    return (
                      <motion.div key={pr.franchise}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={clsx(
                          'glass rounded-2xl p-4 flex items-center gap-4',
                          isMe && 'border-gold/30'
                        )}
                      >
                        {/* Rank */}
                        <div className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0',
                          i === 0 ? 'bg-yellow-300/20 text-yellow-300' :
                          i === 1 ? 'bg-slate-300/20 text-slate-300' :
                          i === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-surface text-text-muted'
                        )}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                        </div>

                        {/* Franchise */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl flex-shrink-0">{prFc.emoji}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary flex items-center gap-2">
                              {prFc.name}
                              {isMe && <span className="badge badge-gold text-xs">YOU</span>}
                            </div>
                            <div className="text-text-muted text-xs">{prAnalytic?.squad_count ?? 0} players · ₹{prAnalytic?.budget_spent ?? 0}Cr spent</div>
                          </div>
                        </div>

                        {/* Grade */}
                        <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center font-display text-2xl flex-shrink-0', GRADE_BG[grade as SquadGrade])}>
                          <span className={GRADE_COLORS[grade as SquadGrade]}>{grade}</span>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-2xl text-gold">{pr.score}</div>
                          <div className="text-text-muted text-xs">pts</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Highlights row */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: '🏅', label: 'Auction MVP', value: mvp_player?.name ?? '—', sub: 'Most contested player' },
                  { icon: '💰', label: 'Best Buy',    value: best_value?.player?.name ?? '—',      sub: `${best_value?.franchise ?? ''}` },
                  { icon: '💸', label: 'Biggest Splurge', value: biggest_splurge?.player?.name ?? '—', sub: `₹${biggest_splurge?.overpay ?? 0}Cr over base` },
                ].map(h => (
                  <div key={h.label} className="glass rounded-2xl p-5 space-y-2">
                    <div className="text-3xl">{h.icon}</div>
                    <div className="text-text-muted text-xs">{h.label}</div>
                    <div className="font-semibold text-text-primary">{h.value}</div>
                    <div className="text-text-muted text-xs">{h.sub}</div>
                  </div>
                ))}
              </div>

              {/* My Squad Card (shareable) */}
              {myAnalytics && (
                <div ref={squadCardRef}
                  className="glass rounded-2xl p-6 space-y-4"
                  style={{ border: `1px solid ${FRANCHISES[myFranchise!]?.color_primary}44` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{FRANCHISES[myFranchise!]?.emoji}</span>
                      <div>
                        <div className="font-display text-2xl" style={{ color: FRANCHISES[myFranchise!]?.color_primary }}>
                          {myFranchise}
                        </div>
                        <div className="text-text-muted text-xs">IPL Auction House 2025</div>
                      </div>
                    </div>
                    <div className={clsx('w-16 h-16 rounded-2xl border flex items-center justify-center font-display text-4xl', GRADE_BG[myAnalytics.grade])}>
                      <span className={GRADE_COLORS[myAnalytics.grade]}>{myAnalytics.grade}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Players',    value: myAnalytics.squad_count },
                      { label: 'Overseas',   value: myAnalytics.overseas_count },
                      { label: 'Remaining',  value: `₹${myAnalytics.budget_remaining}Cr` },
                    ].map(s => (
                      <div key={s.label} className="glass rounded-xl p-3 text-center">
                        <div className="font-display text-2xl text-gold">{s.value}</div>
                        <div className="text-text-muted text-xs">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {mySquad.map((sp: any) => (
                      <div key={sp.id} className="flex items-center gap-3 text-sm">
                        <div className={clsx('badge text-xs',
                          sp.players?.role === 'Batter'      ? 'badge-sky' :
                          sp.players?.role === 'Bowler'      ? 'badge-flame' :
                          sp.players?.role === 'All-Rounder' ? 'badge-emerald' : 'badge-gold'
                        )}>
                          {sp.players?.role?.split('-')[0]}
                        </div>
                        <span className="flex-1 text-text-primary truncate font-medium">{sp.players?.name}</span>
                        {sp.is_icon && <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                        {sp.is_retention && <span className="badge badge-muted text-xs">RET</span>}
                        {sp.is_rtm && <span className="badge badge-flame text-xs">RTM</span>}
                        <span className="text-gold text-xs font-display flex-shrink-0">₹{sp.price_paid}Cr</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── SQUADS ────────────────────────────────────── */}
          {activeTab === 'squads' && (
            <motion.div key="squads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {Object.entries(results.squads ?? {}).map(([franchise, squad]: [string, any]) => {
                const sFc    = FRANCHISES[franchise as FranchiseCode]
                const anal   = analytics.find((a: any) => a.franchise === franchise)
                const isOpen = expanded === franchise
                return (
                  <div key={franchise} className="glass rounded-2xl overflow-hidden">
                    <button onClick={() => setExpanded(isOpen ? null : franchise)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface/50 transition-colors">
                      <span className="text-2xl">{sFc.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary">{sFc.name}</div>
                        <div className="text-text-muted text-xs">{squad.length} players · ₹{anal?.budget_spent ?? 0}Cr</div>
                      </div>
                      <div className={clsx('w-10 h-10 rounded-xl border flex items-center justify-center font-display text-xl', GRADE_BG[anal?.grade ?? 'C'])}>
                        <span className={GRADE_COLORS[anal?.grade ?? 'C']}>{anal?.grade ?? 'C'}</span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden">
                          <div className="p-4 pt-0 space-y-1.5 border-t border-border">
                            {squad.map((sp: any) => (
                              <div key={sp.id} className="flex items-center gap-3 text-sm py-1">
                                <span className={clsx('badge text-xs',
                                  sp.players?.role === 'Batter'      ? 'badge-sky' :
                                  sp.players?.role === 'Bowler'      ? 'badge-flame' :
                                  sp.players?.role === 'All-Rounder' ? 'badge-emerald' : 'badge-gold'
                                )}>{sp.players?.role?.split('-')[0]}</span>
                                <span className="flex-1 text-text-primary truncate">{sp.players?.name}</span>
                                {sp.players?.nationality === 'Overseas' && <Globe2 className="w-3 h-3 text-sky" />}
                                {sp.is_icon && <Crown className="w-3 h-3 text-gold" />}
                                {sp.is_rtm && <span className="badge badge-flame text-xs">RTM</span>}
                                {sp.is_retention && <span className="badge badge-muted text-xs">RET</span>}
                                <span className="font-display text-gold text-sm">₹{sp.price_paid}Cr</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* ── ANALYTICS ─────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {analytics.map((anal: any) => {
                const aFc = FRANCHISES[anal.franchise as FranchiseCode]
                return (
                  <div key={anal.franchise} className="glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{aFc.emoji}</span>
                      <div className="flex-1">
                        <div className="font-display text-xl" style={{ color: aFc.color_primary }}>{anal.franchise}</div>
                      </div>
                      <div className={clsx('w-12 h-12 rounded-xl border flex items-center justify-center font-display text-2xl', GRADE_BG[anal.grade])}>
                        <span className={GRADE_COLORS[anal.grade]}>{anal.grade}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Spent',      value: `₹${anal.budget_spent}Cr` },
                        { label: 'Remaining',  value: `₹${anal.budget_remaining}Cr` },
                        { label: 'Players',    value: anal.squad_count },
                        { label: 'Overseas',   value: `${anal.overseas_count}/4` },
                      ].map(s => (
                        <div key={s.label} className="bg-surface rounded-xl p-3 text-center">
                          <div className="font-display text-xl text-gold">{s.value}</div>
                          <div className="text-text-muted text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Role breakdown */}
                    {anal.tier_breakdown && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(anal.tier_breakdown).filter(([,v]) => (v as number) > 0).map(([tier, count]) => (
                          <span key={tier} className="badge badge-muted text-xs">
                            {tier}: {count as number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
