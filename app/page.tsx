import Link from 'next/link'
import { Trophy, Zap, Users, BarChart3, Mic2, Shield, ChevronRight, Star } from 'lucide-react'

const FEATURES = [
  { icon: Zap,      title: 'Real-time Bidding',   desc: 'Server-authoritative auctions with live timers and instant updates across all devices.' },
  { icon: Users,    title: 'Up to 10 Franchises',  desc: 'Human and bot players. Bots have unique personalities — RCB bids 88% of the time!' },
  { icon: Star,     title: 'RTM & Emergency Loan', desc: 'Right to Match cards and ₹10Cr emergency loans add strategy to every auction.' },
  { icon: Mic2,     title: 'Voice Chat',            desc: 'Built-in voice chat for up to 10 players using LiveKit — no external tools needed.' },
  { icon: BarChart3,'title': 'Squad Analytics',     desc: 'Post-auction grades, power rankings, best buys and biggest splurges for every team.' },
  { icon: Shield,   title: 'Dynasty Mode',          desc: 'Track your franchise across multiple seasons and build a legacy.' },
]

const FRANCHISES_ROW = ['MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-void text-text-primary">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="border-b border-border/50 bg-abyss/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <span className="font-display text-xl text-gold tracking-wide">IPL AUCTION HOUSE</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"  className="btn-ghost px-4 py-2 text-sm">Sign in</Link>
            <Link href="/auth/signup" className="btn-gold  px-4 py-2 text-sm">Register</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-stadium" />
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#FFB800 1px, transparent 1px), linear-gradient(90deg, #FFB800 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-flame/8 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-32 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            IPL 2025 Season · 120+ Players
          </div>

          {/* Heading */}
          <div className="space-y-2 animate-slide-up">
            <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-none tracking-wide text-text-primary">
              IPL AUCTION
            </h1>
            <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-none tracking-wide text-gold text-glow-gold">
              HOUSE
            </h1>
          </div>

          <p className="text-text-secondary text-xl max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Real-time multiplayer IPL auction simulator. Bid on 120+ players, build your squad, and dominate the league with your friends.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/auth/signup" className="btn-gold px-8 py-4 text-base gap-2">
              Start Bidding <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="btn-ghost px-8 py-4 text-base">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '120+', label: 'IPL Players' },
              { value: '10',   label: 'Franchises'  },
              { value: '₹120Cr', label: 'Per Team'  },
              { value: '60+',  label: 'Features'    },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl text-gold">{s.value}</div>
                <div className="text-text-muted text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FRANCHISE STRIP ─────────────────────────────────── */}
      <div className="border-y border-border/50 bg-abyss/40 py-4 overflow-hidden">
        <div className="flex gap-8 animate-ticker whitespace-nowrap">
          {[...FRANCHISES_ROW, ...FRANCHISES_ROW].map((f, i) => (
            <span key={i} className="font-display text-2xl text-text-muted tracking-widest flex-shrink-0">{f}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-display text-5xl text-text-primary">Everything you need</h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Built for serious IPL fans. Every feature is designed to make your auction unforgettable.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className="glass-hover rounded-2xl p-6 space-y-3 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border/50">
        <div className="absolute inset-0 bg-gold-glow opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
          <h2 className="font-display text-6xl text-text-primary">
            Ready to build your <span className="text-gold text-glow-gold">dream squad?</span>
          </h2>
          <p className="text-text-secondary text-lg">Free to play. No downloads. Works on any device.</p>
          <Link href="/auth/signup" className="btn-gold px-10 py-4 text-lg inline-flex gap-2">
            Register Free <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-abyss/60">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Trophy className="w-4 h-4 text-gold" />
            <span>IPL Auction House · Built by Darshan Gowda S</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span>© 2026 IPL Auction House</span>
            {/* Admin login — hidden in footer, no button label hint */}
            <Link href="/auth/admin-login"
              className="text-text-muted/30 hover:text-text-muted/60 transition-colors text-xs">
              ·
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
