#!/usr/bin/env bash
# Merge Flutter web release build into TanStack deploy assets (see docs/FLUTTER-WEB-CUTOVER.md).
#
# Copies flutter/build/web → dist/client/_flutter/ after both builds complete.
# Does not deploy. Safe to run repeatedly (rm -rf dest first).
#
# Usage (typically via package.json build:prod:flutter-web):
#   bun run build:prod
#   ./scripts/flutter-web-build-prod.sh
#   ./scripts/merge-flutter-web-assets.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_SRC="${REPO_ROOT}/flutter/build/web"
FLUTTER_DEST="${REPO_ROOT}/dist/client/_flutter"
DIST_CLIENT="${REPO_ROOT}/dist/client"

log() {
  printf '[merge-flutter-web-assets] %s\n' "$*"
}

fail() {
  printf '[merge-flutter-web-assets] ERROR: %s\n' "$*" >&2
  exit 1
}

[[ -d "${DIST_CLIENT}" ]] || fail "missing ${DIST_CLIENT} — run bun run build:prod first"
[[ -d "${FLUTTER_SRC}" && -f "${FLUTTER_SRC}/index.html" ]] \
  || fail "missing ${FLUTTER_SRC} — run ./scripts/flutter-web-build-prod.sh first"

rm -rf "${FLUTTER_DEST}"
mkdir -p "${FLUTTER_DEST}"
cp -R "${FLUTTER_SRC}/." "${FLUTTER_DEST}/"

log "OK: copied ${FLUTTER_SRC} → ${FLUTTER_DEST}"
