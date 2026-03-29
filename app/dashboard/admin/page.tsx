'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, Trophy, Database, Radio,
  Trash2, Edit2, Plus, Search, LogOut, KeyRound,
  BarChart2, AlertTriangle, Check, X, Loader2,
  ChevronDown, RefreshCw, UserPlus, Gavel,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/authStore'
import ChangePassword from '@/components/auth/ChangePassword'
import clsx from 'clsx'

type AdminTab = 'overview' | 'users' | 'rooms' | 'players' | 'curators' | 'audit' | 'settings'

export default function AdminDashboard() {
  const router        = useRouter()
  const { user, clearUser } = useAuthStore()
  const [tab, setTab] = useState<AdminTab>('overview')

  // Data
  const [stats, setStats]       = useState<any>(null)
  const [users, setUsers]       = useState<any[]>([])
  const [rooms, setRooms]       = useState<any[]>([])
  const [players, setPlayers]   = useState<any[]>([])
  const [curators, setCurators] = useState<any[]>([])
  const [auditLogs, setAudit]   = useState<any[]>([])
  const [loading, setLoading]   = useState(false)

  // UI state
  const [search, setSearch]       = useState('')
  const [showAddCurator, setShowAddCurator] = useState(false)
  const [showChangePwd, setShowChangePwd]   = useState(false)
  const [broadcastMsg, setBroadcastMsg]     = useState('')
  const [newCurator, setNewCurator]         = useState({ name: '', email: '', password: '' })
  const [saving, setSaving]                 = useState(false)
  const [editUser, setEditUser]             = useState<any>(null)
  const [newRole, setNewRole]               = useState('')

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin')
      const json = await res.json()
      setStats(json.stats)
      setAudit(json.recent_logs ?? [])
    } finally { setLoading(false) }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const q    = search ? `?search=${search}` : ''
      const res  = await fetch(`/api/admin/users${q}`)
      const json = await res.json()
      setUsers(json.users ?? [])
    } finally { setLoading(false) }
  }, [search])

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/rooms')
      const json = await res.json()
      setRooms(json.rooms ?? [])
    } finally { setLoading(false) }
  }, [])

  const fetchCurators = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/curators')
      const json = await res.json()
      setCurators(json.curators ?? [])
    } finally { setLoading(false) }
  }, [])

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/players')
      const json = await res.json()
      setPlayers(json.players ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'overview') fetchOverview()
    if (tab === 'users')    fetchUsers()
    if (tab === 'rooms')    fetchRooms()
    if (tab === 'curators') fetchCurators()
    if (tab === 'players')  fetchPlayers()
  }, [tab, fetchOverview, fetchUsers, fetchRooms, fetchCurators, fetchPlayers])

  useEffect(() => {
    const t = setTimeout(() => { if (tab === 'users') fetchUsers() }, 400)
    return () => clearTimeout(t)
  }, [search, tab, fetchUsers])

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg }),
      })
      toast.success('Broadcast sent!')
      setBroadcastMsg('')
    } finally { setSaving(false) }
  }

  const handleAddCurator = async () => {
    if (!newCurator.name || !newCurator.email || !newCurator.password) return toast.error('All fields required')
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/curators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurator),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`Curator ${newCurator.name} created!`)
      setShowAddCurator(false)
      setNewCurator({ name: '', email: '', password: '' })
      fetchCurators()
    } finally { setSaving(false) }
  }

  const handleRemoveCurator = async (id: string) => {
    if (!confirm('Remove curator role from this user?')) return
    await fetch('/api/admin/curators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curator_id: id }),
    })
    toast.success('Curator removed')
    fetchCurators()
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Permanently delete this user and all their data?')) return
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id }),
    })
    toast.success('User deleted')
    fetchUsers()
  }

  const handleUpdateRole = async () => {
    if (!editUser || !newRole) return
    setSaving(true)
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: editUser.id, role: newRole }),
      })
      toast.success('Role updated')
      setEditUser(null)
      fetchUsers()
    } finally { setSaving(false) }
  }

  const handleCloseRoom = async (id: string) => {
    if (!confirm('Close this room?')) return
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    toast.success('Room closed')
    fetchRooms()
  }

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('Remove this player from the pool?')) return
    await fetch(`/api/players/${id}`, { method: 'DELETE' })
    toast.success('Player removed')
    fetchPlayers()
  }

  const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview',  label: 'Overview',  icon: BarChart2  },
    { id: 'users',     label: 'Users',     icon: Users      },
    { id: 'rooms',     label: 'Rooms',     icon: Trophy     },
    { id: 'players',   label: 'Players',   icon: Database   },
    { id: 'curators',  label: 'Curators',  icon: Gavel      },
    { id: 'audit',     label: 'Audit Log', icon: AlertTriangle },
    { id: 'settings',  label: 'Settings',  icon: KeyRound   },
  ]

  return (
    <div className="min-h-screen bg-void flex">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <div className="w-56 border-r border-border bg-abyss flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-crimson/20 border border-crimson/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-crimson" />
            </div>
            <div>
              <div className="font-display text-base text-text-primary leading-none">ADMIN</div>
              <div className="text-text-muted text-xs">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                tab === t.id
                  ? 'bg-crimson/20 text-crimson border border-crimson/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              )}>
              <t.icon className="w-4 h-4 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border space-y-1">
          <button onClick={() => setShowChangePwd(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all text-left">
            <KeyRound className="w-4 h-4" /> Change Password
          </button>
          <button onClick={() => { clearUser(); router.push('/') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-crimson hover:bg-crimson/10 transition-all text-left">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-5xl">

          {/* ── OVERVIEW ──────────────────────────────────── */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-4xl text-text-primary">Dashboard</h1>
                <button onClick={fetchOverview} className="btn-ghost px-3 py-2 gap-2 text-sm">
                  <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} /> Refresh
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats && [
                  { label: 'Total Users',    value: stats.total_users,     color: 'text-sky'     },
                  { label: 'Active Rooms',   value: stats.active_rooms,    color: 'text-emerald' },
                  { label: 'Live Auctions',  value: stats.active_auctions, color: 'text-flame'   },
                  { label: 'Total Players',  value: stats.total_players,   color: 'text-gold'    },
                  { label: 'Total Bids',     value: stats.total_bids,      color: 'text-crimson' },
                ].map(s => (
                  <div key={s.label} className="glass rounded-2xl p-4 text-center">
                    <div className={clsx('font-display text-3xl', s.color)}>{s.value}</div>
                    <div className="text-text-muted text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Broadcast */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                  <Radio className="w-4 h-4" /> Broadcast to All Rooms
                </div>
                <div className="flex gap-3">
                  <input value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="Message shown to all connected users…"
                    className="input-field flex-1" />
                  <button onClick={handleBroadcast} disabled={saving || !broadcastMsg.trim()}
                    className="btn-gold px-5">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>

              {/* Recent audit log */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="font-semibold text-text-primary">Recent Activity</div>
                <div className="space-y-2">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                        log.level === 'critical' ? 'bg-crimson' :
                        log.level === 'warning'  ? 'bg-flame' : 'bg-emerald'
                      )} />
                      <span className="text-text-secondary flex-1">{log.action}</span>
                      <span className="text-text-muted text-xs flex-shrink-0">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── USERS ─────────────────────────────────────── */}
          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-4xl text-text-primary">Users</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search users…" className="input-field pl-9 py-2 text-sm w-56" />
                </div>
              </div>

              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-text-muted text-xs">
                      {['Name', 'Email', 'Role', 'Franchise', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-text-muted">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </td></tr>
                    ) : users.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge text-xs', `role-${u.role}`)}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{u.franchise ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditUser(u); setNewRole(u.role) }}
                              className="p-1.5 rounded-lg text-text-muted hover:text-sky hover:bg-sky/10 transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-crimson hover:bg-crimson/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit user modal */}
              <AnimatePresence>
                {editUser && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                      className="glass rounded-2xl p-6 w-full max-w-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary">Edit {editUser.name}</h3>
                        <button onClick={() => setEditUser(null)} className="text-text-muted hover:text-text-secondary">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-text-secondary">Role</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)} className="input-field">
                          {['team_owner','auctioneer','spectator','curator','super_admin'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleUpdateRole} disabled={saving} className="btn-gold flex-1">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                        <button onClick={() => setEditUser(null)} className="btn-ghost">Cancel</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── ROOMS ─────────────────────────────────────── */}
          {tab === 'rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h1 className="font-display text-4xl text-text-primary">Active Rooms</h1>
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
                        <span>{room.room_members?.[0]?.count ?? 0} members</span>
                      </div>
                    </div>
                    <button onClick={() => handleCloseRoom(room.id)}
                      className="btn-ghost px-3 py-2 text-sm text-crimson border-crimson/30 hover:bg-crimson/10">
                      <Trash2 className="w-4 h-4" /> Close
                    </button>
                  </div>
                ))}
                {rooms.length === 0 && !loading && (
                  <div className="glass rounded-2xl p-12 text-center text-text-muted">No active rooms</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CURATORS ──────────────────────────────────── */}
          {tab === 'curators' && (
            <motion.div key="curators" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-4xl text-text-primary">Curators</h1>
                <button onClick={() => setShowAddCurator(true)} className="btn-gold px-4 py-2 text-sm gap-2">
                  <UserPlus className="w-4 h-4" /> Add Curator
                </button>
              </div>

              <div className="space-y-3">
                {curators.map((c: any) => (
                  <div key={c.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky/20 border border-sky/30 flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-sky" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary">{c.name}</div>
                      <div className="text-text-muted text-xs">{c.email}</div>
                    </div>
                    <button onClick={() => handleRemoveCurator(c.id)}
                      className="btn-ghost px-3 py-2 text-sm text-crimson border-crimson/30 hover:bg-crimson/10">
                      Remove
                    </button>
                  </div>
                ))}
                {curators.length === 0 && !loading && (
                  <div className="glass rounded-2xl p-10 text-center text-text-muted">No curators yet</div>
                )}
              </div>

              {/* Add Curator Modal */}
              <AnimatePresence>
                {showAddCurator && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                      className="glass rounded-2xl p-6 w-full max-w-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary">Add Curator</h3>
                        <button onClick={() => setShowAddCurator(false)} className="text-text-muted hover:text-text-secondary">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input value={newCurator.name} onChange={e => setNewCurator(p => ({ ...p, name: e.target.value }))}
                          placeholder="Full name" className="input-field" />
                        <input value={newCurator.email} onChange={e => setNewCurator(p => ({ ...p, email: e.target.value }))}
                          type="email" placeholder="Email address" className="input-field" />
                        <input value={newCurator.password} onChange={e => setNewCurator(p => ({ ...p, password: e.target.value }))}
                          type="password" placeholder="Password (min 8 chars)" className="input-field" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleAddCurator} disabled={saving} className="btn-gold flex-1">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Curator'}
                        </button>
                        <button onClick={() => setShowAddCurator(false)} className="btn-ghost">Cancel</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── PLAYERS ───────────────────────────────────── */}
          {tab === 'players' && (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-4xl text-text-primary">Player Database</h1>
                <button onClick={() => router.push('/pool')} className="btn-ghost px-4 py-2 text-sm">
                  Open Pool Browser
                </button>
              </div>
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-text-muted text-xs">
                      {['Name', 'Role', 'Tier', 'Nationality', 'Base', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.slice(0, 50).map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-surface/30">
                        <td className="px-4 py-2.5 font-medium text-text-primary">{p.name}</td>
                        <td className="px-4 py-2.5 text-text-secondary">{p.role}</td>
                        <td className="px-4 py-2.5">
                          <span className="badge badge-muted text-xs">{p.stock_tier}</span>
                        </td>
                        <td className="px-4 py-2.5 text-text-secondary">{p.nationality}</td>
                        <td className="px-4 py-2.5 font-display text-gold">₹{p.base_price}Cr</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleDeletePlayer(p.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-crimson hover:bg-crimson/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── AUDIT LOG ─────────────────────────────────── */}
          {tab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h1 className="font-display text-4xl text-text-primary">Audit Log</h1>
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-text-muted text-xs">
                      {['Level', 'Action', 'Target', 'Time'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-surface/30">
                        <td className="px-4 py-2.5">
                          <span className={clsx('badge text-xs',
                            log.level === 'critical' ? 'badge-crimson' :
                            log.level === 'warning'  ? 'badge-flame' : 'badge-emerald'
                          )}>{log.level}</span>
                        </td>
                        <td className="px-4 py-2.5 text-text-primary">{log.action}</td>
                        <td className="px-4 py-2.5 text-text-muted text-xs truncate max-w-32">{log.target ?? '—'}</td>
                        <td className="px-4 py-2.5 text-text-muted text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS ──────────────────────────────────── */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-lg">
              <h1 className="font-display text-4xl text-text-primary">Settings</h1>
              <ChangePassword type="admin" userId={user?.id ?? ''} />
            </motion.div>
          )}

        </div>
      </div>

      {/* Change password modal */}
      <AnimatePresence>
        {showChangePwd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md">
              <ChangePassword type="admin" userId={user?.id ?? ''} onClose={() => setShowChangePwd(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
