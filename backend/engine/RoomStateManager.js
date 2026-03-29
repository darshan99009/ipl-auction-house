// ============================================================
// ROOM STATE MANAGER
// Holds all active room state in memory
// Persists to Supabase for durability / reconnects
// ============================================================

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class RoomStateManager {
  constructor() {
    // Map<roomId, RoomState>
    this.rooms = new Map()
    // Map<socketId, { roomId, userId, franchise, role }>
    this.socketMap = new Map()
  }

  // ----------------------------------------------------------
  // ROOM LIFECYCLE
  // ----------------------------------------------------------
  async loadRoom(roomId) {
    if (this.rooms.has(roomId)) return this.rooms.get(roomId)

    // Hydrate from DB on first access
    const [roomRes, membersRes, currentPlayerRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('id', roomId).single(),
      supabase.from('room_members').select('*, users(name, avatar_url)').eq('room_id', roomId),
      supabase.from('room_players').select('*, players(*)').eq('room_id', roomId).eq('status', 'bidding').single(),
    ])

    if (roomRes.error || !roomRes.data) return null

    const state = {
      room:           roomRes.data,
      members:        membersRes.data ?? [],
      current_player: currentPlayerRes.data ?? null,
      timer:          roomRes.data.settings?.timer_seconds ?? 10,
      timer_interval: null,
      is_paused:      roomRes.data.status === 'paused',
      bid_history:    [],
      sold_count:     0,
      unsold_count:   0,
      consecutive_bids: 0,
      last_bidder:    null,
      pause_message:  null,
      commentary:     [],
    }

    this.rooms.set(roomId, state)
    return state
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) ?? null
  }

  async persistRoomStatus(roomId, status) {
    await supabase.from('rooms')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', roomId)
  }

  // ----------------------------------------------------------
  // SOCKET ↔ USER MAPPING
  // ----------------------------------------------------------
  registerSocket(socketId, { roomId, userId, franchise, role }) {
    this.socketMap.set(socketId, { roomId, userId, franchise, role })

    // Mark member connected
    supabase.from('room_members')
      .update({ is_connected: true })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .then(() => {})
  }

  getSocketInfo(socketId) {
    return this.socketMap.get(socketId) ?? null
  }

  handleDisconnect(socketId) {
    const info = this.socketMap.get(socketId)
    if (!info) return

    const { roomId, userId } = info
    this.socketMap.delete(socketId)

    // Mark disconnected in DB
    supabase.from('room_members')
      .update({ is_connected: false })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .then(() => {})

    // Update in-memory member list
    const state = this.rooms.get(roomId)
    if (state) {
      const member = state.members.find(m => m.user_id === userId)
      if (member) member.is_connected = false
    }
  }

  // ----------------------------------------------------------
  // MEMBER HELPERS
  // ----------------------------------------------------------
  getMember(roomId, franchise) {
    const state = this.rooms.get(roomId)
    return state?.members.find(m => m.franchise === franchise) ?? null
  }

  updateMemberBudget(roomId, franchise, newBudget) {
    const state = this.rooms.get(roomId)
    if (!state) return
    const member = state.members.find(m => m.franchise === franchise)
    if (member) member.budget_remaining = newBudget
  }

  // ----------------------------------------------------------
  // TIMER
  // ----------------------------------------------------------
  startTimer(roomId, seconds, onTick, onExpire) {
    const state = this.rooms.get(roomId)
    if (!state) return

    this.clearTimer(roomId)
    state.timer = seconds

    state.timer_interval = setInterval(() => {
      if (state.is_paused) return

      state.timer -= 1
      onTick(state.timer)

      if (state.timer <= 0) {
        this.clearTimer(roomId)
        onExpire()
      }
    }, 1000)
  }

  addTime(roomId, seconds) {
    const state = this.rooms.get(roomId)
    if (state) state.timer += seconds
  }

  clearTimer(roomId) {
    const state = this.rooms.get(roomId)
    if (state?.timer_interval) {
      clearInterval(state.timer_interval)
      state.timer_interval = null
    }
  }

  pauseTimer(roomId, message = null) {
    const state = this.rooms.get(roomId)
    if (state) {
      state.is_paused    = true
      state.pause_message = message
    }
  }

  resumeTimer(roomId) {
    const state = this.rooms.get(roomId)
    if (state) {
      state.is_paused    = false
      state.pause_message = null
    }
  }

  // ----------------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------------
  closeRoom(roomId) {
    this.clearTimer(roomId)
    this.rooms.delete(roomId)

    // Remove all socket mappings for this room
    for (const [socketId, info] of this.socketMap.entries()) {
      if (info.roomId === roomId) this.socketMap.delete(socketId)
    }
  }
}

module.exports = { RoomStateManager }
