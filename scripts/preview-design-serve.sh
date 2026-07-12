#!/usr/bin/env bash
# Serve design previews from docs/previews/ on :8766 (separate from Flutter :8765).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW_DIR="$ROOT/docs/previews"
PID_FILE="$ROOT/.preview-design-serve.pid"
PORT="${PREVIEW_DESIGN_PORT:-8766}"
HOST="${PREVIEW_DESIGN_HOST:-0.0.0.0}"
MERGED_URL="http://127.0.0.1:${PORT}/personalized-dashboard-preview.html?layout=merged"

log() {
  printf '[preview-design-serve] %s\n' "$*"
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
  return 1
}

stop_listener() {
  local pids
  pids="$(listener_pids)"
  if [[ -n "${pids}" ]]; then
    log "Stopping listener on port ${PORT} (pids: ${pids})"
    kill ${pids} 2>/dev/null || true
    sleep 0.5
  fi
  rm -f "${PID_FILE}"
}

if [[ "${1:-}" == "--stop" ]]; then
  stop_listener
  log "Stopped preview server on :${PORT}"
  exit 0
fi

if [[ "${1:-}" == "--status" ]]; then
  if already_serving; then
    log "Port ${PORT} owned by preview-design-serve pid $(cat "${PID_FILE}")"
    log "Merged preview: ${MERGED_URL}"
    exit 0
  fi
  pids="$(listener_pids)"
  if [[ -n "${pids}" ]]; then
    log "Port ${PORT} in use by pid(s): ${pids} (not managed by ${PID_FILE})"
    exit 0
  fi
  log "Port ${PORT} is free"
  exit 0
fi

if already_serving; then
  log "Already serving ${PREVIEW_DIR} at http://127.0.0.1:${PORT} (pid $(cat "${PID_FILE}"))"
  log "Merged preview: ${MERGED_URL}"
  exit 0
fi

stop_listener

log "Serving ${PREVIEW_DIR} at http://127.0.0.1:${PORT} and http://localhost:${PORT}"
log "Merged (Lovable Today mock): ${MERGED_URL}"
log "Use a persistent background shell; do not daemonize with nohup (agent shells reap children)."

cd "${PREVIEW_DIR}"
printf '%s\n' "$$" >"${PID_FILE}"
trap 'rm -f "${PID_FILE}"' EXIT
exec python3 -m http.server "${PORT}" --bind "${HOST}"
