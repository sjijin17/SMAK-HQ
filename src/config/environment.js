import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config();

/**
 * Validates and exposes typed environment variables.
 * Sensitive values are never printed directly to logs.
 */
export const env = {
  // Discord Bot Credentials
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  CLIENT_ID: process.env.CLIENT_ID || '',
  GUILD_ID: process.env.GUILD_ID || '',

  // Turso / libSQL Remote Database
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || '',
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || '',

  // Server & Environment Settings
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Convenience flags
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
};

/**
 * Validates required environment variables for runtime execution.
 * @param {Object} options
 * @param {boolean} options.requireDiscord - Whether Discord credentials are required (false for db migrations)
 * @param {boolean} options.requireTurso - Whether Turso credentials are required
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateEnvironment(options = { requireDiscord: true, requireTurso: true }) {
  const missing = [];

  if (options.requireDiscord) {
    if (!env.DISCORD_TOKEN) missing.push('DISCORD_TOKEN');
    if (!env.CLIENT_ID) missing.push('CLIENT_ID');
  }

  if (options.requireTurso) {
    if (!env.TURSO_DATABASE_URL) missing.push('TURSO_DATABASE_URL');
    if (!env.TURSO_AUTH_TOKEN) missing.push('TURSO_AUTH_TOKEN');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export default env;
