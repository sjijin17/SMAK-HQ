-- Migration 003: Arcade System

CREATE TABLE IF NOT EXISTS arcade_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  game_type TEXT NOT NULL,
  result TEXT NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_arcade_attempts_user_date
  ON arcade_attempts (
    guild_id,
    discord_user_id,
    activity_date,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_arcade_attempts_guild
  ON arcade_attempts (
    guild_id,
    created_at DESC
  );

CREATE TABLE IF NOT EXISTS arcade_daily_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_arcade_daily_limit
    UNIQUE (guild_id, discord_user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_arcade_daily_limits_user_date
  ON arcade_daily_limits (
    guild_id,
    discord_user_id,
    activity_date
  );
