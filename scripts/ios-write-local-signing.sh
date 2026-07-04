#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${REPO_ROOT}/ios/LocalSigning.xcconfig"
DOPPLER_PROJECT="${DOPPLER_PROJECT:-purple-life}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"
resolve_secret() {
  local key="$1"
  local projects=("${DOPPLER_PROJECT}" "purple-life" "cursor-cloudflare")
  local configs=("${DOPPLER_CONFIG}" "prd" "dev" "prd_cloudlfare")
  local project="" config="" val=""
  for project in "${projects[@]}"; do
    for config in "${configs[@]}"; do
      val="$(doppler secrets get "${key}" --project "${project}" --config "${config}" --plain 2>/dev/null || true)"
      if [[ -n "${val}" ]]; then printf "%s" "${val}"; return 0; fi
    done
  done
  return 1
}
TEAM=""
if [[ -n "${DEVELOPMENT_TEAM:-}" ]]; then
  TEAM="${DEVELOPMENT_TEAM}"
elif ! TEAM="$(resolve_secret DEVELOPMENT_TEAM)"; then
  for key in APPLE_TEAM_ID APPLE_DEVELOPMENT_TEAM; do
    if TEAM="$(resolve_secret "${key}")"; then break; fi
  done
fi
if [[ -z "${TEAM}" ]]; then
  echo "Missing Apple Team ID. Add Doppler secret DEVELOPMENT_TEAM in ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}," >&2
  exit 1
fi
LUCIQ_TOKEN=""
if [[ -n "${LUCIQ_APP_TOKEN:-}" ]]; then
  LUCIQ_TOKEN="${LUCIQ_APP_TOKEN}"
elif LUCIQ_TOKEN="$(resolve_secret LUCIQ_APP_TOKEN 2>/dev/null || true)"; then
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
