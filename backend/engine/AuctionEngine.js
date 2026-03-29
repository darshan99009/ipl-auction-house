// ============================================================
// AUCTION ENGINE
// Server-authoritative auction logic
// Clients CANNOT fake bids, prices, or budgets
// ============================================================

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Bid increment table
function getBidIncrement(currentPrice) {
  if (currentPrice < 1)  return 0.20
  if (currentPrice < 5)  return 0.50
  if (currentPrice < 10) return 1.00
  if (currentPrice < 20) return 2.00
  return 5.00
}

// Auto-generated news headlines
function generateHeadline(playerName, franchise, amount) {
  const headlines = [
    `BREAKING: ${franchise} splashes ₹${amount}Cr on ${playerName}! 💸`,
    `${playerName} SOLD to ${franchise} for ₹${amount}Cr! 🔨`,
    `${franchise} signs ${playerName} in a blockbuster deal worth ₹${amount}Cr!`,
    `The crowd goes wild as ${playerName} joins ${franchise} for ₹${amount}Cr! 🏏`,
    `${franchise} management beams with joy — ${playerName} is theirs at ₹${amount}Cr!`,
  ]
  return headlines[Math.floor(Math.random() * headlines.length)]
}

// Squad grade calculator
function calculateGrade(squadPlayers, budgetSpent, settings) {
  let score = 0
  const total = squadPlayers.length

  // Size score (max 20)
  score += Math.min(20, (total / settings.max_squad) * 20)

  // Role balance (max 30)
  const roles = { Batter: 0, Bowler: 0, 'All-Rounder': 0, 'WK-Batter': 0 }
  squadPlayers.forEach(sp => { if (sp.players) roles[sp.players.role]++ })
  const hasWK      = roles['WK-Batter'] >= 1
  const hasBowlers = roles['Bowler'] >= 3
  const hasAllRnd  = roles['All-Rounder'] >= 2
  if (hasWK)      score += 10
  if (hasBowlers) score += 10
  if (hasAllRnd)  score += 10

  // Value score — avg ratio of base to paid (max 30)
  const valueRatio = squadPlayers.reduce((sum, sp) => {
    const base = sp.players?.base_price ?? 1
    return sum + Math.min(3, sp.price_paid / base)
  }, 0) / (total || 1)
  score += Math.min(30, (1 / valueRatio) * 15)

  // Tier quality (max 20)
  const tierPoints = { Icon: 5, Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 }
  const avgTier = squadPlayers.reduce((sum, sp) => sum + (tierPoints[sp.players?.stock_tier] ?? 1), 0) / (total || 1)
  score += Math.min(20, avgTier * 4)

  if (score >= 85) return 'A+'
  if (score >= 70) return 'A'
  if (score >= 55) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}

// Power ranking score
function calculatePowerScore(squadPlayers) {
  const tierPoints = { Icon: 10, Platinum: 8, Gold: 6, Silver: 4, Bronze: 2 }
  return squadPlayers.reduce((sum, sp) => sum + (tierPoints[sp.players?.stock_tier] ?? 2), 0)
}

class AuctionEngine {
  constructor(io, roomManager) {
    this.io          = io
    this.roomManager = roomManager
  }

  // ----------------------------------------------------------
  // START AUCTION
  // ----------------------------------------------------------
  async startAuction(roomId) {
    const state = await this.roomManager.loadRoom(roomId)
    if (!state) throw new Error('Room not found')

    // Set room status
    await this.roomManager.persistRoomStatus(roomId, 'auction')
    state.room.status = 'auction'

    // Load ordered player pool
    const { data: players } = await supabase
      .from('room_players')
      .select('*, players(*)')
      .eq('room_id', roomId)
      .eq('status', 'pending')
      .order('set_number')
      .order('reveal_order')

    state.player_queue = players ?? []
    state.sold_count   = 0
    state.unsold_count = 0

    this.io.to(roomId).emit('auction:started')
    this.recordReplay(roomId, 'auction:started', {})

    // Reveal first player
    await this.revealNextPlayer(roomId)
  }

  // ----------------------------------------------------------
  // REVEAL NEXT PLAYER
  // ----------------------------------------------------------
  async revealNextPlayer(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    // Every 25 sold players → snapshot break
    if (state.sold_count > 0 && state.sold_count % 25 === 0) {
      await this.emitSnapshot(roomId)
      await new Promise(r => setTimeout(r, 4000))
    }

    const next = state.player_queue?.shift()
    if (!next) {
      await this.endAuction(roomId)
      return
    }

    // Update DB
    await supabase.from('room_players')
      .update({ status: 'bidding', current_price: next.players.base_price, revealed_at: new Date().toISOString() })
      .eq('id', next.id)

    next.status        = 'bidding'
    next.current_price = next.players.base_price
    state.current_player    = next
    state.bid_history        = []
    state.consecutive_bids   = 0
    state.last_bidder        = null

    this.io.to(roomId).emit('auction:player_reveal', next)
    this.recordReplay(roomId, 'auction:player_reveal', { player: next })

    // Small dramatic pause then open bidding
    await new Promise(r => setTimeout(r, 2500))
    this.openBidding(roomId)
  }

  // ----------------------------------------------------------
  // OPEN BIDDING
  // ----------------------------------------------------------
  openBidding(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state || !state.current_player) return

    this.io.to(roomId).emit('auction:bidding_open', state.current_player)

    const timerSeconds = state.room.settings?.timer_seconds ?? 10

    this.roomManager.startTimer(
      roomId,
      timerSeconds,
      (remaining) => {
        this.io.to(roomId).emit('auction:timer_tick', remaining)

        // Hot seat panic effect at 3 seconds
        if (remaining <= 3) {
          this.io.to(roomId).emit('auction:hotseat', remaining)
        }
      },
      () => this.handleTimerExpiry(roomId)
    )

    // Trigger bot bidding
    this.scheduleBotBid(roomId)
  }

  // ----------------------------------------------------------
  // PLACE BID (from client)
  // ----------------------------------------------------------
  async placeBid(roomId, franchise, userId, isBot = false) {
    const state = this.roomManager.getRoom(roomId)
    if (!state || !state.current_player) return { error: 'No active player' }
    if (state.is_paused)                 return { error: 'Auction is paused' }

    const player  = state.current_player
    const member  = this.roomManager.getMember(roomId, franchise)
    if (!member) return { error: 'Not in this room' }

    // --- Validation ---
    const increment   = getBidIncrement(player.current_price)
    const newPrice    = parseFloat((player.current_price + increment).toFixed(2))
    const maxBid      = member.budget_remaining - this.getReserveAmount(state, franchise)

    if (newPrice > maxBid)               return { error: 'Insufficient budget' }
    if (state.last_bidder === franchise) return { error: 'You are already the highest bidder' }

    // Max overseas check
    if (player.players?.nationality === 'Overseas') {
      if (member.overseas_count >= (state.room.settings?.max_overseas ?? 4)) {
        return { error: 'Overseas player limit reached' }
      }
    }

    // --- Record bid ---
    const { data: bid, error } = await supabase.from('bids').insert({
      room_id:        roomId,
      room_player_id: player.id,
      bidder_id:      userId || null,
      franchise,
      amount:         newPrice,
      is_bot:         isBot,
    }).select().single()

    if (error) return { error: 'Failed to place bid' }

    // Update in-memory state
    player.current_price    = newPrice
    player.bid_count        += 1
    state.last_bidder       = franchise
    state.consecutive_bids  += 1
    state.bid_history.unshift(bid)

    // Update DB current price
    await supabase.from('room_players')
      .update({ current_price: newPrice, bid_count: player.bid_count })
      .eq('id', player.id)

    // Emit bid update
    this.io.to(roomId).emit('auction:bid_update', bid, player)
    this.recordReplay(roomId, 'auction:bid_update', { bid, player })

    // Budget alarm — team drops below 20 Cr
    if (member.budget_remaining - newPrice <= 20) {
      this.io.to(roomId).emit('auction:budget_alarm', { franchise, remaining: member.budget_remaining - newPrice })
    }

    // Bidding war detection — same 2 franchises bid 5+ times
    const recentBidders = state.bid_history.slice(0, 10).map(b => b.franchise)
    const bidderCounts  = recentBidders.reduce((acc, f) => { acc[f] = (acc[f] || 0) + 1; return acc }, {})
    const topTwo        = Object.entries(bidderCounts).sort((a, b) => b[1] - a[1]).slice(0, 2)
    if (topTwo.length === 2 && topTwo[0][1] >= 5 && topTwo[1][1] >= 3) {
      this.io.to(roomId).emit('auction:bidding_war', topTwo[0][0], topTwo[1][0])
    }

    // Accelerated timer after 5 consecutive bids
    if (state.consecutive_bids === 5) {
      const speed = state.room.settings?.auction_speed
      const accelSeconds = speed === 'blitz' ? 3 : speed === 'relaxed' ? 10 : 5
      this.roomManager.startTimer(
        roomId,
        accelSeconds,
        (remaining) => {
          this.io.to(roomId).emit('auction:timer_tick', remaining)
          if (remaining <= 3) this.io.to(roomId).emit('auction:hotseat', remaining)
        },
        () => this.handleTimerExpiry(roomId)
      )
      this.io.to(roomId).emit('auction:accel_start', accelSeconds)
    } else {
      // Reset timer on every bid
      const timerSeconds = state.room.settings?.timer_seconds ?? 10
      this.roomManager.startTimer(
        roomId,
        timerSeconds,
        (remaining) => {
          this.io.to(roomId).emit('auction:timer_tick', remaining)
          if (remaining <= 3) this.io.to(roomId).emit('auction:hotseat', remaining)
        },
        () => this.handleTimerExpiry(roomId)
      )
    }

    // Stock ticker update
    this.io.to(roomId).emit('auction:stock_ticker', {
      player_id: player.players?.id,
      tier:      player.players?.stock_tier,
      change:    'up',
    })

    // Schedule next bot bid
    this.scheduleBotBid(roomId)

    return { success: true, bid, newPrice }
  }

  // ----------------------------------------------------------
  // TIMER EXPIRY → SOLD or UNSOLD or PRICE DROP
  // ----------------------------------------------------------
  async handleTimerExpiry(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state || !state.current_player) return

    const player = state.current_player

    if (state.last_bidder) {
      await this.soldPlayer(roomId, player, state.last_bidder)
    } else {
      // No bids — price drop or unsold
      const settings = state.room.settings
      if (settings?.price_drop_on_no_bid && player.current_price > player.players.base_price) {
        const dropPct  = settings.price_drop_pct / 100
        const newPrice = parseFloat((player.current_price * (1 - dropPct)).toFixed(2))
        const minPrice = player.players.base_price

        if (newPrice > minPrice) {
          player.current_price = Math.max(newPrice, minPrice)
          await supabase.from('room_players').update({ current_price: player.current_price }).eq('id', player.id)
          this.io.to(roomId).emit('auction:price_drop', player, player.current_price)
          this.openBidding(roomId) // Re-open at lower price
          return
        }
      }
      await this.unsoldPlayer(roomId, player)
    }
  }

  // ----------------------------------------------------------
  // SOLD
  // ----------------------------------------------------------
  async soldPlayer(roomId, player, franchise) {
    const state  = this.roomManager.getRoom(roomId)
    const member = this.roomManager.getMember(roomId, franchise)
    if (!state || !member) return

    const price = player.current_price

    // DB updates
    await Promise.all([
      supabase.from('room_players').update({
        status: 'sold', sold_to: franchise, sold_price: price, sold_at: new Date().toISOString(),
      }).eq('id', player.id),
      supabase.from('squads').insert({
        room_id: roomId, franchise, player_id: player.players.id, price_paid: price,
      }),
      supabase.from('room_members').update({
        budget_remaining: member.budget_remaining - price,
        squad_count:      member.squad_count + 1,
        overseas_count:   member.overseas_count + (player.players?.nationality === 'Overseas' ? 1 : 0),
      }).eq('room_id', roomId).eq('franchise', franchise),
    ])

    // In-memory updates
    this.roomManager.updateMemberBudget(roomId, franchise, member.budget_remaining - price)
    state.sold_count++

    // Record replay
    this.recordReplay(roomId, 'auction:sold', { player, franchise, price })

    this.io.to(roomId).emit('auction:sold', player, { franchise, amount: price })

    // News flash
    const headline = generateHeadline(player.players.name, franchise, price)
    this.io.to(roomId).emit('auction:news_flash', headline)

    // Confetti for big bids (≥15Cr)
    if (price >= 15) {
      this.io.to(roomId).emit('auction:big_bid_confetti', { player, franchise, price })
    }

    // Squad card reveal every set
    await this.checkSetComplete(roomId)

    await new Promise(r => setTimeout(r, 2000))
    await this.revealNextPlayer(roomId)
  }

  // ----------------------------------------------------------
  // UNSOLD
  // ----------------------------------------------------------
  async unsoldPlayer(roomId, player) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    await supabase.from('room_players').update({ status: 'unsold' }).eq('id', player.id)
    state.unsold_count++

    this.recordReplay(roomId, 'auction:unsold', { player })
    this.io.to(roomId).emit('auction:unsold', player)

    await new Promise(r => setTimeout(r, 1500))
    await this.revealNextPlayer(roomId)
  }

  // ----------------------------------------------------------
  // RTM CARD
  // ----------------------------------------------------------
  async useRTM(roomId, franchise, userId) {
    const state  = this.roomManager.getRoom(roomId)
    const member = this.roomManager.getMember(roomId, franchise)
    if (!state || !member) return { error: 'Not in room' }
    if (member.rtm_used)   return { error: 'RTM already used' }
    if (!state.current_player?.sold_to) return { error: 'No sold player to RTM' }

    const player       = state.current_player
    const soldFranchise = player.sold_to
    if (soldFranchise === franchise) return { error: 'You bought this player' }

    // Check RTM eligibility (must have retained this player previously)
    const { data: retention } = await supabase
      .from('retentions')
      .select('id')
      .eq('room_id', roomId)
      .eq('franchise', franchise)
      .eq('player_id', player.players.id)
      .single()

    if (!retention) return { error: 'You did not retain this player — RTM not valid' }

    // Match the sold price
    const matchPrice = player.current_price
    if (member.budget_remaining < matchPrice) return { error: 'Insufficient budget to RTM' }

    // Transfer from sold franchise back to this franchise
    await Promise.all([
      supabase.from('squads').delete()
        .eq('room_id', roomId).eq('franchise', soldFranchise).eq('player_id', player.players.id),
      supabase.from('squads').insert({
        room_id: roomId, franchise, player_id: player.players.id, price_paid: matchPrice, is_rtm: true,
      }),
      supabase.from('room_members').update({
        rtm_used:         true,
        budget_remaining: member.budget_remaining - matchPrice,
        squad_count:      member.squad_count + 1,
      }).eq('room_id', roomId).eq('franchise', franchise),
      supabase.from('room_members').update({
        budget_remaining: supabase.rpc('increment', { x: matchPrice }),
        squad_count:      supabase.raw('squad_count - 1'),
      }).eq('room_id', roomId).eq('franchise', soldFranchise),
    ])

    this.roomManager.updateMemberBudget(roomId, franchise, member.budget_remaining - matchPrice)
    member.rtm_used = true

    this.recordReplay(roomId, 'auction:rtm_used', { franchise, player, price: matchPrice })
    this.io.to(roomId).emit('auction:rtm_used', franchise, player)

    return { success: true }
  }

  // ----------------------------------------------------------
  // EMERGENCY LOAN
  // ----------------------------------------------------------
  async takeLoan(roomId, franchise, releasePlayerId) {
    const state  = this.roomManager.getRoom(roomId)
    const member = this.roomManager.getMember(roomId, franchise)
    if (!state || !member)  return { error: 'Not in room' }
    if (member.loan_used)   return { error: 'Loan already used' }

    const loanAmount = state.room.settings?.emergency_loan_cr ?? 10

    // Release a player
    const { data: releasedPlayer } = await supabase
      .from('squads')
      .select('*, players(name)')
      .eq('room_id', roomId).eq('franchise', franchise).eq('player_id', releasePlayerId)
      .single()

    if (!releasedPlayer) return { error: 'Player not in squad' }

    await Promise.all([
      supabase.from('squads').delete().eq('room_id', roomId).eq('franchise', franchise).eq('player_id', releasePlayerId),
      supabase.from('room_members').update({
        loan_used:        true,
        budget_remaining: member.budget_remaining + loanAmount + releasedPlayer.price_paid,
        squad_count:      member.squad_count - 1,
      }).eq('room_id', roomId).eq('franchise', franchise),
    ])

    const newBudget = member.budget_remaining + loanAmount + releasedPlayer.price_paid
    this.roomManager.updateMemberBudget(roomId, franchise, newBudget)
    member.loan_used  = true

    this.recordReplay(roomId, 'auction:loan_taken', { franchise, released: releasedPlayer })
    this.io.to(roomId).emit('auction:loan_taken', franchise, releasedPlayer, newBudget)

    return { success: true, newBudget }
  }

  // ----------------------------------------------------------
  // PAUSE / RESUME
  // ----------------------------------------------------------
  togglePause(roomId, paused, message = null) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    if (paused) {
      this.roomManager.pauseTimer(roomId, message)
      this.roomManager.persistRoomStatus(roomId, 'paused')
    } else {
      this.roomManager.resumeTimer(roomId)
      this.roomManager.persistRoomStatus(roomId, 'auction')
    }

    this.io.to(roomId).emit('auction:pause_toggle', paused, message)
    this.recordReplay(roomId, 'auction:pause_toggle', { paused, message })
  }

  // ----------------------------------------------------------
  // AUCTIONEER CONTROLS
  // ----------------------------------------------------------
  extendTimer(roomId, seconds = 5) {
    this.roomManager.addTime(roomId, seconds)
    this.io.to(roomId).emit('auctioneer:timer_extended', seconds)
  }

  spotlight(roomId, playerId) {
    this.io.to(roomId).emit('auctioneer:spotlight', playerId)
  }

  triggerConfetti(roomId) {
    this.io.to(roomId).emit('auctioneer:confetti')
  }

  addCommentary(roomId, text, authorFranchise) {
    const state = this.roomManager.getRoom(roomId)
    if (state) state.commentary.push({ text, author: authorFranchise, ts: Date.now() })
    this.io.to(roomId).emit('auctioneer:commentary', { text, author: authorFranchise })
  }

  async reorderPlayers(roomId, playerIds) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    // Reorder in-memory queue
    const queueMap = new Map(state.player_queue.map(p => [p.id, p]))
    state.player_queue = playerIds.map(id => queueMap.get(id)).filter(Boolean)

    // Persist reveal_order
    await Promise.all(playerIds.map((id, idx) =>
      supabase.from('room_players').update({ reveal_order: idx }).eq('id', id)
    ))

    this.io.to(roomId).emit('auctioneer:reorder', playerIds)
  }

  // ----------------------------------------------------------
  // SNAPSHOT (every 25 sold players)
  // ----------------------------------------------------------
  async emitSnapshot(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    const { data: squads } = await supabase
      .from('squads')
      .select('franchise, price_paid, players(name, role)')
      .eq('room_id', roomId)

    const franchiseSpends = {}
    let   maxEntry = null

    squads?.forEach(s => {
      franchiseSpends[s.franchise] = (franchiseSpends[s.franchise] ?? 0) + s.price_paid
      if (!maxEntry || s.price_paid > maxEntry.price) {
        maxEntry = { player: s.players, price: s.price_paid, franchise: s.franchise }
      }
    })

    const snapshot = {
      sold_count:       state.sold_count,
      total_spend:      Object.values(franchiseSpends).reduce((a, b) => a + b, 0),
      most_expensive:   maxEntry,
      franchise_spends: franchiseSpends,
    }

    this.io.to(roomId).emit('auction:snapshot', snapshot)
    this.recordReplay(roomId, 'auction:snapshot', snapshot)
  }

  // ----------------------------------------------------------
  // SET COMPLETE — Show squad card
  // ----------------------------------------------------------
  async checkSetComplete(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    const remaining = state.player_queue?.filter(p => p.set_number === state.current_player?.set_number) ?? []
    if (remaining.length === 0 && state.current_player) {
      const currentSet = state.current_player.set_number

      // Fetch all squads for this room
      const { data: squads } = await supabase
        .from('squads')
        .select('franchise, players(name, role, stock_tier)')
        .eq('room_id', roomId)

      this.io.to(roomId).emit('auction:set_complete', { set: currentSet, squads })
    }
  }

  // ----------------------------------------------------------
  // END AUCTION
  // ----------------------------------------------------------
  async endAuction(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state) return

    this.roomManager.clearTimer(roomId)
    await this.roomManager.persistRoomStatus(roomId, 'completed')

    // Fetch full results
    const { data: allSquads } = await supabase
      .from('squads')
      .select('*, players(*)')
      .eq('room_id', roomId)

    const { data: members } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)

    // Build analytics per franchise
    const squadsByFranchise = {}
    allSquads?.forEach(s => {
      if (!squadsByFranchise[s.franchise]) squadsByFranchise[s.franchise] = []
      squadsByFranchise[s.franchise].push(s)
    })

    const analytics = Object.entries(squadsByFranchise).map(([franchise, squad]) => {
      const member    = members?.find(m => m.franchise === franchise)
      const spent     = squad.reduce((sum, s) => sum + s.price_paid, 0)
      const grade     = calculateGrade(squad, spent, state.room.settings)
      const tierMap   = { Icon: 0, Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 }
      squad.forEach(s => { if (s.players?.stock_tier) tierMap[s.players.stock_tier]++ })

      const sortedByValue = [...squad].sort((a, b) => (a.price_paid / (a.players?.base_price ?? 1)) - (b.price_paid / (b.players?.base_price ?? 1)))
      const sortedByPrice = [...squad].sort((a, b) => b.price_paid - a.price_paid)

      return {
        franchise,
        grade,
        score:            calculatePowerScore(squad),
        budget_spent:     spent,
        budget_remaining: member?.budget_remaining ?? 0,
        overseas_count:   member?.overseas_count ?? 0,
        squad_count:      squad.length,
        tier_breakdown:   tierMap,
        best_buy:         sortedByValue[0]?.players ?? null,
        biggest_splurge:  sortedByPrice[0]?.players ?? null,
        balance_score:    Math.round((grade === 'A+' ? 95 : grade === 'A' ? 85 : grade === 'B' ? 70 : grade === 'C' ? 55 : 40)),
      }
    })

    // Overall stats
    const allBids    = await supabase.from('bids').select('franchise, room_player_id').eq('room_id', roomId)
    const playerBids = {}
    allBids.data?.forEach(b => { playerBids[b.room_player_id] = (playerBids[b.room_player_id] ?? 0) + 1 })
    const mvpPlayerId    = Object.entries(playerBids).sort((a, b) => b[1] - a[1])[0]?.[0]
    const { data: mvpRp } = mvpPlayerId
      ? await supabase.from('room_players').select('players(*)').eq('id', mvpPlayerId).single()
      : { data: null }

    const sortedAnalytics = [...analytics].sort((a, b) => b.score - a.score)
    const powerRankings   = sortedAnalytics.map((a, i) => ({ franchise: a.franchise, rank: i + 1, score: a.score }))

    const results = {
      room_id:        roomId,
      squads:         squadsByFranchise,
      analytics,
      power_rankings: powerRankings,
      mvp_player:     mvpRp?.players ?? null,
      sold_count:     state.sold_count,
      unsold_count:   state.unsold_count,
    }

    // Save dynasty records
    if (state.room.settings?.dynasty_mode) {
      for (const [franchise, squad] of Object.entries(squadsByFranchise)) {
        const analytic = analytics.find(a => a.franchise === franchise)
        const member   = members?.find(m => m.franchise === franchise)
        if (!member?.user_id) continue

        await supabase.from('dynasty').upsert({
          user_id:        member.user_id,
          franchise,
          season:         state.room.season,
          room_id:        roomId,
          squad_json:     squad,
          grade:          analytic?.grade ?? 'C',
          power_rank:     powerRankings.find(p => p.franchise === franchise)?.rank ?? 10,
          dynasty_points: analytic?.score ?? 0,
          budget_spent:   analytic?.budget_spent ?? 0,
        })
      }
    }

    this.recordReplay(roomId, 'auction:ended', results)
    this.io.to(roomId).emit('auction:ended', results)

    // Persist results to DB
    await supabase.from('rooms').update({
      status:     'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', roomId)

    this.roomManager.closeRoom(roomId)
  }

  // ----------------------------------------------------------
  // BOT BIDDING
  // ----------------------------------------------------------
  scheduleBotBid(roomId) {
    const state = this.roomManager.getRoom(roomId)
    if (!state || !state.current_player) return

    const player  = state.current_player
    const members = state.members.filter(m => m.is_bot && m.franchise !== state.last_bidder)

    for (const bot of members) {
      const personality = bot.bot_personality ?? {}
      const aggression  = (personality.aggression ?? 65) / 100
      const maxMulti    = personality.max_multiplier ?? 7
      const prefRole    = personality.preferred_role

      // Decide if bot bids
      const isPreferred   = player.players?.role === prefRole
      const bidChance     = isPreferred ? aggression * 1.3 : aggression
      if (Math.random() > bidChance) continue

      // Decide bid amount relative to base price
      const maxBotBid = player.players?.base_price * maxMulti
      if (player.current_price >= maxBotBid)       continue
      if (bot.budget_remaining < player.current_price) continue

      // Random delay 0.5s–3s so bots feel human
      const delay = 500 + Math.random() * 2500
      setTimeout(async () => {
        const s = this.roomManager.getRoom(roomId)
        if (!s || s.is_paused || s.last_bidder === bot.franchise) return
        await this.placeBid(roomId, bot.franchise, null, true)
      }, delay)
    }
  }

  // ----------------------------------------------------------
  // RESERVE AMOUNT (keep enough for min squad requirements)
  // ----------------------------------------------------------
  getReserveAmount(state, franchise) {
    const member    = this.roomManager.getMember(state.room.id, franchise)
    const needed    = (state.room.settings?.min_squad_size ?? 15) - (member?.squad_count ?? 0)
    const remaining = state.player_queue?.length ?? 0
    if (needed <= 0 || remaining <= 0) return 0
    return Math.min(needed, remaining) * 0.20 // min base price
  }

  // ----------------------------------------------------------
  // REPLAY RECORDING
  // ----------------------------------------------------------
  recordReplay(roomId, eventType, payload) {
    supabase.from('replay_events').insert({
      room_id:    roomId,
      event_type: eventType,
      payload,
    }).then(() => {})
  }
}

module.exports = { AuctionEngine, calculateGrade, calculatePowerScore }
