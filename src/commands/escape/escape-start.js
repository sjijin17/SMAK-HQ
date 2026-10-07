import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  PermissionFlagsBits as Permissions,
} from 'discord.js';

import EscapeRoomService, {
  setRequiredVoiceChannel,
} from '../../services/escapeRoomService.js';

export const data = new SlashCommandBuilder()
  .setName('escape-start')
  .setDescription('Create a new Escape Room session.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName('case-code')
      .setDescription('Escape Room case code')
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const caseCode = interaction.options.getString('case-code', true);

    const escapeCase = await EscapeRoomService.getCaseByCode(
      interaction.guildId,
      caseCode
    );

    if (!escapeCase) {
      return interaction.editReply(
        `❌ Escape Room case \`${caseCode}\` was not found.`
      );
    }

    if (!['PUBLISHED', 'ACTIVE'].includes(escapeCase.status)) {
      return interaction.editReply(
        `❌ Case \`${escapeCase.caseCode}\` is currently **${escapeCase.status}**. It must be PUBLISHED or ACTIVE.`
      );
    }

    const existingSessions = await EscapeRoomService.listSessions(
      interaction.guildId,
      { status: 'WAITING' }
    );

    const existingSession = existingSessions.find(
      (session) => session.caseId === escapeCase.id
    );

    let session = existingSession;

    if (session?.requiredVoiceChannelId) {
      return interaction.editReply(
        [
          '⚠️ A WAITING session already exists for this case.',
          '',
          `**Session:** #${session.id}`,
          `**Players:** ${session.playerCount ?? 0}/${escapeCase.playerLimit}`,
          `**Voice:** <#${session.requiredVoiceChannelId}>`,
        ].join('\\n')
      );
    }

    if (!session) {
      session = await EscapeRoomService.createSession({
        caseId: escapeCase.id,
        guildId: interaction.guildId,
      });
    }

    const guild = interaction.guild;

    if (!guild) {
      return interaction.editReply(
        '❌ Discord server could not be found.'
      );
    }

    let category = guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === 'ESCAPE ROOMS'
    );

    if (!category) {
      category = await guild.channels.create({
        name: 'ESCAPE ROOMS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [Permissions.ViewChannel],
          },
        ],
      });
    }

    const voiceChannel = await guild.channels.create({
      name: `🔐・escape-${session.id}`,
      type: ChannelType.GuildVoice,
      parent: category.id,
      userLimit: escapeCase.playerLimit,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [
            Permissions.ViewChannel,
            Permissions.Connect,
          ],
        },
        {
          id: interaction.client.user.id,
          allow: [
            Permissions.ViewChannel,
            Permissions.Connect,
            Permissions.MoveMembers,
          ],
        },
      ],
    });

    await setRequiredVoiceChannel(
      session.id,
      voiceChannel.id
    );

    return interaction.editReply(
      [
        '🔐 **Escape Room Session Created**',
        '',
        `**Case:** ${escapeCase.title}`,
        `**Session:** #${session.id}`,
        `**Players:** 0/${escapeCase.playerLimit}`,
        `**Status:** WAITING`,
        `**Duration:** ${escapeCase.durationMinutes} minutes`,
        `**Voice Channel:** ${voiceChannel}`,
        '',
        'Players can now use `/escape-join`.',
        '',
        '⏱️ **The timer has NOT started.**',
        'The timer will only begin after all required players are present in the temporary voice channel.',
      ].join('\n')
    );
  } catch (error) {
    console.error('[Escape Start]', error);

    return interaction.editReply(
      `❌ ${error.message || 'Failed to create Escape Room session.'}`
    );
  }
}
