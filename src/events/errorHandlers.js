import { logger } from '../utils/logger.js';

/**
 * Registers global and client-level error listeners to prevent unexpected crashes.
 * @param {import('discord.js').Client} client
 */
export function registerErrorHandlers(client) {
  // Discord Client WebSocket / Gateway errors
  client.on('error', (error) => {
    logger.error('Discord Client encounter an unexpected error:', error);
  });

  client.on('shardError', (error, shardId) => {
    logger.error(`Discord Shard [${shardId}] encounter connection error:`, error);
  });

  client.on('shardDisconnect', (event, shardId) => {
    logger.warn(`Discord Shard [${shardId}] disconnected from Gateway (Code: ${event.code})`);
  });

  client.on('shardReconnecting', (shardId) => {
    logger.info(`Discord Shard [${shardId}] attempting to reconnect to Gateway...`);
  });

  // Global Node.js unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection detected:', reason);
  });

  // Global Node.js uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception detected:', error);
    // Depending on severity, in production Node usually exits, but we log cleanly first
  });

  logger.debug('Global error and shard monitoring handlers registered.');
}

export default registerErrorHandlers;
