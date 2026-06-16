#!/usr/bin/env bash
# Validate purple-migration/.env before running dump/import scripts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$ROOT/lib.sh"

load_env
require_cmd psql
require_cmd supabase
require_url OLD_DB_URL "$OLD_DB_URL"
require_url NEW_DB_URL "$NEW_DB_URL"
require_url NEW_SUPABASE_URL "$NEW_SUPABASE_URL"
require_url NEW_SERVICE_ROLE_KEY "$NEW_SERVICE_ROLE_KEY"

auth_json="$ROOT/03-auth/auth-users.json"
storage_json="$ROOT/04-storage/storage-manifest.json"
if grep -q '"note"' "$auth_json" 2>/dev/null; then
  echo "WARN: 03-auth/auth-users.json is still a placeholder (export from /admin/migration-export)" >&2
fi
if grep -q '"note"' "$storage_json" 2>/dev/null; then
  echo "WARN: 04-storage/storage-manifest.json is still a placeholder (export from /admin/migration-export)" >&2
fi

echo "OK: .env looks ready (Session pooler URLs, no CHANGE_ME placeholders)."
