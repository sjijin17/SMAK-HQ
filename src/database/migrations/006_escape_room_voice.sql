ALTER TABLE escape_sessions
ADD COLUMN required_voice_channel_id TEXT;

ALTER TABLE escape_sessions
ADD COLUMN voice_ready_at TEXT;

CREATE INDEX IF NOT EXISTS idx_escape_sessions_voice_channel
ON escape_sessions(required_voice_channel_id);

CREATE INDEX IF NOT EXISTS idx_escape_session_players_voice
ON escape_session_players(session_id, voice_present);
