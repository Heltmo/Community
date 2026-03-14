-- ═══════════════════════════════════════════════════════════════
-- BRIM COMMUNITY — Supabase SQL Schema
-- Run this entire file in Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. EXTEND members TABLE ──────────────────────────────────────
ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id   UUID    REFERENCES auth.users(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS role      TEXT    NOT NULL DEFAULT 'member';
ALTER TABLE members ADD COLUMN IF NOT EXISTS xp        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS level_id  INTEGER NOT NULL DEFAULT 1;
ALTER TABLE members ADD COLUMN IF NOT EXISTS verified  BOOLEAN NOT NULL DEFAULT false;

-- ── 2. LEVELS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS levels (
  id          SERIAL  PRIMARY KEY,
  name        TEXT    NOT NULL,
  required_xp INTEGER NOT NULL DEFAULT 0
);

INSERT INTO levels (id, name, required_xp) VALUES
  (1, 'Nykommer',              0),
  (2, 'Vokter',              100),
  (3, 'Kjemper',             300),
  (4, 'Mester',              700),
  (5, 'Eldervokter',        1500),
  (6, 'Legende',            3000),
  (7, 'Den Syvende Flamme', 6000)
ON CONFLICT (id) DO NOTHING;

-- ── 3. COMMUNITY POSTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id          SERIAL      PRIMARY KEY,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'post',   -- 'post' | 'system' | 'welcome'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. TOURNAMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'active' | 'completed'
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. TOURNAMENT PARTICIPANTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_participants (
  id            SERIAL      PRIMARY KEY,
  tournament_id INTEGER     NOT NULL REFERENCES tournaments(id)  ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  member_name   TEXT,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ── 6. TOURNAMENT RESULTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_results (
  id            SERIAL      PRIMARY KEY,
  tournament_id INTEGER     NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  winner_id     UUID        REFERENCES auth.users(id)           ON DELETE SET NULL,
  winner_name   TEXT        NOT NULL,
  position      INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. ANNOUNCEMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL      PRIMARY KEY,
  title      TEXT        NOT NULL,
  content    TEXT,
  type       TEXT        NOT NULL DEFAULT 'info',  -- 'info' | 'warning' | 'event'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON members;
DROP POLICY IF EXISTS "members_insert" ON members;
DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_select" ON members FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_insert" ON members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_update" ON members FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Also allow anon to read count (for the public counter)
CREATE POLICY "members_anon_select" ON members FOR SELECT TO anon USING (true);

-- community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON community_posts;
DROP POLICY IF EXISTS "posts_insert" ON community_posts;
DROP POLICY IF EXISTS "posts_delete" ON community_posts;
CREATE POLICY "posts_select" ON community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT TO authenticated WITH CHECK (author_id IS NULL OR auth.uid() = author_id);
CREATE POLICY "posts_delete" ON community_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- tournaments (public read, admin write handled in app)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tournaments_select" ON tournaments;
CREATE POLICY "tournaments_select" ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert" ON tournaments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tournaments_update" ON tournaments FOR UPDATE TO authenticated USING (true);

-- tournament_participants
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tp_select" ON tournament_participants;
DROP POLICY IF EXISTS "tp_insert" ON tournament_participants;
DROP POLICY IF EXISTS "tp_delete" ON tournament_participants;
CREATE POLICY "tp_select"  ON tournament_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "tp_insert"  ON tournament_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_delete"  ON tournament_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tournament_results
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_select" ON tournament_results;
CREATE POLICY "tr_select" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "tr_insert" ON tournament_results FOR INSERT TO authenticated WITH CHECK (true);

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ann_select" ON announcements;
CREATE POLICY "ann_select" ON announcements FOR SELECT USING (true);
CREATE POLICY "ann_insert" ON announcements FOR INSERT TO authenticated WITH CHECK (true);

-- levels
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "levels_select" ON levels;
CREATE POLICY "levels_select" ON levels FOR SELECT USING (true);
