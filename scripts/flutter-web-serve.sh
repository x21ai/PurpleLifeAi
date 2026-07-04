#!/usr/bin/env bash
# Serve Flutter web release build at http://localhost:8765 (browser address bar only).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
WEB_DIR="${FLUTTER_DIR}/build/web"
PORT="${FLUTTER_WEB_PORT:-8765}"
# Bind IPv6 :: so http://localhost works (macOS resolves localhost to ::1 first).
HOST="${FLUTTER_WEB_HOST:-::}"

log() {
  printf '[flutter-web-serve] %s\n' "$*"
}

fail() {
  printf '[flutter-web-serve] ERROR: %s\n' "$*" >&2
  exit 1
}

stop_listener() {
  local pids
  pids="$(lsof -ti tcp:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    log "Stopping existing listener on port ${PORT}"
    kill ${pids} 2>/dev/null || true
    sleep 0.5
  fi
}

build_web() {
  log "Building Flutter web (release) with Doppler dart-defines"
  (
    cd "${FLUTTER_DIR}"
    doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
      flutter build web --release --base-href="/" \
      --dart-define=SUPABASE_ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}"
  )
}

if [[ "${1:-}" == "--dev" ]]; then
  stop_listener
  log "Starting flutter run web-server on port ${PORT} (hot reload; Ctrl+C to stop)"
  cd "${FLUTTER_DIR}"
  exec doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
    flutter run -d web-server --web-port="${PORT}" --web-hostname=0.0.0.0 \
    --dart-define=SUPABASE_ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}"
fi

cd "${FLUTTER_DIR}"
flutter pub get

if [[ ! -f "${WEB_DIR}/index.html" ]]; then
  build_web
fi

if [[ "${1:-}" == "--rebuild" ]]; then
  build_web
fi

for f in index.html main.dart.js flutter_bootstrap.js; do
  [[ -f "${WEB_DIR}/${f}" ]] || fail "Missing ${WEB_DIR}/${f}; run with --rebuild"
done

stop_listener

log "Serving ${WEB_DIR} at http://127.0.0.1:${PORT} and http://localhost:${PORT}"
log "Use http://localhost:${PORT} or http://127.0.0.1:${PORT} only (not file:// or repo paths)"
cd "${WEB_DIR}"
exec python3 -m http.server "${PORT}" --bind "${HOST}"
