#!/usr/bin/env bash
# Verify App Store Connect API secrets in Doppler for TestFlight automation.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/doppler-purple-life.sh
source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"

missing=0
for secret in \
  "${PURPLE_ASC_KEY_ID_SECRET}" \
  "${PURPLE_ASC_ISSUER_ID_SECRET}" \
  "${PURPLE_ASC_API_KEY_SECRET}"; do
  if purple_doppler_get "${secret}" >/dev/null 2>&1; then
    printf '[asc-doppler] OK: %s\n' "${secret}"
  else
    printf '[asc-doppler] MISSING: %s\n' "${secret}"
    missing=1
  fi
done

if purple_doppler_get "${PURPLE_DEV_TEAM_SECRET}" >/dev/null 2>&1; then
  printf '[asc-doppler] OK: %s\n' "${PURPLE_DEV_TEAM_SECRET}"
else
  printf '[asc-doppler] MISSING: %s\n' "${PURPLE_DEV_TEAM_SECRET}"
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  printf '\nAdd secrets to Doppler %s/%s:\n' "${PURPLE_DOPPLER_PROJECT}" "${PURPLE_DOPPLER_CONFIG}"
  cat <<EOF
  doppler secrets set PURPLE_LIFE_APP_STORE_CONNECT_KEY_ID="YOUR_10_CHAR_KEY_ID" \
    PURPLE_LIFE_APP_STORE_CONNECT_ISSUER_ID="your-issuer-uuid" \
    --project ${PURPLE_DOPPLER_PROJECT} --config ${PURPLE_DOPPLER_CONFIG}

  doppler secrets set PURPLE_LIFE_APP_STORE_CONNECT_API_KEY="\$(cat /path/to/AuthKey_YOUR_KEY_ID.p8)" \
    --project ${PURPLE_DOPPLER_PROJECT} --config ${PURPLE_DOPPLER_CONFIG}

  doppler secrets set PURPLE_LIFE_DEVELOPMENT_TEAM="YOUR_TEAM_ID" \
    --project ${PURPLE_DOPPLER_PROJECT} --config ${PURPLE_DOPPLER_CONFIG}
EOF
  exit 1
fi

printf '\n[asc-doppler] All secrets present. Run: bun run ios:testflight\n'
