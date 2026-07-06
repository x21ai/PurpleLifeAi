#!/usr/bin/env bash
# Serve Flutter web release build at http://localhost:8765 (browser address bar only).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
WEB_DIR="${FLUTTER_DIR}/build/web"

# shellcheck source=flutter-build-dirs.sh
source "${REPO_ROOT}/scripts/flutter-build-dirs.sh"
ensure_flutter_build_local
PORT="${FLUTTER_WEB_PORT:-8765}"
# Bind all interfaces so both 127.0.0.1 and [::1] work in browsers/curl.
HOST="${FLUTTER_WEB_HOST:-0.0.0.0}"

PID_FILE="${REPO_ROOT}/.flutter-web-serve.pid"
LOCK_FILE="${REPO_ROOT}/.flutter-web-serve.lock"

log() {
  printf '[flutter-web-serve] %s\n' "$*"
}

fail() {
  printf '[flutter-web-serve] ERROR: %s\n' "$*" >&2
  exit 1
}

listener_pids() {
  lsof -ti tcp:"${PORT}" -sTCP:LISTEN 2>/dev/null || true
}

already_serving() {
  local pids owner
  pids="$(listener_pids)"
  [[ -n "${pids}" ]] || return 1
  if [[ -f "${PID_FILE}" ]]; then
    owner="$(cat "${PID_FILE}" 2>/dev/null || true)"
    if [[ -n "${owner}" ]] && kill -0 "${owner}" 2>/dev/null && [[ "${pids}" == "${owner}" ]]; then
      return 0
    fi
  fi
  # Stale pid file or foreign listener; reclaim on next start.
  return 1
}

write_pid_file() {
  printf '%s\n' "$1" >"${PID_FILE}"
}

stop_listener() {
  local pids
  pids="$(listener_pids)"
  if [[ -n "${pids}" ]]; then
    log "Stopping existing listener on port ${PORT} (pids: ${pids})"
    kill ${pids} 2>/dev/null || true
    sleep 0.5
  fi
  rm -f "${PID_FILE}" "${LOCK_FILE}"
}

acquire_serve_lock() {
  if [[ -f "${LOCK_FILE}" ]]; then
    local lock_pid
    lock_pid="$(cat "${LOCK_FILE}" 2>/dev/null || true)"
    if [[ -n "${lock_pid}" ]] && kill -0 "${lock_pid}" 2>/dev/null; then
      fail "Another flutter-web-serve build/start is running (pid ${lock_pid}). Wait for it or remove ${LOCK_FILE} if stale."
    fi
    rm -f "${LOCK_FILE}"
  fi
  printf '%s\n' "$$" >"${LOCK_FILE}"
}

release_serve_lock() {
  rm -f "${LOCK_FILE}"
}

build_web() {
  log "Building Flutter web (release) with Doppler dart-defines"
  (
    cd "${FLUTTER_DIR}"
    doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
      bash -c 'flutter build web --release --base-href="/" --no-tree-shake-icons \
        --pwa-strategy=none \
        --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
        --dart-define=SITE_URL="http://127.0.0.1:'"${PORT}"'"'
  )
  for asset in sqlite3.wasm drift_worker.js; do
    if [[ -f "${FLUTTER_DIR}/web/${asset}" ]]; then
      cp "${FLUTTER_DIR}/web/${asset}" "${WEB_DIR}/${asset}"
      log "Copied Drift web asset ${asset}"
    else
      fail "Missing ${FLUTTER_DIR}/web/${asset} (required for Drift on web)"
    fi
  done
}

if [[ "${1:-}" == "--status" ]]; then
  if already_serving; then
    log "Port ${PORT} is owned by flutter-web-serve pid $(cat "${PID_FILE}")"
    exit 0
  fi
  pids="$(listener_pids)"
  if [[ -n "${pids}" ]]; then
    log "Port ${PORT} is in use by pid(s): ${pids} (not managed by ${PID_FILE})"
    exit 0
  fi
  log "Port ${PORT} is free"
  exit 0
fi

if [[ "${1:-}" != "--rebuild" && "${1:-}" != "--dev" ]] && already_serving; then
  log "Already serving ${WEB_DIR} at http://127.0.0.1:${PORT} (pid $(cat "${PID_FILE}"))"
  log "Use --rebuild to replace artifacts and restart, or --status to inspect the listener"
  exit 0
fi

if [[ "${1:-}" == "--dev" ]]; then
  acquire_serve_lock
  trap release_serve_lock EXIT
  stop_listener
  log "Starting flutter run web-server on port ${PORT} (hot reload; Ctrl+C to stop)"
  cd "${FLUTTER_DIR}"
  write_pid_file "$$"
  exec doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
    bash -c 'flutter run -d web-server --web-port="'"${PORT}"'" --web-hostname=0.0.0.0 \
      --pwa-strategy=none \
      --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
      --dart-define=SITE_URL="http://127.0.0.1:'"${PORT}"'"'
fi

acquire_serve_lock
trap release_serve_lock EXIT

cd "${FLUTTER_DIR}"
flutter pub get

if [[ "${1:-}" == "--rebuild" ]] || ! web_build_artifacts_complete "${WEB_DIR}"; then
  build_web
fi

web_build_artifacts_complete "${WEB_DIR}" || fail "Web build incomplete in ${WEB_DIR}; run with --rebuild"

stop_listener

log "Serving ${WEB_DIR} at http://127.0.0.1:${PORT} and http://localhost:${PORT}"
log "Use http://127.0.0.1:${PORT} or http://localhost:${PORT} only (not file:// or repo paths)"
log "Hard-refresh after --rebuild; stale service workers can show a blank canvas"
log "Stable start: ./scripts/flutter-web-serve.sh  |  rebuild: ./scripts/flutter-web-serve.sh --rebuild"
cd "${WEB_DIR}"
# Foreground serve (default): agent shells reap detached children, so a
# nohup/disown daemon dies seconds after the script exits. Run python in the
# foreground and keep the owning shell alive (Cursor background shell or tmux).
write_pid_file "$$"
release_serve_lock
trap 'rm -f "${PID_FILE}"' EXIT
exec python3 "${REPO_ROOT}/scripts/flutter-web-spa-serve.py" "${PORT}" "${WEB_DIR}" --bind "${HOST}"
