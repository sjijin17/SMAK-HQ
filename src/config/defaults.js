/**
 * Default configuration constants for the Discord economy and entertainment systems.
 * Centralized here to avoid hardcoded magic numbers across services.
 */
export const DEFAULTS = {
  // Economy Defaults
  ECONOMY: {
    STARTING_BALANCE: 0,
    CURRENCY_NAME: 'Credits',
    CURRENCY_SYMBOL: '🪙',
    MIN_TRANSFER_AMOUNT: 1,
    MAX_TRANSFER_AMOUNT: 1_000_000,
  },

  // Activity Earning Defaults
  ACTIVITY_EARNING: {
    CAMERA_ROLL_REWARD: 100,
    CAMERA_ROLL_DAILY_LIMIT: 5,
    CAMERA_ROLL_COOLDOWN_HOURS: 24,

    GENERAL_CHAT_REWARD: 5,
    GENERAL_CHAT_DAILY_LIMIT: 30,
    GENERAL_CHAT_COOLDOWN_SECONDS: 60,

    OPEN_CHAT_REWARD: 5,
    OPEN_CHAT_DAILY_LIMIT: 30,
    OPEN_CHAT_COOLDOWN_SECONDS: 60,

    TIME_ZONE: 'Asia/Manila',
  },

  // Planned Arcade Defaults (Reserved for future milestone)
  ARCADE: {
    DAILY_ATTEMPTS: 5,
  },

  // Planned Robbery Defaults (Reserved for future milestone)
  ROBBERY: {
    DAILY_LIMIT: 1,
    BASE_SUCCESS_CHANCE: 0.40, // 40% base success
    PENALTY_PERCENTAGE: 0.25,  // 25% fine on failure
  },

  // Planned Jail Defaults (Reserved for future milestone)
  JAIL: {
    ROBBERY_TIMEOUT_MINUTES: 30,
    SECRET_RULE_TIMEOUT_MINUTES: 10,
    ROBBERY_BAIL_AMOUNT: 500,
    SECRET_RULE_BAIL_AMOUNT: 150,
  },

  // Planned Escape Room Defaults (Reserved for future milestone)
  ESCAPE_ROOM: {
    TEAM_SIZE: 3,
    INTERVAL_DAYS: 7,
    SKIP_PENALTY_AMOUNT: 300,
  },

  // System & Health Defaults
  SYSTEM: {
    HEALTH_CHECK_PATH: '/health',
    DEFAULT_PORT: 8080,
    DATABASE_QUERY_TIMEOUT_MS: 10_000,
  },
};

export default DEFAULTS;
