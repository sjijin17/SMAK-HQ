import { execute, queryOne } from '../database/client.js';
import { DEFAULTS } from '../config/defaults.js';
import { EconomyService } from './economyService.js';
import { getManilaDate } from '../utils/time.js';
import { logger } from '../utils/logger.js';

const ACTIVITY_TYPES = {
  CAMERA_ROLL: 'camera_roll',
  GENERAL_CHAT: 'general_chat',
  OPEN_CHAT: 'open_chat',
};

const ACTIVITY_CONFIG = {
  [ACTIVITY_TYPES.CAMERA_ROLL]: {
    reward: 100,
    dailyLimit: 5,
    cooldownSeconds: 0,
  },
  [ACTIVITY_TYPES.GENERAL_CHAT]: {
    reward: 5,
    dailyLimit: 30,
    cooldownSeconds: 60,
  },
  [ACTIVITY_TYPES.OPEN_CHAT]: {
    reward: 5,
    dailyLimit: 30,
    cooldownSeconds: 60,
  },
};

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
]);

function getChannelId(configKey) {
  return process.env[configKey] || '';
}

function getChannelIds(configKey) {
  return (process.env[configKey] || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function isImageAttachment(attachment) {
  const contentType = attachment.contentType?.toLowerCase();

  if (contentType?.startsWith('image/')) {
    return true;
  }

  const extension = attachment.name?.split('.').pop()?.toLowerCase();
  return extension ? IMAGE_EXTENSIONS.has(extension) : false;
}

function getActivityConfig(activityType) {
  const config = ACTIVITY_CONFIG[activityType];

  if (!config) {
    throw new Error(`Unknown activity type: ${activityType}`);
  }

  return config;
}

async function getDailyActivity(guildId, userId, activityType, activityDate) {
  return queryOne(
    `SELECT id, earned_amount, action_count, last_action_at
     FROM daily_limits
     WHERE guild_id = ?
       AND discord_user_id = ?
       AND activity_type = ?
       AND activity_date = ?`,
    [guildId, userId, activityType, activityDate]
  );
}

async function hasUsedCooldown(guildId, userId, activityType, activityDate, cooldownSeconds) {
  if (cooldownSeconds <= 0) {
    return false;
  }

  const row = await getDailyActivity(
    guildId,
    userId,
    activityType,
    activityDate
  );

  if (!row?.last_action_at) {
    return false;
  }

  const lastAction = new Date(`${row.last_action_at.replace(' ', 'T')}Z`);
  const elapsedSeconds = (Date.now() - lastAction.getTime()) / 1000;

  return elapsedSeconds < cooldownSeconds;
}

async function recordActivity(
  guildId,
  userId,
  activityType,
  activityDate,
  amount,
  sourceId
) {
  const config = getActivityConfig(activityType);

  const existing = await getDailyActivity(
    guildId,
    userId,
    activityType,
    activityDate
  );

  const currentEarned = Number(existing?.earned_amount || 0);
  const currentCount = Number(existing?.action_count || 0);

  if (currentEarned + amount > config.reward * config.dailyLimit) {
    return {
      eligible: false,
      reason: 'daily_limit_reached',
    };
  }

  if (sourceId) {
    const duplicate = await queryOne(
      `SELECT id
       FROM earning_activity
       WHERE guild_id = ?
         AND discord_user_id = ?
         AND activity_type = ?
         AND source_id = ?
       LIMIT 1`,
      [guildId, userId, activityType, sourceId]
    );

    if (duplicate) {
      return {
        eligible: false,
        reason: 'duplicate_source',
      };
    }
  }

  const result = await execute(
    `INSERT INTO earning_activity
     (guild_id, discord_user_id, activity_type, activity_date, reward_amount, source_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      guildId,
      userId,
      activityType,
      activityDate,
      amount,
      sourceId || null,
    ]
  );

  await execute(
    `INSERT INTO daily_limits
     (guild_id, discord_user_id, activity_type, activity_date,
      earned_amount, action_count, last_action_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(guild_id, discord_user_id, activity_type, activity_date)
     DO UPDATE SET
       earned_amount = earned_amount + excluded.earned_amount,
       action_count = action_count + excluded.action_count,
       last_action_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`,
    [
      guildId,
      userId,
      activityType,
      activityDate,
      amount,
      1,
    ]
  );

  return {
    eligible: true,
    amount,
    activityId: result.lastInsertRowid,
    currentEarned: currentEarned + amount,
    remaining: Math.max(
      0,
      config.reward * config.dailyLimit - currentEarned - amount
    ),
  };
}

export class EarningService {
  static async evaluateCameraRollPost(message) {
    if (!message?.guildId || !message?.author?.id || message.author.bot) {
      return { eligible: false, reason: 'invalid_message' };
    }

    const configuredChannel = getChannelId('CAMERA_ROLL_CHANNEL_ID');

    if (!configuredChannel || message.channelId !== configuredChannel) {
      return { eligible: false, reason: 'wrong_channel' };
    }

    if (!message.attachments?.size) {
      return { eligible: false, reason: 'no_image' };
    }

    const hasImage = [...message.attachments.values()].some(isImageAttachment);

    if (!hasImage) {
      return { eligible: false, reason: 'no_image' };
    }

    const activityDate = getManilaDate();

    return recordActivity(
      message.guildId,
      message.author.id,
      ACTIVITY_TYPES.CAMERA_ROLL,
      activityDate,
      ACTIVITY_CONFIG[ACTIVITY_TYPES.CAMERA_ROLL].reward,
      message.id
    );
  }

  static async evaluateChatMessage(message) {
    if (!message?.guildId || !message?.author?.id || message.author.bot) {
      return { eligible: false, reason: 'invalid_message' };
    }

    const activityDate = getManilaDate();

    if (message.channelId === getChannelId('GENERAL_CHAT_CHANNEL_ID')) {
      return this.evaluateActivity(
        message,
        ACTIVITY_TYPES.GENERAL_CHAT,
        activityDate
      );
    }

    if (message.channelId === getChannelId('OPEN_CHAT_CHANNEL_ID')) {
      return this.evaluateActivity(
        message,
        ACTIVITY_TYPES.OPEN_CHAT,
        activityDate
      );
    }

    return { eligible: false, reason: 'wrong_channel' };
  }

  static async evaluateActivity(message, activityType, activityDate = getManilaDate()) {
    const config = getActivityConfig(activityType);

    if (
      await hasUsedCooldown(
        message.guildId,
        message.author.id,
        activityType,
        activityDate,
        config.cooldownSeconds
      )
    ) {
      return { eligible: false, reason: 'cooldown' };
    }

    if (config.dailyLimit > 0) {
      const daily = await getDailyActivity(
        message.guildId,
        message.author.id,
        activityType,
        activityDate
      );

      if (Number(daily?.action_count || 0) >= config.dailyLimit) {
        return { eligible: false, reason: 'daily_limit_reached' };
      }
    }

    return recordActivity(
      message.guildId,
      message.author.id,
      activityType,
      activityDate,
      config.reward,
      message.id
    );
  }

  static async awardActivityReward(guildId, userId, amount, source, transactionMeta = {}) {
    const result = await EconomyService.addCurrency(
      guildId,
      userId,
      amount,
      source,
      transactionMeta
    );

    return {
      awarded: true,
      amount,
      newBalance: result.newBalance,
    };
  }
}

export default EarningService;
