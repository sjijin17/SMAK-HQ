import { query, queryOne } from '../database/client.js';

function parseJson(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeScene(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    sceneKey: row.scene_key,
    title: row.title,
    description: row.description ?? null,
    isStartingScene: Boolean(row.is_starting_scene),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeObject(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    sceneId: Number(row.scene_id),
    objectKey: row.object_key,
    title: row.title,
    objectType: row.object_type,
    config: parseJson(row.config_json),
    initiallyVisible: Boolean(row.initially_visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEvidence(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    evidenceKey: row.evidence_key,
    title: row.title,
    evidenceType: row.evidence_type,
    content: parseJson(row.content_json),
    playerSlot:
      row.player_slot === null || row.player_slot === undefined
        ? null
        : Number(row.player_slot),
    isRequired: Boolean(row.is_required),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePuzzle(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    puzzleKey: row.puzzle_key,
    title: row.title,
    puzzleType: row.puzzle_type,
    config: parseJson(row.config_json),
    requiredPlayers: Number(row.required_players),
    playerSlot:
      row.player_slot === null || row.player_slot === undefined
        ? null
        : Number(row.player_slot),
    hasFailureConsequence: Boolean(row.has_failure_consequence),
    isRequired: Boolean(row.is_required),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeChoice(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    choiceKey: row.choice_key,
    title: row.title,
    description: row.description ?? null,
    config: parseJson(row.config_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeEnding(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    caseId: Number(row.case_id),
    endingKey: row.ending_key,
    title: row.title,
    description: row.description,
    config: parseJson(row.config_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class EscapeStoryService {
  // ==========================================================================
  // CASE CONTENT
  // ==========================================================================

  static async getScene(sceneId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_scenes
        WHERE id = ?
      `,
      [sceneId]
    );

    return normalizeScene(row);
  }

  static async getSceneByKey(caseId, sceneKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_scenes
        WHERE case_id = ?
          AND scene_key = ?
      `,
      [caseId, sceneKey]
    );

    return normalizeScene(row);
  }

  static async listScenes(caseId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_scenes
        WHERE case_id = ?
        ORDER BY sort_order ASC, id ASC
      `,
      [caseId]
    );

    return rows.map(normalizeScene);
  }

  static async getStartingScene(caseId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_scenes
        WHERE case_id = ?
          AND is_starting_scene = 1
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      `,
      [caseId]
    );

    return normalizeScene(row);
  }

  // ==========================================================================
  // CASE OBJECTS
  // ==========================================================================

  static async getObject(objectId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_objects
        WHERE id = ?
      `,
      [objectId]
    );

    return normalizeObject(row);
  }

  static async getObjectByKey(sceneId, objectKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_objects
        WHERE scene_id = ?
          AND object_key = ?
      `,
      [sceneId, objectKey]
    );

    return normalizeObject(row);
  }

  static async listSceneObjects(sceneId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_objects
        WHERE scene_id = ?
        ORDER BY id ASC
      `,
      [sceneId]
    );

    return rows.map(normalizeObject);
  }

  // ==========================================================================
  // CASE EVIDENCE
  // ==========================================================================

  static async getEvidence(evidenceId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_evidence
        WHERE id = ?
      `,
      [evidenceId]
    );

    return normalizeEvidence(row);
  }

  static async getEvidenceByKey(caseId, evidenceKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_evidence
        WHERE case_id = ?
          AND evidence_key = ?
      `,
      [caseId, evidenceKey]
    );

    return normalizeEvidence(row);
  }

  static async listEvidence(caseId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_evidence
        WHERE case_id = ?
        ORDER BY id ASC
      `,
      [caseId]
    );

    return rows.map(normalizeEvidence);
  }

  // ==========================================================================
  // CASE PUZZLES
  // ==========================================================================

  static async getPuzzle(puzzleId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_puzzles
        WHERE id = ?
      `,
      [puzzleId]
    );

    return normalizePuzzle(row);
  }

  static async getPuzzleByKey(caseId, puzzleKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_puzzles
        WHERE case_id = ?
          AND puzzle_key = ?
      `,
      [caseId, puzzleKey]
    );

    return normalizePuzzle(row);
  }

  static async listPuzzles(caseId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_puzzles
        WHERE case_id = ?
        ORDER BY id ASC
      `,
      [caseId]
    );

    return rows.map(normalizePuzzle);
  }

  // ==========================================================================
  // CASE CHOICES
  // ==========================================================================

  static async getChoice(choiceId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_choices
        WHERE id = ?
      `,
      [choiceId]
    );

    return normalizeChoice(row);
  }

  static async getChoiceByKey(caseId, choiceKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_choices
        WHERE case_id = ?
          AND choice_key = ?
      `,
      [caseId, choiceKey]
    );

    return normalizeChoice(row);
  }

  static async listChoices(caseId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_choices
        WHERE case_id = ?
        ORDER BY id ASC
      `,
      [caseId]
    );

    return rows.map(normalizeChoice);
  }

  // ==========================================================================
  // CASE ENDINGS
  // ==========================================================================

  static async getEnding(endingId) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_endings
        WHERE id = ?
      `,
      [endingId]
    );

    return normalizeEnding(row);
  }

  static async getEndingByKey(caseId, endingKey) {
    const row = await queryOne(
      `
        SELECT *
        FROM escape_case_endings
        WHERE case_id = ?
          AND ending_key = ?
      `,
      [caseId, endingKey]
    );

    return normalizeEnding(row);
  }

  static async listEndings(caseId) {
    const rows = await query(
      `
        SELECT *
        FROM escape_case_endings
        WHERE case_id = ?
        ORDER BY id ASC
      `,
      [caseId]
    );

    return rows.map(normalizeEnding);
  }

  // ==========================================================================
  // COMPLETE STORY CONTENT
  // ==========================================================================

  static async getCaseStory(caseId) {
    const [
      scenes,
      evidence,
      puzzles,
      choices,
      endings,
    ] = await Promise.all([
      this.listScenes(caseId),
      this.listEvidence(caseId),
      this.listPuzzles(caseId),
      this.listChoices(caseId),
      this.listEndings(caseId),
    ]);

    const objectsByScene = {};

    for (const scene of scenes) {
      objectsByScene[scene.sceneKey] =
        await this.listSceneObjects(scene.id);
    }

    return {
      caseId: Number(caseId),
      scenes,
      objectsByScene,
      evidence,
      puzzles,
      choices,
      endings,
    };
  }
}

export default EscapeStoryService;
