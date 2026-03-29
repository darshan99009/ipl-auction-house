'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  new_password:     z.string().min(8, 'Password must be at least 8 characters')
                              .regex(/[A-Z]/, 'Must contain an uppercase letter')
                              .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type FormData = z.infer<typeof schema>

interface Props {
  /** 'user' = regular user, 'admin' = super_admin, 'curator' = curator */
  type: 'user' | 'admin' | 'curator'
  userId: string
  onClose?: () => void
}

const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
  let score = 0
  if (pwd.length >= 8)  score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { label: 'Weak',   color: 'bg-crimson', width: 'w-1/5' }
  if (score <= 2) return { label: 'Fair',   color: 'bg-flame',   width: 'w-2/5' }
  if (score <= 3) return { label: 'Good',   color: 'bg-gold',    width: 'w-3/5' }
  if (score <= 4) return { label: 'Strong', color: 'bg-sky',     width: 'w-4/5' }
  return                 { label: 'Excellent', color: 'bg-emerald', width: 'w-full' }
}

export default function ChangePassword({ type, userId, onClose }: Props) {
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)
  const [newPwd,      setNewPwd]      = useState('')

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedPwd = watch('new_password', '')
  const strength   = passwordStrength(watchedPwd)

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const endpoint = type === 'admin' ? '/api/auth/admin-change-password' : '/api/auth/change-password'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: data.new_password }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to change password')
        return
      }

      setDone(true)
      toast.success('Password updated successfully!')
      setTimeout(() => onClose?.(), 1500)
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-emerald/20 border border-emerald/30 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald" />
        </div>
        <p className="text-text-primary font-semibold">Password updated!</p>
        <p className="text-text-secondary text-sm">Your new password is active.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Change Password</h3>
          <p className="text-text-muted text-sm">No re-authentication required</p>
        </div>
      </div>

      <div className="divider" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">New Password</label>
          <div className="relative">
            <input
              {...register('new_password')}
              type={showNew ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="input-field pr-12"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.new_password && <p className="text-crimson text-xs">{errors.new_password.message}</p>}

          {/* Strength meter */}
          {watchedPwd && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
              </div>
              <p className="text-xs text-text-muted">Strength: <span className="text-text-secondary">{strength.label}</span></p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-secondary">Confirm Password</label>
          <div className="relative">
            <input
              {...register('confirm_password')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat new password"
              className="input-field pr-12"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-crimson text-xs">{errors.confirm_password.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-gold flex-1">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              : 'Update Password'
            }
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
