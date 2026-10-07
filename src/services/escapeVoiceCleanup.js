import { ChannelType } from 'discord.js';

export async function cleanupEscapeVoiceChannel({
  client,
  session,
}) {
  if (!client) {
    throw new Error('Discord client is required for Escape Room voice cleanup.');
  }

  if (!session?.requiredVoiceChannelId) {
    return {
      deleted: false,
      reason: 'no_voice_channel',
    };
  }

  const channelId = String(session.requiredVoiceChannelId);

  let channel = client.channels.cache.get(channelId);

  if (!channel) {
    channel = await client.channels.fetch(channelId).catch(() => null);
  }

  if (!channel) {
    return {
      deleted: false,
      reason: 'channel_not_found',
      channelId,
    };
  }

  if (channel.type !== ChannelType.GuildVoice) {
    return {
      deleted: false,
      reason: 'not_voice_channel',
      channelId,
    };
  }

  await channel.delete(
    `Escape Room session ${session.id} ended with status ${session.status}.`
  );

  return {
    deleted: true,
    channelId,
  };
}
