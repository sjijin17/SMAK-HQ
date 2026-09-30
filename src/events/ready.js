import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';

export const name = 'ready';
export const once = true;

/**
 * Handles the Discord Client 'ready' event upon successful gateway connection.
 * @param {import('discord.js').Client} client
 */
export async function execute(client) {
  logger.info(`Discord Bot connected successfully as ${client.user.tag} (ID: ${client.user.id})`);
  logger.info(`Active in ${client.guilds.cache.size} server(s).`);

  // Set bot activity status
  try {
    client.user.setPresence({
      activities: [
        {
          name: '/ping | Economy Foundation',
          type: ActivityType.Custom,
          state: 'Economy & Entertainment Bot Online',
        },
      ],
      status: 'online',
    });
  } catch (error) {
    logger.warn('Failed to set bot presence:', error.message);
  }
}

export default { name, once, execute };
