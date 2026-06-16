#!/usr/bin/env bash
# Prompt 1: dump schema from OLD, strip built-in role noise, apply to NEW.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$ROOT/lib.sh"

load_env
require_cmd psql
require_cmd supabase
require_url OLD_DB_URL "$OLD_DB_URL"
require_url NEW_DB_URL "$NEW_DB_URL"

SCHEMA_FILE="$ROOT/01-schema.sql"
RAW_FILE="$ROOT/01-schema.raw.sql"

echo "==> Dumping schema from OLD (public, auth, storage)..."
if supabase db dump \
  --db-url "$OLD_DB_URL" \
  --schema public,auth,storage \
  --schema-only \
  -f "$RAW_FILE" 2>/dev/null; then
  echo "    used supabase db dump"
else
  echo "    supabase db dump failed, falling back to pg_dump"
  require_cmd pg_dump
  pg_dump "$OLD_DB_URL" \
    --schema-only \
    --schema=public \
    --schema=auth \
    --schema=storage \
    --no-owner \
    --no-privileges \
    -f "$RAW_FILE"
fi

echo "==> Stripping built-in Supabase role/grant lines..."
python3 - "$RAW_FILE" "$SCHEMA_FILE" <<'PY'
import re, sys
src, dst = sys.argv[1], sys.argv[2]
skip_res = [
    re.compile(r"^CREATE ROLE ", re.I),
    re.compile(r"^ALTER ROLE ", re.I),
    re.compile(r"^DROP ROLE ", re.I),
    re.compile(r"^GRANT .+ TO (supabase_|authenticator|anon|authenticated|service_role)", re.I),
    re.compile(r"^REVOKE .+ FROM (supabase_|authenticator|anon|authenticated|service_role)", re.I),
]
out = []
with open(src, encoding="utf-8", errors="replace") as f:
    for line in f:
        if any(r.search(line) for r in skip_res):
            out.append("-- stripped: " + line.rstrip("\n") + "\n")
        else:
            out.append(line)
with open(dst, "w", encoding="utf-8") as f:
    f.writelines(out)
PY

echo "==> Applying schema to NEW..."
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"

echo "==> Table counts (public schema):"
old_count=$(psql "$OLD_DB_URL" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
new_count=$(psql "$NEW_DB_URL" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
echo "OLD public tables: $old_count"
echo "NEW public tables: $new_count"
schema_bytes=$(wc -c < "$SCHEMA_FILE" | tr -d ' ')
echo "01-schema.sql size: ${schema_bytes} bytes"

if [[ "$old_count" != "$new_count" ]]; then
  echo "WARN: public table counts differ (old=$old_count new=$new_count)" >&2
  exit 1
fi

echo "==> Schema migration complete."
