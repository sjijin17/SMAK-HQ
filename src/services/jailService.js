import { batch, query, queryOne } from '../database/client.js';
import { DEFAULTS } from '../config/defaults.js';
import { ValidationError } from '../utils/errors.js';
import { getManilaDate } from '../utils/time.js';

const JAIL_CONFIG = {
  ROBBERY: {
    timeoutMinutes: DEFAULTS.JAIL.ROBBERY_TIMEOUT_MINUTES,
    bailAmount: DEFAULTS.JAIL.ROBBERY_BAIL_AMOUNT,
  },
  SECRET_RULE: {
    timeoutMinutes: DEFAULTS.JAIL.SECRET_RULE_TIMEOUT_MINUTES,
    bailAmount: DEFAULTS.JAIL.SECRET_RULE_BAIL_AMOUNT,
  },
};

function normalizeReasonCategory(reasonCategory) {
  const value = String(reasonCategory || '').toUpperCase();

  if (!JAIL_CONFIG[value]) {
    throw new ValidationError('Invalid jail reason category.');
  }

  return value;
}

function getJailConfig(reasonCategory) {
  return JAIL_CONFIG[normalizeReasonCategory(reasonCategory)];
}

function calculateReleaseDate(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export class JailService {
  /**
   * Jail a guild member and synchronize the Discord timeout.
   */
  static async jailMember(member, reasonCategory, details = '') {
    if (!member?.guild?.id || !member?.id) {
      throw new ValidationError('A valid guild member is required.');
    }

    const category = normalizeReasonCategory(reasonCategory);
    const config = getJailConfig(category);

    const existing = await queryOne(
      `
        SELECT *
        FROM jail_records
        WHERE guild_id = ?
          AND discord_user_id = ?
          AND status = 'jailed'
        LIMIT 1
      `,
      [member.guild.id, member.id],
    );

    if (existing) {
      return {
        success: false,
        alreadyJailed: true,
        record: existing,
        message: 'Member is already jailed.',
      };
    }

    const releaseAt = calculateReleaseDate(config.timeoutMinutes);
    const reason = details ? String(details).slice(0, 500) : null;

    const result = await batch(
      [
        {
          sql: `
            INSERT INTO jail_records (
              guild_id,
              discord_user_id,
              reason_type,
              reason,
              bail_amount,
              release_at,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?, 'jailed')
          `,
          args: [
            member.guild.id,
            member.id,
            category,
            reason,
            config.bailAmount,
            releaseAt,
          ],
        },
      ],
      'deferred',
    );

    let timeoutApplied = false;

    try {
      await member.timeout(
        config.timeoutMinutes * 60 * 1000,
        `Jailed: ${category}`,
      );
      timeoutApplied = true;
    } catch (error) {
      console.error(
        `Failed to apply Discord timeout to jailed member ${member.id}:`,
        error,
      );
    }

    const record = await queryOne(
      `
        SELECT *
        FROM jail_records
        WHERE guild_id = ?
          AND discord_user_id = ?
          AND status = 'jailed'
        ORDER BY id DESC
        LIMIT 1
      `,
      [member.guild.id, member.id],
    );

    return {
      success: true,
      timeoutApplied,
      record,
      message: timeoutApplied
        ? 'Member jailed successfully.'
        : 'Jail recorded, but Discord timeout could not be applied.',
    };
  }

  /**
   * Return the active jail record for a member.
   */
  static async getActiveJail(guildId, discordUserId) {
    return queryOne(
      `
        SELECT *
        FROM jail_records
        WHERE guild_id = ?
          AND discord_user_id = ?
          AND status = 'jailed'
        LIMIT 1
      `,
      [guildId, discordUserId],
    );
  }

  /**
   * Return all currently active jail records whose release time has passed.
   */
  static async getExpiredJails() {
    return query(
      `
        SELECT *
        FROM jail_records
        WHERE status = 'jailed'
          AND release_at IS NOT NULL
          AND release_at <= CURRENT_TIMESTAMP
        ORDER BY release_at ASC
      `,
      [],
    );
  }

  /**
   * Release an expired jailed member in the database.
   */
  static async releaseExpiredJail(jailRecordId) {
    const record = await queryOne(
      `
        SELECT *
        FROM jail_records
        WHERE id = ?
          AND status = 'jailed'
        LIMIT 1
      `,
      [jailRecordId],
    );

    if (!record) {
      return {
        success: false,
        message: 'Active jail record not found.',
      };
    }

    await batch(
      [
        {
          sql: `
            UPDATE jail_records
            SET status = 'released'
            WHERE id = ?
              AND status = 'jailed'
          `,
          args: [jailRecordId],
        },
      ],
      'deferred',
    );

    return {
      success: true,
      recordId: jailRecordId,
      userId: record.discord_user_id,
    };
  }

  /**
   * Pay bail and release a jailed member immediately.
   */
  static async payBail(guildId, discordUserId) {
    const record = await this.getActiveJail(guildId, discordUserId);

    if (!record) {
      throw new ValidationError('You are not currently in jail.');
    }

    const balance = await queryOne(
      `
        SELECT balance
        FROM users
        WHERE guild_id = ?
          AND discord_user_id = ?
        LIMIT 1
      `,
      [guildId, discordUserId],
    );

    if (!balance) {
      throw new ValidationError('You do not have an economy account.');
    }

    const bailAmount = Number(record.bail_amount);

    if (!Number.isInteger(bailAmount) || bailAmount < 0) {
      throw new ValidationError('Invalid bail amount.');
    }

    if (Number(balance.balance) < bailAmount) {
      throw new ValidationError(
        `You need ${bailAmount} Credits to pay bail.`,
      );
    }

    await batch(
      [
        {
          sql: `
            UPDATE users
            SET balance = balance - ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE guild_id = ?
              AND discord_user_id = ?
              AND balance >= ?
          `,
          args: [
            bailAmount,
            guildId,
            discordUserId,
            bailAmount,
          ],
        },
        {
          sql: `
            INSERT INTO transactions (
              guild_id,
              discord_user_id,
              type,
              amount,
              balance_after,
              reference_type,
              reference_id,
              description
            )
            SELECT
              ?,
              ?,
              'jail_bail',
              ?,
              balance,
              'jail',
              ?,
              ?
            FROM users
            WHERE guild_id = ?
              AND discord_user_id = ?
          `,
          args: [
            guildId,
            discordUserId,
            -bailAmount,
            String(record.id),
            `Bail paid for jail record #${record.id}`,
            guildId,
            discordUserId,
          ],
        },
        {
          sql: `
            UPDATE jail_records
            SET status = 'bailed',
                bailed_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND status = 'jailed'
          `,
          args: [record.id],
        },
      ],
      'deferred',
    );

    return {
      success: true,
      bailAmount,
      recordId: record.id,
    };
  }

  /**
   * Check whether a message violates a configured secret rule.
   *
   * Secret rules are intentionally not implemented yet.
   * The method remains available so message handling can be added later
   * without changing the JailService API.
   */
  static async checkSecretRuleViolation(message) {
    if (!message?.content) {
      return false;
    }

    return false;
  }

  /**
   * Synchronize a Discord member's timeout with the persistent jail state.
   */
  static async synchronizeMember(member) {
    if (!member?.guild?.id || !member?.id) {
      return false;
    }

    const record = await this.getActiveJail(
      member.guild.id,
      member.id,
    );

    if (!record) {
      return false;
    }

    const releaseTime = new Date(record.release_at).getTime();
    const remainingMs = releaseTime - Date.now();

    if (remainingMs <= 0) {
      await this.releaseExpiredJail(record.id);

      try {
        if (member.communicationDisabledUntilTimestamp) {
          await member.timeout(null, 'Jail sentence expired.');
        }
      } catch (error) {
        console.error(
          `Failed to remove expired jail timeout from ${member.id}:`,
          error,
        );
      }

      return false;
    }

    try {
      await member.timeout(
        remainingMs,
        `Jail synchronization: ${record.reason_type}`,
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to synchronize jail timeout for ${member.id}:`,
        error,
      );
      return false;
    }
  }
}

export default JailService;
