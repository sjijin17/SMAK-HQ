-- Migration 001: Initial Users Table & Constraints
-- Author: Foundation Architecture
-- Description: Establishes base users table, unique constraint on (guild_id, discord_user_id), and lookup indexes.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_guild_member UNIQUE (guild_id, discord_user_id),
  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_users_guild_discord 
  ON users (guild_id, discord_user_id);

CREATE INDEX IF NOT EXISTS idx_users_guild_balance 
  ON users (guild_id, balance DESC);
