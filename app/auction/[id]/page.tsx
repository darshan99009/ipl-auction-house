'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Mic, MicOff, MessageSquare, Smile, Gavel,
  Pause, Play, Star, Zap, ChevronRight, Crown, Globe2,
  Timer, TrendingUp, BarChart2, Settings, X, Volume2,
  AlertTriangle, ChevronDown, ChevronUp, Send, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { useSocket } from '@/lib/hooks/useSocket'
import { useVoiceChat } from '@/lib/hooks/useVoiceChat'
import { useAuctionStore } from '@/lib/store/auctionStore'
import { FRANCHISES } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { FranchiseCode, AuctionPlayer, Bid } from '@/types'

const EMOJIS = ['😱','🔥','💸','👏','😂','🏏','💰','🎉','😤','🤯','👑','❤️']

export default function AuctionPage() {
  const params  = useParams()
  const router  = useRouter()
  const roomId  = params.id as string
  const { user, token } = useAuthStore()

  const store   = useAuctionStore()
  const socket  = useSocket(token, roomId)
  const voice   = useVoiceChat(roomId, user?.id ?? '', user?.name ?? '')

  const myFranchise = user?.franchise as FranchiseCode | undefined
  const myMember    = store.members.find(m => m.franchise === myFranchise)
  const isAuctioneer = ['auctioneer','super_admin','curator'].includes(user?.role ?? '')
  const fc          = myFranchise ? FRANCHISES[myFranchise] : null

  // UI state
  const [chatOpen, setChatOpen]       = useState(false)
  const [chatMsg, setChatMsg]         = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [aucPanel, setAucPanel]       = useState(false)
  const [commentary, setCommentary]   = useState('')
  const [pauseMsg, setPauseMsg]       = useState('')
  const [loanOpen, setLoanOpen]       = useState(false)
  const [mySquad, setMySquad]         = useState<any[]>([])
  const [showBudgetAlarm, setShowBudgetAlarm] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Socket chat events
  useEffect(() => {
    const rawSocket = (socket as any).socket
    if (!rawSocket) return

    rawSocket.on('social:chat', (msg: any) => {
      setChatHistory(prev => [...prev, msg])
    })

    return () => { rawSocket.off('social:chat') }
  }, [socket])

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  // Budget alarm
  useEffect(() => {
    if (store.budget_alarms[myFranchise ?? '']) {
      setShowBudgetAlarm(true)
      setTimeout(() => setShowBudgetAlarm(false), 5000)
    }
  }, [store.budget_alarms, myFranchise])

  // Redirect when ended
  useEffect(() => {
    if (store.phase === 'ended') router.push(`/results/${roomId}`)
  }, [store.phase, roomId, router])

  const sendChat = () => {
    if (!chatMsg.trim()) return
    socket.chat(chatMsg.trim())
    setChatMsg('')
  }

  const player   = store.current_player
  const playerData = (player as any)?.players
  const isHotseat  = store.is_hotseat
  const isBidding  = store.phase === 'bidding'
  const isPaused   = store.is_paused
  const amHighest  = store.bid_history[0]?.franchise === myFranchise
  const canBid     = isBidding && !isPaused && !amHighest &&
                     (myMember?.budget_remaining ?? 0) >= (player?.current_price ?? 0)

  // Timer color
  const timerColor = store.timer <= 3 ? 'text-crimson' : store.timer <= 7 ? 'text-flame' : 'text-gold'

  return (
    <div className="min-h-screen bg-void flex flex-col overflow-hidden">

      {/* ── TOP NAV BAR ─────────────────────────────────────── */}
      <div className="border-b border-border bg-abyss/90 backdrop-blur-xl z-40 flex-shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">

          {/* Franchise badge */}
          {fc && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: fc.color_primary + '22', border: `1px solid ${fc.color_primary}44` }}>
              <span className="text-lg">{fc.emoji}</span>
              <div>
                <div className="font-display text-base leading-none" style={{ color: fc.color_primary }}>{myFranchise}</div>
                <div className="text-xs text-text-muted">₹{myMember?.budget_remaining ?? 0}Cr left</div>
              </div>
            </div>
          )}

          {/* Sold counter */}
          <div className="glass rounded-xl px-3 py-1.5 flex-shrink-0">
            <div className="text-xs text-text-muted">Sold</div>
            <div className="font-display text-base text-gold leading-none">{store.sold_count}</div>
          </div>

          {/* Overseas */}
          <div className="glass rounded-xl px-3 py-1.5 flex-shrink-0">
            <div className="text-xs text-text-muted">Overseas</div>
            <div className="font-display text-base text-sky leading-none">
              {myMember?.overseas_count ?? 0}/4
            </div>
          </div>

          <div className="flex-1" />

          {/* Status */}
          {isPaused && (
            <div className="badge badge-flame text-xs animate-pulse">PAUSED</div>
          )}
          {store.bidding_war && (
            <div className="badge badge-crimson text-xs hidden sm:flex">
              🔥 {store.bidding_war.f1} vs {store.bidding_war.f2}
            </div>
          )}

          {/* Controls */}
          <button onClick={() => setChatOpen(!chatOpen)}
            className={clsx('p-2 rounded-xl transition-colors', chatOpen ? 'bg-sky/20 text-sky' : 'text-text-muted hover:text-text-secondary')}>
            <MessageSquare className="w-5 h-5" />
          </button>

          <button onClick={() => voice.isConnected ? voice.disconnect() : voice.connect()}
            className={clsx('p-2 rounded-xl transition-colors', voice.isConnected ? 'bg-emerald/20 text-emerald' : 'text-text-muted hover:text-text-secondary')}>
            {voice.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {voice.isConnected && (
            <button onClick={voice.toggleMute}
              className={clsx('p-2 rounded-xl', voice.isMuted ? 'bg-crimson/20 text-crimson' : 'bg-emerald/20 text-emerald')}>
              {voice.isMuted ? <MicOff className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {isAuctioneer && (
            <button onClick={() => setAucPanel(!aucPanel)}
              className={clsx('p-2 rounded-xl transition-colors', aucPanel ? 'bg-gold/20 text-gold' : 'text-text-muted hover:text-gold')}>
              <Gavel className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── NEWS TICKER ─────────────────────────────────────── */}
      {store.headlines.length > 0 && (
        <div className="bg-gold/10 border-b border-gold/20 py-1.5 overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3 px-4">
            <span className="badge badge-gold text-xs flex-shrink-0">LIVE</span>
            <div className="overflow-hidden flex-1">
              <div className="animate-ticker whitespace-nowrap text-gold text-sm">
                {store.headlines.join('   ·   ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAUSED OVERLAY ──────────────────────────────────── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/70 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="glass rounded-2xl p-8 text-center space-y-4 max-w-sm">
              <Pause className="w-12 h-12 text-gold mx-auto" />
              <h2 className="font-display text-3xl text-text-primary">Auction Paused</h2>
              {store.pause_message && (
                <p className="text-text-secondary">{store.pause_message}</p>
              )}
              {isAuctioneer && (
                <button onClick={() => socket.pause(false)} className="btn-gold w-full">
                  <Play className="w-4 h-4" /> Resume
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BUDGET ALARM ────────────────────────────────────── */}
      <AnimatePresence>
        {showBudgetAlarm && (
          <motion.div initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-crimson/90 backdrop-blur rounded-2xl px-6 py-3 flex items-center gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                ⚠️ Budget below ₹{store.budget_alarms[myFranchise ?? '']}Cr!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── CENTER: AUCTION STAGE ───────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 min-w-0">

          {/* Player Card */}
          <div className="flex-1 flex items-center justify-center w-full max-w-sm">
            <AnimatePresence mode="wait">
              {player && playerData ? (
                <motion.div key={player.id}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0,  opacity: 1 }}
                  exit={{ rotateY: -90,    opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={clsx(
                    'w-full glass rounded-3xl p-6 space-y-5 relative overflow-hidden',
                    store.is_spotlight && 'animate-pulse-gold',
                    amHighest && isBidding && 'border-emerald/40'
                  )}
                >
                  {/* Bg glow */}
                  <div className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${fc?.color_primary ?? '#FFB800'} 0%, transparent 70%)` }} />

                  {/* Tier badge */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className={clsx(
                      'badge text-xs border',
                      playerData.stock_tier === 'Icon'     ? 'text-yellow-300 border-yellow-300/40 bg-yellow-300/10' :
                      playerData.stock_tier === 'Platinum' ? 'text-slate-300 border-slate-300/40 bg-slate-300/10' :
                      playerData.stock_tier === 'Gold'     ? 'badge-gold' :
                      playerData.stock_tier === 'Silver'   ? 'text-gray-400 border-gray-400/30 bg-gray-400/10' :
                                                             'text-amber-600 border-amber-600/30 bg-amber-600/10'
                    )}>
                      {playerData.stock_tier === 'Icon' && <Crown className="w-3 h-3" />}
                      {playerData.stock_tier}
                    </span>

                    {playerData.nationality === 'Overseas' && (
                      <span className="badge badge-sky text-xs"><Globe2 className="w-3 h-3" /> Overseas</span>
                    )}
                  </div>

                  {/* Player name */}
                  <div className="relative z-10 text-center space-y-1">
                    <h2 className="font-display text-4xl text-text-primary leading-none">{playerData.name}</h2>
                    <p className="text-text-secondary text-sm">{playerData.country}</p>
                  </div>

                  {/* Role badges */}
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <span className={clsx('badge text-sm',
                      playerData.role === 'Batter'      ? 'badge-sky' :
                      playerData.role === 'Bowler'      ? 'badge-flame' :
                      playerData.role === 'All-Rounder' ? 'badge-emerald' : 'badge-gold'
                    )}>
                      {playerData.role}
                    </span>
                    {playerData.bowler_type && (
                      <span className="badge badge-muted text-sm">{playerData.bowler_type}</span>
                    )}
                    {playerData.ipl_team && (
                      <span className="badge badge-muted text-sm">{playerData.ipl_team}</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="relative z-10 text-center">
                    <div className={clsx(
                      'font-display text-6xl transition-all duration-300',
                      store.bid_history.length > 0 ? 'text-gold text-glow-gold' : 'text-text-primary'
                    )}>
                      ₹{player.current_price}Cr
                    </div>
                    <div className="text-text-muted text-xs mt-1">
                      Base ₹{playerData.base_price}Cr · {player.bid_count} bids
                    </div>
                  </div>

                  {/* Highest bidder */}
                  {store.bid_history[0] && (
                    <motion.div key={store.bid_history[0].id}
                      initial={{ backgroundColor: '#FFB80033' }}
                      animate={{ backgroundColor: 'transparent' }}
                      transition={{ duration: 0.5 }}
                      className="relative z-10 flex items-center justify-between p-3 rounded-xl bg-surface"
                    >
                      <span className="text-text-muted text-sm">Highest bidder</span>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg" style={{
                          color: FRANCHISES[store.bid_history[0].franchise]?.color_primary
                        }}>
                          {store.bid_history[0].franchise}
                        </span>
                        {amHighest && <span className="badge badge-emerald text-xs">YOU</span>}
                      </div>
                    </motion.div>
                  )}

                  {/* Sold overlay */}
                  {store.phase === 'sold' && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-void/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 z-20">
                      <div className="font-display text-5xl text-gold text-glow-gold">SOLD!</div>
                      {player.sold_to && (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{FRANCHISES[player.sold_to as FranchiseCode]?.emoji}</span>
                          <span className="font-display text-2xl" style={{ color: FRANCHISES[player.sold_to as FranchiseCode]?.color_primary }}>
                            {player.sold_to}
                          </span>
                        </div>
                      )}
                      <div className="font-display text-3xl text-gold">₹{player.current_price}Cr</div>
                    </motion.div>
                  )}

                  {store.phase === 'unsold' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-void/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 z-20">
                      <div className="font-display text-5xl text-text-muted">UNSOLD</div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="glass rounded-3xl p-12 text-center space-y-4 w-full">
                  <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
                  <p className="text-text-secondary">Next player incoming…</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── TIMER + BID BUTTON ────────────────────── */}
          <div className="w-full max-w-sm space-y-4">

            {/* Timer */}
            {isBidding && (
              <div className="flex items-center justify-center gap-3">
                <Timer className="w-5 h-5 text-text-muted" />
                <span className={clsx(
                  'font-display text-6xl transition-all duration-500',
                  timerColor,
                  isHotseat && 'animate-timer-pulse scale-110'
                )}>
                  {store.timer}
                </span>
                {store.is_accelerated && (
                  <span className="badge badge-flame text-xs"><Zap className="w-3 h-3" /> ACCEL</span>
                )}
              </div>
            )}

            {/* BID BUTTON */}
            {isBidding && !isAuctioneer && (
              <motion.button
                onClick={socket.bid}
                disabled={!canBid}
                whileTap={{ scale: 0.95 }}
                className={clsx(
                  'w-full py-5 rounded-2xl font-display text-3xl tracking-wide transition-all duration-200',
                  canBid
                    ? 'bg-gold text-void hover:bg-gold-light shadow-gold'
                    : amHighest
                    ? 'bg-emerald/20 border border-emerald/40 text-emerald cursor-not-allowed'
                    : 'bg-surface border border-border text-text-muted cursor-not-allowed'
                )}
              >
                {amHighest ? '✓ HIGHEST BIDDER' : canBid ? 'BID NOW' : 'CANNOT BID'}
              </motion.button>
            )}

            {/* RTM & Loan */}
            {!isAuctioneer && store.phase === 'sold' && player?.sold_to !== myFranchise && !myMember?.rtm_used && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={socket.useRTM}
                className="btn-flame w-full py-3 gap-2">
                ↩️ Use RTM Card
              </motion.button>
            )}

            {!isAuctioneer && !myMember?.loan_used && (myMember?.budget_remaining ?? 0) < 10 && (
              <button onClick={() => setLoanOpen(true)}
                className="btn-ghost w-full py-2.5 text-sm gap-2">
                💰 Emergency Loan
              </button>
            )}
          </div>

          {/* ── EMOJI REACTIONS ────────────────────────── */}
          <div className="flex gap-2 flex-wrap justify-center">
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => socket.react(emoji)}
                className="w-9 h-9 rounded-xl bg-surface hover:bg-muted transition-all text-xl active:scale-90">
                {emoji}
              </button>
            ))}
          </div>

          {/* ── LIVE REACTIONS FLOATING ─────────────────── */}
          <AnimatePresence>
            {/* Reactions float up — handled via CSS animation */}
          </AnimatePresence>
        </div>

        {/* ── RIGHT SIDEBAR ───────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-72 border-l border-border bg-abyss/60 overflow-hidden flex-shrink-0">

          {/* Bid history */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-text-muted text-xs font-medium px-1 sticky top-0 bg-abyss/80 py-1">
              Bid History
            </div>
            <AnimatePresence>
              {store.bid_history.slice(0, 30).map((bid: Bid, i) => {
                const bidFc = FRANCHISES[bid.franchise]
                return (
                  <motion.div key={bid.id}
                    initial={{ opacity: 0, x: 20, backgroundColor: '#FFB80033' }}
                    animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                    className="flex items-center gap-2 p-2 rounded-xl text-sm"
                  >
                    <span className="text-base flex-shrink-0">{bidFc?.emoji}</span>
                    <span className="flex-1 truncate font-medium" style={{ color: bidFc?.color_primary }}>
                      {bid.franchise}
                    </span>
                    <span className="font-display text-gold flex-shrink-0">₹{bid.amount}Cr</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Teams budget strip */}
          <div className="border-t border-border p-3 space-y-1.5 flex-shrink-0">
            <div className="text-text-muted text-xs font-medium">Budgets</div>
            {store.members.filter(m => !m.is_bot).map(m => {
              const mFc  = FRANCHISES[m.franchise]
              const pct  = (m.budget_remaining / (store.room?.settings?.budget_cr ?? 120)) * 100
              return (
                <div key={m.franchise} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: mFc?.color_primary }}>{m.franchise}</span>
                    <span className="text-text-muted">₹{m.budget_remaining}Cr</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: mFc?.color_primary }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CHAT PANEL ──────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-abyss border-l border-border z-40 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Chat</h3>
              <button onClick={() => setChatOpen(false)} className="text-text-muted hover:text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatHistory.map((msg: any) => {
                const msgFc = FRANCHISES[msg.franchise as FranchiseCode]
                return (
                  <div key={msg.id} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: msgFc?.color_primary }}>
                        {msg.franchise}
                      </span>
                      <span className="text-text-muted text-xs">{msg.user_name}</span>
                    </div>
                    <div className="text-text-primary text-sm bg-surface rounded-xl px-3 py-2">
                      {msg.message}
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Message…" className="input-field py-2 text-sm flex-1" />
              <button onClick={sendChat} className="btn-gold px-3 py-2">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AUCTIONEER PANEL ────────────────────────────────── */}
      <AnimatePresence>
        {aucPanel && isAuctioneer && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-abyss border-t border-gold/30 z-40 p-4 shadow-gold">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-gold flex items-center gap-2">
                  <Gavel className="w-5 h-5" /> Auctioneer Controls
                </h3>
                <button onClick={() => setAucPanel(false)} className="text-text-muted hover:text-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => socket.extendTimer(5)} className="btn-ghost py-2 text-sm gap-1.5">
                  <Timer className="w-4 h-4" /> +5 Seconds
                </button>
                <button onClick={() => socket.spotlight(player?.players?.id ?? '')} className="btn-ghost py-2 text-sm gap-1.5">
                  <Star className="w-4 h-4" /> Spotlight
                </button>
                <button onClick={socket.confetti} className="btn-ghost py-2 text-sm gap-1.5">
                  🎉 Confetti
                </button>
                <button
                  onClick={() => socket.pause(!isPaused, isPaused ? undefined : pauseMsg)}
                  className={clsx('py-2 text-sm gap-1.5', isPaused ? 'btn-gold' : 'btn-ghost')}>
                  {isPaused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
                </button>
              </div>
              {!isPaused && (
                <div className="flex gap-2">
                  <input value={pauseMsg} onChange={e => setPauseMsg(e.target.value)}
                    placeholder="Pause message (optional)…"
                    className="input-field py-2 text-sm flex-1" />
                </div>
              )}
              <div className="flex gap-2">
                <input value={commentary} onChange={e => setCommentary(e.target.value)}
                  placeholder="Live commentary…"
                  className="input-field py-2 text-sm flex-1" />
                <button onClick={() => { socket.commentary(commentary); setCommentary('') }}
                  className="btn-gold px-4 py-2 text-sm">
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMMENTARY TICKER ───────────────────────────────── */}
      {store.commentary.length > 0 && (
        <div className="border-t border-border bg-surface/50 px-4 py-1.5 flex items-center gap-3 flex-shrink-0">
          <span className="badge badge-flame text-xs flex-shrink-0">🎙️</span>
          <span className="text-text-secondary text-sm truncate">
            {store.commentary[store.commentary.length - 1]?.text}
          </span>
        </div>
      )}
    </div>
  )
}
