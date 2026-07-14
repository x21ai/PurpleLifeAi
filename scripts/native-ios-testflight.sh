#!/usr/bin/env bash
# DEPRECATED — do not use unless emergency Capacitor WebView rollback.
# Primary TestFlight path: scripts/flutter-ios-testflight.sh (bun run ios:testflight).
#
# Archive Capacitor iOS shell and upload to TestFlight (App Store Connect).
# Prerequisites: full Xcode.app, Doppler x21/prd with PURPLE_LIFE_* ASC + team secrets.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/doppler-purple-life.sh
source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"
DOPPLER_PROJECT="${PURPLE_DOPPLER_PROJECT}"
DOPPLER_CONFIG="${PURPLE_DOPPLER_CONFIG}"
ARCHIVE_PATH="${ARCHIVE_PATH:-${REPO_ROOT}/build/ios/Purple.xcarchive}"
EXPORT_DIR="${EXPORT_DIR:-${REPO_ROOT}/build/ios/export}"
IOS_DIR="${REPO_ROOT}/ios/App"
PROJECT="${IOS_DIR}/App.xcodeproj"
SCHEME="App"

log() { printf '[ios-testflight] %s\n' "$*"; }
fail() { printf '[ios-testflight] ERROR: %s\n' "$*" >&2; exit 1; }

find_xcode_dev_dir() {
  local selected=""
  selected="$(xcode-select -p 2>/dev/null || true)"
  if [[ -n "${selected}" && "${selected}" != *"CommandLineTools"* ]]; then
    export DEVELOPER_DIR="${selected}"
    return 0
  fi
  for candidate in "/Applications/Xcode.app" "/Applications/Xcode-beta.app"; do
    if [[ -d "${candidate}/Contents/Developer" ]]; then
      export DEVELOPER_DIR="${candidate}/Contents/Developer"
      return 0
    fi
  done
  return 1
}

require_asc_secrets() {
  purple_require_asc_secrets \
    || fail "Add App Store Connect API key to Doppler ${DOPPLER_PROJECT}/${DOPPLER_CONFIG} (PURPLE_LIFE_APP_STORE_CONNECT_*)"
}

ASC_KEY_FILE=""
ASC_KEY_ID=""
ASC_ISSUER_ID=""
ASC_AUTH_ARGS=()

cleanup_asc_key() {
  if [[ -n "${ASC_KEY_FILE}" && -f "${ASC_KEY_FILE}" ]]; then
    rm -f "${ASC_KEY_FILE}"
  fi
}

prepare_asc_auth() {
  ASC_KEY_ID="$(purple_get_asc_key_id)" || fail "Missing ${PURPLE_ASC_KEY_ID_SECRET}"
  ASC_ISSUER_ID="$(purple_get_asc_issuer_id)" || fail "Missing ${PURPLE_ASC_ISSUER_ID_SECRET}"
  # macOS mktemp requires trailing Xs; extension is optional for xcodebuild auth key path.
  ASC_KEY_FILE="$(mktemp "${TMPDIR:-/tmp}/AuthKey_XXXXXX")"
  purple_get_asc_api_key >"${ASC_KEY_FILE}" || fail "Missing ${PURPLE_ASC_API_KEY_SECRET}"
  chmod 600 "${ASC_KEY_FILE}"
  trap cleanup_asc_key EXIT
}

xcodebuild_auth_args() {
  ASC_AUTH_ARGS=(
    -authenticationKeyPath "${ASC_KEY_FILE}"
    -authenticationKeyID "${ASC_KEY_ID}"
    -authenticationKeyIssuerID "${ASC_ISSUER_ID}"
  )
}

main() {
  log "DEPRECATED: Capacitor TestFlight upload. Use 'bun run ios:testflight' (Flutter) unless emergency rollback."
  find_xcode_dev_dir || fail "Xcode.app not found"
  require_asc_secrets
  prepare_asc_auth
  xcodebuild_auth_args

  cd "${REPO_ROOT}"
  log "Syncing Capacitor iOS project"
  bun run native:sync
  node "${REPO_ROOT}/scripts/check-native-shell.mjs"

  log "Writing local signing team from Doppler ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}"
  DOPPLER_PROJECT="${DOPPLER_PROJECT}" DOPPLER_CONFIG="${DOPPLER_CONFIG}" bun run ios:local-signing

  TEAM="$(grep DEVELOPMENT_TEAM ios/LocalSigning.xcconfig | awk '{print $3}')"
  [[ -n "${TEAM}" ]] || fail "Missing DEVELOPMENT_TEAM in ios/LocalSigning.xcconfig"

  mkdir -p "$(dirname "${ARCHIVE_PATH}")" "${EXPORT_DIR}"
  rm -rf "${ARCHIVE_PATH}" "${EXPORT_DIR:?}"/*

  log "Ensuring App Store Connect app record for org.purplelife.app"
  doppler run --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" -- node scripts/asc-ensure-app.mjs

  log "Archiving Release build (team ${TEAM})"
  xcodebuild \
    -project "${PROJECT}" \
    -scheme "${SCHEME}" \
    -configuration Release \
    -sdk iphoneos \
    -archivePath "${ARCHIVE_PATH}" \
    DEVELOPMENT_TEAM="${TEAM}" \
    CODE_SIGN_STYLE=Automatic \
    -allowProvisioningUpdates \
    "${ASC_AUTH_ARGS[@]}" \
    archive

  log "Exporting and uploading to App Store Connect / TestFlight"
  xcodebuild \
    -exportArchive \
    -archivePath "${ARCHIVE_PATH}" \
    -exportPath "${EXPORT_DIR}" \
    -exportOptionsPlist "${REPO_ROOT}/ios/ExportOptions.plist" \
    DEVELOPMENT_TEAM="${TEAM}" \
    -allowProvisioningUpdates \
    "${ASC_AUTH_ARGS[@]}"

  log "Upload complete. Open App Store Connect → TestFlight to add internal/external testers."
  log "Build processing usually takes 5–15 minutes before it is installable."
}

main "$@"
