'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Trophy, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/lib/store/authStore'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

const FRANCHISE_TAGLINES = [
  'Paltan ready. Are you?',
  'Ee sala cup namde.',
  'One Family. One Goal.',
  'Korbo Lorbo Jeetbo Re!',
  'Dil Dilli Dilli!',
  'Rise. Orange Army.',
  'Sher Di Aayi Aa.',
  'Aa Bail Mujhe Maar.',
  'Lucknow mein swagat hai!',
  'Halla Bol!',
]

export default function LoginPage() {
  const router      = useRouter()
  const { setUser } = useAuthStore()

  // FIX 1: Set tagline client-side only to avoid server/client hydration mismatch
  const [tagline, setTagline]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    setTagline(FRANCHISE_TAGLINES[Math.floor(Math.random() * FRANCHISE_TAGLINES.length)])
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Login failed')
        return
      }

      // FIX 2: Save user to auth store so dashboards can read name/role/franchise
      setUser(json.user, '')

      toast.success(`Welcome back, ${json.user.name}! 🏏`)

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        super_admin: '/dashboard/admin',
        curator:     '/dashboard/curator',
        auctioneer:  '/dashboard/auctioneer',
        team_owner:  '/dashboard/owner',
        spectator:   '/dashboard/spectator',
      }
      router.push(roleRoutes[json.user.role] ?? '/dashboard/owner')
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex">

      {/* LEFT — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-16">
        <div className="absolute inset-0 bg-stadium" />
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#FFB800 1px, transparent 1px), linear-gradient(90deg, #FFB800 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-flame/10 blur-3xl" />

        <div className="relative z-10 text-center space-y-8">
          <div className="flex items-center justify-center gap-3 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/30 flex items-center justify-center shadow-gold">
              <Trophy className="w-8 h-8 text-gold" />
            </div>
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="font-display text-7xl font-bold text-text-primary text-glow-gold leading-none tracking-wide">
              IPL AUCTION
            </h1>
            <h1 className="font-display text-7xl font-bold text-gold leading-none tracking-wide">
              HOUSE
            </h1>
          </div>

          {/* Only render tagline after client mount */}
          {tagline && (
            <p className="text-text-secondary text-lg italic animate-fade-in" style={{ animationDelay: '0.2s' }}>
              &ldquo;{tagline}&rdquo;
            </p>
          )}

          <div className="flex items-center justify-center gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Teams',   value: '10'     },
              { label: 'Players', value: '120+'   },
              { label: 'Budget',  value: '₹120Cr' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl text-gold">{stat.value}</div>
                <div className="text-text-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Auth panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-slide-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-gold" />
            </div>
            <span className="font-display text-2xl text-gold tracking-wide">IPL AUCTION HOUSE</span>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-4xl text-text-primary tracking-wide">Welcome back</h2>
            <p className="text-text-secondary">Sign in to your franchise dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="input-field"
              />
              {errors.email && <p className="text-crimson text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-crimson text-xs">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full text-base py-3.5"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                : <><span>Sign in</span><ChevronRight className="w-5 h-5" /></>
              }
            </button>
          </form>

          <div className="divider" />

          <p className="text-text-secondary text-sm text-center">
            New franchise?{' '}
            <Link href="/auth/signup" className="text-gold hover:text-gold-light font-medium transition-colors">
              Register your team
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
