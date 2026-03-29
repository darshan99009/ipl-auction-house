'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, Trophy, LogOut, KeyRound, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import ChangePassword from '@/components/auth/ChangePassword'
import clsx from 'clsx'

type Tab = 'rooms' | 'password'

export default function SpectatorDashboard() {
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

  useEffect(() => { fetchRooms() }, [fetchRooms])

  return (
    <div className="min-h-screen bg-void">
      <div className="border-b border-border bg-abyss/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-muted/30 border border-border flex items-center justify-center">
              <Eye className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <div className="font-display text-lg text-text-primary leading-none">SPECTATOR</div>
              <div className="text-text-muted text-xs">{user?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border">
              {[
                { id: 'rooms',    label: 'Live Rooms', icon: Trophy  },
                { id: 'password', label: 'Password',   icon: KeyRound },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as Tab)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    tab === t.id ? 'bg-text-secondary text-void' : 'text-text-secondary hover:text-text-primary'
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        {tab === 'rooms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-4xl text-text-primary">Watch Live</h1>
              <button onClick={fetchRooms} className="btn-ghost px-3 py-2 text-sm gap-2">
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center space-y-3">
                <Eye className="w-12 h-12 text-text-muted mx-auto" />
                <p className="text-text-secondary">No live rooms right now</p>
                <p className="text-text-muted text-sm">Check back soon or ask for a room code</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room: any) => (
                  <button key={room.id}
                    onClick={() => router.push(`/auction/${room.id}?spectate=true`)}
                    className="glass-hover rounded-2xl p-4 w-full flex items-center gap-4 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary">{room.name}</div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span className="font-display text-gold tracking-widest">{room.code}</span>
                        <span className={clsx('badge text-xs',
                          room.status === 'auction' ? 'badge-flame' : 'badge-muted'
                        )}>{room.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Eye className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
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
