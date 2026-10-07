import { Events } from 'discord.js';
import EscapeRoomService from '../services/escapeRoomService.js';
import { setPlayerVoiceState } from '../services/escapeVoiceService.js';

export const name = Events.VoiceStateUpdate;

export async function execute(oldState, newState) {
  try {
    console.log(
      `[Escape Voice DEBUG] ${newState.id ?? oldState.id}: ` +
      `${oldState.channelId ?? 'NONE'} -> ${newState.channelId ?? 'NONE'}`
    );

    const guildId = newState.guild?.id ?? oldState.guild?.id;
    if (!guildId) return;

    const userId = newState.id ?? oldState.id;
    if (!userId) return;

    const sessions = await EscapeRoomService.listSessions(guildId);

    const relevantSessions = sessions.filter((session) =>
      ['WAITING', 'ACTIVE', 'PAUSED'].includes(session.status)
    );

    for (const session of relevantSessions) {
      const player = await EscapeRoomService.getPlayer(session.id, userId);

      if (!player || player.participationStatus !== 'ACTIVE') continue;

      const requiredChannelId = session.requiredVoiceChannelId;

      if (!requiredChannelId) continue;

      const wasInRequiredChannel = oldState.channelId === requiredChannelId;
      const isNowInRequiredChannel = newState.channelId === requiredChannelId;

      if (wasInRequiredChannel === isNowInRequiredChannel) continue;

      console.log(
        `[Escape Voice] Session ${session.id}: ${userId} ` +
        `${wasInRequiredChannel ? 'left' : 'joined'} required voice channel.`
      );

      await setPlayerVoiceState({
        sessionId: session.id,
        discordUserId: userId,
        voicePresent: isNowInRequiredChannel,
      });
    }
  } catch (error) {
    console.error('[Escape Voice] Failed to process voice state update:', error);
  }
}
