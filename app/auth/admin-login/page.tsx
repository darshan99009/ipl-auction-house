'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
})
type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/admin-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) { toast.error(json.error ?? 'Invalid credentials'); return }

      toast.success('Welcome, Admin')
      router.push('/dashboard/admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 animate-scale-in">

        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-crimson/20 border border-crimson/30 flex items-center justify-center">
            <Shield className="w-7 h-7 text-crimson" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl text-text-primary">Admin Access</h1>
            <p className="text-text-muted text-sm mt-1">Restricted area</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Username</label>
            <input {...register('username')} placeholder="Admin username"
              autoComplete="off" className="input-field" />
            {errors.username && <p className="text-crimson text-xs">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPwd ? 'text' : 'password'}
                placeholder="••••••••" autoComplete="current-password"
                className="input-field pr-11" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-crimson text-xs">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-crimson hover:bg-crimson/80 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 16px #FF174433' }}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              : <><Shield className="w-4 h-4" /> Enter Admin Panel</>
            }
          </button>
        </form>

      </div>
    </div>
  )
}
