# 🏏 IPL Auction House v3.0

Real-time multiplayer IPL auction simulator — bid on 120+ players, build squads, voice chat, dynasty mode, and more.

**Built by Darshan Gowda S · Presidency University, Bengaluru**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Real-time | Socket.IO on custom Node.js server |
| Database + Auth | Supabase (PostgreSQL) |
| Voice Chat | LiveKit Cloud |
| Deployment | Railway (server) + Vercel (optional static) |
| PDF/Image | html2canvas + jsPDF |

---

## Features

- ✅ Real-time bidding — server-authoritative, clients can't fake bids
- ✅ 120+ IPL 2025 players across Icon/Platinum/Gold/Silver/Bronze tiers
- ✅ Bot franchises with per-team personality (RCB 88% aggression!)
- ✅ RTM cards, emergency loans, bid increment table
- ✅ Retention ceremony with icon player reveal
- ✅ Accelerated timer after 5 consecutive bids
- ✅ Price drop on no bids
- ✅ Bidding war detection
- ✅ Budget alarm below ₹20Cr
- ✅ Live reactions, team chat, polls, predictions
- ✅ Voice chat via LiveKit
- ✅ Auctioneer controls (pause, +5s, spotlight, confetti, commentary)
- ✅ Squad grades (A+/A/B/C/D) + power rankings
- ✅ Dynasty mode — multi-season history
- ✅ Trade system — post-auction player swaps
- ✅ Dream Team builder
- ✅ Auction replay
- ✅ WhatsApp squad card sharing
- ✅ Admin panel (super admin + curator roles)
- ✅ Mobile-first UI
- ✅ Reconnect on disconnect

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/darshan99009/ipl-auction-house
cd ipl-auction-house
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. In the SQL Editor, run `database/schema.sql`
3. Then run `database/seed.sql`
4. Copy your project URL and keys

### 3. Set up LiveKit (voice chat)

1. Go to [livekit.io](https://livekit.io) → Cloud → New project
2. Copy your WebSocket URL, API key, and secret

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-48-char-random-secret
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
ADMIN_USERNAME=ipl_admin
ADMIN_PASSWORD_HASH=$2a$12$... (generate below)
NEXT_PUBLIC_BUDGET_CR=120
```

### 5. Generate admin password hash

```bash
node -e "const b = require('bcryptjs'); b.hash('YourPassword', 12).then(console.log)"
```

Paste the output into `ADMIN_PASSWORD_HASH` in `.env.local`.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Railway)

Railway is recommended over Render because it keeps Socket.IO connections alive 24/7.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ipl-auction-house
git push -u origin main
```

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository
3. Railway auto-detects Node.js

### 3. Set environment variables in Railway dashboard

Add all variables from `.env.example` — except `NEXT_PUBLIC_SOCKET_URL` which should point to your Railway deployment URL.

### 4. Deploy

Railway auto-deploys on every push to main.

---

## How to Play

### As Team Owner
1. Register at `/auth/signup` and pick your franchise
2. Join a room via 6-char code or invite link
3. During retention phase, select up to 3 players to keep
4. During auction, click **BID NOW** to place bids
5. Use **RTM Card** once to reclaim a formerly retained player
6. Use **Emergency Loan** once if you run low on budget (must release a player)
7. After auction, propose trades and build your Dream Team

### As Auctioneer
1. Register, then a Super Admin must set your role to `auctioneer`
2. Create a room from the lobby
3. Configure settings (speed, budget, dynasty mode, etc.)
4. During auction, use the 🔨 panel to: pause, +5s timer, spotlight, confetti, commentary

### As Admin
1. Access `/auth/admin-login` via the tiny `·` dot in the home page footer
2. Use username/password set in environment variables
3. Full control: users, rooms, players, curators, audit log, broadcast

---

## Project Structure

```
ipl-auction-house/
├── app/
│   ├── page.tsx                    # Home landing page
│   ├── auth/
│   │   ├── login/                  # Login page
│   │   ├── signup/                 # Signup with franchise picker
│   │   └── admin-login/            # Admin-only login (footer dot)
│   ├── lobby/                      # Room browser + create
│   ├── pool/                       # Player pool browser
│   ├── room/[id]/                  # Waiting room
│   ├── retention/[id]/             # Retention phase
│   ├── auction/[id]/               # Live auction room
│   ├── results/[id]/               # Post-auction results
│   ├── trades/[id]/                # Trade center
│   ├── dream-team/[id]/            # Dream XI builder
│   ├── replay/[id]/                # Auction replay
│   ├── join/[token]/               # Invite link handler
│   ├── dashboard/
│   │   ├── admin/                  # Super Admin dashboard
│   │   ├── curator/                # Curator dashboard
│   │   ├── owner/                  # Team Owner dashboard
│   │   ├── auctioneer/             # Auctioneer dashboard
│   │   └── spectator/              # Spectator dashboard
│   └── api/                        # All API routes
├── backend/
│   ├── engine/
│   │   ├── AuctionEngine.js        # Server-authoritative auction logic
│   │   └── RoomStateManager.js     # In-memory room state
│   └── socket/
│       ├── auctionHandlers.js      # Bidding, RTM, auctioneer controls
│       ├── roomHandlers.js         # Join, leave, reconnect
│       └── socialHandlers.js       # Chat, reactions, polls
├── components/
│   └── auth/
│       └── ChangePassword.tsx      # Used in all 5 dashboards
├── lib/
│   ├── hooks/
│   │   ├── useSocket.ts            # Socket.IO client hook
│   │   └── useVoiceChat.ts         # LiveKit voice hook
│   ├── store/
│   │   ├── auctionStore.ts         # Zustand auction state
│   │   └── authStore.ts            # Persisted auth state
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server + service role client
│   │   └── queries.ts              # All DB queries
│   └── utils/
│       └── constants.ts            # Franchises, bid increments, costs
├── types/index.ts                  # All TypeScript types
├── database/
│   ├── schema.sql                  # 16 tables + triggers + RLS
│   └── seed.sql                    # 125 IPL 2025 players
├── server.js                       # Custom Next.js + Socket.IO server
├── middleware.ts                   # Role-based route protection
└── .env.example                    # All required environment variables
```

---

## Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full website — users, rooms, players, curators, audit log |
| **Curator** | Manage rooms, reset passwords, broadcast |
| **Auctioneer** | Create rooms, run auctions, auctioneer controls |
| **Team Owner** | Bid, retain, trade, dynasty |
| **Spectator** | Watch only, no bidding |

---

## Franchise Bot Personalities

| Franchise | Aggression | Max Bid | Preferred Role |
|-----------|-----------|---------|----------------|
| RCB | 88% | 10x base | Batter |
| LSG | 80% | 9x base | WK-Batter |
| SRH | 82% | 9x base | Batter |
| MI | 72% | 8x base | Bowler |
| KKR | 70% | 7x base | All-Rounder |
| GT | 67% | 7x base | Batter |
| CSK | 65% | 7x base | All-Rounder |
| RR | 62% | 8x base | Batter |
| DC | 60% | 7x base | Bowler |
| PBKS | 55% | 6x base | Bowler |

---

## Security

- Passwords hashed with bcrypt (cost 12)
- JWT tokens — 7 days for users, 12 hours for admins
- All auction logic server-authoritative — clients cannot fake bids or budgets
- CORS whitelisted to your app URL only
- Admin login accessible only from the hidden footer dot — no visible button or link
- Service role key never exposed to client
- RLS enabled on all tables (backend uses service role)

---

## License

MIT — built for personal use with friends. Not affiliated with BCCI or IPL.
