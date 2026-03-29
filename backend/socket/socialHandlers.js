// ============================================================
// SOCIAL SOCKET HANDLERS
// Reactions, chat, polls, predictions
// ============================================================

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALLOWED_EMOJIS = ['😱','🔥','💸','👏','😂','🏏','💰','🎉','😤','🤯','👑','❤️','💛','🧡']

function registerSocialHandlers(io, socket, roomManager) {

  // ----------------------------------------------------------
  // LIVE REACTION
  // ----------------------------------------------------------
  socket.on('social:reaction', async ({ roomId, emoji }) => {
    if (!socket.userId || !socket.franchise) return
    if (!ALLOWED_EMOJIS.includes(emoji))      return

    const reaction = {
      id:        crypto.randomUUID(),
      room_id:   roomId,
      user_id:   socket.userId,
      franchise: socket.franchise,
      emoji,
      timestamp: new Date().toISOString(),
    }

    // Persist (fire and forget)
    supabase.from('reactions').insert(reaction).then(() => {})

    // Broadcast to all in room
    io.to(roomId).emit('social:reaction', reaction)
  })

  // ----------------------------------------------------------
  // CHAT MESSAGE
  // ----------------------------------------------------------
  socket.on('social:chat', async ({ roomId, message }) => {
    if (!socket.userId || !socket.franchise) return
    if (!message?.trim() || message.length > 200) return

    // Get user name
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', socket.userId)
      .single()

    const msg = {
      id:        crypto.randomUUID(),
      room_id:   roomId,
      user_id:   socket.userId,
      user_name: user?.name ?? 'Unknown',
      franchise: socket.franchise,
      message:   message.trim(),
      created_at: new Date().toISOString(),
    }

    // Persist
    supabase.from('chat_messages').insert(msg).then(() => {})

    // Broadcast
    io.to(roomId).emit('social:chat', msg)
  })

  // ----------------------------------------------------------
  // CREATE POLL (auctioneer only)
  // ----------------------------------------------------------
  socket.on('social:create_poll', async ({ roomId, question, options, durationSeconds }) => {
    if (!['auctioneer','super_admin','curator'].includes(socket.role)) return

    const poll = {
      room_id:    roomId,
      question:   question.trim(),
      options:    options.slice(0, 4),
      votes:      {},
      created_by: socket.userId,
      expires_at: new Date(Date.now() + (durationSeconds ?? 30) * 1000).toISOString(),
    }

    const { data } = await supabase.from('polls').insert(poll).select().single()
    if (!data) return

    io.to(roomId).emit('social:poll_created', data)

    // Auto-close poll
    setTimeout(async () => {
      const { data: finalPoll } = await supabase.from('polls').select('*').eq('id', data.id).single()
      io.to(roomId).emit('social:poll_closed', finalPoll)
    }, (durationSeconds ?? 30) * 1000)
  })

  // ----------------------------------------------------------
  // VOTE ON POLL
  // ----------------------------------------------------------
  socket.on('social:poll_vote', async ({ roomId, pollId, option }) => {
    if (!socket.userId) return

    const { data: poll } = await supabase.from('polls').select('votes, options, expires_at').eq('id', pollId).single()
    if (!poll) return
    if (new Date(poll.expires_at) < new Date()) return socket.emit('error', 'Poll has ended')
    if (!poll.options.includes(option))          return

    const updatedVotes = { ...poll.votes, [socket.userId]: option }
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId)

    io.to(roomId).emit('social:poll_vote', { pollId, userId: socket.userId, option, totalVotes: Object.keys(updatedVotes).length })
  })

  // ----------------------------------------------------------
  // PRE-AUCTION PREDICTION
  // ----------------------------------------------------------
  socket.on('social:prediction', async ({ roomId, predictedPlayerId }) => {
    if (!socket.userId) return

    await supabase.from('predictions').upsert({
      room_id:             roomId,
      user_id:             socket.userId,
      predicted_player_id: predictedPlayerId,
    })

    socket.emit('social:prediction_saved', { predictedPlayerId })
  })
}

module.exports = { registerSocialHandlers }
