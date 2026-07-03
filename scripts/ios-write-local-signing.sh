#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${REPO_ROOT}/ios/LocalSigning.xcconfig"
DOPPLER_PROJECT="${DOPPLER_PROJECT:-cursor-cloudflare}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd_cloudlfare}"
resolve_team() {
  if [[ -n "${DEVELOPMENT_TEAM:-}" ]]; then printf "%s" "${DEVELOPMENT_TEAM}"; return 0; fi
  for key in DEVELOPMENT_TEAM APPLE_TEAM_ID APPLE_DEVELOPMENT_TEAM; do
    val="$(doppler secrets get "${key}" --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain 2>/dev/null || true)"
    if [[ -n "${val}" ]]; then printf "%s" "${val}"; return 0; fi
  done
  return 1
}
TEAM=""
if ! TEAM="$(resolve_team)"; then
  echo "Missing Apple Team ID. Add Doppler secret DEVELOPMENT_TEAM in ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}," >&2
  exit 1
fi
printf "// Generated — do not commit\nDEVELOPMENT_TEAM = %s\n" "${TEAM}" > "${OUT}"
echo "Wrote ${OUT}"
