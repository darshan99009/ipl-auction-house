'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Users, Copy, ExternalLink, Play, Settings,
  Bot, User2, Wifi, WifiOff, ChevronRight, Plus, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import { FRANCHISES } from '@/lib/utils/constants'
import { useSocket } from '@/lib/hooks/useSocket'
import clsx from 'clsx'
import type { Room, RoomMember, FranchiseCode } from '@/types'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const { user, token } = useAuthStore()

  const [room, setRoom]       = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const socket = useSocket(token, roomId)

  // ── Fetch room state ─────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    try {
      const res  = await fetch(`/api/rooms/${roomId}`)
      const json = await res.json()
      if (!res.ok) { toast.error('Room not found'); router.push('/lobby'); return }
      setRoom(json.room)
      setMembers(json.members ?? [])
    } finally {
      setLoading(false)
    }
  }, [roomId, router])

  useEffect(() => { fetchRoom() }, [fetchRoom])

  // Redirect if auction starts
  useEffect(() => {
    if (room?.status === 'auction')   router.push(`/auction/${roomId}`)
    if (room?.status === 'retention') router.push(`/retention/${roomId}`)
  }, [room?.status, roomId, router])

  const isHost      = room?.host_id === user?.id
  const myFranchise = members.find(m => m.user_id === user?.id)?.franchise

  const humanCount  = members.filter(m => !m.is_bot).length
  const botCount    = members.filter(m => m.is_bot).length

  const copyCode = () => {
    navigator.clipboard.writeText(room?.code ?? '')
    toast.success('Code copied!')
  }

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) toast.error(json.error ?? 'Failed to start')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    )
  }

  if (!room) return null

  const settings = room.settings

  return (
    <div className="min-h-screen bg-void">
      {/* Header */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <div>
              <div className="font-semibold text-text-primary">{room.name}</div>
              <div className="text-text-muted text-xs">Waiting for players…</div>
            </div>
          </div>
          {/* Room Code */}
          <button onClick={copyCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-all">
            <span className="font-display text-xl text-gold tracking-widest">{room.code}</span>
            <Copy className="w-3.5 h-3.5 text-gold" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Room Settings Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Budget',   value: `₹${settings?.budget_cr ?? 120}Cr` },
            { label: 'Speed',    value: settings?.auction_speed ?? 'normal' },
            { label: 'Timer',    value: `${settings?.timer_seconds ?? 10}s` },
            { label: 'Max Squad',value: settings?.max_squad ?? 25 },
          ].map(s => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <div className="font-display text-2xl text-gold">{s.value}</div>
              <div className="text-text-muted text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Members list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-text-primary">
                Franchises <span className="text-gold">{humanCount + botCount}/10</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="badge badge-emerald text-xs">{humanCount} human</span>
                <span className="badge badge-muted text-xs">{botCount} bot</span>
              </div>
            </div>

            <AnimatePresence>
              {members.map((member, i) => {
                const fc      = FRANCHISES[member.franchise]
                const isMe    = member.user_id === user?.id
                const isBot   = member.is_bot
                return (
                  <motion.div key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(
                      'glass rounded-xl p-4 flex items-center gap-4',
                      isMe && 'border-gold/30 bg-gold/5'
                    )}
                  >
                    {/* Franchise color swatch */}
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-display font-bold text-sm"
                      style={{ backgroundColor: fc.color_primary + '33', color: fc.color_primary }}>
                      {fc.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">{fc.name}</span>
                        {isMe && <span className="badge badge-gold text-xs">You</span>}
                        {member.role === 'auctioneer' && <span className="badge badge-flame text-xs">Auctioneer</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isBot ? (
                          <span className="flex items-center gap-1 text-text-muted text-xs">
                            <Bot className="w-3 h-3" /> Bot franchise
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs">
                            {member.is_connected
                              ? <><Wifi className="w-3 h-3 text-emerald" /><span className="text-emerald">Connected</span></>
                              : <><WifiOff className="w-3 h-3 text-text-muted" /><span className="text-text-muted">Offline</span></>
                            }
                          </span>
                        )}
                        <span className="text-text-muted text-xs">
                          ₹{member.budget_remaining}Cr
                        </span>
                      </div>
                    </div>

                    {/* Aggression indicator for bots */}
                    {isBot && member.bot_personality && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-text-muted">Aggression</div>
                        <div className="text-sm font-semibold"
                          style={{ color: member.bot_personality.aggression > 75 ? '#FF6B35' : member.bot_personality.aggression > 60 ? '#FFB800' : '#00E676' }}>
                          {member.bot_personality.aggression}%
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Actions panel */}
          <div className="space-y-4">

            {/* My franchise */}
            {myFranchise && (
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="text-text-muted text-sm">Your franchise</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: FRANCHISES[myFranchise].color_primary + '33' }}>
                    {FRANCHISES[myFranchise].emoji}
                  </div>
                  <div>
                    <div className="font-display text-2xl text-text-primary">{myFranchise}</div>
                    <div className="text-text-muted text-sm">{FRANCHISES[myFranchise].full_name}</div>
                  </div>
                </div>
                <div className="glass rounded-xl p-3 flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Budget</span>
                  <span className="font-display text-xl text-gold">₹{settings?.budget_cr ?? 120}Cr</span>
                </div>
              </div>
            )}

            {/* Host controls */}
            {isHost && (
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="text-text-muted text-sm">Host Controls</div>

                <button
                  onClick={handleStart}
                  disabled={starting || humanCount < 1}
                  className="btn-gold w-full py-3"
                >
                  {starting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                    : <><Play className="w-4 h-4" /> Start Auction</>
                  }
                </button>

                <button
                  onClick={() => router.push(`/pool?room_id=${roomId}`)}
                  className="btn-ghost w-full py-2.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Manage Player Pool
                </button>

                {room.invite_link && (
                  <button onClick={() => { navigator.clipboard.writeText(room.invite_link!); toast.success('Link copied!') }}
                    className="btn-ghost w-full py-2.5 text-sm">
                    <Copy className="w-4 h-4" /> Copy Invite Link
                  </button>
                )}
              </div>
            )}

            {/* Guest: browse pool */}
            {!isHost && (
              <button onClick={() => router.push(`/pool?room_id=${roomId}`)}
                className="btn-ghost w-full py-3 gap-2">
                <Users className="w-4 h-4" /> Browse Player Pool
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
