import { batch, query, queryOne } from '../database/client.js';
import { env } from '../config/environment.js';
import { getManilaDate } from '../utils/time.js';
import { EconomyError } from '../utils/errors.js';

const ROBBERY_CONFIG = {
  DAILY_ATTEMPTS: 1,
  BASE_SUCCESS_PERCENT: 40,
  MIN_ATTEMPT_AMOUNT: 10,
  MAX_ATTEMPT_PERCENT_OF_TARGET_BALANCE: 50,
  FAILED_PENALTY_MULTIPLIER: 2,
};

function getActivityDate() {
  return env.ARCADE_TEST_DATE || getManilaDate();
}

function normalizeAmount(value) {
  const amount = Number(value);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new EconomyError('Robbery amount must be a positive whole number.');
  }

  return amount;
}

export async function getRobberyConfig() {
  return { ...ROBBERY_CONFIG };
}

export async function getRobberyAttempt(guildId, robberUserId) {
  return queryOne(
    `
      SELECT *
      FROM robbery_attempts
      WHERE guild_id = ?
        AND robber_user_id = ?
        AND activity_date = ?
      LIMIT 1
    `,
    [guildId, robberUserId, getActivityDate()],
  );
}

export async function hasRobberyAttemptedToday(guildId, robberUserId) {
  const attempt = await getRobberyAttempt(guildId, robberUserId);
  return Boolean(attempt);
}

export async function getActiveJail(guildId, discordUserId) {
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

export async function getRobberyShopItems() {
  return query(
    `
      SELECT
        id,
        item_key,
        item_name,
        description,
        price,
        success_bonus_percent
      FROM robbery_shop_items
      WHERE active = 1
      ORDER BY price ASC, id ASC
    `,
  );
}

export async function getInventory(guildId, discordUserId) {
  return query(
    `
      SELECT
        inventory.id,
        inventory.item_id,
        inventory.quantity,
        item.item_key,
        item.item_name,
        item.description,
        item.price,
        item.success_bonus_percent
      FROM robbery_inventory AS inventory
      INNER JOIN robbery_shop_items AS item
        ON item.id = inventory.item_id
      WHERE inventory.guild_id = ?
        AND inventory.discord_user_id = ?
        AND inventory.quantity > 0
      ORDER BY item.price ASC, item.id ASC
    `,
    [guildId, discordUserId],
  );
}

export async function getInventoryBonuses(guildId, discordUserId) {
  const rows = await query(
    `
      SELECT
        COALESCE(SUM(item.success_bonus_percent * inventory.quantity), 0) AS total_bonus
      FROM robbery_inventory AS inventory
      INNER JOIN robbery_shop_items AS item
        ON item.id = inventory.item_id
      WHERE inventory.guild_id = ?
        AND inventory.discord_user_id = ?
        AND inventory.quantity > 0
    `,
    [guildId, discordUserId],
  );

  return Number(rows[0]?.total_bonus || 0);
}

export function calculateSuccessChance(itemBonusPercent = 0) {
  const bonus = Math.max(0, Number(itemBonusPercent) || 0);

  return Math.min(
    100,
    ROBBERY_CONFIG.BASE_SUCCESS_PERCENT + bonus,
  );
}

export function calculateFailedPenalty(attemptedAmount) {
  const amount = normalizeAmount(attemptedAmount);

  return amount * ROBBERY_CONFIG.FAILED_PENALTY_MULTIPLIER;
}

export function validateRobberyAmount(amount, targetBalance) {
  const normalizedAmount = normalizeAmount(amount);
  const balance = Number(targetBalance);

  if (!Number.isInteger(balance) || balance < 0) {
    throw new EconomyError('Target balance is invalid.');
  }

  if (normalizedAmount < ROBBERY_CONFIG.MIN_ATTEMPT_AMOUNT) {
    throw new EconomyError(
      `The minimum robbery amount is ${ROBBERY_CONFIG.MIN_ATTEMPT_AMOUNT}.`,
    );
  }

  if (normalizedAmount > balance) {
    throw new EconomyError('You cannot attempt to rob more than the target currently has.');
  }

  const maximumAmount = Math.floor(
    balance * (ROBBERY_CONFIG.MAX_ATTEMPT_PERCENT_OF_TARGET_BALANCE / 100),
  );

  if (maximumAmount < ROBBERY_CONFIG.MIN_ATTEMPT_AMOUNT) {
    throw new EconomyError('The target does not have enough currency to be robbed.');
  }

  if (normalizedAmount > maximumAmount) {
    throw new EconomyError(
      `You can attempt to rob at most ${maximumAmount} currency from this member.`,
    );
  }

  return normalizedAmount;
}

export async function recordRobberyAttempt({
  guildId,
  robberUserId,
  targetUserId,
  result,
  attemptedAmount,
  transferredAmount = 0,
  penaltyAmount = 0,
  jailRecordId = null,
}) {
  if (!guildId || !robberUserId || !targetUserId) {
    throw new EconomyError('Robbery participant information is required.');
  }

  if (robberUserId === targetUserId) {
    throw new EconomyError('You cannot rob yourself.');
  }

  const amount = normalizeAmount(attemptedAmount);

  await batch(
    [
      {
        sql: `
          INSERT INTO robbery_attempts (
            guild_id,
            robber_user_id,
            target_user_id,
            activity_date,
            result,
            attempted_amount,
            transferred_amount,
            penalty_amount,
            jail_record_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          guildId,
          robberUserId,
          targetUserId,
          getActivityDate(),
          result,
          amount,
          Number(transferredAmount) || 0,
          Number(penaltyAmount) || 0,
          jailRecordId,
        ],
      },
    ],
    'deferred',
  );
}

export async function executeSuccessfulRobbery({
  guildId,
  robberUserId,
  targetUserId,
  amount,
}) {
  const robberyAmount = normalizeAmount(amount);

  if (robberUserId === targetUserId) {
    throw new EconomyError('You cannot rob yourself.');
  }

  const activityDate = getActivityDate();

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
          robberyAmount,
          guildId,
          targetUserId,
          robberyAmount,
        ],
      },
      {
        sql: `
          UPDATE users
          SET balance = balance + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE guild_id = ?
            AND discord_user_id = ?
        `,
        args: [
          robberyAmount,
          guildId,
          robberUserId,
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
            'robbery',
            ?,
            balance,
            'robbery',
            ?,
            ?
          FROM users
          WHERE guild_id = ?
            AND discord_user_id = ?
        `,
        args: [
          guildId,
          robberUserId,
          robberyAmount,
          `${robberUserId}:${targetUserId}:${activityDate}`,
          `Successful robbery from ${targetUserId}`,
          guildId,
          robberUserId,
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
            'robbery_loss',
            ?,
            balance,
            'robbery',
            ?,
            ?
          FROM users
          WHERE guild_id = ?
            AND discord_user_id = ?
        `,
        args: [
          guildId,
          targetUserId,
          -robberyAmount,
          `${robberUserId}:${targetUserId}:${activityDate}`,
          `Currency lost to robbery by ${robberUserId}`,
          guildId,
          targetUserId,
        ],
      },
    ],
    'deferred',
  );

  return {
    amount: robberyAmount,
    referenceId: `${robberUserId}:${targetUserId}:${activityDate}`,
  };
}

export async function executeFailedRobbery({
  guildId,
  robberUserId,
  targetUserId,
  penaltyAmount,
}) {
  const penalty = normalizeAmount(penaltyAmount);

  if (robberUserId === targetUserId) {
    throw new EconomyError('You cannot rob yourself.');
  }

  const result = await batch(
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
          penalty,
          guildId,
          robberUserId,
          penalty,
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
            'robbery_penalty',
            ?,
            balance,
            'robbery',
            ?,
            ?
          FROM users
          WHERE guild_id = ?
            AND discord_user_id = ?
        `,
        args: [
          guildId,
          robberUserId,
          -penalty,
          `${robberUserId}:${targetUserId}:${getActivityDate()}`,
          `Failed robbery penalty against ${targetUserId}`,
          guildId,
          robberUserId,
        ],
      },
    ],
    'deferred',
  );

  const updateResult = result[0];

  if (!updateResult || Number(updateResult.rowsAffected || 0) !== 1) {
    throw new EconomyError(
      `You do not have enough currency to pay the robbery failure penalty of ${penalty}.`,
    );
  }

  return {
    penalty,
    referenceId: `${robberUserId}:${targetUserId}:${getActivityDate()}`,
  };
}
