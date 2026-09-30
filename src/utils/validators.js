/**
 * Parameter and Environment Validators
 */

/**
 * Validates a Discord Snowflake ID (17-20 digit integer string)
 * @param {string} id
 * @returns {boolean}
 */
export function isValidSnowflake(id) {
  if (typeof id !== 'string') return false;
  return /^[0-9]{17,20}$/.test(id);
}

/**
 * Validates a Turso/libSQL database connection URL
 * Must start with libsql://, wss://, or https://
 * @param {string} url
 * @returns {boolean}
 */
export function isValidTursoUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  return /^libsql:\/\/[a-z0-9-_.]+/i.test(url) || /^https?:\/\/[a-z0-9-_.]+/i.test(url);
}

/**
 * Validates whether a value is a valid non-negative integer currency amount
 * @param {number|string} amount
 * @returns {boolean}
 */
export function isValidCurrencyAmount(amount) {
  const num = Number(amount);
  return Number.isInteger(num) && num >= 0 && Number.isFinite(num);
}
