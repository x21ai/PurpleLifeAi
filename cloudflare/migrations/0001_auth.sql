-- D1 auth tables (replaces Supabase auth.users + auth.identities)
-- Apply: wrangler d1 execute purplelifeai --remote --file=cloudflare/migrations/0001_auth.sql

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  email_confirmed_at TEXT,
  phone_confirmed_at TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_sign_in_at TEXT,
  user_metadata TEXT NOT NULL DEFAULT '{}',
  app_metadata TEXT NOT NULL DEFAULT '{}',
  banned_until TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS auth_users_email_idx ON auth_users (email);

CREATE TABLE IF NOT EXISTS auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  identity_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS auth_identities_user_idx ON auth_identities (user_id);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_idx ON auth_refresh_tokens (user_id);

-- Migration bookkeeping
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0001_auth');
