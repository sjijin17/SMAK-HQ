import { SlashCommandBuilder } from 'discord.js';
import { EscapeRoomService } from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-leave')
  .setDescription('Leave a waiting Escape Room session.')
  .addIntegerOption((option) =>
    option
      .setName('session-id')
      .setDescription('The Escape Room session ID to leave.')
      .setRequired(true)
      .setMinValue(1)
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

    const sessionId = interaction.options.getInteger('session-id', true);

    const session = await EscapeRoomService.getSession(sessionId);

    if (!session || session.guildId !== interaction.guildId) {
      await interaction.editReply(
        `❌ Escape Room session \`${sessionId}\` was not found in this server.`
      );
      return;
    }

    if (session.status !== 'WAITING') {
      await interaction.editReply(
        `❌ Session \`${sessionId}\` is not accepting player changes. Current status: \`${session.status}\`.`
      );
      return;
    }

    const player = await EscapeRoomService.getPlayer(
      sessionId,
      interaction.user.id
    );

    if (!player || player.participationStatus !== 'ACTIVE') {
      await interaction.editReply(
        `❌ You are not an active player in Escape Room session \`${sessionId}\`.`
      );
      return;
    }

    await EscapeRoomService.removePlayer(
      sessionId,
      interaction.user.id
    );

    const escapeCase = await EscapeRoomService.getSessionCase(sessionId);
    const players = await EscapeRoomService.getPlayers(sessionId);

    const activePlayers = players.filter(
      (entry) => entry.participationStatus === 'ACTIVE'
    );

    await interaction.editReply(
      [
        '🚪 **You Left the Escape Room**',
        '',
        `**Case:** ${escapeCase?.title ?? 'Unknown Case'}`,
        `**Session:** \`${sessionId}\``,
        `**Players:** ${activePlayers.length}/${escapeCase?.playerLimit ?? '?'}`,
        `**Status:** \`${session.status}\``,
        '',
        'You can rejoin while the session is still waiting.',
      ].join('\n')
    );
  } catch (error) {
    console.error('Unexpected /escape-leave error:', error);

    await interaction.editReply(
      '❌ Something went wrong while leaving the Escape Room session.'
    ).catch(() => {});
  }
}
