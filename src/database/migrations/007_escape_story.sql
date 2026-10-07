-- ============================================================================
-- Migration 007: Escape Room Story Content
-- ============================================================================
-- Reusable story/content layer for Escape Room cases.
--
-- CASE CONTENT:
--   scenes -> objects -> evidence/puzzles/choices/endings
--
-- SESSION STATE:
--   tracks what a player/team has discovered or activated during a session.
--
-- The existing escape_cases / escape_sessions foundation remains unchanged.
-- ============================================================================


-- ============================================================================
-- CASE SCENES
-- ============================================================================
CREATE TABLE IF NOT EXISTS escape_case_scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  case_id INTEGER NOT NULL,

  -- Stable internal identifier used by the game website.
  scene_key TEXT NOT NULL,

  -- Human-readable scene/location name.
  title TEXT NOT NULL,

  -- Optional environment description.
  description TEXT,

  -- Scene shown when a new session begins.
  is_starting_scene INTEGER NOT NULL DEFAULT 0,

  -- Ordering hint for admin/content tooling.
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_scene_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_scene_key
    UNIQUE (case_id, scene_key),

  CONSTRAINT chk_escape_case_scene_starting
    CHECK (is_starting_scene IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_escape_case_scenes_case
  ON escape_case_scenes (case_id, sort_order);


-- ============================================================================
-- CASE OBJECTS
-- ============================================================================
-- Interactive objects physically present inside scenes.
--
-- Examples:
--   photograph
--   desk drawer
--   telephone
--   CRT terminal
--   classroom door
--   notebook
--
-- The website decides how an object looks and behaves.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_case_objects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  scene_id INTEGER NOT NULL,

  object_key TEXT NOT NULL,

  title TEXT NOT NULL,

  object_type TEXT NOT NULL,

  -- Optional structured visual/interaction configuration.
  config_json TEXT,

  -- Whether the object is visible before any prerequisite is met.
  initially_visible INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_object_scene
    FOREIGN KEY (scene_id)
    REFERENCES escape_case_scenes(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_object_key
    UNIQUE (scene_id, object_key),

  CONSTRAINT chk_escape_case_object_visible
    CHECK (initially_visible IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_escape_case_objects_scene
  ON escape_case_objects (scene_id);


-- ============================================================================
-- CASE EVIDENCE
-- ============================================================================
-- Evidence is information a player/team can discover.
--
-- Evidence may be:
--   truthful
--   misleading
--   incomplete
--   player-specific
--   required by a puzzle
--   relevant only to an ending
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_case_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  case_id INTEGER NOT NULL,

  evidence_key TEXT NOT NULL,

  title TEXT NOT NULL,

  evidence_type TEXT NOT NULL,

  -- Optional structured content/configuration.
  content_json TEXT,

  -- If set, evidence belongs to one specific perspective/player slot.
  player_slot INTEGER,

  -- Whether discovering it is required for normal progression.
  is_required INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_evidence_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_evidence_key
    UNIQUE (case_id, evidence_key),

  CONSTRAINT chk_escape_case_evidence_required
    CHECK (is_required IN (0, 1)),

  CONSTRAINT chk_escape_case_evidence_player_slot
    CHECK (player_slot IS NULL OR player_slot >= 1)
);

CREATE INDEX IF NOT EXISTS idx_escape_case_evidence_case
  ON escape_case_evidence (case_id);


-- ============================================================================
-- CASE PUZZLES
-- ============================================================================
-- Actual game challenges.
--
-- A puzzle may require:
--   evidence
--   another puzzle
--   a specific choice
--   multiple players
--   a specific player perspective
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_case_puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  case_id INTEGER NOT NULL,

  puzzle_key TEXT NOT NULL,

  title TEXT NOT NULL,

  puzzle_type TEXT NOT NULL,

  config_json TEXT,

  -- Number of players required to solve/activate it.
  required_players INTEGER NOT NULL DEFAULT 1,

  -- Optional perspective/player slot restriction.
  player_slot INTEGER,

  -- Whether an incorrect submission can cause a consequence.
  has_failure_consequence INTEGER NOT NULL DEFAULT 0,

  -- Whether solving this puzzle is required for the intended route.
  is_required INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_puzzle_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_puzzle_key
    UNIQUE (case_id, puzzle_key),

  CONSTRAINT chk_escape_case_puzzle_players
    CHECK (required_players >= 1),

  CONSTRAINT chk_escape_case_puzzle_failure
    CHECK (has_failure_consequence IN (0, 1)),

  CONSTRAINT chk_escape_case_puzzle_required
    CHECK (is_required IN (0, 1)),

  CONSTRAINT chk_escape_case_puzzle_player_slot
    CHECK (player_slot IS NULL OR player_slot >= 1)
);

CREATE INDEX IF NOT EXISTS idx_escape_case_puzzles_case
  ON escape_case_puzzles (case_id);


-- ============================================================================
-- CASE CHOICES
-- ============================================================================
-- Decisions made during gameplay.
--
-- A choice can:
--   unlock something
--   lock something
--   trigger a trap
--   alter an ending
--   consume a resource
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_case_choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  case_id INTEGER NOT NULL,

  choice_key TEXT NOT NULL,

  title TEXT NOT NULL,

  description TEXT,

  config_json TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_choice_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_choice_key
    UNIQUE (case_id, choice_key)
);

CREATE INDEX IF NOT EXISTS idx_escape_case_choices_case
  ON escape_case_choices (case_id);


-- ============================================================================
-- CASE ENDINGS
-- ============================================================================
-- Possible outcomes of a case.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_case_endings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  case_id INTEGER NOT NULL,

  ending_key TEXT NOT NULL,

  title TEXT NOT NULL,

  description TEXT NOT NULL,

  config_json TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_case_ending_case
    FOREIGN KEY (case_id)
    REFERENCES escape_cases(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_case_ending_key
    UNIQUE (case_id, ending_key)
);

CREATE INDEX IF NOT EXISTS idx_escape_case_endings_case
  ON escape_case_endings (case_id);


-- ============================================================================
-- SESSION EVIDENCE
-- ============================================================================
-- Records evidence discovered during a specific playthrough.
--
-- Player-specific evidence remains private to that player.
-- Team evidence can be represented with NULL discord_user_id.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_session_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  evidence_id INTEGER NOT NULL,

  discord_user_id TEXT,

  discovered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_session_evidence_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_escape_session_evidence_evidence
    FOREIGN KEY (evidence_id)
    REFERENCES escape_case_evidence(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_session_evidence
    UNIQUE (session_id, evidence_id, discord_user_id)
);

CREATE INDEX IF NOT EXISTS idx_escape_session_evidence_session
  ON escape_session_evidence (session_id, discovered_at ASC);

CREATE INDEX IF NOT EXISTS idx_escape_session_evidence_player
  ON escape_session_evidence (session_id, discord_user_id);


-- ============================================================================
-- SESSION PUZZLES
-- ============================================================================
-- Tracks puzzle state during a playthrough.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_session_puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  puzzle_id INTEGER NOT NULL,

  status TEXT NOT NULL DEFAULT 'LOCKED',

  attempts INTEGER NOT NULL DEFAULT 0,

  solved_by TEXT,

  solved_at TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_escape_session_puzzle_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_escape_session_puzzle_puzzle
    FOREIGN KEY (puzzle_id)
    REFERENCES escape_case_puzzles(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_session_puzzle
    UNIQUE (session_id, puzzle_id),

  CONSTRAINT chk_escape_session_puzzle_status
    CHECK (status IN (
      'LOCKED',
      'AVAILABLE',
      'SOLVED',
      'FAILED'
    )),

  CONSTRAINT chk_escape_session_puzzle_attempts
    CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_escape_session_puzzles_session
  ON escape_session_puzzles (session_id);


-- ============================================================================
-- SESSION CHOICES
-- ============================================================================
-- Permanent record of important decisions made during a session.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_session_choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  choice_id INTEGER NOT NULL,

  discord_user_id TEXT,

  selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  config_json TEXT,

  CONSTRAINT fk_escape_session_choice_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_escape_session_choice_choice
    FOREIGN KEY (choice_id)
    REFERENCES escape_case_choices(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escape_session_choices_session
  ON escape_session_choices (session_id, selected_at ASC);


-- ============================================================================
-- SESSION SCENE STATE
-- ============================================================================
-- Tracks the scenes reached during a playthrough.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escape_session_scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  session_id INTEGER NOT NULL,

  scene_id INTEGER NOT NULL,

  first_entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  last_entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  visit_count INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT fk_escape_session_scene_session
    FOREIGN KEY (session_id)
    REFERENCES escape_sessions(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_escape_session_scene_scene
    FOREIGN KEY (scene_id)
    REFERENCES escape_case_scenes(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_escape_session_scene
    UNIQUE (session_id, scene_id),

  CONSTRAINT chk_escape_session_scene_visits
    CHECK (visit_count >= 1)
);

CREATE INDEX IF NOT EXISTS idx_escape_session_scenes_session
  ON escape_session_scenes (session_id, last_entered_at DESC);
