import { execute, queryOne } from '../database/client.js';
import { EconomyService } from './economyService.js';
import { DEFAULTS } from '../config/defaults.js';
import { getManilaDate } from '../utils/time.js';
import env from '../config/environment.js';

const DAILY_ATTEMPTS = DEFAULTS.ARCADE.DAILY_ATTEMPTS;

function getArcadeActivityDate() {
  return env.ARCADE_TEST_DATE || getManilaDate();
}

export class ArcadeService {
  static async getDailyAttempts(guildId, userId, activityDate = getArcadeActivityDate()) {
    const row = await queryOne(
      `SELECT attempt_count
       FROM arcade_daily_limits
       WHERE guild_id = ?
         AND discord_user_id = ?
         AND activity_date = ?`,
      [guildId, userId, activityDate]
    );

    return Number(row?.attempt_count || 0);
  }

  static async getRemainingAttempts(
    guildId,
    userId,
    activityDate = getArcadeActivityDate()
  ) {
    const used = await this.getDailyAttempts(
      guildId,
      userId,
      activityDate
    );

    return Math.max(0, DAILY_ATTEMPTS - used);
  }

  static async recordAttempt(
    guildId,
    userId,
    gameType,
    result,
    rewardAmount = 0,
    activityDate = getArcadeActivityDate()
  ) {
    const used = await this.getDailyAttempts(
      guildId,
      userId,
      activityDate
    );

    if (used >= DAILY_ATTEMPTS) {
      return {
        allowed: false,
        reason: 'daily_limit_reached',
        remainingAttempts: 0,
      };
    }

    await execute(
      `INSERT INTO arcade_attempts
       (
         guild_id,
         discord_user_id,
         activity_date,
         game_type,
         result,
         reward_amount
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        guildId,
        userId,
        activityDate,
        gameType,
        result,
        rewardAmount,
      ]
    );

    await execute(
      `INSERT INTO arcade_daily_limits
       (
         guild_id,
         discord_user_id,
         activity_date,
         attempt_count,
         updated_at
       )
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(guild_id, discord_user_id, activity_date)
       DO UPDATE SET
         attempt_count = attempt_count + 1,
         updated_at = CURRENT_TIMESTAMP`,
      [
        guildId,
        userId,
        activityDate,
        1,
      ]
    );

    return {
      allowed: true,
      remainingAttempts: Math.max(0, DAILY_ATTEMPTS - used - 1),
    };
  }

  static async playGame({
    guildId,
    userId,
    gameType,
    result,
    rewardAmount = 0,
    rewardSource,
    transactionMeta = {},
  }) {
    const attempt = await this.recordAttempt(
      guildId,
      userId,
      gameType,
      result,
      rewardAmount
    );

    if (!attempt.allowed) {
      return attempt;
    }

    let newBalance = null;

    if (rewardAmount > 0) {
      const economyResult = await EconomyService.addCurrency(
        guildId,
        userId,
        rewardAmount,
        rewardSource || `arcade_${gameType}`,
        transactionMeta
      );

      newBalance = economyResult.newBalance;
    }

    return {
      allowed: true,
      result,
      rewardAmount,
      newBalance,
      remainingAttempts: attempt.remainingAttempts,
    };
  }

  static getDailyAttemptLimit() {
    return DAILY_ATTEMPTS;
  }
}

export default ArcadeService;
