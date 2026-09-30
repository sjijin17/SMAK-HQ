import { EarningService } from '../services/earningService.js';
import { logger } from '../utils/logger.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    if (!message || message.author?.bot || !message.guildId) {
      return;
    }

    try {
      const cameraResult = await EarningService.evaluateCameraRollPost(message);

      if (cameraResult.eligible) {
        await EarningService.awardActivityReward(
          message.guildId,
          message.author.id,
          cameraResult.amount,
          'activity_camera_roll',
          {
            referenceType: 'discord_message',
            referenceId: message.id,
            description: 'Camera Roll photo reward',
          }
        );

        return;
      }

      const chatResult = await EarningService.evaluateChatMessage(message);

      if (!chatResult.eligible) {
        return;
      }

      const source =
        chatResult.activityType === 'general_chat'
          ? 'activity_general_chat'
          : 'activity_open_chat';

      await EarningService.awardActivityReward(
        message.guildId,
        message.author.id,
        chatResult.amount,
        source,
        {
          referenceType: 'discord_message',
          referenceId: message.id,
          description:
            source === 'activity_general_chat'
              ? 'General Chat activity reward'
              : 'Open Chat activity reward',
        }
      );
    } catch (error) {
      logger.error(
        `Failed to process activity reward for message ${message.id}:`,
        error
      );
    }
  },
};
