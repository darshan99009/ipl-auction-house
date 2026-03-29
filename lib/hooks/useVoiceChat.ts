'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface VoiceState {
  isConnected:  boolean
  isMuted:      boolean
  participants: string[]
}

export function useVoiceChat(roomId: string, userId: string, userName: string) {
  const [state, setState]   = useState<VoiceState>({
    isConnected:  false,
    isMuted:      false,
    participants: [],
  })
  const [room, setRoom]     = useState<unknown>(null)

  const connect = useCallback(async () => {
    try {
      // Get LiveKit token from our API
      const res = await fetch('/api/voice/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ roomId, userId, userName }),
      })
      const { token, url } = await res.json()
      if (!token) throw new Error('No token')

      // Dynamic import to avoid SSR issues
      const { Room, RoomEvent } = await import('livekit-client')

      const lkRoom = new Room({
        adaptiveStream:    true,
        dynacast:          true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })

      lkRoom.on(RoomEvent.ParticipantConnected, (p) => {
        setState(prev => ({ ...prev, participants: [...prev.participants, p.identity] }))
        toast(`${p.identity} joined voice 🎤`, { duration: 2000 })
      })

      lkRoom.on(RoomEvent.ParticipantDisconnected, (p) => {
        setState(prev => ({ ...prev, participants: prev.participants.filter(id => id !== p.identity) }))
      })

      lkRoom.on(RoomEvent.Disconnected, () => {
        setState(prev => ({ ...prev, isConnected: false, participants: [] }))
      })

      await lkRoom.connect(url, token)
      await lkRoom.localParticipant.setMicrophoneEnabled(true)

      setRoom(lkRoom)
      setState(prev => ({
        ...prev,
        isConnected:  true,
        participants: Array.from(lkRoom.participants.values()).map(p => p.identity),
      }))

      toast.success('Voice chat connected 🎤')
    } catch (err) {
      console.error('[Voice]', err)
      toast.error('Failed to connect voice chat')
    }
  }, [roomId, userId, userName])

  const disconnect = useCallback(async () => {
    if (!room) return
    const { Room } = await import('livekit-client')
    if (room instanceof Room) await room.disconnect()
    setRoom(null)
    setState({ isConnected: false, isMuted: false, participants: [] })
  }, [room])

  const toggleMute = useCallback(async () => {
    if (!room) return
    const { Room } = await import('livekit-client')
    if (room instanceof Room) {
      const muted = !state.isMuted
      await room.localParticipant.setMicrophoneEnabled(!muted)
      setState(prev => ({ ...prev, isMuted: muted }))
    }
  }, [room, state.isMuted])

  useEffect(() => {
    return () => { disconnect() }
  }, [disconnect])

  return { ...state, connect, disconnect, toggleMute }
}
