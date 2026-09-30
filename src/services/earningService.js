import { logger } from '../utils/logger.js';
import { DEFAULTS } from '../config/defaults.js';
import { EconomyService } from './economyService.js';

/**
 * Earning Service Architecture Foundation
 * 
 * Future Milestone Features:
 * 1. Camera Roll Photo Rewards (Highest reward, daily cap, anti-spam duplicate hash check)
 * 2. General Chat Participation Rewards (Small reward, cooldown, qualifying length check)
 * 3. Open Chat Participation Rewards (Small reward, cooldown)
 * 
 * NOTE: Currently in foundation mode. Rewards are NOT distributed yet.
 */
export class EarningService {
  /**
   * Evaluates an incoming message for Camera Roll qualifying photo criteria.
   * Reserved for future milestone.
   * @param {import('discord.js').Message} message
   * @returns {Promise<{ eligible: boolean, reason?: string }>}
   */
  static async evaluateCameraRollPost(message) {
    logger.debug(`[Placeholder] EarningService: evaluateCameraRollPost for message ${message?.id}`);
    return {
      eligible: false,
      reason: 'Feature scheduled for next milestone.',
    };
  }

  /**
   * Evaluates an incoming message for general chat engagement reward.
   * Reserved for future milestone.
   * @param {import('discord.js').Message} message
   * @returns {Promise<{ eligible: boolean, reason?: string }>}
   */
  static async evaluateChatMessage(message) {
    logger.debug(`[Placeholder] EarningService: evaluateChatMessage for message ${message?.id}`);
    return {
      eligible: false,
      reason: 'Feature scheduled for next milestone.',
    };
  }

  /**
   * Distributes qualifying activity rewards through EconomyService.
   * Reserved for future milestone.
   */
  static async awardActivityReward(guildId, userId, amount, source) {
    logger.info(`[Placeholder] EarningService: awardActivityReward ${amount} to ${userId} from ${source}`);
    // Future implementation will invoke EconomyService.addCurrency()
  }
}

export default EarningService;
