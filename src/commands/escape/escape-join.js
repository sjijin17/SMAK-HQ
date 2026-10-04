import { SlashCommandBuilder } from 'discord.js';
import { EscapeRoomService } from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-join')
  .setDescription('Join a waiting Escape Room session.')
  .addIntegerOption((option) =>
    option
      .setName('session-id')
      .setDescription('The Escape Room session ID to join.')
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
        `❌ Session \`${sessionId}\` is not accepting players. Current status: \`${session.status}\`.`
      );
      return;
    }

    const escapeCase = await EscapeRoomService.getSessionCase(sessionId);

    if (!escapeCase) {
      await interaction.editReply(
        '❌ The case associated with this session could not be found.'
      );
      return;
    }

    const existingPlayer = await EscapeRoomService.getPlayer(
      sessionId,
      interaction.user.id
    );

    if (
      existingPlayer &&
      existingPlayer.participationStatus === 'ACTIVE'
    ) {
      if (session.requiredVoiceChannelId) {
        const voiceChannel = await interaction.guild.channels.fetch(
          session.requiredVoiceChannelId
        );

        if (!voiceChannel) {
          throw new Error(
            'The Escape Room voice channel no longer exists.'
          );
        }

        await voiceChannel.permissionOverwrites.edit(
          interaction.user.id,
          {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            Stream: true,
          }
        );
      }

      const players = await EscapeRoomService.getPlayers(sessionId);

      await interaction.editReply(
        [
          '⚠️ **You Are Already In This Session**',
          '',
          `**Session:** \`${sessionId}\``,
          `**Players:** ${players.filter(
            (player) => player.participationStatus === 'ACTIVE'
          ).length}/${escapeCase.playerLimit}`,
          session.requiredVoiceChannelId
            ? `**Private Voice Channel:** <#${session.requiredVoiceChannelId}>`
            : '',
        ].filter(Boolean).join('\n')
      );
      return;
    }

    await EscapeRoomService.addPlayer({
      sessionId,
      discordUserId: interaction.user.id,
    });

    if (session.requiredVoiceChannelId) {
      const voiceChannel = await interaction.guild.channels.fetch(
        session.requiredVoiceChannelId
      );

      if (!voiceChannel) {
        throw new Error(
          'The Escape Room voice channel no longer exists.'
        );
      }

      await voiceChannel.permissionOverwrites.edit(
        interaction.user.id,
        {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          Stream: true,
        }
      );
    }

    const players = await EscapeRoomService.getPlayers(sessionId);

    const activePlayers = players.filter(
      (entry) => entry.participationStatus === 'ACTIVE'
    );

    await interaction.editReply(
      [
        '🕵️ **You Joined the Escape Room**',
        '',
        `**Case:** ${escapeCase.title}`,
        `**Session:** \`${sessionId}\``,
        `**Players:** ${activePlayers.length}/${escapeCase.playerLimit}`,
        `**Status:** \`${session.status}\``,
        '',
        '⏳ The session is still waiting for players.',
        'The timer has **not** started.',
        session.requiredVoiceChannelId
          ? `\n🔐 **Private Voice Channel:** <#${session.requiredVoiceChannelId}>`
          : '',
      ].filter(Boolean).join('\n')
    );
  } catch (error) {
    console.error('Unexpected /escape-join error:', error);

    const message = error?.message?.includes(
      'maximum of'
    )
      ? `❌ ${error.message}`
      : `❌ ${error?.message || 'Something went wrong while joining the Escape Room session.'}`;

    await interaction.editReply(message).catch(() => {});
  }
}
