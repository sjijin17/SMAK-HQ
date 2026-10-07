import { SlashCommandBuilder } from 'discord.js';
import { queryOne } from '../../database/client.js';
import {
  calculateFailedPenalty,
  calculateSuccessChance,
  executeFailedRobbery,
  executeSuccessfulRobbery,
  getInventoryBonuses,
  hasRobberyAttemptedToday,
  recordRobberyAttempt,
  validateRobberyAmount,
} from '../../services/robberyService.js';
import { ValidationError } from '../../utils/errors.js';

export const data = new SlashCommandBuilder()
  .setName('rob')
  .setDescription('Attempt to rob another member.')
  .addUserOption((option) =>
    option
      .setName('member')
      .setDescription('The member you want to rob.')
      .setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName('amount')
      .setDescription('The amount of currency you want to attempt to steal.')
      .setMinValue(1)
      .setRequired(true),
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId;
  const robberUserId = interaction.user.id;
  const targetUser = interaction.options.getUser('member', true);
  const attemptedAmount = interaction.options.getInteger('amount', true);

  try {
    if (!guildId) {
      throw new ValidationError('This command can only be used inside a server.');
    }

    if (targetUser.bot) {
      throw new ValidationError('You cannot rob a bot.');
    }

    if (targetUser.id === robberUserId) {
      throw new ValidationError('You cannot rob yourself.');
    }

    const alreadyAttempted = await hasRobberyAttemptedToday(
      guildId,
      robberUserId,
    );

    if (alreadyAttempted) {
      throw new ValidationError(
        'You have already attempted a robbery today. Try again tomorrow.',
      );
    }

    const targetAccount = await queryOne(
      `
        SELECT balance
        FROM users
        WHERE guild_id = ?
          AND discord_user_id = ?
        LIMIT 1
      `,
      [guildId, targetUser.id],
    );

    if (!targetAccount) {
      throw new ValidationError(
        'That member does not have an economy account yet.',
      );
    }

    const amount = validateRobberyAmount(
      attemptedAmount,
      Number(targetAccount.balance),
    );

    const itemBonus = await getInventoryBonuses(
      guildId,
      robberUserId,
    );

    const successChance = calculateSuccessChance(itemBonus);
    const roll = Math.random() * 100;
    const success = roll < successChance;

    if (success) {
      const robbery = await executeSuccessfulRobbery({
        guildId,
        robberUserId,
        targetUserId: targetUser.id,
        amount,
      });

      await recordRobberyAttempt({
        guildId,
        robberUserId,
        targetUserId: targetUser.id,
        result: 'success',
        attemptedAmount: amount,
        transferredAmount: robbery.amount,
      });

      const bonusText = itemBonus > 0
        ? `\nYour equipment bonus: +${itemBonus}%`
        : '';

      await interaction.editReply(
        `🕵️ **Robbery successful!**\n\n` +
        `You stole **${robbery.amount}** currency from ${targetUser}.\n` +
        `Success chance: **${successChance}%**.${bonusText}`,
      );

      return;
    }

    const penalty = calculateFailedPenalty(amount);

    try {
      await executeFailedRobbery({
        guildId,
        robberUserId,
        targetUserId: targetUser.id,
        penaltyAmount: penalty,
      });
    } catch (penaltyError) {
      if (penaltyError instanceof ValidationError) {
        throw penaltyError;
      }

      throw new ValidationError(
        'The robbery failed and the penalty could not be processed.',
      );
    }

    await recordRobberyAttempt({
      guildId,
      robberUserId,
      targetUserId: targetUser.id,
      result: 'failed',
      attemptedAmount: amount,
      penaltyAmount: penalty,
    });

    const bonusText = itemBonus > 0
      ? `\nYour equipment bonus: +${itemBonus}%`
      : '';

    await interaction.editReply(
      `🚨 **Robbery failed!**\n\n` +
      `You lost **${penalty}** currency as a penalty.\n` +
      `Success chance: **${successChance}%**.${bonusText}`,
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      await interaction.editReply(`❌ ${error.message}`);
      return;
    }

    console.error('Unexpected /rob error:', error);
    await interaction.editReply(
      '❌ Something went wrong while processing the robbery.',
    );
  }
}
