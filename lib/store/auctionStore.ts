import { create } from 'zustand'
import type {
  Room, RoomMember, AuctionPlayer, Bid, FranchiseCode,
  SnapshotStats, AuctionResults,
} from '@/types'

type AuctionPhase = 'waiting' | 'retention' | 'revealing' | 'bidding' | 'sold' | 'unsold' | 'ended'

interface Commentary { text: string; author: string; ts: number }

interface AuctionState {
  // Room
  room:              Room | null
  members:           RoomMember[]
  phase:             AuctionPhase
  is_paused:         boolean
  pause_message:     string | null

  // Current player
  current_player:    AuctionPlayer | null
  timer:             number
  is_hotseat:        boolean
  is_accelerated:    boolean
  is_spotlight:      boolean

  // Bids
  bid_history:       Bid[]
  sold_count:        number

  // Social
  headlines:         string[]
  commentary:        Commentary[]
  bidding_war:       { f1: FranchiseCode; f2: FranchiseCode } | null
  budget_alarms:     Record<string, number>

  // Snapshot
  snapshot:          SnapshotStats | null
  set_complete:      unknown | null

  // Results
  results:           AuctionResults | null

  // Actions
  syncState:         (state: Partial<AuctionState>) => void
  setStatus:         (status: string) => void
  setPhase:          (phase: AuctionPhase) => void
  setCurrentPlayer:  (player: AuctionPlayer) => void
  setTimer:          (t: number) => void
  setHotseat:        (v: boolean) => void
  setAccelerated:    (v: boolean) => void
  setSpotlight:      (v: boolean) => void
  addBid:            (bid: Bid) => void
  addSoldPlayer:     (player: AuctionPlayer, franchise: FranchiseCode, price: number) => void
  addMember:         (member: RoomMember) => void
  removeMember:      (userId: string) => void
  updateMemberBudget:(franchise: FranchiseCode, budget: number) => void
  addHeadline:       (h: string) => void
  addCommentary:     (c: Commentary) => void
  setBiddingWar:     (f1: FranchiseCode, f2: FranchiseCode) => void
  triggerBudgetAlarm:(franchise: FranchiseCode, remaining: number) => void
  setSnapshot:       (s: SnapshotStats) => void
  setSetComplete:    (data: unknown) => void
  setPaused:         (paused: boolean, message?: string) => void
  setResults:        (results: AuctionResults) => void
  reset:             () => void
}

const initialState = {
  room:           null,
  members:        [],
  phase:          'waiting' as AuctionPhase,
  is_paused:      false,
  pause_message:  null,
  current_player: null,
  timer:          10,
  is_hotseat:     false,
  is_accelerated: false,
  is_spotlight:   false,
  bid_history:    [],
  sold_count:     0,
  headlines:      [],
  commentary:     [],
  bidding_war:    null,
  budget_alarms:  {},
  snapshot:       null,
  set_complete:   null,
  results:        null,
}

export const useAuctionStore = create<AuctionState>((set) => ({
  ...initialState,

  syncState: (state) => set((prev) => ({ ...prev, ...state })),

  setStatus: (status) => set((prev) => ({
    room: prev.room ? { ...prev.room, status: status as Room['status'] } : null,
  })),

  setPhase: (phase) => set({ phase, is_spotlight: false, is_accelerated: phase === 'bidding' ? prev_acc : false }),

  setCurrentPlayer: (player) => set({ current_player: player, is_hotseat: false, is_accelerated: false }),

  setTimer: (timer) => set({ timer }),

  setHotseat: (is_hotseat) => set({ is_hotseat }),

  setAccelerated: (is_accelerated) => set({ is_accelerated }),

  setSpotlight: (is_spotlight) => set({ is_spotlight }),

  addBid: (bid) => set((prev) => ({
    bid_history: [bid, ...prev.bid_history].slice(0, 50),
  })),

  addSoldPlayer: (player, franchise, price) => set((prev) => ({
    current_player: { ...player, sold_to: franchise, sold_price: price, status: 'sold' },
    sold_count:     prev.sold_count + 1,
  })),

  addMember: (member) => set((prev) => ({
    members: prev.members.some(m => m.id === member.id)
      ? prev.members.map(m => m.id === member.id ? member : m)
      : [...prev.members, member],
  })),

  removeMember: (userId) => set((prev) => ({
    members: prev.members.map(m => m.user_id === userId ? { ...m, is_connected: false } : m),
  })),

  updateMemberBudget: (franchise, budget) => set((prev) => ({
    members: prev.members.map(m => m.franchise === franchise ? { ...m, budget_remaining: budget } : m),
  })),

  addHeadline: (h) => set((prev) => ({
    headlines: [h, ...prev.headlines].slice(0, 20),
  })),

  addCommentary: (c) => set((prev) => ({
    commentary: [...prev.commentary, c].slice(-50),
  })),

  setBiddingWar: (f1, f2) => set({ bidding_war: { f1, f2 } }),

  triggerBudgetAlarm: (franchise, remaining) => set((prev) => ({
    budget_alarms: { ...prev.budget_alarms, [franchise]: remaining },
  })),

  setSnapshot: (snapshot) => set({ snapshot }),

  setSetComplete: (set_complete) => set({ set_complete }),

  setPaused: (is_paused, pause_message = null) => set({ is_paused, pause_message: pause_message ?? null }),

  setResults: (results) => set({ results }),

  reset: () => set(initialState),
}))

// Workaround for setPhase closure
let prev_acc = false
