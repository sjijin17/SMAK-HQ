-- Migration 004: Robbery, Shop Inventory, and Jail
-- Establishes persistent state for the Phase 3 robbery and jail systems.

CREATE TABLE IF NOT EXISTS robbery_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  robber_user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  result TEXT NOT NULL,
  attempted_amount INTEGER NOT NULL DEFAULT 0,
  transferred_amount INTEGER NOT NULL DEFAULT 0,
  penalty_amount INTEGER NOT NULL DEFAULT 0,
  jail_record_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_robbery_attempt_daily
  ON robbery_attempts (
    guild_id,
    robber_user_id,
    activity_date
  );

CREATE INDEX IF NOT EXISTS idx_robbery_attempts_guild_date
  ON robbery_attempts (
    guild_id,
    activity_date,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_robbery_attempts_target
  ON robbery_attempts (
    guild_id,
    target_user_id,
    created_at DESC
  );

CREATE TABLE IF NOT EXISTS robbery_shop_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  success_bonus_percent INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_robbery_shop_item_key UNIQUE (item_key),
  CONSTRAINT chk_shop_item_price_non_negative CHECK (price >= 0),
  CONSTRAINT chk_shop_item_bonus_non_negative CHECK (success_bonus_percent >= 0),
  CONSTRAINT chk_shop_item_active CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS robbery_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_robbery_inventory_item
    UNIQUE (guild_id, discord_user_id, item_id),

  CONSTRAINT chk_inventory_quantity_non_negative
    CHECK (quantity >= 0),

  CONSTRAINT fk_inventory_item
    FOREIGN KEY (item_id) REFERENCES robbery_shop_items(id)
);

CREATE INDEX IF NOT EXISTS idx_robbery_inventory_user
  ON robbery_inventory (
    guild_id,
    discord_user_id
  );

CREATE TABLE IF NOT EXISTS jail_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  reason_type TEXT NOT NULL,
  reason TEXT,
  bail_amount INTEGER NOT NULL DEFAULT 0,
  jailed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  release_at TIMESTAMP,
  bailed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'jailed',

  CONSTRAINT chk_jail_bail_non_negative CHECK (bail_amount >= 0),
  CONSTRAINT chk_jail_status
    CHECK (status IN ('jailed', 'released', 'bailed'))
);

CREATE INDEX IF NOT EXISTS idx_jail_records_user_status
  ON jail_records (
    guild_id,
    discord_user_id,
    status,
    release_at
  );

CREATE INDEX IF NOT EXISTS idx_jail_records_guild_status
  ON jail_records (
    guild_id,
    status,
    release_at
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_jail_per_member
  ON jail_records (
    guild_id,
    discord_user_id
  )
  WHERE status = 'jailed';

INSERT OR IGNORE INTO robbery_shop_items
  (item_key, item_name, description, price, success_bonus_percent, active)
VALUES
  (
    'lockpick',
    'Lockpick',
    'A basic lockpick that slightly improves robbery success.',
    100,
    5,
    1
  ),
  (
    'mask',
    'Mask',
    'A mask that gives a moderate robbery success bonus.',
    250,
    10,
    1
  ),
  (
    'gloves',
    'Gloves',
    'Gloves that provide a small additional robbery success bonus.',
    400,
    15,
    1
  );
