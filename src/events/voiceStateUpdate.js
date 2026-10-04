import { Events } from 'discord.js';
import EscapeRoomService from '../services/escapeRoomService.js';
import { setPlayerVoiceState } from '../services/escapeVoiceService.js';

export const name = Events.VoiceStateUpdate;

export async function execute(oldState, newState) {
  try {
    const guildId = newState.guild?.id ?? oldState.guild?.id;

    if (!guildId) {
      return;
    }

    const userId = newState.id ?? oldState.id;

    const sessions = await EscapeRoomService.listSessions(guildId);

    const relevantSessions = sessions.filter((session) =>
      ['WAITING', 'ACTIVE', 'PAUSED'].includes(session.status)
    );

    for (const session of relevantSessions) {
      const player = await EscapeRoomService.getPlayer(
        session.id,
        userId
      );

      if (!player || player.participationStatus !== 'ACTIVE') {
        continue;
      }

      const requiredChannelId = session.requiredVoiceChannelId;

      if (!requiredChannelId) {
        continue;
      }

      const isNowInRequiredChannel =
        newState.channelId === requiredChannelId;

      const wasInRequiredChannel =
        oldState.channelId === requiredChannelId;

      if (
        isNowInRequiredChannel === wasInRequiredChannel
      ) {
        continue;
      }

      await setPlayerVoiceState({
        sessionId: session.id,
        discordUserId: userId,
        voicePresent: isNowInRequiredChannel,
      });
    }
  } catch (error) {
    console.error(
      '[Escape Voice] Failed to process voice state update:',
      error
    );
  }
}
