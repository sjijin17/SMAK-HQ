import { batch, query, queryOne } from '../database/client.js';
import EscapeRoomService from './escapeRoomService.js';
import EscapeStoryService from './escapeStoryService.js';

export class EscapeGameSessionService {
  /**
   * Initializes the gameplay state for a newly ACTIVE session.
   *
   * This method is intentionally idempotent:
   * running it again will not duplicate puzzle or scene state.
   */
  static async initializeSession(sessionId) {
    const session = await EscapeRoomService.getSession(sessionId);

    if (!session) {
      throw new Error(`Escape session ${sessionId} was not found.`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(
        `Gameplay can only be initialized for an ACTIVE session. Current status: ${session.status}`
      );
    }

    const escapeCase = await EscapeRoomService.getSessionCase(sessionId);

    if (!escapeCase) {
      throw new Error(
        `Escape case for session ${sessionId} was not found.`
      );
    }

    const startingScene =
      await EscapeStoryService.getStartingScene(escapeCase.id);

    if (!startingScene) {
      throw new Error(
        `Escape case ${escapeCase.caseCode} has no starting scene.`
      );
    }

    const puzzles =
      await EscapeStoryService.listPuzzles(escapeCase.id);

    const existingPuzzleRows = await query(
      `
        SELECT puzzle_id
        FROM escape_session_puzzles
        WHERE session_id = ?
      `,
      [sessionId]
    );

    const existingPuzzleIds = new Set(
      existingPuzzleRows.map((row) => Number(row.puzzle_id))
    );

    const statements = [];

    for (const puzzle of puzzles) {
      if (existingPuzzleIds.has(puzzle.id)) {
        continue;
      }

      statements.push({
        sql: `
          INSERT INTO escape_session_puzzles (
            session_id,
            puzzle_id,
            status,
            attempts
          )
          VALUES (?, ?, 'LOCKED', 0)
        `,
        args: [
          sessionId,
          puzzle.id,
        ],
      });
    }

    const existingScene = await queryOne(
      `
        SELECT *
        FROM escape_session_scenes
        WHERE session_id = ?
          AND scene_id = ?
      `,
      [sessionId, startingScene.id]
    );

    if (existingScene) {
      statements.push({
        sql: `
          UPDATE escape_session_scenes
          SET
            last_entered_at = CURRENT_TIMESTAMP,
            visit_count = visit_count + 1
          WHERE id = ?
        `,
        args: [existingScene.id],
      });
    } else {
      statements.push({
        sql: `
          INSERT INTO escape_session_scenes (
            session_id,
            scene_id
          )
          VALUES (?, ?)
        `,
        args: [
          sessionId,
          startingScene.id,
        ],
      });
    }

    if (statements.length > 0) {
      await batch(statements);
    }

    await EscapeRoomService.recordEvent({
      sessionId,
      eventType: 'GAMEPLAY_INITIALIZED',
      eventData: {
        caseId: escapeCase.id,
        caseCode: escapeCase.caseCode,
        startingSceneId: startingScene.id,
        startingSceneKey: startingScene.sceneKey,
        puzzlesInitialized: puzzles.length,
      },
    });

    return {
      sessionId: Number(sessionId),
      caseId: escapeCase.id,
      startingScene,
      puzzlesInitialized: puzzles.length,
    };
  }
}

export default EscapeGameSessionService;
