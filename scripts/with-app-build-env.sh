#!/usr/bin/env bash
# Run a command with app build env vars (version, build number, BUILD_DATE).
set -euo pipefail
# shellcheck source=app-build-env.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/app-build-env.sh"
exec "$@"
