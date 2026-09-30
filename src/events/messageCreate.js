import { logger } from '../utils/logger.js';

export const name = 'messageCreate';
export const once = false;

/**
 * Handles incoming guild messages.
 * 
 * In this foundation stage, this verifies the bot is successfully receiving 
 * Message events and privileged message content from the Discord Gateway.
 * 
 * NOTE: As per architectural specification:
 * - NO currency is awarded yet.
 * - NO message rewards are active.
 * - NO Camera Roll rewards are active.
 * - NO secret-word detection triggers punishments yet.
 * 
 * @param {import('discord.js').Message} message
 */
export async function execute(message) {
  // Always ignore bot accounts to avoid infinite loops
  if (message.author.bot) return;

  // Ignore direct messages (economy runs strictly inside guilds)
  if (!message.guild) return;

  // Demonstration logging in debug mode: confirms Gateway reception of message content
  logger.debug(
    `[Gateway Message Received] Channel: #${message.channel.name} (${message.channelId}) | Author: ${message.author.tag} | Has Attachments: ${message.attachments.size > 0}`
  );

  // Future milestone hooks will be dispatched here:
  // 1. EarningService.evaluateCameraRollPost(message)
  // 2. EarningService.evaluateChatMessage(message)
  // 3. JailService.checkSecretRuleViolation(message)
}

export default { name, once, execute };
