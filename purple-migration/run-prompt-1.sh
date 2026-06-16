#!/usr/bin/env bash
# Prompt 1 + finish Prompt 0 exports: schema dump/apply, then CSV export from OLD.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/check-env.sh"
"$ROOT/dump-and-apply-schema.sh"
"$ROOT/export-csvs.sh"

echo ""
echo "Prompt 1 complete. Next: Prompt 2 (auth import) per .lovable/plan.md"
