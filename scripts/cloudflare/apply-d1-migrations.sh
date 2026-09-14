#!/usr/bin/env bash
# Apply D1 migrations to local or remote purplelifeai database.
# Usage:
#   ./scripts/cloudflare/apply-d1-migrations.sh          # local
#   ./scripts/cloudflare/apply-d1-migrations.sh --remote # POS Ai account remote D1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE=""
if [[ "${1:-}" == "--remote" ]]; then
  REMOTE="--remote"
fi

DB="purplelifeai"
for f in "$ROOT/cloudflare/migrations/"*.sql; do
  echo "Applying $(basename "$f")..."
  bunx wrangler d1 execute "$DB" $REMOTE --file="$f"
done

echo "D1 migrations applied."
