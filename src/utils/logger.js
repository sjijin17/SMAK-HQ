/**
 * Centralized Application Logger
 * Formats log levels with timestamps, colors, and automatic credential sanitization.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Patterns that should be redacted from log outputs
const SENSITIVE_PATTERNS = [
  /([A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,})/g, // Discord Bot Token
  /(ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)/g,          // JWT / Auth tokens
  /(authToken=[^&\s]+)/gi,                                         // URL auth token param
  /(password=[^&\s]+)/gi,
  /(token=[^&\s]+)/gi,
];

/**
 * Sanitizes strings and objects to prevent secrets leaking to stdout/stderr.
 */
function sanitize(item) {
  if (typeof item === 'string') {
    let sanitized = item;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
    }
    return sanitized;
  }

  if (item instanceof Error) {
    const cleanError = new Error(sanitize(item.message));
    cleanError.stack = sanitize(item.stack || '');
    return cleanError;
  }

  if (typeof item === 'object' && item !== null) {
    try {
      const serialized = JSON.stringify(item);
      return JSON.parse(sanitize(serialized));
    } catch {
      return '[Unserializable Object]';
    }
  }

  return item;
}

function formatMessage(level, message, ...meta) {
  const timestamp = new Date().toISOString();
  const cleanMessage = sanitize(message);
  const cleanMeta = meta.map(sanitize);

  return {
    timestamp,
    level,
    message: cleanMessage,
    meta: cleanMeta.length > 0 ? cleanMeta : null,
  };
}

export const logger = {
  debug(message, ...meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      const formatted = formatMessage('DEBUG', message, ...meta);
      console.log(`[${formatted.timestamp}] [DEBUG] ${formatted.message}`, ...(formatted.meta || []));
    }
  },

  info(message, ...meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const formatted = formatMessage('INFO', message, ...meta);
      console.log(`[${formatted.timestamp}] [INFO]  ${formatted.message}`, ...(formatted.meta || []));
    }
  },

  warn(message, ...meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      const formatted = formatMessage('WARN', message, ...meta);
      console.warn(`[${formatted.timestamp}] [WARN]  ${formatted.message}`, ...(formatted.meta || []));
    }
  },

  error(message, ...meta) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const formatted = formatMessage('ERROR', message, ...meta);
      console.error(`[${formatted.timestamp}] [ERROR] ${formatted.message}`, ...(formatted.meta || []));
    }
  },
};

export default logger;
