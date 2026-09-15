-- Today/Vitals D1 gaps: health_narratives (matches app types).
-- Prod zone D1 may already have this table and typed admin_messages; this file is
-- idempotent for health_narratives only. Skip admin_messages ALTER on prod when
-- columns already exist (see docs/CLOUDFLARE-MIGRATION.md).

CREATE TABLE IF NOT EXISTS health_narratives (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  narrative TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS health_narratives_user_idx ON health_narratives (user_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0003_today_vitals');
