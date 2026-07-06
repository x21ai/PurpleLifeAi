#!/usr/bin/env bash
# Serve design previews from docs/previews/ on :8766 (separate from Flutter :8765).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW_DIR="$ROOT/docs/previews"
PID_FILE="$ROOT/.preview-design-serve.pid"
PORT=8766

if [[ "${1:-}" == "--stop" ]]; then
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "Stopped preview server on :$PORT"
  fi
  exit 0
fi

if lsof -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Preview server already listening on http://127.0.0.1:$PORT"
  echo "  → http://127.0.0.1:$PORT/personalized-dashboard-preview.html"
  exit 0
fi

cd "$PREVIEW_DIR"
python3 -m http.server "$PORT" --bind 127.0.0.1 &
echo $! > "$PID_FILE"
sleep 0.5
echo "Preview server started on http://127.0.0.1:$PORT"
echo "  → http://127.0.0.1:$PORT/personalized-dashboard-preview.html"
