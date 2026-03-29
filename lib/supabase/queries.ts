import { createServiceClient } from './server'
import type {
  User, Player, Room, RoomMember, RoomSettings,
  Bid, SquadPlayer, Retention, DynastyRecord,
  Trade, Prediction, Poll, ChatMessage,
  AuditLog, AdminStats, FranchiseCode,
} from '@/types'

// Helper to get service client
const db = () => createServiceClient()

// ============================================================
// USERS
// ============================================================
export const Users = {
  async getById(id: string) {
    const { data } = await db().from('users').select('*').eq('id', id).single()
    return data as User | null
  },

  async getByEmail(email: string) {
    const { data } = await db().from('users').select('*').eq('email', email.toLowerCase()).single()
    return data
  },

  async getAll() {
    const { data } = await db().from('users').select('id,name,email,role,franchise,created_at').order('created_at', { ascending: false })
    return data ?? []
  },

  async updatePassword(id: string, password_hash: string) {
    const { error } = await db().from('users').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  },

  async updateRole(id: string, role: string) {
    const { error } = await db().from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  },

  async delete(id: string) {
    const { error } = await db().from('users').delete().eq('id', id)
    return !error
  },
}

// ============================================================
// PLAYERS
// ============================================================
export const Players = {
  async getAll(activeOnly = true) {
    let q = db().from('players').select('*').order('stock_tier').order('name')
    if (activeOnly) q = q.eq('is_active', true)
    const { data } = await q
    return data as Player[] ?? []
  },

  async getById(id: string) {
    const { data } = await db().from('players').select('*').eq('id', id).single()
    return data as Player | null
  },

  async getByTier(tier: string) {
    const { data } = await db().from('players').select('*').eq('stock_tier', tier).eq('is_active', true)
    return data as Player[] ?? []
  },

  async create(player: Partial<Player>) {
    const { data, error } = await db().from('players').insert(player).select().single()
    if (error) throw error
    return data as Player
  },

  async update(id: string, updates: Partial<Player>) {
    const { error } = await db().from('players').update(updates).eq('id', id)
    return !error
  },

  async delete(id: string) {
    const { error } = await db().from('players').update({ is_active: false }).eq('id', id)
    return !error
  },

  async bulkInsert(players: Partial<Player>[]) {
    const { data, error } = await db().from('players').insert(players).select()
    if (error) throw error
    return data as Player[]
  },
}

// ============================================================
// ROOMS
// ============================================================
export const Rooms = {
  async create(data: {
    name: string
    host_id: string
    access_type: string
    db_source: string
    settings: RoomSettings
    is_tournament?: boolean
    curator_id?: string
  }) {
    const { data: room, error } = await db().from('rooms').insert(data).select().single()
    if (error) throw error
    return room as Room
  },

  async getById(id: string) {
    const { data } = await db().from('rooms').select('*').eq('id', id).single()
    return data as Room | null
  },

  async getByCode(code: string) {
    const { data } = await db().from('rooms').select('*').eq('code', code.toUpperCase()).single()
    return data as Room | null
  },

  async getActive() {
    const { data } = await db()
      .from('rooms')
      .select('*, room_members(count)')
      .in('status', ['waiting','retention','auction'])
      .order('created_at', { ascending: false })
    return data ?? []
  },

  async getAll() {
    const { data } = await db()
      .from('rooms')
      .select('*, room_members(count)')
      .order('created_at', { ascending: false })
    return data ?? []
  },

  async updateStatus(id: string, status: string) {
    const { error } = await db().from('rooms').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  },

  async updateSettings(id: string, settings: Partial<RoomSettings>) {
    const { data: room } = await db().from('rooms').select('settings').eq('id', id).single()
    const merged = { ...(room?.settings ?? {}), ...settings }
    const { error } = await db().from('rooms').update({ settings: merged, updated_at: new Date().toISOString() }).eq('id', id)
    return !error
  },

  async delete(id: string) {
    const { error } = await db().from('rooms').delete().eq('id', id)
    return !error
  },

  async generateInviteLink(id: string) {
    const token = crypto.randomUUID()
    const link  = `${process.env.NEXT_PUBLIC_APP_URL}/join/${token}`
    await db().from('rooms').update({ invite_link: link }).eq('id', id)
    return link
  },
}

// ============================================================
// ROOM MEMBERS
// ============================================================
export const RoomMembers = {
  async getByRoom(roomId: string) {
    const { data } = await db()
      .from('room_members')
      .select('*, users(name, avatar_url)')
      .eq('room_id', roomId)
    return data as RoomMember[] ?? []
  },

  async getByRoomAndFranchise(roomId: string, franchise: FranchiseCode) {
    const { data } = await db()
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .eq('franchise', franchise)
      .single()
    return data as RoomMember | null
  },

  async add(roomId: string, userId: string, franchise: FranchiseCode, role: string, budgetCr: number) {
    const { data, error } = await db()
      .from('room_members')
      .insert({ room_id: roomId, user_id: userId, franchise, role, budget_remaining: budgetCr })
      .select().single()
    if (error) throw error
    return data as RoomMember
  },

  async addBot(roomId: string, franchise: FranchiseCode, personality: object, budgetCr: number) {
    const { data, error } = await db()
      .from('room_members')
      .insert({ room_id: roomId, franchise, role: 'team_owner', is_bot: true, bot_personality: personality, budget_remaining: budgetCr })
      .select().single()
    if (error) throw error
    return data as RoomMember
  },

  async updateBudget(roomId: string, franchise: FranchiseCode, newBudget: number) {
    const { error } = await db()
      .from('room_members')
      .update({ budget_remaining: newBudget })
      .eq('room_id', roomId).eq('franchise', franchise)
    return !error
  },

  async setConnected(roomId: string, userId: string, connected: boolean) {
    await db().from('room_members').update({ is_connected: connected }).eq('room_id', roomId).eq('user_id', userId)
  },

  async setIconPlayer(roomId: string, franchise: FranchiseCode, playerId: string) {
    await db().from('room_members').update({ icon_player_id: playerId }).eq('room_id', roomId).eq('franchise', franchise)
  },

  async markRTMUsed(roomId: string, franchise: FranchiseCode) {
    await db().from('room_members').update({ rtm_used: true }).eq('room_id', roomId).eq('franchise', franchise)
  },

  async markLoanUsed(roomId: string, franchise: FranchiseCode) {
    await db().from('room_members').update({ loan_used: true }).eq('room_id', roomId).eq('franchise', franchise)
  },
}

// ============================================================
// BIDS
// ============================================================
export const Bids = {
  async create(bid: {
    room_id: string
    room_player_id: string
    bidder_id?: string
    franchise: FranchiseCode
    amount: number
    is_bot?: boolean
  }) {
    const { data, error } = await db().from('bids').insert(bid).select().single()
    if (error) throw error
    return data as Bid
  },

  async getByRoomPlayer(roomPlayerId: string) {
    const { data } = await db()
      .from('bids')
      .select('*')
      .eq('room_player_id', roomPlayerId)
      .order('created_at', { ascending: false })
    return data as Bid[] ?? []
  },

  async getByRoom(roomId: string) {
    const { data } = await db()
      .from('bids')
      .select('*, players(name, role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  async getRivalries(roomId: string) {
    // Find top bidding wars between two franchises on same players
    const { data } = await db().rpc('get_rivalries', { p_room_id: roomId })
    return data ?? []
  },
}

// ============================================================
// SQUADS
// ============================================================
export const Squads = {
  async getByRoom(roomId: string) {
    const { data } = await db()
      .from('squads')
      .select('*, players(*)')
      .eq('room_id', roomId)
    return data as SquadPlayer[] ?? []
  },

  async getByFranchise(roomId: string, franchise: FranchiseCode) {
    const { data } = await db()
      .from('squads')
      .select('*, players(*)')
      .eq('room_id', roomId)
      .eq('franchise', franchise)
    return data as SquadPlayer[] ?? []
  },

  async add(squad: {
    room_id: string
    franchise: FranchiseCode
    player_id: string
    price_paid: number
    is_rtm?: boolean
    is_retention?: boolean
    is_icon?: boolean
  }) {
    const { data, error } = await db().from('squads').insert(squad).select('*, players(*)').single()
    if (error) throw error
    return data as SquadPlayer
  },

  async trade(roomId: string, fromFranchise: FranchiseCode, toFranchise: FranchiseCode, playerId: string) {
    const { error } = await db()
      .from('squads')
      .update({ franchise: toFranchise })
      .eq('room_id', roomId)
      .eq('franchise', fromFranchise)
      .eq('player_id', playerId)
    return !error
  },
}

// ============================================================
// RETENTIONS
// ============================================================
export const Retentions = {
  async getByRoom(roomId: string) {
    const { data } = await db()
      .from('retentions')
      .select('*, players(*)')
      .eq('room_id', roomId)
      .order('created_at')
    return data as Retention[] ?? []
  },

  async save(retentions: Array<{
    room_id: string
    franchise: FranchiseCode
    player_id: string
    cost: number
    is_icon?: boolean
  }>) {
    const { error } = await db().from('retentions').insert(retentions)
    return !error
  },

  async markRevealed(id: string) {
    await db().from('retentions').update({ revealed: true }).eq('id', id)
  },

  async markAllRevealed(roomId: string) {
    await db().from('retentions').update({ revealed: true }).eq('room_id', roomId)
  },
}

// ============================================================
// DYNASTY
// ============================================================
export const Dynasty = {
  async save(record: Partial<DynastyRecord>) {
    const { data, error } = await db().from('dynasty').upsert(record).select().single()
    if (error) throw error
    return data as DynastyRecord
  },

  async getByUser(userId: string) {
    const { data } = await db()
      .from('dynasty')
      .select('*')
      .eq('user_id', userId)
      .order('season', { ascending: false })
    return data as DynastyRecord[] ?? []
  },

  async getLeaderboard(franchise: FranchiseCode) {
    const { data } = await db()
      .from('dynasty')
      .select('*, users(name)')
      .eq('franchise', franchise)
      .order('dynasty_points', { ascending: false })
      .limit(10)
    return data ?? []
  },
}

// ============================================================
// AUDIT LOGS
// ============================================================
export const AuditLogs = {
  async log(entry: {
    admin_id?: string
    admin_name: string
    action: string
    target?: string
    level?: 'info' | 'warning' | 'critical'
    meta?: object
  }) {
    await db().from('audit_logs').insert({ level: 'info', ...entry })
  },

  async getAll(limit = 100) {
    const { data } = await db()
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data as AuditLog[] ?? []
  },
}

// ============================================================
// ADMIN STATS
// ============================================================
export const AdminQueries = {
  async getStats(): Promise<AdminStats> {
    const [users, rooms, players, bids] = await Promise.all([
      db().from('users').select('id', { count: 'exact', head: true }),
      db().from('rooms').select('id', { count: 'exact', head: true }).in('status', ['waiting','retention','auction']),
      db().from('players').select('id', { count: 'exact', head: true }).eq('is_active', true),
      db().from('bids').select('id', { count: 'exact', head: true }),
    ])
    const { count: activeAuctions } = await db().from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'auction')

    return {
      total_users:     users.count ?? 0,
      active_rooms:    rooms.count ?? 0,
      total_players:   players.count ?? 0,
      total_bids:      bids.count ?? 0,
      active_auctions: activeAuctions ?? 0,
    }
  },
}
