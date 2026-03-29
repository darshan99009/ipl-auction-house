'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Check, X, Clock, Loader2,
  ArrowLeft, RefreshCw, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { FranchiseCode } from '@/types'

export default function TradesPage() {
  const params    = useParams()
  const router    = useRouter()
  const roomId    = params.id as string
  const { user }  = useAuthStore()

  const myFranchise = user?.franchise as FranchiseCode | undefined

  const [trades, setTrades]       = useState<any[]>([])
  const [mySquad, setMySquad]     = useState<any[]>([])
  const [allSquads, setAllSquads] = useState<Record<string, any[]>>({})
  const [loading, setLoading]     = useState(true)
  const [showPropose, setShowPropose] = useState(false)

  // Propose form state
  const [offeredPlayer, setOffered]         = useState<any>(null)
  const [targetFranchise, setTargetFranchise] = useState<FranchiseCode | null>(null)
  const [requestedPlayer, setRequested]     = useState<any>(null)
  const [proposing, setProposing]           = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tradesRes, resultsRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}/trades`),
        fetch(`/api/auction/${roomId}/results`),
      ])
      const [tradesJson, resultsJson] = await Promise.all([
        tradesRes.json(), resultsRes.json(),
      ])

      setTrades(tradesJson.trades ?? [])
      const squads = resultsJson.results?.squads ?? {}
      setAllSquads(squads)
      setMySquad(squads[myFranchise ?? ''] ?? [])
    } finally { setLoading(false) }
  }, [roomId, myFranchise])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (tradeId: string, action: 'accept' | 'reject' | 'cancel') => {
    const res = await fetch(`/api/rooms/${roomId}/trades`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ trade_id: tradeId, action }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error); return }
    toast.success(`Trade ${action}ed!`)
    fetchData()
  }

  const handlePropose = async () => {
    if (!offeredPlayer || !requestedPlayer || !targetFranchise) {
      toast.error('Select all trade details')
      return
    }
    setProposing(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/trades`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          offered_player_id:   offeredPlayer.player_id,
          requested_player_id: requestedPlayer.player_id,
          receiver_franchise:  targetFranchise,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Trade proposed!')
      setShowPropose(false)
      setOffered(null); setRequested(null); setTargetFranchise(null)
      fetchData()
    } finally { setProposing(false) }
  }

  const pendingIncoming = trades.filter(t => t.receiver_franchise === myFranchise && t.status === 'pending')
  const pendingOutgoing = trades.filter(t => t.proposer_franchise === myFranchise && t.status === 'pending')
  const resolved        = trades.filter(t => t.status !== 'pending')

  return (
    <div className="min-h-screen bg-void pb-16">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-text-muted hover:text-text-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-display text-2xl text-text-primary">TRADE CENTER</div>
              <div className="text-text-muted text-xs">Post-auction player swaps</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="btn-ghost px-3 py-2 text-sm gap-2">
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button onClick={() => setShowPropose(true)} className="btn-gold px-4 py-2 text-sm gap-2">
              <Plus className="w-4 h-4" /> Propose Trade
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── INCOMING TRADES ─────────────────────────────── */}
        {pendingIncoming.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-gold">
              Incoming Offers <span className="badge badge-gold text-sm">{pendingIncoming.length}</span>
            </h2>
            {pendingIncoming.map(trade => (
              <TradeCard key={trade.id} trade={trade} myFranchise={myFranchise}
                onAction={handleAction} />
            ))}
          </div>
        )}

        {/* ── OUTGOING TRADES ─────────────────────────────── */}
        {pendingOutgoing.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-sky">
              Sent Offers <span className="badge badge-sky text-sm">{pendingOutgoing.length}</span>
            </h2>
            {pendingOutgoing.map(trade => (
              <TradeCard key={trade.id} trade={trade} myFranchise={myFranchise}
                onAction={handleAction} />
            ))}
          </div>
        )}

        {/* ── RESOLVED TRADES ─────────────────────────────── */}
        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-text-secondary">Trade History</h2>
            {resolved.map(trade => (
              <TradeCard key={trade.id} trade={trade} myFranchise={myFranchise}
                onAction={handleAction} />
            ))}
          </div>
        )}

        {trades.length === 0 && !loading && (
          <div className="glass rounded-2xl p-16 text-center space-y-3">
            <ArrowLeftRight className="w-12 h-12 text-text-muted mx-auto" />
            <p className="text-text-secondary">No trades yet</p>
            <p className="text-text-muted text-sm">Propose a trade to swap players with another franchise</p>
          </div>
        )}
      </div>

      {/* ── PROPOSE TRADE MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showPropose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-lg space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl text-text-primary">Propose Trade</h3>
                <button onClick={() => setShowPropose(false)} className="text-text-muted hover:text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Pick your player */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Offer from your squad</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {mySquad.map((sp: any) => (
                    <button key={sp.player_id ?? sp.id}
                      onClick={() => setOffered(sp)}
                      className={clsx(
                        'p-2.5 rounded-xl border text-left text-sm transition-all',
                        offeredPlayer?.player_id === (sp.player_id ?? sp.id)
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border bg-surface/50 text-text-secondary hover:border-border/80'
                      )}>
                      <div className="font-medium truncate">{sp.players?.name}</div>
                      <div className="text-xs text-text-muted">{sp.players?.role} · ₹{sp.price_paid}Cr</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Pick target franchise */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Trade with</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(allSquads)
                    .filter(([fc]) => fc !== myFranchise)
                    .map(([fc]) => {
                      const f = FRANCHISES[fc as FranchiseCode]
                      return (
                        <button key={fc} onClick={() => { setTargetFranchise(fc as FranchiseCode); setRequested(null) }}
                          className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all',
                            targetFranchise === fc
                              ? 'border-current'
                              : 'border-border bg-surface/50 text-text-secondary'
                          )}
                          style={targetFranchise === fc ? { borderColor: f.color_primary, color: f.color_primary } : {}}>
                          <span>{f.emoji}</span>{fc}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Step 3: Pick their player */}
              {targetFranchise && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Request from {targetFranchise}</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {(allSquads[targetFranchise] ?? []).map((sp: any) => (
                      <button key={sp.player_id ?? sp.id}
                        onClick={() => setRequested(sp)}
                        className={clsx(
                          'p-2.5 rounded-xl border text-left text-sm transition-all',
                          requestedPlayer?.player_id === (sp.player_id ?? sp.id)
                            ? 'border-sky bg-sky/10 text-sky'
                            : 'border-border bg-surface/50 text-text-secondary hover:border-border/80'
                        )}>
                        <div className="font-medium truncate">{sp.players?.name}</div>
                        <div className="text-xs text-text-muted">{sp.players?.role} · ₹{sp.price_paid}Cr</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade summary */}
              {offeredPlayer && requestedPlayer && (
                <div className="glass rounded-xl p-4 flex items-center gap-3 text-sm">
                  <div className="flex-1 text-center">
                    <div className="text-text-muted text-xs mb-1">You give</div>
                    <div className="font-semibold text-gold">{offeredPlayer.players?.name}</div>
                  </div>
                  <ArrowLeftRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <div className="text-text-muted text-xs mb-1">You get</div>
                    <div className="font-semibold text-sky">{requestedPlayer.players?.name}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handlePropose} disabled={proposing || !offeredPlayer || !requestedPlayer}
                  className="btn-gold flex-1 py-3">
                  {proposing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowLeftRight className="w-4 h-4" /> Send Trade</>}
                </button>
                <button onClick={() => setShowPropose(false)} className="btn-ghost">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Trade Card ─────────────────────────────────────────────
function TradeCard({ trade, myFranchise, onAction }: {
  trade: any
  myFranchise?: FranchiseCode
  onAction: (id: string, action: 'accept' | 'reject' | 'cancel') => void
}) {
  const proposerFc = FRANCHISES[trade.proposer_franchise as FranchiseCode]
  const receiverFc = FRANCHISES[trade.receiver_franchise as FranchiseCode]
  const isIncoming = trade.receiver_franchise === myFranchise
  const isOutgoing = trade.proposer_franchise === myFranchise

  const statusStyles: Record<string, string> = {
    pending:   'badge-gold',
    accepted:  'badge-emerald',
    rejected:  'badge-crimson',
    cancelled: 'badge-muted',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span style={{ color: proposerFc?.color_primary }}>{trade.proposer_franchise}</span>
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span style={{ color: receiverFc?.color_primary }}>{trade.receiver_franchise}</span>
        </div>
        <span className={clsx('badge text-xs', statusStyles[trade.status])}>{trade.status}</span>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs mb-1">{trade.proposer_franchise} offers</div>
          <div className="font-semibold text-text-primary text-sm">{trade.offered_player?.name ?? '—'}</div>
          <div className="text-text-muted text-xs">{trade.offered_player?.role}</div>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-text-muted text-xs mb-1">{trade.receiver_franchise} gives</div>
          <div className="font-semibold text-text-primary text-sm">{trade.requested_player?.name ?? '—'}</div>
          <div className="text-text-muted text-xs">{trade.requested_player?.role}</div>
        </div>
      </div>

      {/* Actions */}
      {trade.status === 'pending' && (
        <div className="flex gap-2">
          {isIncoming && (
            <>
              <button onClick={() => onAction(trade.id, 'accept')}
                className="btn-gold flex-1 py-2 text-sm gap-1.5">
                <Check className="w-4 h-4" /> Accept
              </button>
              <button onClick={() => onAction(trade.id, 'reject')}
                className="btn-ghost flex-1 py-2 text-sm text-crimson border-crimson/30 hover:bg-crimson/10">
                <X className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {isOutgoing && (
            <button onClick={() => onAction(trade.id, 'cancel')}
              className="btn-ghost w-full py-2 text-sm text-text-muted">
              Cancel Offer
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
