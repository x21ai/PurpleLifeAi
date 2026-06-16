#!/usr/bin/env bash
# Shared helpers for purple-migration scripts.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PATH="/opt/homebrew/opt/libpq/bin:${PATH:-}"

load_env() {
  if [[ ! -f "$ROOT/.env" ]]; then
    echo "Missing $ROOT/.env - copy from .env.example and fill in values." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
}

require_url() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "$name is empty in .env" >&2
    exit 1
  fi
  if [[ "$value" == *"CHANGE_ME"* ]] || [[ "$value" == *"<"* ]]; then
    echo "$name still has placeholder values in .env" >&2
    exit 1
  fi
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd (brew install libpq for psql)" >&2
    exit 1
  fi
}
