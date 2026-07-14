#!/usr/bin/env bash
# Run a command with Purple Life Doppler secrets (x21/prd).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/doppler-purple-life.sh
source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"
exec doppler run \
  --project "${PURPLE_DOPPLER_PROJECT}" \
  --config "${PURPLE_DOPPLER_CONFIG}" \
  -- "$@"
