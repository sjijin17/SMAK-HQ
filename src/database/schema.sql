-- ================================================================
-- DISCORD ECONOMY BOT - FOUNDATION DATABASE SCHEMA (Turso / libSQL)
-- ================================================================

-- Migration tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Core Users Table:
-- Represents a Discord member within a specific guild (server).
-- Multi-tenant by design: one Discord account can have distinct balances across servers.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Enforce uniqueness of user per guild
  CONSTRAINT uq_guild_member UNIQUE (guild_id, discord_user_id),

  -- Integrity check to prevent invalid negative balances
  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_guild_discord 
  ON users (guild_id, discord_user_id);

CREATE INDEX IF NOT EXISTS idx_users_guild_balance 
  ON users (guild_id, balance DESC);
