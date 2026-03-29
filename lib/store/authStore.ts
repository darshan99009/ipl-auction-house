import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user:     User | null
  token:    string | null
  setUser:  (user: User, token: string) => void
  clearUser:() => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:  null,
      token: null,

      setUser: (user, token) => set({ user, token }),

      clearUser: () => {
        set({ user: null, token: null })
        // Clear cookie too
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      },
    }),
    {
      name:    'ipl_auth',
      // Only persist non-sensitive fields
      partialize: (state) => ({ user: state.user }),
    }
  )
)
