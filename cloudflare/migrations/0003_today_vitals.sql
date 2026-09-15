-- Today/Vitals D1 gaps: health_narratives + admin_messages typed columns.
-- Matches Postgres public.health_narratives (user_id, day, narrative, created_at)
-- and public.admin_messages (subject, body, is_broadcast, recipient_id, sender_id).
-- Safe to re-run: CREATE IF NOT EXISTS; ALTER may no-op if columns already exist.

CREATE TABLE IF NOT EXISTS health_narratives (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  narrative TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS health_narratives_user_idx ON health_narratives (user_id);

-- Expand admin_messages from generic payload blob to typed columns used by Today/admin UI.
ALTER TABLE admin_messages ADD COLUMN subject TEXT;
ALTER TABLE admin_messages ADD COLUMN body TEXT;
ALTER TABLE admin_messages ADD COLUMN is_broadcast INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_messages ADD COLUMN recipient_id TEXT;
ALTER TABLE admin_messages ADD COLUMN sender_id TEXT;

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0003_today_vitals');
