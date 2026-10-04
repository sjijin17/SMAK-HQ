import { SlashCommandBuilder } from 'discord.js';
import JailService from '../../services/jailService.js';
import { ValidationError } from '../../utils/errors.js';

export const data = new SlashCommandBuilder()
  .setName('jail')
  .setDescription('View your current jail status or pay bail.')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('status')
      .setDescription('View your current jail status.')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('bail')
      .setDescription('Pay your bail and leave jail early.')
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName('test')
      .setDescription('Admin-only temporary jail test.')
      .addUserOption((option) =>
        option
          .setName('member')
          .setDescription('Member to temporarily jail.')
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName('reason')
          .setDescription('Test reason.')
          .setRequired(false)
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guildId) {
      throw new ValidationError(
        'This command can only be used inside a server.',
      );
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      const record = await JailService.getActiveJail(
        interaction.guildId,
        interaction.user.id,
      );

      if (!record) {
        await interaction.editReply(
          '🔓 You are not currently in jail.',
        );
        return;
      }

      const releaseAt = record.release_at
        ? `<t:${Math.floor(new Date(record.release_at).getTime() / 1000)}:R>`
        : 'Unknown';

      const reasonLabel = record.reason_type === 'ROBBERY'
        ? 'Robbery'
        : 'Secret Rule Violation';

      await interaction.editReply(
        `🔒 **You are in jail.**\n\n` +
        `Reason: **${reasonLabel}**\n` +
        `Bail: **${record.bail_amount} Credits**\n` +
        `Release: ${releaseAt}\n\n` +
        `Use **/jail bail** to pay your bail and leave early.`,
      );

      return;
    }

    if (subcommand === 'test') {
      if (!interaction.memberPermissions?.has('Administrator')) {
        throw new ValidationError(
          'Only server administrators can use the jail test command.',
        );
      }

      const target = interaction.options.getMember('member');

      if (!target) {
        throw new ValidationError('The selected member could not be found in this server.');
      }

      if (target.user.bot) {
        throw new ValidationError('Bots cannot be jailed.');
      }

      const reason = interaction.options.getString('reason') || 'Temporary jail system test';

      const result = await JailService.jailMember(
        target,
        'SECRET_RULE',
        reason,
      );

      if (result.alreadyJailed) {
        await interaction.editReply(
          `⚠️ ${target} is already jailed.`
        );
        return;
      }

      await interaction.editReply(
        `🔒 **Jail test applied.**\n\n` +
        `Member: ${target}\n` +
        `Reason: **Secret Rule Violation**\n` +
        `Bail: **${result.record.bail_amount} Credits**\n` +
        `Release: <t:${Math.floor(new Date(result.record.release_at).getTime() / 1000)}:R>\n` +
        `Discord timeout: **${result.timeoutApplied ? 'Applied' : 'Failed'}**`,
      );

      return;
    }

    if (subcommand === 'bail') {
      const result = await JailService.payBail(
        interaction.guildId,
        interaction.user.id,
      );

      const member = await interaction.guild.members.fetch(
        interaction.user.id,
      );

      try {
        await member.timeout(null, 'Jail bail paid.');
      } catch (timeoutError) {
        console.error(
          `Failed to remove jail timeout from ${interaction.user.id}:`,
          timeoutError,
        );
      }

      await interaction.editReply(
        `💰 **Bail paid!**\n\n` +
        `You paid **${result.bailAmount} Credits** and have been released from jail.`,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      await interaction.editReply(`❌ ${error.message}`);
      return;
    }

    console.error('Unexpected /jail error:', error);

    await interaction.editReply(
      '❌ Something went wrong while processing your jail request.',
    );
  }
}
