import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('escape-home')
  .setDescription('Post the permanent Escape Room homepage.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    if (!interaction.guild) {
      await interaction.editReply(
        '❌ This command can only be used inside a server.'
      );
      return;
    }

    const guild = interaction.guild;

    let category = guild.channels.cache.find(
      (channel) =>
        channel.type === 4 &&
        channel.name === 'ESCAPE ROOMS'
    );

    if (!category) {
      category = await guild.channels.create({
        name: 'ESCAPE ROOMS',
        type: 4,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: ['ViewChannel'],
          },
        ],
      });
    }

    let homeChannel = guild.channels.cache.find(
      (channel) =>
        channel.type === 0 &&
        channel.name === 'escape-home' &&
        channel.parentId === category.id
    );

    if (!homeChannel) {
      homeChannel = await guild.channels.create({
        name: 'escape-home',
        type: 0,
        parent: category.id,
      });
    }

    const components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('escape-home:play')
          .setLabel('PLAY ESCAPE ROOM')
          .setEmoji('🎮')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('escape-home:history')
          .setLabel('GAME HISTORY')
          .setEmoji('📜')
          .setStyle(ButtonStyle.Secondary),
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('escape-home:leaderboard')
          .setLabel('LEADERBOARD')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('escape-home:stats')
          .setLabel('MY STATS')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('escape-home:monitor')
          .setLabel('ADMIN MONITOR')
          .setEmoji('⚙️')
          .setStyle(ButtonStyle.Danger),
      ),
    ];

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('🕵️ SMAK ESCAPE ROOM')
      .setDescription(`**THE INVESTIGATION AWAITS**

Team up. Investigate. Escape.`);

    const existingMessages = await homeChannel.messages.fetch({ limit: 50 });

    let message = existingMessages.find(
      (msg) =>
        msg.author.id === interaction.client.user.id &&
        msg.embeds.some((e) => e.title === '🕵️ SMAK ESCAPE ROOM')
    );

    if (message) {
      await message.edit({
        embeds: [embed],
        components,
      });
    } else {
      message = await homeChannel.send({
        embeds: [embed],
        components,
      });
    }

    await interaction.editReply(
      [
        '✅ **Escape Room homepage is ready.**',
        '',
        `📍 ${homeChannel}`,
        `🆔 Message ID: \`${message.id}\``,
        '',
        'This channel is intended to remain permanently in the ESCAPE ROOMS category.',
      ].join('\\n')
    );
  } catch (error) {
    console.error('[Escape Home]', error);

    await interaction.editReply(
      `❌ ${error?.message || 'Failed to create the Escape Room homepage.'}`
    ).catch(() => {});
  }
}

export async function handleEscapePlay(interaction) {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({
      content: '❌ Escape Room can only be played inside a server.',
      flags: 64,
    });
    return;
  }

  await interaction.deferReply({ flags: 64 });

  try {
    const EscapeRoomService = (
      await import('../../services/escapeRoomService.js')
    ).default;

    const { ChannelType, PermissionFlagsBits } = await import('discord.js');

    const publishedCases = await EscapeRoomService.listCases(
      interaction.guildId,
      { status: 'PUBLISHED' }
    );

    if (publishedCases.length === 0) {
      await interaction.editReply(
        [
          '🔒 **NO ESCAPE ROOM AVAILABLE**',
          '',
          'There is currently no published Escape Room.',
          '',
          'Check back when the next investigation is released.',
        ].join('\n')
      );
      return;
    }

    const escapeCase = publishedCases[0];

    const waitingSessions = await EscapeRoomService.listSessions(
      interaction.guildId,
      { status: 'WAITING' }
    );

    let session = waitingSessions.find(
      (entry) => entry.caseId === escapeCase.id
    );

    if (!session) {
      session = await EscapeRoomService.createSession({
        caseId: escapeCase.id,
        guildId: interaction.guildId,
      });
    }

    const guild = interaction.guild;

    let category = guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === 'ESCAPE ROOMS'
    );

    if (!category) {
      category = await guild.channels.create({
        name: 'ESCAPE ROOMS',
        type: ChannelType.GuildCategory,
      });
    }

    let voiceChannel = null;

    if (session.requiredVoiceChannelId) {
      voiceChannel = await guild.channels.fetch(
        session.requiredVoiceChannelId
      ).catch(() => null);
    }

    if (!voiceChannel) {
      voiceChannel = await guild.channels.create({
        name: `🔐・escape-${session.id}`,
        type: ChannelType.GuildVoice,
        parent: category.id,
        userLimit: escapeCase.playerLimit,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
            ],
          },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });

      const { setRequiredVoiceChannel } = await import(
        '../../services/escapeRoomService.js'
      );

      await setRequiredVoiceChannel(
        session.id,
        voiceChannel.id
      );

      session = await EscapeRoomService.getSession(session.id);
    }

    const players = await EscapeRoomService.getPlayers(session.id);

    const activePlayers = players.filter(
      (player) => player.participationStatus === 'ACTIVE'
    );

    const existingPlayer = activePlayers.find(
      (player) => player.discordUserId === interaction.user.id
    );

    const components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`escape-session:join:${session.id}`)
          .setLabel('JOIN GAME')
          .setEmoji('👥')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`escape-session:leave:${session.id}`)
          .setLabel('LEAVE GAME')
          .setEmoji('🚪')
          .setStyle(ButtonStyle.Secondary),
      ),
    ];

    await interaction.editReply({
      content: [
        '🕵️ **CURRENT ESCAPE ROOM**',
        '',
        `## ${escapeCase.title}`,
        '',
        escapeCase.description
          ? escapeCase.description
          : 'A new investigation awaits.',
        '',
        `👥 **Players:** ${activePlayers.length}/${escapeCase.playerLimit}`,
        `⏱️ **Time Limit:** ${escapeCase.durationMinutes} minutes`,
        `🔐 **Private Voice:** ${voiceChannel}`,
        '',
        existingPlayer
          ? '✅ **You are already registered for this game.**'
          : 'Join the game when you are ready.',
        '',
        'The timer will NOT start until every required player has joined the private voice channel.',
      ].join('\n'),
      components,
    });
  } catch (error) {
    console.error('[Escape Play]', error);

    await interaction.editReply(
      `❌ ${error?.message || 'Failed to open the current Escape Room.'}`
    ).catch(() => {});
  }
}

export async function handleEscapeSessionButton(interaction) {
  const [, action, sessionIdText] = interaction.customId.split(':');
  const sessionId = Number(sessionIdText);

  if (!Number.isInteger(sessionId) || sessionId < 1) {
    await interaction.reply({
      content: '❌ Invalid Escape Room session.',
      flags: 64,
    });
    return;
  }

  if (action === 'join') {
    await interaction.deferReply({ flags: 64 });

    try {
      const EscapeRoomService = (
        await import('../../services/escapeRoomService.js')
      ).default;

      const session = await EscapeRoomService.getSession(sessionId);

      if (!session || session.guildId !== interaction.guildId) {
        await interaction.editReply(
          '❌ This Escape Room session no longer exists.'
        );
        return;
      }

      if (session.status !== 'WAITING') {
        await interaction.editReply(
          `❌ This Escape Room is no longer accepting players. Current status: \`${session.status}\`.`
        );
        return;
      }

      await EscapeRoomService.addPlayer({
        sessionId,
        discordUserId: interaction.user.id,
      });

      const updatedSession = await EscapeRoomService.getSession(sessionId);

      if (updatedSession.requiredVoiceChannelId) {
        const voiceChannel =
          await interaction.guild.channels.fetch(
            updatedSession.requiredVoiceChannelId
          );

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

      const escapeCase =
        await EscapeRoomService.getSessionCase(sessionId);

      const players =
        await EscapeRoomService.getPlayers(sessionId);

      await interaction.editReply({
        content: [
          '✅ **YOU JOINED THE INVESTIGATION**',
          '',
          `**${escapeCase.title}**`,
          '',
          `👥 **Players:** ${players.length}/${escapeCase.playerLimit}`,
          `🔐 **Private Voice:** <#${updatedSession.requiredVoiceChannelId}>`,
          '',
          'Join the private voice channel.',
          '',
          '⏳ The timer starts automatically once every required player is inside.',
        ].join('\n'),
      });
    } catch (error) {
      await interaction.editReply(
        `❌ ${error?.message || 'Unable to join the Escape Room.'}`
      ).catch(() => {});
    }

    return;
  }

  if (action === 'leave') {
    await interaction.deferReply({ flags: 64 });

    try {
      const EscapeRoomService = (
        await import('../../services/escapeRoomService.js')
      ).default;

      await EscapeRoomService.removePlayer(
        sessionId,
        interaction.user.id
      );

      await interaction.editReply(
        '🚪 You left the Escape Room waiting lobby. You can rejoin while it remains open.'
      );
    } catch (error) {
      await interaction.editReply(
        `❌ ${error?.message || 'Unable to leave the Escape Room.'}`
      ).catch(() => {});
    }

    return;
  }

  await interaction.reply({
    content: '❌ Unknown Escape Room session action.',
    flags: 64,
  });
}
