'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Gavel, Trophy, Users, Radio, LogOut,
  KeyRound, Trash2, RefreshCw, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import ChangePassword from '@/components/auth/ChangePassword'
import clsx from 'clsx'

type Tab = 'rooms' | 'users' | 'broadcast' | 'password'

export default function CuratorDashboard() {
  const router  = useRouter()
  const { user, clearUser } = useAuthStore()
  const [tab, setTab]       = useState<Tab>('rooms')
  const [rooms, setRooms]   = useState<any[]>([])
  const [users, setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [sending, setSending] = useState(false)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/rooms')
      const json = await res.json()
      setRooms(json.rooms ?? [])
    } finally { setLoading(false) }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/users')
      const json = await res.json()
      setUsers(json.users ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'rooms') fetchRooms()
    if (tab === 'users') fetchUsers()
  }, [tab, fetchRooms, fetchUsers])

  const handleCloseRoom = async (id: string) => {
    if (!confirm('Close this room?')) return
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    toast.success('Room closed')
    fetchRooms()
  }

  const handleResetPassword = async (userId: string, newPwd: string) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, new_password: newPwd }),
    })
    if (res.ok) toast.success('Password reset')
    else toast.error('Failed to reset password')
  }

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setSending(true)
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg }),
      })
      toast.success('Broadcast sent!')
      setBroadcastMsg('')
    } finally { setSending(false) }
  }

  const TABS = [
    { id: 'rooms',     label: 'Rooms',     icon: Trophy   },
    { id: 'users',     label: 'Users',     icon: Users    },
    { id: 'broadcast', label: 'Broadcast', icon: Radio    },
    { id: 'password',  label: 'Password',  icon: KeyRound },
  ]

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-border bg-abyss flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky/20 border border-sky/30 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-sky" />
            </div>
            <div>
              <div className="font-display text-base text-text-primary leading-none">CURATOR</div>
              <div className="text-text-muted text-xs truncate max-w-28">{user?.name}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                tab === t.id
                  ? 'bg-sky/20 text-sky border border-sky/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              )}>
              <t.icon className="w-4 h-4 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button onClick={() => { clearUser(); router.push('/') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-crimson hover:bg-crimson/10 transition-all text-left">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">

        {tab === 'rooms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-4xl text-text-primary">Manage Rooms</h1>
              <button onClick={fetchRooms} className="btn-ghost px-3 py-2 gap-2 text-sm">
                <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
              </button>
            </div>
            <div className="space-y-3">
              {rooms.map((room: any) => (
                <div key={room.id} className="glass rounded-2xl p-4 flex items-center gap-4">
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
                  <button onClick={() => handleCloseRoom(room.id)}
                    className="btn-ghost px-3 py-2 text-sm text-crimson border-crimson/30 hover:bg-crimson/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {rooms.length === 0 && !loading && (
                <div className="glass rounded-2xl p-10 text-center text-text-muted">No active rooms</div>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h1 className="font-display text-4xl text-text-primary">Users</h1>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-text-muted text-xs">
                    {['Name', 'Email', 'Role', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-surface/30">
                      <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge text-xs', `role-${u.role}`)}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            const pwd = prompt('New password for this user (min 8 chars):')
                            if (pwd && pwd.length >= 8) handleResetPassword(u.id, pwd)
                            else if (pwd) toast.error('Password too short')
                          }}
                          className="text-xs text-sky hover:text-sky-400 transition-colors">
                          Reset pwd
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === 'broadcast' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-lg">
            <h1 className="font-display text-4xl text-text-primary">Broadcast</h1>
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-text-secondary text-sm">Send a message to all connected users across all rooms.</p>
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Your message…"
                rows={4} className="input-field resize-none" />
              <button onClick={handleBroadcast} disabled={sending || !broadcastMsg.trim()} className="btn-gold w-full">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radio className="w-4 h-4" /> Broadcast</>}
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'password' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-md">
            <h1 className="font-display text-4xl text-text-primary">Change Password</h1>
            <ChangePassword type="curator" userId={user?.id ?? ''} />
          </motion.div>
        )}

      </div>
    </div>
  )
}
