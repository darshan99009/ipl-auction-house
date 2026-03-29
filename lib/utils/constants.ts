import type { FranchiseCode } from '@/types'

export const FRANCHISES: Record<FranchiseCode, {
  code: FranchiseCode
  name: string
  full_name: string
  color_primary: string
  color_secondary: string
  emoji: string
  aggression: number
  max_multiplier: number
  preferred_role: string
  anthem_path: string
}> = {
  MI: {
    code: 'MI', name: 'Mumbai Indians', full_name: 'Mumbai Indians',
    color_primary: '#004BA0', color_secondary: '#00BFFF', emoji: '💙',
    aggression: 72, max_multiplier: 8, preferred_role: 'Bowler',
    anthem_path: '/anthems/mi.mp3',
  },
  CSK: {
    code: 'CSK', name: 'Chennai Super Kings', full_name: 'Chennai Super Kings',
    color_primary: '#FDB913', color_secondary: '#004C97', emoji: '💛',
    aggression: 65, max_multiplier: 7, preferred_role: 'All-Rounder',
    anthem_path: '/anthems/csk.mp3',
  },
  RCB: {
    code: 'RCB', name: 'Royal Challengers', full_name: 'Royal Challengers Bengaluru',
    color_primary: '#EC1C24', color_secondary: '#000000', emoji: '❤️',
    aggression: 88, max_multiplier: 10, preferred_role: 'Batter',
    anthem_path: '/anthems/rcb.mp3',
  },
  KKR: {
    code: 'KKR', name: 'Kolkata Knight Riders', full_name: 'Kolkata Knight Riders',
    color_primary: '#3A225D', color_secondary: '#B3A123', emoji: '💜',
    aggression: 70, max_multiplier: 7, preferred_role: 'All-Rounder',
    anthem_path: '/anthems/kkr.mp3',
  },
  DC: {
    code: 'DC', name: 'Delhi Capitals', full_name: 'Delhi Capitals',
    color_primary: '#0078BC', color_secondary: '#EF1B23', emoji: '🔵',
    aggression: 60, max_multiplier: 7, preferred_role: 'Bowler',
    anthem_path: '/anthems/dc.mp3',
  },
  SRH: {
    code: 'SRH', name: 'Sunrisers Hyderabad', full_name: 'Sunrisers Hyderabad',
    color_primary: '#F26522', color_secondary: '#000000', emoji: '🧡',
    aggression: 82, max_multiplier: 9, preferred_role: 'Batter',
    anthem_path: '/anthems/srh.mp3',
  },
  PBKS: {
    code: 'PBKS', name: 'Punjab Kings', full_name: 'Punjab Kings',
    color_primary: '#ED1B24', color_secondary: '#A7A9AC', emoji: '❤️',
    aggression: 55, max_multiplier: 6, preferred_role: 'Bowler',
    anthem_path: '/anthems/pbks.mp3',
  },
  GT: {
    code: 'GT', name: 'Gujarat Titans', full_name: 'Gujarat Titans',
    color_primary: '#1C1C5E', color_secondary: '#C8A951', emoji: '🔷',
    aggression: 67, max_multiplier: 7, preferred_role: 'Batter',
    anthem_path: '/anthems/gt.mp3',
  },
  LSG: {
    code: 'LSG', name: 'Lucknow Super Giants', full_name: 'Lucknow Super Giants',
    color_primary: '#A72B3D', color_secondary: '#FBDB1C', emoji: '🔵',
    aggression: 80, max_multiplier: 9, preferred_role: 'WK-Batter',
    anthem_path: '/anthems/lsg.mp3',
  },
  RR: {
    code: 'RR', name: 'Rajasthan Royals', full_name: 'Rajasthan Royals',
    color_primary: '#2D4EA2', color_secondary: '#E8527D', emoji: '💗',
    aggression: 62, max_multiplier: 8, preferred_role: 'Batter',
    anthem_path: '/anthems/rr.mp3',
  },
}

export const FRANCHISE_LIST = Object.values(FRANCHISES)

export const FRANCHISE_CODES = Object.keys(FRANCHISES) as FranchiseCode[]

export const TIER_ORDER = ['Icon', 'Platinum', 'Gold', 'Silver', 'Bronze'] as const

export const RETENTION_COSTS = {
  1: 18,   // First retention costs 18 Cr
  2: 14,   // Second retention costs 14 Cr
  3: 11,   // Third retention costs 11 Cr
} as const

export const SQUAD_REQUIREMENTS = {
  min_wk:       1,
  min_bowlers:  3,
  min_overseas: 2,
  min_size:     15,
  max_size:     25,
  max_overseas: 4,
} as const

export const BID_INCREMENT = (currentPrice: number): number => {
  if (currentPrice < 1)   return 0.20
  if (currentPrice < 5)   return 0.50
  if (currentPrice < 10)  return 1.00
  if (currentPrice < 20)  return 2.00
  return 5.00
}
