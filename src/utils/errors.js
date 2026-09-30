/**
 * Centralized Error Hierarchy and Safe User-Facing Formatting
 */

export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code || 'INTERNAL_ERROR';
    this.userMessage = options.userMessage || 'An unexpected error occurred. Please try again later.';
    this.statusCode = options.statusCode || 500;
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, {
      code: 'DATABASE_ERROR',
      userMessage: 'A database error occurred. Your data is safe; please try again in a moment.',
      statusCode: 500,
    });
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class DiscordApiError extends AppError {
  constructor(message, originalError = null) {
    super(message, {
      code: 'DISCORD_API_ERROR',
      userMessage: 'Failed to communicate with Discord services.',
      statusCode: 502,
    });
    this.name = 'DiscordApiError';
    this.originalError = originalError;
  }
}

export class ValidationError extends AppError {
  constructor(message, userMessage) {
    super(message, {
      code: 'VALIDATION_ERROR',
      userMessage: userMessage || message,
      statusCode: 400,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Formats an error into a user-friendly message suitable for Discord interaction replies.
 * Prevents sensitive internal stack traces and server paths from being exposed.
 * @param {Error|unknown} error
 * @returns {string} Safe message for Discord users
 */
export function formatUserErrorMessage(error) {
  if (error instanceof AppError && error.userMessage) {
    return `❌ **Error**: ${error.userMessage}`;
  }

  // Generic fallback for unexpected uncaught errors
  return '❌ **Error**: An unexpected error occurred while processing this command. The issue has been logged.';
}
