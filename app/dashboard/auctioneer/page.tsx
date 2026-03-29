'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Gavel, Trophy, Plus, ChevronRight,
  Loader2, KeyRound, LogOut, RefreshCw, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import ChangePassword from '@/components/auth/ChangePassword'
import clsx from 'clsx'

type Tab = 'rooms' | 'create' | 'password'

export default function AuctioneerDashboard() {
  const router = useRouter()
  const { user, clearUser } = useAuthStore()
  const [tab, setTab]       = useState<Tab>('rooms')
  const [rooms, setRooms]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/rooms')
      const json = await res.json()
      setRooms(json.rooms ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'rooms') fetchRooms()
  }, [tab, fetchRooms])

  const TABS = [
    { id: 'rooms',    label: 'My Rooms', icon: Trophy  },
    { id: 'create',   label: 'Create',   icon: Plus    },
    { id: 'password', label: 'Password', icon: KeyRound },
  ]

  return (
    <div className="min-h-screen bg-void">
      {/* Nav */}
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-flame/20 border border-flame/30 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-flame" />
            </div>
            <div>
              <div className="font-display text-lg text-text-primary leading-none">AUCTIONEER</div>
              <div className="text-text-muted text-xs">{user?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as Tab)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    tab === t.id ? 'bg-flame text-void' : 'text-text-secondary hover:text-text-primary'
                  )}>
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { clearUser(); router.push('/') }}
              className="p-2 text-text-muted hover:text-crimson transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {tab === 'rooms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-4xl text-text-primary">Active Rooms</h1>
              <div className="flex gap-2">
                <button onClick={fetchRooms} className="btn-ghost px-3 py-2 gap-2 text-sm">
                  <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
                </button>
                <button onClick={() => setTab('create')} className="btn-flame px-4 py-2 text-sm gap-2">
                  <Plus className="w-4 h-4" /> New Room
                </button>
              </div>
            </div>

            {rooms.length === 0 && !loading ? (
              <div className="glass rounded-2xl p-12 text-center space-y-3">
                <Trophy className="w-12 h-12 text-text-muted mx-auto" />
                <p className="text-text-secondary">No rooms yet</p>
                <button onClick={() => setTab('create')} className="btn-flame mt-2 gap-2">
                  <Plus className="w-4 h-4" /> Create First Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room: any) => (
                  <div key={room.id} className="glass-hover rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary">{room.name}</div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span className="font-display text-gold tracking-widest">{room.code}</span>
                        <span className={clsx('badge text-xs',
                          room.status === 'auction' ? 'badge-flame' :
                          room.status === 'waiting' ? 'badge-emerald' : 'badge-muted'
                        )}>{room.status}</span>
                      </div>
                    </div>
                    <button onClick={() => router.push(`/room/${room.id}`)} className="btn-gold px-4 py-2 text-sm gap-2">
                      Enter <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
            <h1 className="font-display text-4xl text-text-primary mb-6">Create Room</h1>
            {/* Reuse the lobby create form by redirecting */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <p className="text-text-secondary text-sm">Create a new auction room with full settings control.</p>
              <button onClick={() => router.push('/lobby?tab=create')} className="btn-flame w-full py-3 gap-2">
                <Plus className="w-5 h-5" /> Open Room Creator
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'password' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-4">
            <h1 className="font-display text-4xl text-text-primary">Change Password</h1>
            <ChangePassword type="user" userId={user?.id ?? ''} />
          </motion.div>
        )}

      </div>
    </div>
  )
}
