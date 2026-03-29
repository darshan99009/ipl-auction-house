'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipForward, SkipBack,
  FastForward, ArrowLeft, Loader2, Clock,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import clsx from 'clsx'
import type { FranchiseCode } from '@/types'

export default function ReplayPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [events, setEvents]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [playing, setPlaying]     = useState(false)
  const [speed, setSpeed]         = useState(1)
  const [cursor, setCursor]       = useState(0)
  const [currentEvent, setCurrent] = useState<any>(null)
  const intervalRef               = useRef<NodeJS.Timeout | null>(null)

  const fetchReplay = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/auction/${roomId}/replay`)
      const json = await res.json()
      setEvents(json.events ?? [])
    } finally { setLoading(false) }
  }, [roomId])

  useEffect(() => { fetchReplay() }, [fetchReplay])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCursor(prev => {
          if (prev >= events.length - 1) {
            setPlaying(false)
            return prev
          }
          setCurrent(events[prev + 1])
          return prev + 1
        })
      }, 1500 / speed)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, speed, events])

  const jumpTo = (idx: number) => {
    setCursor(idx)
    setCurrent(events[idx])
  }

  const auctionEvents = events.filter(e =>
    ['auction:sold', 'auction:unsold', 'auction:bid_update'].includes(e.event_type)
  )

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-text-muted hover:text-text-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-display text-2xl text-text-primary">AUCTION REPLAY</div>
              <div className="text-text-muted text-xs">{events.length} events recorded</div>
            </div>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs">Speed</span>
            {[0.5, 1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={clsx(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  speed === s ? 'bg-gold text-void' : 'text-text-secondary hover:text-text-primary'
                )}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Current Event Display */}
        <AnimatePresence mode="wait">
          {currentEvent && (
            <motion.div key={cursor}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-6 text-center space-y-3"
            >
              {currentEvent.event_type === 'auction:sold' && (
                <>
                  <div className="font-display text-5xl text-gold text-glow-gold">SOLD!</div>
                  <div className="font-display text-3xl text-text-primary">
                    {currentEvent.payload?.player?.players?.name}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">
                      {FRANCHISES[currentEvent.payload?.franchise as FranchiseCode]?.emoji}
                    </span>
                    <span className="font-display text-2xl text-gold">
                      ₹{currentEvent.payload?.price}Cr
                    </span>
                  </div>
                </>
              )}
              {currentEvent.event_type === 'auction:unsold' && (
                <>
                  <div className="font-display text-4xl text-text-muted">UNSOLD</div>
                  <div className="font-display text-2xl text-text-secondary">
                    {currentEvent.payload?.player?.players?.name}
                  </div>
                </>
              )}
              {currentEvent.event_type === 'auction:bid_update' && (
                <>
                  <div className="font-display text-3xl text-sky">BID</div>
                  <div className="font-display text-2xl text-text-primary">
                    {currentEvent.payload?.player?.players?.name}
                  </div>
                  <div className="font-display text-4xl text-gold">
                    ₹{currentEvent.payload?.bid?.amount}Cr
                  </div>
                  <div className="text-text-secondary">
                    by {currentEvent.payload?.bid?.franchise}
                  </div>
                </>
              )}
              <div className="text-text-muted text-xs">
                {new Date(currentEvent.created_at).toLocaleTimeString()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Controls */}
        <div className="glass rounded-2xl p-5 space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <input type="range" min={0} max={events.length - 1} value={cursor}
              onChange={e => jumpTo(Number(e.target.value))}
              className="w-full accent-gold" />
            <div className="flex justify-between text-xs text-text-muted">
              <span>Event {cursor + 1}</span>
              <span>{events.length} total</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => jumpTo(Math.max(0, cursor - 1))}
              className="p-2.5 rounded-xl bg-surface hover:bg-muted transition-colors text-text-secondary hover:text-text-primary">
              <SkipBack className="w-5 h-5" />
            </button>

            <button onClick={() => setPlaying(!playing)}
              className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center shadow-gold hover:bg-gold-light transition-all">
              {playing
                ? <Pause className="w-6 h-6 text-void" />
                : <Play className="w-6 h-6 text-void ml-0.5" />
              }
            </button>

            <button onClick={() => jumpTo(Math.min(events.length - 1, cursor + 1))}
              className="p-2.5 rounded-xl bg-surface hover:bg-muted transition-colors text-text-secondary hover:text-text-primary">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Event Timeline */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-display text-xl text-text-primary">Timeline</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {auctionEvents.map((event, i) => {
              const isSold   = event.event_type === 'auction:sold'
              const isUnsold = event.event_type === 'auction:unsold'
              const fc       = isSold ? FRANCHISES[event.payload?.franchise as FranchiseCode] : null

              return (
                <button key={event.id}
                  onClick={() => jumpTo(events.indexOf(event))}
                  className={clsx(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl text-sm text-left transition-all',
                    events.indexOf(event) === cursor ? 'bg-gold/10 border border-gold/30' : 'hover:bg-surface/50'
                  )}>
                  <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                    isSold ? 'bg-gold' : isUnsold ? 'bg-text-muted' : 'bg-sky'
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-text-primary truncate">
                      {event.payload?.player?.players?.name ?? event.payload?.player?.players?.name}
                    </span>
                  </div>
                  {isSold && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span>{fc?.emoji}</span>
                      <span className="font-display text-gold">₹{event.payload?.price}Cr</span>
                    </div>
                  )}
                  {isUnsold && <span className="text-text-muted text-xs flex-shrink-0">Unsold</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
