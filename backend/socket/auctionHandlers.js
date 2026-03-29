// ============================================================
// AUCTION SOCKET HANDLERS
// ============================================================

const { AuctionEngine } = require('../engine/AuctionEngine')
const { createClient }  = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// One engine instance per process (shared across all rooms)
let engine = null

function registerAuctionHandlers(io, socket, roomManager) {
  if (!engine) engine = new AuctionEngine(io, roomManager)

  // ----------------------------------------------------------
  // START AUCTION (auctioneer only)
  // ----------------------------------------------------------
  socket.on('auction:start', async ({ roomId }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    try {
      await engine.startAuction(roomId)
    } catch (err) {
      socket.emit('error', err.message)
    }
  })

  // ----------------------------------------------------------
  // PLACE BID
  // ----------------------------------------------------------
  socket.on('auction:bid', async ({ roomId }) => {
    if (!socket.userId || !socket.franchise) return socket.emit('error', 'Not authenticated')
    if (socket.role === 'spectator')          return socket.emit('error', 'Spectators cannot bid')

    const result = await engine.placeBid(roomId, socket.franchise, socket.userId)
    if (result.error) socket.emit('auction:bid_error', result.error)
  })

  // ----------------------------------------------------------
  // USE RTM CARD
  // ----------------------------------------------------------
  socket.on('auction:rtm', async ({ roomId }) => {
    if (!socket.userId || !socket.franchise) return socket.emit('error', 'Not authenticated')

    const result = await engine.useRTM(roomId, socket.franchise, socket.userId)
    if (result.error) socket.emit('error', result.error)
  })

  // ----------------------------------------------------------
  // EMERGENCY LOAN
  // ----------------------------------------------------------
  socket.on('auction:loan', async ({ roomId, releasePlayerId }) => {
    if (!socket.franchise) return socket.emit('error', 'Not authenticated')

    const result = await engine.takeLoan(roomId, socket.franchise, releasePlayerId)
    if (result.error) socket.emit('error', result.error)
  })

  // ----------------------------------------------------------
  // PAUSE / RESUME (auctioneer only)
  // ----------------------------------------------------------
  socket.on('auction:pause', ({ roomId, paused, message }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    engine.togglePause(roomId, paused, message ?? null)
  })

  // ----------------------------------------------------------
  // AUCTIONEER — EXTEND TIMER
  // ----------------------------------------------------------
  socket.on('auctioneer:extend_timer', ({ roomId, seconds }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    engine.extendTimer(roomId, seconds ?? 5)
  })

  // ----------------------------------------------------------
  // AUCTIONEER — SPOTLIGHT
  // ----------------------------------------------------------
  socket.on('auctioneer:spotlight', ({ roomId, playerId }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    engine.spotlight(roomId, playerId)
  })

  // ----------------------------------------------------------
  // AUCTIONEER — CONFETTI
  // ----------------------------------------------------------
  socket.on('auctioneer:confetti', ({ roomId }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    engine.triggerConfetti(roomId)
  })

  // ----------------------------------------------------------
  // AUCTIONEER — CUSTOM COMMENTARY
  // ----------------------------------------------------------
  socket.on('auctioneer:commentary', ({ roomId, text }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    if (!text?.trim())         return
    engine.addCommentary(roomId, text.trim(), socket.franchise)
  })

  // ----------------------------------------------------------
  // AUCTIONEER — REORDER PLAYERS
  // ----------------------------------------------------------
  socket.on('auctioneer:reorder', async ({ roomId, playerIds }) => {
    if (!isAuctioneer(socket)) return socket.emit('error', 'Auctioneer only')
    await engine.reorderPlayers(roomId, playerIds)
  })

  // ----------------------------------------------------------
  // VOICE — WebRTC signalling relay
  // ----------------------------------------------------------
  socket.on('voice:offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice:offer', { from: socket.id, offer })
  })

  socket.on('voice:answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice:answer', { from: socket.id, answer })
  })

  socket.on('voice:ice', ({ targetId, candidate }) => {
    io.to(targetId).emit('voice:ice', { from: socket.id, candidate })
  })
}

// Helper — is this socket the auctioneer or admin?
function isAuctioneer(socket) {
  return ['auctioneer', 'super_admin', 'curator'].includes(socket.role)
}

module.exports = { registerAuctionHandlers }
