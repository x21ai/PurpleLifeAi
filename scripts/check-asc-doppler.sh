#!/usr/bin/env bash
# Verify App Store Connect API secrets in Doppler for TestFlight automation.
set -euo pipefail

DOPPLER_PROJECT="${DOPPLER_PROJECT:-purple-life}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"

missing=0
for secret in APP_STORE_CONNECT_KEY_ID APP_STORE_CONNECT_ISSUER_ID APP_STORE_CONNECT_API_KEY; do
  if ! doppler secrets get "$secret" --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" --plain >/dev/null 2>&1; then
    printf '[asc-doppler] MISSING: %s\n' "$secret"
    missing=1
  else
    printf '[asc-doppler] OK: %s\n' "$secret"
  fi
done

if doppler secrets get DEVELOPMENT_TEAM --project "$DOPPLER_PROJECT" --config "$DOPPLER_CONFIG" --plain >/dev/null 2>&1; then
  printf '[asc-doppler] OK: DEVELOPMENT_TEAM\n'
else
  printf '[asc-doppler] MISSING: DEVELOPMENT_TEAM\n'
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  printf '\nAdd secrets to Doppler %s/%s:\n' "$DOPPLER_PROJECT" "$DOPPLER_CONFIG"
  cat <<'EOF'
  doppler secrets set APP_STORE_CONNECT_KEY_ID="YOUR_10_CHAR_KEY_ID" \
    APP_STORE_CONNECT_ISSUER_ID="your-issuer-uuid" \
    --project purple-life --config prd

  doppler secrets set APP_STORE_CONNECT_API_KEY="$(cat /path/to/AuthKey_YOUR_KEY_ID.p8)" \
    --project purple-life --config prd
EOF
  exit 1
fi

printf '\n[asc-doppler] All secrets present. Run: bun run ios:testflight\n'
