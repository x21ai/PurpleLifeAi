#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${REPO_ROOT}/ios/LocalSigning.xcconfig"
FLUTTER_OUT="${REPO_ROOT}/flutter/ios/Flutter/LocalSigning.xcconfig"
# shellcheck source=lib/doppler-purple-life.sh
source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"
DOPPLER_PROJECT="${PURPLE_DOPPLER_PROJECT}"
DOPPLER_CONFIG="${PURPLE_DOPPLER_CONFIG}"

TEAM=""
if [[ -n "${DEVELOPMENT_TEAM:-}" ]]; then
  TEAM="${DEVELOPMENT_TEAM}"
elif ! TEAM="$(purple_get_dev_team)"; then
  for key in APPLE_TEAM_ID APPLE_DEVELOPMENT_TEAM; do
    if TEAM="$(purple_resolve_secret "${key}" "${key}" 2>/dev/null || true)"; then break; fi
  done
fi
if [[ -z "${TEAM}" ]]; then
  echo "Missing Apple Team ID. Add Doppler secret ${PURPLE_DEV_TEAM_SECRET} in ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}," >&2
  exit 1
fi
LUCIQ_TOKEN=""
if [[ -n "${LUCIQ_APP_TOKEN:-}" ]]; then
  LUCIQ_TOKEN="${LUCIQ_APP_TOKEN}"
elif LUCIQ_TOKEN="$(purple_get_luciq_app_token 2>/dev/null || true)"; then
  :
fi
{
  printf "// Generated — do not commit\n"
  printf "DEVELOPMENT_TEAM = %s\n" "${TEAM}"
  if [[ -n "${LUCIQ_TOKEN}" ]]; then
    printf "LUCIQ_APP_TOKEN = %s\n" "${LUCIQ_TOKEN}"
  fi
} > "${OUT}"
echo "Wrote ${OUT}"
mkdir -p "$(dirname "${FLUTTER_OUT}")"
cp "${OUT}" "${FLUTTER_OUT}"
echo "Wrote ${FLUTTER_OUT}"
