-- Additive auth tables for password reset and refresh.
-- CREATE IF NOT EXISTS only. Does not rewrite or delete existing rows.
-- auth_refresh_tokens is also created in 0001_auth.sql.

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_idx ON auth_refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS auth_password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS auth_password_resets_user_idx ON auth_password_resets (user_id);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0004_auth_sessions');
