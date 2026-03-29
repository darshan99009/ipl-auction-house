'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuctionStore } from '@/lib/store/auctionStore'
import { toast } from 'sonner'
import type { AuctionPlayer, Bid, RoomMember, FranchiseCode } from '@/types'

let globalSocket: Socket | null = null

export function useSocket(token: string | null, roomId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const store     = useAuctionStore()

  const connect = useCallback(() => {
    if (globalSocket?.connected) {
      socketRef.current = globalSocket
      return
    }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports:          ['websocket', 'polling'],
      reconnection:        true,
      reconnectionAttempts: 10,
      reconnectionDelay:   1000,
      reconnectionDelayMax: 5000,
      timeout:             20000,
    })

    // Auth
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      if (token) socket.emit('auth', { token })
      if (roomId) socket.emit('room:join', { roomId })
    })

    socket.on('auth:ok', ({ userId, role }) => {
      console.log('[Socket] Authenticated:', userId, role)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason)
      if (reason === 'io server disconnect') {
        socket.connect() // Server kicked us — reconnect
      }
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    // Room state sync (on join / reconnect)
    socket.on('room:state_sync', (state) => {
      store.syncState(state)
    })

    socket.on('room:member_joined', (member: RoomMember) => {
      store.addMember(member)
      toast(`${member.franchise} joined the room`, { icon: '🏏' })
    })

    socket.on('room:member_left', (userId: string) => {
      store.removeMember(userId)
    })

    // Auction events
    socket.on('auction:started', () => {
      store.setStatus('auction')
      toast.success('Auction has started! 🔨')
    })

    socket.on('auction:player_reveal', (player: AuctionPlayer) => {
      store.setCurrentPlayer(player)
      store.setPhase('revealing')
    })

    socket.on('auction:bidding_open', (player: AuctionPlayer) => {
      store.setCurrentPlayer(player)
      store.setPhase('bidding')
    })

    socket.on('auction:bid_update', (bid: Bid, player: AuctionPlayer) => {
      store.addBid(bid)
      store.setCurrentPlayer(player)
    })

    socket.on('auction:timer_tick', (seconds: number) => {
      store.setTimer(seconds)
    })

    socket.on('auction:hotseat', (seconds: number) => {
      store.setHotseat(seconds <= 3)
    })

    socket.on('auction:accel_start', (seconds: number) => {
      store.setAccelerated(true)
      toast(`⚡ Timer accelerated to ${seconds}s!`, { icon: '⚡' })
    })

    socket.on('auction:sold', (player: AuctionPlayer, bid: { franchise: FranchiseCode; amount: number }) => {
      store.addSoldPlayer(player, bid.franchise, bid.amount)
      store.setPhase('sold')
      toast.success(`${player.players?.name} → ${bid.franchise} for ₹${bid.amount}Cr`)
    })

    socket.on('auction:unsold', (player: AuctionPlayer) => {
      store.setPhase('unsold')
      toast(`${player.players?.name} UNSOLD`, { icon: '❌' })
    })

    socket.on('auction:rtm_used', (franchise: FranchiseCode, player: AuctionPlayer) => {
      toast(`${franchise} used RTM card on ${player.players?.name}! ↩️`, { duration: 4000 })
    })

    socket.on('auction:loan_taken', (franchise: FranchiseCode, _released: unknown, newBudget: number) => {
      store.updateMemberBudget(franchise, newBudget)
      toast(`${franchise} took emergency loan 💰`)
    })

    socket.on('auction:price_drop', (player: AuctionPlayer, newPrice: number) => {
      store.setCurrentPlayer({ ...player, current_price: newPrice })
      toast(`Price dropped to ₹${newPrice}Cr 📉`)
    })

    socket.on('auction:bidding_war', (f1: FranchiseCode, f2: FranchiseCode) => {
      store.setBiddingWar(f1, f2)
    })

    socket.on('auction:budget_alarm', ({ franchise, remaining }: { franchise: FranchiseCode; remaining: number }) => {
      store.triggerBudgetAlarm(franchise, remaining)
    })

    socket.on('auction:snapshot', (stats) => {
      store.setSnapshot(stats)
    })

    socket.on('auction:news_flash', (headline: string) => {
      store.addHeadline(headline)
    })

    socket.on('auction:set_complete', (data) => {
      store.setSetComplete(data)
    })

    socket.on('auction:big_bid_confetti', () => {
      triggerConfetti()
    })

    socket.on('auction:ended', (results) => {
      store.setResults(results)
      store.setPhase('ended')
    })

    socket.on('auction:pause_toggle', (paused: boolean, message?: string) => {
      store.setPaused(paused, message)
      toast(paused ? `⏸ Auction paused${message ? `: ${message}` : ''}` : '▶️ Auction resumed')
    })

    // Auctioneer controls
    socket.on('auctioneer:spotlight', () => store.setSpotlight(true))
    socket.on('auctioneer:confetti', () => triggerConfetti())
    socket.on('auctioneer:commentary', ({ text, author }: { text: string; author: string }) => {
      store.addCommentary({ text, author, ts: Date.now() })
    })

    socket.on('error', (msg: string) => {
      toast.error(msg)
    })

    globalSocket = socket
    socketRef.current = socket
  }, [token, roomId, store])

  useEffect(() => {
    if (!token) return
    connect()

    return () => {
      // Don't disconnect on unmount — keep socket alive for reconnects
    }
  }, [connect, token])

  // Public methods
  const bid        = useCallback(() => {
    if (!roomId) return
    socketRef.current?.emit('auction:bid', { roomId })
  }, [roomId])

  const useRTM     = useCallback(() => {
    if (!roomId) return
    socketRef.current?.emit('auction:rtm', { roomId })
  }, [roomId])

  const takeLoan   = useCallback((releasePlayerId: string) => {
    if (!roomId) return
    socketRef.current?.emit('auction:loan', { roomId, releasePlayerId })
  }, [roomId])

  const react      = useCallback((emoji: string) => {
    if (!roomId) return
    socketRef.current?.emit('social:reaction', { roomId, emoji })
  }, [roomId])

  const chat       = useCallback((message: string) => {
    if (!roomId) return
    socketRef.current?.emit('social:chat', { roomId, message })
  }, [roomId])

  const predict    = useCallback((playerId: string) => {
    if (!roomId) return
    socketRef.current?.emit('social:prediction', { roomId, predictedPlayerId: playerId })
  }, [roomId])

  // Auctioneer methods
  const pause      = useCallback((paused: boolean, message?: string) => {
    if (!roomId) return
    socketRef.current?.emit('auction:pause', { roomId, paused, message })
  }, [roomId])

  const extendTimer = useCallback((seconds = 5) => {
    if (!roomId) return
    socketRef.current?.emit('auctioneer:extend_timer', { roomId, seconds })
  }, [roomId])

  const spotlight   = useCallback((playerId: string) => {
    if (!roomId) return
    socketRef.current?.emit('auctioneer:spotlight', { roomId, playerId })
  }, [roomId])

  const confetti    = useCallback(() => {
    if (!roomId) return
    socketRef.current?.emit('auctioneer:confetti', { roomId })
  }, [roomId])

  const commentary  = useCallback((text: string) => {
    if (!roomId) return
    socketRef.current?.emit('auctioneer:commentary', { roomId, text })
  }, [roomId])

  const reorder     = useCallback((playerIds: string[]) => {
    if (!roomId) return
    socketRef.current?.emit('auctioneer:reorder', { roomId, playerIds })
  }, [roomId])

  return {
    socket: socketRef.current,
    bid, useRTM, takeLoan, react, chat, predict,
    pause, extendTimer, spotlight, confetti, commentary, reorder,
  }
}

// Confetti helper
function triggerConfetti() {
  import('canvas-confetti').then(({ default: confetti }) => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FFB800','#FF6B35','#00A8E8','#00E676'] })
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.1, y: 0.7 } }), 300)
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.9, y: 0.7 } }), 500)
  })
}
