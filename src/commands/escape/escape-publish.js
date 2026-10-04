import { SlashCommandBuilder } from 'discord.js';
import { EscapeRoomService } from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-publish')
  .setDescription('Publish an Escape Room case.')
  .addStringOption((option) =>
    option
      .setName('case-code')
      .setDescription('The case code to publish.')
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(50)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guildId) {
      await interaction.editReply(
        '❌ This command can only be used inside a server.'
      );
      return;
    }

    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.editReply(
        '❌ Only server administrators can publish Escape Room cases.'
      );
      return;
    }

    const caseCode = interaction.options
      .getString('case-code', true)
      .trim()
      .toUpperCase();

    const escapeCase = await EscapeRoomService.getCaseByCode(
      interaction.guildId,
      caseCode
    );

    if (!escapeCase) {
      await interaction.editReply(
        `❌ No Escape Room case found with code \`${caseCode}\`.`
      );
      return;
    }

    if (!['DRAFT', 'TESTING'].includes(escapeCase.status)) {
      await interaction.editReply(
        `❌ Case \`${caseCode}\` cannot be published from its current status: \`${escapeCase.status}\`.`
      );
      return;
    }

    const publishedCase = await EscapeRoomService.updateCaseStatus(
      escapeCase.id,
      'PUBLISHED'
    );

    await interaction.editReply(
      [
        '📢 **Escape Room Case Published**',
        '',
        `**Case:** \`${publishedCase.caseCode}\``,
        `**Title:** ${publishedCase.title}`,
        `**Players:** ${publishedCase.playerLimit}`,
        `**Duration:** ${publishedCase.durationMinutes} minutes`,
        `**Status:** \`${publishedCase.status}\``,
        '',
        'The case can now be used to create an Escape Room session.',
      ].join('\n')
    );
  } catch (error) {
    console.error('Unexpected /escape-publish error:', error);

    await interaction.editReply(
      '❌ Something went wrong while publishing the Escape Room case.'
    ).catch(() => {});
  }
}
