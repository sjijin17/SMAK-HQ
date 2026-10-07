import { batch, query, queryOne } from '../database/client.js';
import { logger } from '../utils/logger.js';

const CASE_STATUSES = [
  'DRAFT',
  'TESTING',
  'PUBLISHED',
  'ACTIVE',
  'ARCHIVED',
];

const SESSION_STATUSES = [
  'WAITING',
  'ACTIVE',
  'PAUSED',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
];

const PLAYER_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'DISCONNECTED',
  'FAILED',
  'REMOVED',
];

function assertCaseStatus(status) {
  if (!CASE_STATUSES.includes(status)) {
    throw new Error(
      `Invalid escape case status "${status}". Allowed values: ${CASE_STATUSES.join(', ')}`
    );
  }
}

function assertSessionStatus(status) {
  if (!SESSION_STATUSES.includes(status)) {
    throw new Error(
      `Invalid escape session status "${status}". Allowed values: ${SESSION_STATUSES.join(', ')}`
    );
  }
}

function assertPlayerStatus(status) {
  if (!PLAYER_STATUSES.includes(status)) {
    throw new Error(
      `Invalid escape player status "${status}". Allowed values: ${PLAYER_STATUSES.join(', ')}`
    );
  }
}

function normalizeCase(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    guildId: row.guild_id,
    caseCode: row.case_code,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    playerLimit: Number(row.player_limit),
    durationMinutes: Number(row.duration_minutes),
    createdBy: row.created_by ?? null,
    version: Number(row.version),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSession(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    guildId: row.guild_id,
    status: row.status,
    startedAt: row.started_at ?? null,
    deadlineAt: row.deadline_at ?? null,
    endedAt: row.ended_at ?? null,
    voiceReadyAt: row.voice_ready_at ?? null,
    hintsUsed: Number(row.hints_used),
    wrongSubmissions: Number(row.wrong_submissions),
    finalAnswer: row.final_answer ?? null,
    resultNote: row.result_note ?? null,
    rewardAmount: Number(row.reward_amount),
    punishmentApplied: Boolean(row.punishment_applied),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePlayer(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    discordUserId: row.discord_user_id,
    playerRole: row.player_role ?? null,
    voicePresent: Boolean(row.voice_present),
    voiceJoinedAt: row.voice_joined_at ?? null,
    voiceLeftAt: row.voice_left_at ?? null,
    voiceSeconds: Number(row.voice_seconds),
    evidenceFound: Number(row.evidence_found),
    participationStatus: row.participation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEvent(row) {
  if (!row) return null;

  let eventData = null;

  if (row.event_data) {
    try {
      eventData = JSON.parse(row.event_data);
    } catch {
      eventData = row.event_data;
    }
  }

  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    discordUserId: row.discord_user_id ?? null,
    eventType: row.event_type,
    eventData,
    createdAt: row.created_at,
  };
}

export class EscapeRoomService {
  // ==========================================================================
  // CASE MANAGEMENT
  // ==========================================================================

  /**
   * Creates a permanent escape-room case definition.
   *
   * A case is reusable content. It can later be published and played
   * through multiple sessions.
   */
  static async createCase({
    guildId,
    caseCode,
    title,
    description = null,
    playerLimit = 3,
    durationMinutes = 45,
    createdBy = null,
  }) {
    if (!guildId) throw new Error('guildId is required.');
    if (!caseCode) throw new Error('caseCode is required.');
    if (!title) throw new Error('title is required.');

    if (!Number.isInteger(playerLimit) || playerLimit < 1) {
      throw new Error('playerLimit must be a positive integer.');
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      throw new Error('durationMinutes must be a positive integer.');
    }

    const existing = await queryOne(
      `
        SELECT id
        FROM escape_cases
        WHERE guild_id = ?
          AND case_code = ?
      `,
      [guildId, caseCode]
    );

    if (existing) {
      throw new Error(
        `Escape case "${caseCode}" already exists in this guild.`
      );
    }

    const result = await queryOne(
      `
        INSERT INTO escape_cases (
          guild_id,
          case_code,
          title,
          description,
          status,
          player_limit,
          duration_minutes,
          created_by
        )
        VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?)
        RETURNING *
      `,
      [
        guildId,
        caseCode,
        title,
        description,
        playerLimit,
        durationMinutes,
        createdBy,
      ]
    );

    logger.info(
      `Created escape case ${caseCode} for guild ${guildId}.`
    );

    return normalizeCase(result);
  }

  /**
   * Gets one case by database ID.
   */
  static async getCase(caseId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_cases
        WHERE id = ?
      `,
      [caseId]
    );

    return normalizeCase(row);
  }

  /**
   * Gets one case by guild + case code.
   */
  static async getCaseByCode(guildId, caseCode) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_cases
        WHERE guild_id = ?
          AND case_code = ?
      `,
      [guildId, caseCode]
    );

    return normalizeCase(row);
  }

  /**
   * Lists cases belonging to a guild.
   *
   * By default, archived cases are included so admins can inspect
   * the complete case library.
   */
  static async listCases(guildId, { status = null } = {}) {
    let rows;

    if (status) {
      assertCaseStatus(status);

      rows = await query(
        `
          SELECT *
          FROM escape_cases
          WHERE guild_id = ?
            AND status = ?
          ORDER BY created_at DESC
        `,
        [guildId, status]
      );
    } else {
      rows = await query(
        `
          SELECT *
          FROM escape_cases
          WHERE guild_id = ?
          ORDER BY created_at DESC
        `,
        [guildId]
      );
    }

    return rows.map(normalizeCase);
  }

  /**
   * Changes a case lifecycle status.
   */
  static async updateCaseStatus(caseId, status) {
    assertCaseStatus(status);

    const result = await queryOne(
      `
        UPDATE escape_cases
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING *
      `,
      [status, caseId]
    );

    if (!result) {
      throw new Error(`Escape case ${caseId} was not found.`);
    }

    logger.info(
      `Escape case ${caseId} status changed to ${status}.`
    );

    return normalizeCase(result);
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Creates a new team session for an existing case.
   *
   * Sessions start in WAITING state. The timer does not begin here.
   * A later voice/session engine will transition the session to ACTIVE
   * once all required players are present.
   */
  static async createSession({ caseId, guildId }) {
    if (!caseId) throw new Error('caseId is required.');
    if (!guildId) throw new Error('guildId is required.');

    const escapeCase = await this.getCase(caseId);

    if (!escapeCase) {
      throw new Error(`Escape case ${caseId} was not found.`);
    }

    if (escapeCase.guildId !== guildId) {
      throw new Error(
        'Escape case does not belong to the supplied guild.'
      );
    }

    if (
      escapeCase.status !== 'PUBLISHED' &&
      escapeCase.status !== 'ACTIVE'
    ) {
      throw new Error(
        `Escape case "${escapeCase.caseCode}" is not playable while in ${escapeCase.status} status.`
      );
    }

    const result = await queryOne(
      `
        INSERT INTO escape_sessions (
          case_id,
          guild_id,
          status
        )
        VALUES (?, ?, 'WAITING')
        RETURNING *
      `,
      [caseId, guildId]
    );

    await this.recordEvent({
      sessionId: result.id,
      eventType: 'SESSION_CREATED',
      eventData: {
        caseId,
        caseCode: escapeCase.caseCode,
      },
    });

    logger.info(
      `Created escape session ${result.id} for case ${escapeCase.caseCode}.`
    );

    return normalizeSession(result);
  }

  /**
   * Starts a WAITING session when every required player is present
   * in the required Escape Room voice channel.
   *
   * The timer is authoritative from Turso timestamps:
   * started_at = current server time
   * deadline_at = started_at + case duration
   */
  static async startSessionWhenVoiceReady(sessionId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Escape session ${sessionId} was not found.`);
    }

    if (session.status !== 'WAITING') {
      return session;
    }

    const escapeCase = await this.getSessionCase(sessionId);

    if (!escapeCase) {
      throw new Error(
        `Escape case for session ${sessionId} was not found.`
      );
    }

    const players = await this.getPlayers(sessionId);
    const activePlayers = players.filter(
      (player) => player.participationStatus === 'ACTIVE'
    );

    const requiredPlayers = escapeCase.playerLimit;

    if (activePlayers.length !== requiredPlayers) {
      return session;
    }

    const allPlayersPresent = activePlayers.every(
      (player) => player.voicePresent
    );

    if (!allPlayersPresent) {
      return session;
    }

    const now = new Date();
    const startedAt = now.toISOString();
    const deadlineAt = new Date(
      now.getTime() + escapeCase.durationMinutes * 60 * 1000
    ).toISOString();

    const updated = await queryOne(
      `
        UPDATE escape_sessions
        SET
          status = 'ACTIVE',
          started_at = ?,
          deadline_at = ?,
          voice_ready_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND status = 'WAITING'
        RETURNING *
      `,
      [
        startedAt,
        deadlineAt,
        startedAt,
        sessionId,
      ]
    );

    if (!updated) {
      return this.getSession(sessionId);
    }

    await this.recordEvent({
      sessionId,
      eventType: 'SESSION_STARTED',
      eventData: {
        startedAt,
        deadlineAt,
        durationMinutes: escapeCase.durationMinutes,
        requiredPlayers,
      },
    });

    logger.info(
      `Escape session ${sessionId} started. Deadline: ${deadlineAt}`
    );

    return normalizeSession(updated);
  }

  /**
   * Gets a session by ID.
   */
  static async getSession(sessionId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_sessions
        WHERE id = ?
      `,
      [sessionId]
    );

    return normalizeSession(row);
  }

  /**
   * Gets the case associated with a session.
   */
  static async getSessionCase(sessionId) {
    const row = await queryOne(
      `
        SELECT c.*
        FROM escape_cases c
        INNER JOIN escape_sessions s
          ON s.case_id = c.id
        WHERE s.id = ?
      `,
      [sessionId]
    );

    return normalizeCase(row);
  }

  /**
   * Lists sessions for a guild.
   */
  static async listSessions(guildId, { status = null } = {}) {
    let rows;

    if (status) {
      assertSessionStatus(status);

      rows = await query(
        `
          SELECT *
          FROM escape_sessions
          WHERE guild_id = ?
            AND status = ?
          ORDER BY created_at DESC
        `,
        [guildId, status]
      );
    } else {
      rows = await query(
        `
          SELECT *
          FROM escape_sessions
          WHERE guild_id = ?
          ORDER BY created_at DESC
        `,
        [guildId]
      );
    }

    return rows.map(normalizeSession);
  }

  /**
   * Changes a session status.
   *
   * This method intentionally does not automatically start/stop timers.
   * Timing will be handled by the dedicated session/timer engine.
   */
  static async updateSessionStatus(sessionId, status, {
    resultNote = null,
    finalAnswer = null,
    rewardAmount = null,
    punishmentApplied = null,
  } = {}) {
    assertSessionStatus(status);

    const existing = await this.getSession(sessionId);

    if (!existing) {
      throw new Error(`Escape session ${sessionId} was not found.`);
    }

    const now = new Date().toISOString();

    const endedStatuses = [
      'SUCCESS',
      'FAILED',
      'EXPIRED',
      'CANCELLED',
    ];

    const statements = [
      {
        sql: `
          UPDATE escape_sessions
          SET
            status = ?,
            ended_at = CASE
              WHEN ? = 1 THEN COALESCE(ended_at, ?)
              ELSE ended_at
            END,
            result_note = COALESCE(?, result_note),
            final_answer = COALESCE(?, final_answer),
            reward_amount = COALESCE(?, reward_amount),
            punishment_applied = COALESCE(?, punishment_applied),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          status,
          endedStatuses.includes(status) ? 1 : 0,
          now,
          resultNote,
          finalAnswer,
          rewardAmount,
          punishmentApplied === null
            ? null
            : punishmentApplied
              ? 1
              : 0,
          sessionId,
        ],
      },
    ];

    await batch(statements);

    const updated = await this.getSession(sessionId);

    await this.recordEvent({
      sessionId,
      eventType: 'SESSION_STATUS_CHANGED',
      eventData: {
        previousStatus: existing.status,
        newStatus: status,
        resultNote,
      },
    });

    return updated;
  }

  // ==========================================================================
  // SESSION PLAYERS
  // ==========================================================================

  /**
   * Adds a Discord member to a session.
   */
  static async addPlayer({
    sessionId,
    discordUserId,
    playerRole = null,
  }) {
    if (!sessionId) throw new Error('sessionId is required.');
    if (!discordUserId) throw new Error('discordUserId is required.');

    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Escape session ${sessionId} was not found.`);
    }

    if (session.status !== 'WAITING') {
      throw new Error(
        'Players can only be added while an escape session is WAITING.'
      );
    }

    const escapeCase = await this.getSessionCase(sessionId);

    const currentPlayers = await queryOne(
      `
        SELECT COUNT(*) AS count
        FROM escape_session_players
        WHERE session_id = ?
          AND participation_status != 'REMOVED'
      `,
      [sessionId]
    );

    if (Number(currentPlayers.count) >= escapeCase.playerLimit) {
      throw new Error(
        `This session already has the maximum of ${escapeCase.playerLimit} players.`
      );
    }

    const existing = await queryOne(
      `
        SELECT *
        FROM escape_session_players
        WHERE session_id = ?
          AND discord_user_id = ?
      `,
      [sessionId, discordUserId]
    );

    if (existing) {
      if (existing.participation_status === 'REMOVED') {
        const restored = await queryOne(
          `
            UPDATE escape_session_players
            SET
              player_role = ?,
              participation_status = 'ACTIVE',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *
          `,
          [playerRole, existing.id]
        );

        await this.recordEvent({
          sessionId,
          discordUserId,
          eventType: 'PLAYER_REJOINED_SESSION',
          eventData: {
            playerRole,
          },
        });

        return normalizePlayer(restored);
      }

      throw new Error(
        'This Discord member is already part of the session.'
      );
    }

    const result = await queryOne(
      `
        INSERT INTO escape_session_players (
          session_id,
          discord_user_id,
          player_role
        )
        VALUES (?, ?, ?)
        RETURNING *
      `,
      [sessionId, discordUserId, playerRole]
    );

    await this.recordEvent({
      sessionId,
      discordUserId,
      eventType: 'PLAYER_ADDED',
      eventData: {
        playerRole,
      },
    });

    return normalizePlayer(result);
  }

  /**
   * Removes a player from a WAITING session without deleting the
   * permanent audit record.
   */
  static async removePlayer(sessionId, discordUserId) {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Escape session ${sessionId} was not found.`);
    }

    if (session.status !== 'WAITING') {
      throw new Error(
        'Players can only be removed while an escape session is WAITING.'
      );
    }

    const result = await queryOne(
      `
        UPDATE escape_session_players
        SET
          participation_status = 'REMOVED',
          updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
          AND discord_user_id = ?
          AND participation_status != 'REMOVED'
        RETURNING *
      `,
      [sessionId, discordUserId]
    );

    if (!result) {
      throw new Error(
        'Active session player was not found.'
      );
    }

    await this.recordEvent({
      sessionId,
      discordUserId,
      eventType: 'PLAYER_REMOVED',
      eventData: null,
    });

    return normalizePlayer(result);
  }

  /**
   * Gets all active/non-removed players in a session.
   */
  static async getPlayers(sessionId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_session_players
        WHERE session_id = ?
          AND participation_status != 'REMOVED'
        ORDER BY id ASC
      `,
      [sessionId]
    );

    return rows.map(normalizePlayer);
  }

  /**
   * Gets one player from a session.
   */
  static async getPlayer(sessionId, discordUserId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_session_players
        WHERE session_id = ?
          AND discord_user_id = ?
      `,
      [sessionId, discordUserId]
    );

    return normalizePlayer(row);
  }

  // ==========================================================================
  // AUDIT EVENTS
  // ==========================================================================

  /**
   * Records an immutable-ish event in the session audit trail.
   *
   * Event data is stored as JSON so future case mechanics can record
   * structured information without changing the table for every mechanic.
   */
  static async recordEvent({
    sessionId,
    discordUserId = null,
    eventType,
    eventData = null,
  }) {
    if (!sessionId) throw new Error('sessionId is required.');
    if (!eventType) throw new Error('eventType is required.');

    let serializedData = null;

    if (eventData !== null && eventData !== undefined) {
      serializedData =
        typeof eventData === 'string'
          ? eventData
          : JSON.stringify(eventData);
    }

    const result = await queryOne(
      `
        INSERT INTO escape_session_events (
          session_id,
          discord_user_id,
          event_type,
          event_data
        )
        VALUES (?, ?, ?, ?)
        RETURNING *
      `,
      [
        sessionId,
        discordUserId,
        eventType,
        serializedData,
      ]
    );

    return normalizeEvent(result);
  }

  /**
   * Returns the chronological audit trail for a session.
   */
  static async getSessionEvents(sessionId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_session_events
        WHERE session_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [sessionId]
    );

    return rows.map(normalizeEvent);
  }
}


export async function setRequiredVoiceChannel(sessionId, channelId) {
  const session = await EscapeRoomService.getSession(sessionId);

  if (!session) {
    throw new Error('Escape session not found.');
  }

  if (!['WAITING', 'PAUSED'].includes(session.status)) {
    throw new Error(
      'Required voice channel can only be configured while the session is WAITING or PAUSED.'
    );
  }

  const now = new Date().toISOString();

  await batch([
    {
      sql: `UPDATE escape_sessions
            SET required_voice_channel_id = ?,
                voice_ready_at = NULL,
                updated_at = ?
            WHERE id = ?`,
      args: [channelId, now, sessionId],
    },
  ]);

  await EscapeRoomService.recordEvent({
    sessionId,
    eventType: 'VOICE_CHANNEL_CREATED',
    eventData: {
      channelId,
    },
  });

  return EscapeRoomService.getSession(sessionId);
}

export default EscapeRoomService;
