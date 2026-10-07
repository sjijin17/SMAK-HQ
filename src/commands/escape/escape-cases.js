import { SlashCommandBuilder } from 'discord.js';
import { EscapeRoomService } from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-cases')
  .setDescription('List Escape Room cases for this server.');

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
        '❌ Only server administrators can view Escape Room cases.'
      );
      return;
    }

    const cases = await EscapeRoomService.listCases(interaction.guildId);

    if (cases.length === 0) {
      await interaction.editReply(
        '🕵️ **Escape Room Cases**\n\nNo cases have been created for this server yet.'
      );
      return;
    }

    const lines = cases.map((escapeCase) => {
      return [
        `**${escapeCase.caseCode}** — ${escapeCase.title}`,
        `Status: \`${escapeCase.status}\` • Players: ${escapeCase.playerLimit} • Duration: ${escapeCase.durationMinutes} min`,
      ].join('\n');
    });

    await interaction.editReply(
      ['🕵️ **Escape Room Cases**', '', ...lines].join('\n\n')
    );
  } catch (error) {
    console.error('Unexpected /escape-cases error:', error);

    await interaction.editReply(
      '❌ Something went wrong while loading the Escape Room cases.'
    ).catch(() => {});
  }
}
