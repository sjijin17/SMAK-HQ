-- Migration 002: Economy Activity & Daily Claims

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user
  ON transactions (guild_id, discord_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_guild
  ON transactions (guild_id, created_at DESC);

CREATE TABLE IF NOT EXISTS earning_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  source_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_earning_activity_user_date
  ON earning_activity (guild_id, discord_user_id, activity_type, activity_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_earning_activity_source
  ON earning_activity (guild_id, discord_user_id, activity_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS daily_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  earned_amount INTEGER NOT NULL DEFAULT 0,
  action_count INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_daily_limit
    UNIQUE (guild_id, discord_user_id, activity_type, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date
  ON daily_limits (guild_id, discord_user_id, activity_date);

CREATE TABLE IF NOT EXISTS daily_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  claim_date TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_daily_claim
    UNIQUE (guild_id, discord_user_id, claim_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_claims_user
  ON daily_claims (guild_id, discord_user_id, claim_date DESC);
