import { execute, query, queryOne } from '../database/client.js';
import EscapeRoomService from './escapeRoomService.js';

function normalize(row) {
  if (!row) return null;

  return {
    id: row.id,
    sessionId: row.session_id,
    discordUserId: row.discord_user_id,
    playerRole: row.player_role,
    voicePresent: Boolean(row.voice_present),
    voiceJoinedAt: row.voice_joined_at,
    voiceLeftAt: row.voice_left_at,
    voiceSeconds: row.voice_seconds ?? 0,
    participationStatus: row.participation_status,
  };
}

export async function setPlayerVoiceState({
  sessionId,
  discordUserId,
  voicePresent,
}) {
  const player = await EscapeRoomService.getPlayer(
    sessionId,
    discordUserId
  );

  if (!player) {
    return null;
  }

  const now = new Date().toISOString();

  if (voicePresent) {
    if (player.voicePresent) {
      return normalize(
        await queryOne(
          `SELECT *
           FROM escape_session_players
           WHERE session_id = ? AND discord_user_id = ?`,
          [sessionId, discordUserId]
        )
      );
    }

    await execute(
      `UPDATE escape_session_players
       SET voice_present = 1,
           voice_joined_at = ?,
           voice_left_at = NULL,
           updated_at = ?
       WHERE session_id = ?
         AND discord_user_id = ?`,
      [now, now, sessionId, discordUserId]
    );

    await EscapeRoomService.recordEvent({
      sessionId,
      discordUserId,
      eventType: 'VOICE_JOINED',
      eventData: {
        joinedAt: now,
      },
    });
  } else {
    let additionalSeconds = 0;

    if (player.voicePresent && player.voiceJoinedAt) {
      additionalSeconds = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(player.voiceJoinedAt).getTime()) / 1000
        )
      );
    }

    const totalVoiceSeconds =
      (player.voiceSeconds ?? 0) + additionalSeconds;

    await execute(
      `UPDATE escape_session_players
       SET voice_present = 0,
           voice_left_at = ?,
           voice_seconds = ?,
           updated_at = ?
       WHERE session_id = ?
         AND discord_user_id = ?`,
      [
        now,
        totalVoiceSeconds,
        now,
        sessionId,
        discordUserId,
      ]
    );

    await EscapeRoomService.recordEvent({
      sessionId,
      discordUserId,
      eventType: 'VOICE_LEFT',
      eventData: {
        leftAt: now,
        voiceSeconds: totalVoiceSeconds,
      },
    });
  }

  const updatedPlayer = normalize(
    await queryOne(
      `SELECT *
       FROM escape_session_players
       WHERE session_id = ? AND discord_user_id = ?`,
      [sessionId, discordUserId]
    )
  );

  if (voicePresent) {
    await EscapeRoomService.startSessionWhenVoiceReady(sessionId);
  }

  return updatedPlayer;
}

export async function getVoiceReadyState(sessionId) {
  const session = await EscapeRoomService.getSession(sessionId);

  if (!session) {
    return null;
  }

  const players = await EscapeRoomService.getPlayers(sessionId);
  const activePlayers = players.filter(
    (player) => player.participationStatus === 'ACTIVE'
  );

  const requiredPlayers = session.playerLimit;
  const presentPlayers = activePlayers.filter(
    (player) => player.voicePresent
  );

  return {
    sessionId,
    requiredPlayers,
    joinedPlayers: activePlayers.length,
    presentPlayers: presentPlayers.length,
    ready:
      activePlayers.length === requiredPlayers &&
      presentPlayers.length === requiredPlayers,
    players: activePlayers.map((player) => ({
      discordUserId: player.discordUserId,
      voicePresent: player.voicePresent,
    })),
  };
}
