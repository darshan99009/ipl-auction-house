// ============================================================
// ROOM SOCKET HANDLERS
// ============================================================

const { createClient } = require('@supabase/supabase-js')
const jwt              = require('jsonwebtoken')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function registerRoomHandlers(io, socket, roomManager) {

  // ----------------------------------------------------------
  // AUTHENTICATE SOCKET
  // ----------------------------------------------------------
  socket.on('auth', async ({ token }) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId    = decoded.id
      socket.franchise = decoded.franchise
      socket.role      = decoded.role
      socket.emit('auth:ok', { userId: decoded.id, role: decoded.role })
    } catch {
      socket.emit('auth:error', 'Invalid token')
    }
  })

  // ----------------------------------------------------------
  // JOIN ROOM
  // ----------------------------------------------------------
  socket.on('room:join', async ({ roomId }) => {
    if (!socket.userId) {
      socket.emit('error', 'Not authenticated')
      return
    }

    try {
      // Verify member exists
      const { data: member } = await supabase
        .from('room_members')
        .select('*, users(name, avatar_url)')
        .eq('room_id', roomId)
        .eq('user_id', socket.userId)
        .single()

      if (!member) {
        socket.emit('error', 'Not a member of this room')
        return
      }

      // Join socket room
      socket.join(roomId)
      socket.roomId = roomId

      // Register in state manager
      roomManager.registerSocket(socket.id, {
        roomId,
        userId:    socket.userId,
        franchise: socket.franchise,
        role:      socket.role,
      })

      // Load room state
      const state = await roomManager.loadRoom(roomId)
      if (!state) {
        socket.emit('error', 'Room not found')
        return
      }

      // Send full state to joining client (reconnect support)
      socket.emit('room:state_sync', {
        room:           state.room,
        members:        state.members,
        current_player: state.current_player,
        timer:          state.timer,
        is_paused:      state.is_paused,
        bid_history:    state.bid_history.slice(0, 20),
        sold_count:     state.sold_count,
      })

      // Notify others
      socket.to(roomId).emit('room:member_joined', {
        ...member,
        is_connected: true,
      })

      console.log(`[Room] ${socket.userId} (${socket.franchise}) joined ${roomId}`)
    } catch (err) {
      console.error('[room:join]', err)
      socket.emit('error', 'Failed to join room')
    }
  })

  // ----------------------------------------------------------
  // LEAVE ROOM
  // ----------------------------------------------------------
  socket.on('room:leave', () => {
    if (!socket.roomId) return
    socket.to(socket.roomId).emit('room:member_left', socket.userId)
    socket.leave(socket.roomId)
    roomManager.handleDisconnect(socket.id)
  })

  // ----------------------------------------------------------
  // SPECTATOR JOIN (read-only, no franchise)
  // ----------------------------------------------------------
  socket.on('room:spectate', async ({ roomId }) => {
    socket.join(roomId)
    socket.roomId = roomId

    const state = await roomManager.loadRoom(roomId)
    if (state) {
      socket.emit('room:state_sync', {
        room:           state.room,
        members:        state.members,
        current_player: state.current_player,
        timer:          state.timer,
        is_paused:      state.is_paused,
        bid_history:    state.bid_history.slice(0, 20),
        sold_count:     state.sold_count,
      })
    }
  })
}

module.exports = { registerRoomHandlers }
