#!/usr/bin/env bash
# Production Flutter web build for Worker cutover (see docs/FLUTTER-WEB-CUTOVER.md).
#
# Output: flutter/build/web (release, Supabase anon key baked via dart-define).
# Does not deploy. Does not merge into dist/client; run the merge step from the
# runbook after bun run build:prod when implementing cutover.
#
# Usage:
#   ./scripts/flutter-web-build-prod.sh
#   ./scripts/flutter-web-build-prod.sh --verify-only   # skip build if artifacts exist
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
WEB_DIR="${FLUTTER_DIR}/build/web"

# shellcheck source=flutter-build-dirs.sh
source "${REPO_ROOT}/scripts/flutter-build-dirs.sh"

log() {
  printf '[flutter-web-build-prod] %s\n' "$*"
}

fail() {
  printf '[flutter-web-build-prod] ERROR: %s\n' "$*" >&2
  exit 1
}

copy_drift_web_assets() {
  for asset in sqlite3.wasm drift_worker.js; do
    if [[ -f "${FLUTTER_DIR}/web/${asset}" ]]; then
      cp "${FLUTTER_DIR}/web/${asset}" "${WEB_DIR}/${asset}"
      log "Copied Drift web asset ${asset}"
    else
      fail "Missing ${FLUTTER_DIR}/web/${asset} (required for Drift on web)"
    fi
  done
}

build_flutter_web_release() {
  log "Building Flutter web (release) with Doppler dart-defines"
  # shellcheck source=app-build-env.sh
  source "${REPO_ROOT}/scripts/app-build-env.sh"
  (
    cd "${FLUTTER_DIR}"
    doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
      bash -c 'flutter build web --release --base-href="/" --no-tree-shake-icons \
        --pwa-strategy=none \
        --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
        --dart-define=SITE_URL="https://www.purplelife.org" \
        --dart-define=WORKER_API_BASE_URL="https://www.purplelife.org/api" \
        --dart-define=BUILD_DATE="'"${BUILD_DATE}"'"'
  )
  copy_drift_web_assets
}

ensure_flutter_build_local
cd "${FLUTTER_DIR}"
flutter pub get

if [[ "${1:-}" == "--verify-only" ]]; then
  web_build_artifacts_complete "${WEB_DIR}" || fail "Web build incomplete in ${WEB_DIR}"
  for asset in sqlite3.wasm drift_worker.js; do
    [[ -f "${WEB_DIR}/${asset}" ]] || fail "Missing ${WEB_DIR}/${asset}"
  done
  log "OK: ${WEB_DIR} has release artifacts + Drift wasm"
  exit 0
fi

build_flutter_web_release
web_build_artifacts_complete "${WEB_DIR}" || fail "Web build incomplete in ${WEB_DIR}"
log "Done. Artifacts: ${WEB_DIR}"
log "Next (cutover, owner approval): merge into dist/client per docs/FLUTTER-WEB-CUTOVER.md"
