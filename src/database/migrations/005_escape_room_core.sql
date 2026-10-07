-- ============================================================================
-- Migration 005: Escape Room Core Platform
-- ============================================================================
-- Establishes the reusable Escape Room platform.
--
-- CASES:
--   Permanent investigation/case definitions.
--
-- SESSIONS:
--   Individual team attempts against a published case.
--
-- SESSION PLAYERS:
--   Discord members participating in a specific session.
--
-- This migration intentionally does NOT create story-specific puzzles,
-- evidence, timers, or Discord channels yet. Those will be built on top
-- of this reusable foundation.
-- ============================================================================


-- ============================================================================
-- CASES
-- ============================================================================
CREATE TABLE IF NOT EXISTS escape_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Discord server this case belongs to.
  guild_id TEXT NOT NULL,

  -- Human/admin-facing identifier, e.g. CASE-001.
  case_code TEXT NOT NULL,

  -- Public case title.
  title TEXT NOT NULL,

  -- Short description shown before starting.
  description TEXT,

  -- Case lifecycle:
  -- DRAFT -> TESTING -> PUBLISHED -> ACTIVE -> ARCHIVED
  status TEXT NOT NULL DEFAULT 'DRAFT',

  -- Maximum number of players permitted for a session.
  player_limit INTEGER NOT NULL DEFAULT 3,

  -- Time limit in minutes.
  duration_minutes INTEGER NOT NULL DEFAULT 45,

  -- Optional case author/creator Discord ID.
  created_by TEXT,

  -- Case content/configuration version.
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_escape_case_code
    UNIQUE (guild_id, case_code),

  CONSTRAINT chk_escape_case_status
    CHECK (status IN (
      'DRAFT',
      'TESTING',
      'PUBLISHED',
      'ACTIVE',
      'ARCHIVED'
    )),

  CONSTRAINT chk_escape_case_player_limit
    CHECK (player_limit >= 1),

  CONSTRAINT chk_escape_case_duration
    CHECK (duration_minutes > 0),

  CONSTRAINT chk_escape_case_version
    CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_escape_cases_guild_status
  ON escape_cases (guild_id, status);

CREATE INDEX IF NOT EXISTS idx_escape_cases_guild_created
  ON escape_cases (guild_id, created_at DESC);


-- ============================================================================
-- ESCAPE SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS escape_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Case being played.
  case_id INTEGER NOT NULL,

  -- Discord server where the session is taking place.
  guild_id TEXT NOT NULL,

  -- Session lifecycle.
  --
  -- WAITING:
  --   Team selected, waiting for all required players to join voice.
  --
  -- ACTIVE:
  --   Investigation is running.
  --
  -- PAUSED:
  --   Temporarily paused due to a disconnect/grace period.
  --
  -- SUCCESS:
  --   Team solved the case.
  --
  -- FAILED:
  --   Team failed the case.
  --
  -- EXPIRED:
  --   Time limit elapsed.
  --
  -- CANCELLED:
  --   Admin/system cancelled the session.
  status TEXT NOT NULL DEFAULT 'WAITING',

  -- Server-authoritative timing.
  started_at TIMESTAMP,
  deadline_at TIMESTAMP,

  -- When the session ended, regardless of outcome.
  ended_at TIMESTAMP,

  -- Number of hints used by the team.
  hints_used INTEGER NOT NULL DEFAULT 0,

  -- Number of incorrect final/puzzle submissions.
  wrong_submissions INTEGER NOT NULL DEFAULT 0,

  -- Final answer submitted by the team, if applicable.
  final_answer TEXT,

  -- Human-readable result/reason.
  result_note TEXT,

  -- Reward granted after success.
  reward_amount INTEGER NOT NULL DEFAULT 0,

  -- Whether a failure punishment was applied.
  punishment_applied INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_session_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id),

  CONSTRAINT chk_escape_session_status
    CHECK (status IN (
      'WAITING',
      'ACTIVE',
      'PAUSED',
      'SUCCESS',
      'FAILED',
      'EXPIRED',
      'CANCELLED'
    )),

  CONSTRAINT chk_escape_session_hints
    CHECK (hints_used >= 0),

  CONSTRAINT chk_escape_session_wrong_submissions
    CHECK (wrong_submissions >= 0),

  CONSTRAINT chk_escape_session_reward
    CHECK (reward_amount >= 0),

  CONSTRAINT chk_escape_session_punishment
    CHECK (punishment_applied IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_escape_sessions_guild_status
  ON escape_sessions (guild_id, status);

CREATE INDEX IF NOT EXISTS idx_escape_sessions_case
  ON escape_sessions (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escape_sessions_deadline
  ON escape_sessions (status, deadline_at);


-- ============================================================================
-- ESCAPE SESSION PLAYERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS escape_session_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  discord_user_id TEXT NOT NULL,

  -- Role is deliberately generic so future cases can assign
  -- differentiated player responsibilities.
  player_role TEXT,

  -- Whether this player has successfully joined the required
  -- investigation voice channel.
  voice_present INTEGER NOT NULL DEFAULT 0,

  -- First time they joined the required voice channel.
  voice_joined_at TIMESTAMP,

  -- Most recent time they left the required voice channel.
  voice_left_at TIMESTAMP,

  -- Accumulated seconds spent in the required voice channel.
  voice_seconds INTEGER NOT NULL DEFAULT 0,

  -- Player-specific progress.
  evidence_found INTEGER NOT NULL DEFAULT 0,

  -- Whether the player completed/participated through the end.
  participation_status TEXT NOT NULL DEFAULT 'ACTIVE',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_session_player_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_session_player
    UNIQUE (session_id, discord_user_id),

  CONSTRAINT chk_escape_player_voice_present
    CHECK (voice_present IN (0, 1)),

  CONSTRAINT chk_escape_player_voice_seconds
    CHECK (voice_seconds >= 0),

  CONSTRAINT chk_escape_player_evidence_found
    CHECK (evidence_found >= 0),

  CONSTRAINT chk_escape_player_participation
    CHECK (participation_status IN (
      'ACTIVE',
      'COMPLETED',
      'DISCONNECTED',
      'FAILED',
      'REMOVED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_escape_session_players_session
  ON escape_session_players (session_id);

CREATE INDEX IF NOT EXISTS idx_escape_session_players_user
  ON escape_session_players (discord_user_id);


-- ============================================================================
-- ESCAPE SESSION EVENT LOG
-- ============================================================================
-- Permanent audit trail for important session events.
--
-- This allows us to reconstruct what happened during a case without
-- relying on Discord's temporary message/channel history.

CREATE TABLE IF NOT EXISTS escape_session_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  discord_user_id TEXT,

  event_type TEXT NOT NULL,

  -- Optional structured data serialized as JSON.
  event_data TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_session_event_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escape_session_events_session
  ON escape_session_events (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_escape_session_events_type
  ON escape_session_events (event_type, created_at DESC);
