-- ============================================================
-- IPL AUCTION HOUSE — COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'team_owner'
                   CHECK (role IN ('super_admin','curator','auctioneer','team_owner','spectator')),
  franchise        TEXT CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_franchise ON users(franchise);

-- ============================================================
-- 2. PLAYERS
-- ============================================================
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  role            TEXT NOT NULL
                  CHECK (role IN ('Batter','Bowler','All-Rounder','WK-Batter')),
  bowler_type     TEXT CHECK (bowler_type IN ('Fast','Spin','Medium')),
  nationality     TEXT NOT NULL CHECK (nationality IN ('Indian','Overseas')),
  status          TEXT NOT NULL CHECK (status IN ('Capped','Uncapped')),
  stock_tier      TEXT NOT NULL DEFAULT 'Silver'
                  CHECK (stock_tier IN ('Icon','Platinum','Gold','Silver','Bronze')),
  base_price      NUMERIC(6,2) NOT NULL DEFAULT 0.20, -- in Crores
  image_url       TEXT,
  country         TEXT NOT NULL DEFAULT 'India',
  ipl_team        TEXT CHECK (ipl_team IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  batting_style   TEXT,
  age             INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom       BOOLEAN NOT NULL DEFAULT FALSE, -- added by room host
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_role        ON players(role);
CREATE INDEX idx_players_stock_tier  ON players(stock_tier);
CREATE INDEX idx_players_nationality ON players(nationality);
CREATE INDEX idx_players_is_active   ON players(is_active);

-- ============================================================
-- 3. ROOMS
-- ============================================================
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            CHAR(6) NOT NULL UNIQUE,
  invite_link     TEXT UNIQUE,
  name            TEXT NOT NULL,
  host_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_type     TEXT NOT NULL DEFAULT 'code'
                  CHECK (access_type IN ('code','link','public')),
  db_source       TEXT NOT NULL DEFAULT 'global'
                  CHECK (db_source IN ('global','imported','manual')),
  status          TEXT NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','retention','auction','completed','paused')),
  current_set     INTEGER NOT NULL DEFAULT 1,
  season          INTEGER NOT NULL DEFAULT 1,
  settings        JSONB NOT NULL DEFAULT '{
    "budget_cr": 120,
    "max_squad": 25,
    "max_overseas": 4,
    "max_retentions": 3,
    "rtm_per_team": 1,
    "emergency_loan_cr": 10,
    "auction_speed": "normal",
    "timer_seconds": 10,
    "min_wk": 1,
    "min_bowlers": 3,
    "min_overseas": 2,
    "min_squad_size": 15,
    "price_drop_on_no_bid": true,
    "price_drop_pct": 10,
    "secret_budget": false,
    "dynasty_mode": false,
    "tier_order": ["Icon","Platinum","Gold","Silver","Bronze"]
  }',
  is_tournament   BOOLEAN NOT NULL DEFAULT FALSE,
  curator_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_code       ON rooms(code);
CREATE INDEX idx_rooms_status     ON rooms(status);
CREATE INDEX idx_rooms_host_id    ON rooms(host_id);
CREATE INDEX idx_rooms_curator_id ON rooms(curator_id);

-- ============================================================
-- 4. ROOM MEMBERS
-- ============================================================
CREATE TABLE room_members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  franchise         TEXT NOT NULL
                    CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  role              TEXT NOT NULL DEFAULT 'team_owner'
                    CHECK (role IN ('auctioneer','team_owner','spectator')),
  budget_remaining  NUMERIC(7,2) NOT NULL DEFAULT 120,
  icon_player_id    UUID REFERENCES players(id) ON DELETE SET NULL,
  rtm_used          BOOLEAN NOT NULL DEFAULT FALSE,
  loan_used         BOOLEAN NOT NULL DEFAULT FALSE,
  overseas_count    INTEGER NOT NULL DEFAULT 0,
  squad_count       INTEGER NOT NULL DEFAULT 0,
  is_bot            BOOLEAN NOT NULL DEFAULT FALSE,
  is_connected      BOOLEAN NOT NULL DEFAULT FALSE,
  bot_personality   JSONB, -- aggression, max_multiplier, preferred_role
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, franchise),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_members_room_id  ON room_members(room_id);
CREATE INDEX idx_room_members_user_id  ON room_members(user_id);
CREATE INDEX idx_room_members_franchise ON room_members(franchise);

-- ============================================================
-- 5. ROOM PLAYERS (per-room player pool)
-- ============================================================
CREATE TABLE room_players (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  set_number      INTEGER NOT NULL DEFAULT 1,
  reveal_order    INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','bidding','sold','unsold','deferred')),
  current_price   NUMERIC(6,2),
  sold_to         TEXT CHECK (sold_to IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  sold_price      NUMERIC(6,2),
  bid_count       INTEGER NOT NULL DEFAULT 0,
  is_rtm          BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_at     TIMESTAMPTZ,
  sold_at         TIMESTAMPTZ,
  UNIQUE(room_id, player_id)
);

CREATE INDEX idx_room_players_room_id   ON room_players(room_id);
CREATE INDEX idx_room_players_status    ON room_players(status);
CREATE INDEX idx_room_players_set       ON room_players(set_number);

-- ============================================================
-- 6. BIDS
-- ============================================================
CREATE TABLE bids (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id           UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_player_id    UUID NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  bidder_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  franchise         TEXT NOT NULL
                    CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  amount            NUMERIC(6,2) NOT NULL,
  is_bot            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bids_room_id        ON bids(room_id);
CREATE INDEX idx_bids_room_player_id ON bids(room_player_id);
CREATE INDEX idx_bids_franchise      ON bids(franchise);
CREATE INDEX idx_bids_created_at     ON bids(created_at);

-- ============================================================
-- 7. SQUADS
-- ============================================================
CREATE TABLE squads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  franchise       TEXT NOT NULL
                  CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  price_paid      NUMERIC(6,2) NOT NULL,
  is_rtm          BOOLEAN NOT NULL DEFAULT FALSE,
  is_retention    BOOLEAN NOT NULL DEFAULT FALSE,
  is_icon         BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, franchise, player_id)
);

CREATE INDEX idx_squads_room_id   ON squads(room_id);
CREATE INDEX idx_squads_franchise ON squads(franchise);

-- ============================================================
-- 8. RETENTIONS
-- ============================================================
CREATE TABLE retentions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  franchise    TEXT NOT NULL
               CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  cost         NUMERIC(6,2) NOT NULL,
  is_icon      BOOLEAN NOT NULL DEFAULT FALSE,
  revealed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, franchise, player_id)
);

CREATE INDEX idx_retentions_room_id   ON retentions(room_id);
CREATE INDEX idx_retentions_franchise ON retentions(franchise);

-- ============================================================
-- 9. DYNASTY
-- ============================================================
CREATE TABLE dynasty (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  franchise        TEXT NOT NULL
                   CHECK (franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  season           INTEGER NOT NULL,
  room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  squad_json       JSONB NOT NULL DEFAULT '[]',
  grade            TEXT CHECK (grade IN ('A+','A','B','C','D')),
  power_rank       INTEGER,
  dynasty_points   INTEGER NOT NULL DEFAULT 0,
  budget_spent     NUMERIC(7,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, franchise, season, room_id)
);

CREATE INDEX idx_dynasty_user_id   ON dynasty(user_id);
CREATE INDEX idx_dynasty_franchise ON dynasty(franchise);
CREATE INDEX idx_dynasty_season    ON dynasty(season);

-- ============================================================
-- 10. TRADES
-- ============================================================
CREATE TABLE trades (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id              UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  proposer_franchise   TEXT NOT NULL
                       CHECK (proposer_franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  receiver_franchise   TEXT NOT NULL
                       CHECK (receiver_franchise IN ('MI','CSK','RCB','KKR','DC','SRH','PBKS','GT','LSG','RR')),
  offered_player_id    UUID NOT NULL REFERENCES players(id),
  requested_player_id  UUID NOT NULL REFERENCES players(id),
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','accepted','rejected','cancelled')),
  proposed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ
);

CREATE INDEX idx_trades_room_id            ON trades(room_id);
CREATE INDEX idx_trades_proposer_franchise ON trades(proposer_franchise);
CREATE INDEX idx_trades_status             ON trades(status);

-- ============================================================
-- 11. PREDICTIONS
-- ============================================================
CREATE TABLE predictions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id              UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  predicted_player_id  UUID NOT NULL REFERENCES players(id),
  actual_player_id     UUID REFERENCES players(id),
  is_correct           BOOLEAN,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============================================================
-- 12. POLLS
-- ============================================================
CREATE TABLE polls (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  options     JSONB NOT NULL DEFAULT '[]',   -- string[]
  votes       JSONB NOT NULL DEFAULT '{}',   -- { user_id: option }
  created_by  UUID NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_polls_room_id ON polls(room_id);

-- ============================================================
-- 13. CHAT MESSAGES
-- ============================================================
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  franchise   TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_room_id    ON chat_messages(room_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at);

-- ============================================================
-- 14. REACTIONS
-- ============================================================
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  franchise   TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reactions_room_id ON reactions(room_id);

-- ============================================================
-- 15. AUCTION REPLAY EVENTS
-- ============================================================
CREATE TABLE replay_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_replay_room_id    ON replay_events(room_id);
CREATE INDEX idx_replay_created_at ON replay_events(created_at);

-- ============================================================
-- 16. AUDIT LOGS (Admin)
-- ============================================================
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  target       TEXT,
  level        TEXT NOT NULL DEFAULT 'info'
               CHECK (level IN ('info','warning','critical')),
  meta         JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin_id   ON audit_logs(admin_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_level      ON audit_logs(level);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate 6-char room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TRIGGER AS $$
DECLARE code TEXT; exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM rooms WHERE rooms.code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  NEW.code := code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_generate_code BEFORE INSERT ON rooms
  FOR EACH ROW WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_room_code();

-- Decrement budget when squad player added
CREATE OR REPLACE FUNCTION update_member_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_retention THEN
    UPDATE room_members
    SET budget_remaining = budget_remaining - NEW.price_paid,
        squad_count      = squad_count + 1
    WHERE room_id = NEW.room_id AND franchise = NEW.franchise;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER squads_update_budget AFTER INSERT ON squads
  FOR EACH ROW EXECUTE FUNCTION update_member_budget();

-- Track overseas count
CREATE OR REPLACE FUNCTION update_overseas_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE room_members rm
    SET overseas_count = overseas_count + 1
    FROM players p
    WHERE p.id = NEW.player_id
      AND p.nationality = 'Overseas'
      AND rm.room_id = NEW.room_id
      AND rm.franchise = NEW.franchise;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER squads_overseas_count AFTER INSERT ON squads
  FOR EACH ROW EXECUTE FUNCTION update_overseas_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids          ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE retentions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynasty       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades        ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE replay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS (used by our backend)
-- All reads/writes go through server-side API with service role key
-- Frontend never touches DB directly

-- Allow service role full access
CREATE POLICY "service_role_all" ON users         FOR ALL USING (true);
CREATE POLICY "service_role_all" ON players       FOR ALL USING (true);
CREATE POLICY "service_role_all" ON rooms         FOR ALL USING (true);
CREATE POLICY "service_role_all" ON room_members  FOR ALL USING (true);
CREATE POLICY "service_role_all" ON room_players  FOR ALL USING (true);
CREATE POLICY "service_role_all" ON bids          FOR ALL USING (true);
CREATE POLICY "service_role_all" ON squads        FOR ALL USING (true);
CREATE POLICY "service_role_all" ON retentions    FOR ALL USING (true);
CREATE POLICY "service_role_all" ON dynasty       FOR ALL USING (true);
CREATE POLICY "service_role_all" ON trades        FOR ALL USING (true);
CREATE POLICY "service_role_all" ON predictions   FOR ALL USING (true);
CREATE POLICY "service_role_all" ON polls         FOR ALL USING (true);
CREATE POLICY "service_role_all" ON chat_messages FOR ALL USING (true);
CREATE POLICY "service_role_all" ON reactions     FOR ALL USING (true);
CREATE POLICY "service_role_all" ON replay_events FOR ALL USING (true);
CREATE POLICY "service_role_all" ON audit_logs    FOR ALL USING (true);
