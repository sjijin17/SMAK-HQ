import { SlashCommandBuilder } from 'discord.js';
import { EscapeRoomService } from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-create')
  .setDescription('Create a new Escape Room case.')
  .addStringOption((option) =>
    option
      .setName('case-code')
      .setDescription('Unique code for the case, e.g. CASE001.')
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(50)
  )
  .addStringOption((option) =>
    option
      .setName('title')
      .setDescription('Title of the Escape Room case.')
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(100)
  )
  .addIntegerOption((option) =>
    option
      .setName('players')
      .setDescription('Maximum number of players.')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(10)
  )
  .addIntegerOption((option) =>
    option
      .setName('duration')
      .setDescription('Time limit in minutes.')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(180)
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
        '❌ Only server administrators can create Escape Room cases.'
      );
      return;
    }

    const caseCode = interaction.options
      .getString('case-code', true)
      .trim()
      .toUpperCase();

    const title = interaction.options
      .getString('title', true)
      .trim();

    const playerLimit =
      interaction.options.getInteger('players') ?? 3;

    const durationMinutes =
      interaction.options.getInteger('duration') ?? 45;

    const escapeCase = await EscapeRoomService.createCase({
      guildId: interaction.guildId,
      caseCode,
      title,
      playerLimit,
      durationMinutes,
      createdBy: interaction.user.id,
    });

    await interaction.editReply(
      [
        '🕵️ **Escape Room Case Created**',
        '',
        `**Case:** \`${escapeCase.caseCode}\``,
        `**Title:** ${escapeCase.title}`,
        `**Players:** ${escapeCase.playerLimit}`,
        `**Duration:** ${escapeCase.durationMinutes} minutes`,
        `**Status:** \`${escapeCase.status}\``,
        '',
        'The case is currently a draft and cannot be started yet.',
      ].join('\n')
    );
  } catch (error) {
    console.error('Unexpected /escape-create error:', error);

    const message =
      error?.message?.includes('already exists')
        ? `❌ ${error.message}`
        : '❌ Something went wrong while creating the Escape Room case.';

    await interaction.editReply(message).catch(() => {});
  }
}
