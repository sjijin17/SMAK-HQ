import { queryOne, execute, batch } from '../database/client.js';
import { DEFAULTS } from '../config/defaults.js';
import { logger } from '../utils/logger.js';
import { ValidationError, DatabaseError } from '../utils/errors.js';
import { isValidSnowflake, isValidCurrencyAmount } from '../utils/validators.js';

/**
 * Economy Service Foundation
 * 
 * Central authority for all currency modifications and account lookups.
 * Balance updates must NEVER occur outside of this service.
 */
export class EconomyService {
  /**
   * Retrieves a user account for a specific guild.
   * @param {string} guildId - Discord Guild ID
   * @param {string} discordUserId - Discord User ID
   * @returns {Promise<Object|null>} User account row or null
   */
  static async getUserAccount(guildId, discordUserId) {
    if (!isValidSnowflake(guildId) || !isValidSnowflake(discordUserId)) {
      throw new ValidationError('Invalid guildId or discordUserId format.');
    }

    const row = await queryOne(
      'SELECT id, discord_user_id, guild_id, balance, created_at, updated_at FROM users WHERE guild_id = ? AND discord_user_id = ?',
      [guildId, discordUserId]
    );

    return row || null;
  }

  /**
   * Creates a user account with the default starting balance.
   * @param {string} guildId - Discord Guild ID
   * @param {string} discordUserId - Discord User ID
   * @param {number} [startingBalance=DEFAULTS.ECONOMY.STARTING_BALANCE]
   * @returns {Promise<Object>} Created account row
   */
  static async createUserAccount(guildId, discordUserId, startingBalance = DEFAULTS.ECONOMY.STARTING_BALANCE) {
    if (!isValidSnowflake(guildId) || !isValidSnowflake(discordUserId)) {
      throw new ValidationError('Invalid guildId or discordUserId format.');
    }

    if (!isValidCurrencyAmount(startingBalance)) {
      throw new ValidationError('Starting balance must be a non-negative integer.');
    }

    try {
      await execute(
        `INSERT INTO users (guild_id, discord_user_id, balance, created_at, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [guildId, discordUserId, startingBalance]
      );

      logger.info(`Created new economy account for user ${discordUserId} in guild ${guildId} with balance ${startingBalance}`);
      return await this.getUserAccount(guildId, discordUserId);
    } catch (error) {
      // If unique constraint violation occurred concurrently, return existing
      if (error.message && error.message.includes('UNIQUE')) {
        return await this.getUserAccount(guildId, discordUserId);
      }
      throw error;
    }
  }

  /**
   * Idempotently gets or creates an account.
   * @param {string} guildId
   * @param {string} discordUserId
   * @returns {Promise<Object>}
   */
  static async getOrCreateAccount(guildId, discordUserId) {
    const existing = await this.getUserAccount(guildId, discordUserId);
    if (existing) {
      return existing;
    }
    return await this.createUserAccount(guildId, discordUserId);
  }

  /**
   * Retrieves the current balance for a member.
   * @param {string} guildId
   * @param {string} discordUserId
   * @returns {Promise<number>} Current balance integer
   */
  static async getBalance(guildId, discordUserId) {
    const account = await this.getOrCreateAccount(guildId, discordUserId);
    return Number(account.balance || 0);
  }

  /**
   * Adds currency to a user account.
   * Note: In a future milestone, this will also insert into a transactions audit table.
   * @param {string} guildId
   * @param {string} discordUserId
   * @param {number} amount
   * @param {string} [reason='admin_adjustment']
   * @returns {Promise<{ newBalance: number }>}
   */
  static async addCurrency(guildId, discordUserId, amount, reason = 'standard_credit', transactionMeta = {}) {
    if (!isValidCurrencyAmount(amount) || amount <= 0) {
      throw new ValidationError('Amount to add must be a positive integer.');
    }

    // Ensure account exists
    await this.getOrCreateAccount(guildId, discordUserId);

    await execute(
      `UPDATE users 
       SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE guild_id = ? AND discord_user_id = ?`,
      [amount, guildId, discordUserId]
    );

    const newBalance = await this.getBalance(guildId, discordUserId);

    await execute(
      `INSERT INTO transactions
       (guild_id, discord_user_id, type, amount, balance_after, reference_type, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guildId,
        discordUserId,
        reason,
        amount,
        newBalance,
        transactionMeta.referenceType || null,
        transactionMeta.referenceId || null,
        transactionMeta.description || null,
      ]
    );

    logger.info(`Added ${amount} credits to user ${discordUserId} in guild ${guildId}. Reason: ${reason}. New balance: ${newBalance}`);
    return { newBalance };
  }

  /**
   * Deducts currency from a user account with balance check.
   * @param {string} guildId
   * @param {string} discordUserId
   * @param {number} amount
   * @param {string} [reason='standard_debit']
   * @returns {Promise<{ newBalance: number }>}
   */
  static async removeCurrency(guildId, discordUserId, amount, reason = 'standard_debit', transactionMeta = {}) {
    if (!isValidCurrencyAmount(amount) || amount <= 0) {
      throw new ValidationError('Amount to remove must be a positive integer.');
    }

    const currentBalance = await this.getBalance(guildId, discordUserId);
    if (currentBalance < amount) {
      throw new ValidationError(
        `Insufficient funds. Current balance: ${currentBalance} credits, needed: ${amount} credits.`
      );
    }

    // Atomic update preventing negative balance
    const result = await execute(
      `UPDATE users 
       SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
       WHERE guild_id = ? AND discord_user_id = ? AND balance >= ?`,
      [amount, guildId, discordUserId, amount]
    );

    if (result.rowsAffected === 0) {
      throw new ValidationError('Transaction failed: Insufficient balance or concurrent modification.');
    }

    const newBalance = await this.getBalance(guildId, discordUserId);

    await execute(
      `INSERT INTO transactions
       (guild_id, discord_user_id, type, amount, balance_after, reference_type, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guildId,
        discordUserId,
        reason,
        -amount,
        newBalance,
        transactionMeta.referenceType || null,
        transactionMeta.referenceId || null,
        transactionMeta.description || null,
      ]
    );

    logger.info(`Deducted ${amount} credits from user ${discordUserId} in guild ${guildId}. Reason: ${reason}. New balance: ${newBalance}`);
    return { newBalance };
  }

  /**
   * Transfers currency between two members within the same server transactionally.
   * @param {string} guildId
   * @param {string} senderUserId
   * @param {string} recipientUserId
   * @param {number} amount
   * @param {string} [reason='transfer']
   * @returns {Promise<{ senderNewBalance: number, recipientNewBalance: number }>}
   */
  static async transferCurrency(guildId, senderUserId, recipientUserId, amount, reason = 'user_transfer') {
    if (senderUserId === recipientUserId) {
      throw new ValidationError('You cannot transfer currency to yourself.');
    }

    if (!isValidCurrencyAmount(amount) || amount <= 0) {
      throw new ValidationError('Transfer amount must be a positive integer.');
    }

    // Ensure both accounts exist
    await this.getOrCreateAccount(guildId, senderUserId);
    await this.getOrCreateAccount(guildId, recipientUserId);

    const senderBalance = await this.getBalance(guildId, senderUserId);
    if (senderBalance < amount) {
      throw new ValidationError(`Insufficient funds to transfer ${amount} credits.`);
    }

    // Execute atomic batch transaction
    await batch([
      {
        sql: `UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
              WHERE guild_id = ? AND discord_user_id = ? AND balance >= ?`,
        args: [amount, guildId, senderUserId, amount],
      },
      {
        sql: `UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
              WHERE guild_id = ? AND discord_user_id = ?`,
        args: [amount, guildId, recipientUserId],
      },
    ]);

    const senderNewBalance = await this.getBalance(guildId, senderUserId);
    const recipientNewBalance = await this.getBalance(guildId, recipientUserId);

    logger.info(
      `Transferred ${amount} credits from ${senderUserId} to ${recipientUserId} in guild ${guildId}. Reason: ${reason}`
    );

    return { senderNewBalance, recipientNewBalance };
  }
}

export default EconomyService;
