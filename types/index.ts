// ============================================================
// IPL AUCTION HOUSE — COMPLETE TYPE DEFINITIONS
// ============================================================

// ----------------------------------------------------------
// USER & ROLES
// ----------------------------------------------------------
export type UserRole = 'super_admin' | 'curator' | 'auctioneer' | 'team_owner' | 'spectator'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string
  franchise?: FranchiseCode
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  token: string
}

// ----------------------------------------------------------
// FRANCHISES
// ----------------------------------------------------------
export type FranchiseCode =
  | 'MI' | 'CSK' | 'RCB' | 'KKR' | 'DC'
  | 'SRH' | 'PBKS' | 'GT' | 'LSG' | 'RR'

export interface Franchise {
  code: FranchiseCode
  name: string
  full_name: string
  color_primary: string
  color_secondary: string
  logo: string
  anthem_url?: string
  aggression: number         // 0–100
  max_multiplier: number     // e.g. 10x base
  preferred_role: PlayerRole
}

// ----------------------------------------------------------
// PLAYERS
// ----------------------------------------------------------
export type PlayerRole = 'Batter' | 'Bowler' | 'All-Rounder' | 'WK-Batter'
export type BowlerType = 'Fast' | 'Spin' | 'Medium' | null
export type PlayerNationality = 'Indian' | 'Overseas'
export type PlayerStatus = 'Capped' | 'Uncapped'
export type StockTier = 'Icon' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze'

export interface Player {
  id: string
  name: string
  role: PlayerRole
  bowler_type: BowlerType
  nationality: PlayerNationality
  status: PlayerStatus
  stock_tier: StockTier
  base_price: number          // in Crores
  image_url?: string
  country: string
  ipl_team?: FranchiseCode    // current IPL team
  is_active: boolean
  is_custom: boolean          // added by room host
  batting_style?: string
  age?: number
  created_at: string
}

// ----------------------------------------------------------
// ROOMS
// ----------------------------------------------------------
export type RoomStatus = 'waiting' | 'retention' | 'auction' | 'completed' | 'paused'
export type RoomAccess = 'code' | 'link' | 'public'
export type AuctionSpeed = 'blitz' | 'normal' | 'relaxed'
export type DBSource = 'global' | 'imported' | 'manual'

export interface RoomSettings {
  budget_cr: number           // default 120
  max_squad: number           // default 25
  max_overseas: number        // default 4
  max_retentions: number      // default 3
  rtm_per_team: number        // default 1
  emergency_loan_cr: number   // default 10
  auction_speed: AuctionSpeed
  timer_seconds: number       // 5 / 10 / 20
  rul_cap: number             // default 125
  min_wk: number              // default 1
  min_bowlers: number         // default 3
  min_overseas: number        // default 2
  min_squad_size: number      // default 15
  price_drop_on_no_bid: boolean
  price_drop_pct: number      // default 10
  secret_budget: boolean
  dynasty_mode: boolean
  tier_order: StockTier[]     // reveal order
}

export interface Room {
  id: string
  code: string                // 6-char code
  invite_link?: string
  name: string
  host_id: string
  access_type: RoomAccess
  db_source: DBSource
  status: RoomStatus
  settings: RoomSettings
  current_set: number
  season: number              // for dynasty
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  franchise: FranchiseCode
  budget_remaining: number
  icon_player_id?: string     // chosen icon from retentions
  rtm_used: boolean
  loan_used: boolean
  overseas_count: number
  squad_count: number
  role: UserRole
  is_bot: boolean
  is_connected: boolean
  joined_at: string
}

// ----------------------------------------------------------
// RETENTIONS
// ----------------------------------------------------------
export interface Retention {
  id: string
  room_id: string
  franchise: FranchiseCode
  player_id: string
  player?: Player
  cost: number
  is_icon: boolean
  revealed: boolean           // for reveal ceremony
  created_at: string
}

// ----------------------------------------------------------
// AUCTION
// ----------------------------------------------------------
export type AuctionPlayerStatus = 'pending' | 'bidding' | 'sold' | 'unsold' | 'deferred'

export interface AuctionPlayer {
  id: string
  room_id: string
  player_id: string
  player?: Player
  set_number: number
  reveal_order: number
  status: AuctionPlayerStatus
  current_price: number
  base_price: number
  sold_to?: FranchiseCode
  sold_price?: number
  bid_count: number
  is_rtm: boolean
  created_at: string
}

export interface Bid {
  id: string
  room_id: string
  auction_player_id: string
  bidder_id: string
  franchise: FranchiseCode
  amount: number
  is_bot: boolean
  timestamp: string
}

// ----------------------------------------------------------
// SQUADS
// ----------------------------------------------------------
export interface SquadPlayer {
  id: string
  room_id: string
  franchise: FranchiseCode
  player_id: string
  player?: Player
  price_paid: number
  is_rtm: boolean
  is_retention: boolean
  is_icon: boolean
  acquired_at: string
}

export type SquadGrade = 'A+' | 'A' | 'B' | 'C' | 'D'

export interface SquadAnalytics {
  franchise: FranchiseCode
  grade: SquadGrade
  score: number
  budget_spent: number
  budget_remaining: number
  overseas_count: number
  role_breakdown: Record<PlayerRole, number>
  best_buy: Player | null
  biggest_splurge: Player | null
  balance_score: number
}

// ----------------------------------------------------------
// DYNASTY
// ----------------------------------------------------------
export interface DynastyRecord {
  id: string
  user_id: string
  franchise: FranchiseCode
  season: number
  room_id: string
  squad_json: SquadPlayer[]
  grade: SquadGrade
  power_rank: number
  dynasty_points: number
  created_at: string
}

// ----------------------------------------------------------
// TRADES
// ----------------------------------------------------------
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface Trade {
  id: string
  room_id: string
  proposer_franchise: FranchiseCode
  receiver_franchise: FranchiseCode
  offered_player_id: string
  requested_player_id: string
  status: TradeStatus
  proposed_at: string
  resolved_at?: string
}

// ----------------------------------------------------------
// PREDICTIONS
// ----------------------------------------------------------
export interface Prediction {
  id: string
  room_id: string
  user_id: string
  predicted_player_id: string  // most expensive
  actual_player_id?: string
  is_correct?: boolean
  created_at: string
}

// ----------------------------------------------------------
// POLLS
// ----------------------------------------------------------
export interface Poll {
  id: string
  room_id: string
  question: string
  options: string[]
  votes: Record<string, string>  // user_id -> option
  created_by: string
  expires_at: string
  created_at: string
}

// ----------------------------------------------------------
// REACTIONS
// ----------------------------------------------------------
export interface Reaction {
  id: string
  room_id: string
  user_id: string
  franchise: FranchiseCode
  emoji: string
  timestamp: string
}

// ----------------------------------------------------------
// CHAT
// ----------------------------------------------------------
export interface ChatMessage {
  id: string
  room_id: string
  user_id: string
  user_name: string
  franchise: FranchiseCode
  message: string
  timestamp: string
}

// ----------------------------------------------------------
// AUCTION REPLAY
// ----------------------------------------------------------
export interface ReplayEvent {
  id: string
  room_id: string
  event_type: string
  payload: Record<string, unknown>
  timestamp: string
}

// ----------------------------------------------------------
// ADMIN
// ----------------------------------------------------------
export interface AuditLog {
  id: string
  admin_id: string
  admin_name: string
  action: string
  target: string
  level: 'info' | 'warning' | 'critical'
  meta?: Record<string, unknown>
  created_at: string
}

export interface AdminStats {
  total_users: number
  active_rooms: number
  total_players: number
  total_bids: number
  active_auctions: number
}

// ----------------------------------------------------------
// SOCKET EVENTS
// ----------------------------------------------------------
export interface SocketEvents {
  // Room
  'room:join':              (roomId: string) => void
  'room:member_joined':     (member: RoomMember) => void
  'room:member_left':       (userId: string) => void
  'room:state_sync':        (state: RoomState) => void

  // Retention
  'retention:reveal_next':  (retention: Retention) => void
  'retention:all_revealed': () => void

  // Auction
  'auction:started':        () => void
  'auction:player_reveal':  (player: AuctionPlayer) => void
  'auction:bidding_open':   (player: AuctionPlayer) => void
  'auction:bid':            (bid: Bid) => void
  'auction:bid_update':     (bid: Bid, player: AuctionPlayer) => void
  'auction:timer_tick':     (seconds: number) => void
  'auction:accel_start':    () => void
  'auction:sold':           (player: AuctionPlayer, bid: Bid) => void
  'auction:unsold':         (player: AuctionPlayer) => void
  'auction:rtm_used':       (franchise: FranchiseCode, player: AuctionPlayer) => void
  'auction:loan_taken':     (franchise: FranchiseCode) => void
  'auction:snapshot':       (stats: SnapshotStats) => void
  'auction:news_flash':     (headline: string) => void
  'auction:stock_ticker':   (update: StockUpdate) => void
  'auction:ended':          (results: AuctionResults) => void
  'auction:pause_toggle':   (paused: boolean, message?: string) => void
  'auction:price_drop':     (player: AuctionPlayer, newPrice: number) => void
  'auction:bidding_war':    (franchise1: FranchiseCode, franchise2: FranchiseCode) => void

  // Auctioneer controls
  'auctioneer:spotlight':   (playerId: string) => void
  'auctioneer:confetti':    () => void
  'auctioneer:extend_timer':(seconds: number) => void
  'auctioneer:commentary':  (text: string) => void
  'auctioneer:reorder':     (playerIds: string[]) => void

  // Social
  'social:reaction':        (reaction: Reaction) => void
  'social:chat':            (message: ChatMessage) => void
  'social:poll_created':    (poll: Poll) => void
  'social:poll_vote':       (pollId: string, option: string) => void

  // Voice
  'voice:offer':            (data: RTCSessionDescriptionInit, targetId: string) => void
  'voice:answer':           (data: RTCSessionDescriptionInit, targetId: string) => void
  'voice:ice':              (data: RTCIceCandidateInit, targetId: string) => void
}

// ----------------------------------------------------------
// ROOM STATE (in-memory on server)
// ----------------------------------------------------------
export interface RoomState {
  room: Room
  members: RoomMember[]
  current_player: AuctionPlayer | null
  timer: number
  is_paused: boolean
  bid_history: Bid[]
  sold_count: number
  unsold_count: number
}

// ----------------------------------------------------------
// SNAPSHOT & ANALYTICS
// ----------------------------------------------------------
export interface SnapshotStats {
  sold_count: number
  total_spend: number
  most_expensive: { player: Player; price: number; franchise: FranchiseCode } | null
  franchise_spends: Record<FranchiseCode, number>
}

export interface StockUpdate {
  player_id: string
  tier: StockTier
  change: 'up' | 'down' | 'same'
}

export interface AuctionResults {
  room_id: string
  squads: Record<FranchiseCode, SquadPlayer[]>
  analytics: SquadAnalytics[]
  mvp_player: Player | null
  best_value: { player: Player; franchise: FranchiseCode } | null
  biggest_splurge: { player: Player; franchise: FranchiseCode; overpay: number } | null
  rivalry: { franchise1: FranchiseCode; franchise2: FranchiseCode; battles: number } | null
  power_rankings: Array<{ franchise: FranchiseCode; score: number }>
}

// ----------------------------------------------------------
// FORM TYPES
// ----------------------------------------------------------
export interface LoginForm {
  email: string
  password: string
}

export interface SignupForm {
  name: string
  email: string
  password: string
  confirm_password: string
  franchise: FranchiseCode
}

export interface ChangePasswordForm {
  new_password: string
  confirm_password: string
}

export interface AdminLoginForm {
  username: string
  password: string
}
