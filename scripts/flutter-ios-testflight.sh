#!/usr/bin/env bash
# Archive Purple Flutter iOS app and upload to TestFlight (App Store Connect).
# Primary TestFlight path (bun run ios:testflight).
# Capacitor emergency rollback: scripts/native-ios-testflight.sh (ios:testflight:capacitor).
#
# Prerequisites: full Xcode.app, Doppler purple-life/prd (DEVELOPMENT_TEAM, ASC API key,
# LUCIQ_APP_TOKEN), cursor-cloudflare/prd_cloudlfare (VITE_SUPABASE_PUBLISHABLE_KEY).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
DOPPLER_PROJECT="${DOPPLER_PROJECT:-purple-life}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"
FLUTTER_DOPPLER_PROJECT="${FLUTTER_DOPPLER_PROJECT:-cursor-cloudflare}"
FLUTTER_DOPPLER_CONFIG="${FLUTTER_DOPPLER_CONFIG:-prd_cloudlfare}"
ARCHIVE_PATH="${ARCHIVE_PATH:-${FLUTTER_DIR}/build/ios/archive/Runner.xcarchive}"
EXPORT_DIR="${EXPORT_DIR:-${REPO_ROOT}/build/flutter-ios/export}"
EXPORT_OPTIONS="${FLUTTER_DIR}/ios/ExportOptions.plist"
EXPORT_OPTIONS_LOCAL="${FLUTTER_DIR}/ios/ExportOptions-export.plist"

log() { printf '[flutter-ios-testflight] %s\n' "$*"; }
fail() { printf '[flutter-ios-testflight] ERROR: %s\n' "$*" >&2; exit 1; }

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
  doppler secrets get APP_STORE_CONNECT_KEY_ID APP_STORE_CONNECT_ISSUER_ID APP_STORE_CONNECT_API_KEY \
    --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain >/dev/null 2>&1 \
    || fail "Add App Store Connect API key to Doppler ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}"
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
  ASC_KEY_ID="$(doppler secrets get APP_STORE_CONNECT_KEY_ID --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain)"
  ASC_ISSUER_ID="$(doppler secrets get APP_STORE_CONNECT_ISSUER_ID --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain)"
  ASC_KEY_FILE="$(mktemp "${TMPDIR:-/tmp}/AuthKey_XXXXXX")"
  doppler secrets get APP_STORE_CONNECT_API_KEY --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain >"${ASC_KEY_FILE}"
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

read_build_number() {
  local version_line build_number
  version_line="$(grep '^version:' "${FLUTTER_DIR}/pubspec.yaml" | head -1 | awk '{print $2}')"
  build_number="${version_line#*+}"
  if [[ -z "${build_number}" || "${build_number}" == "${version_line}" ]]; then
    fail "pubspec.yaml version must include +buildNumber (e.g. 1.0.0+10)"
  fi
  printf '%s' "${build_number}"
}

main() {
  find_xcode_dev_dir || fail "Xcode.app not found"
  require_asc_secrets
  prepare_asc_auth
  xcodebuild_auth_args

  cd "${REPO_ROOT}"

  log "Running Flutter analyze + test"
  cd "${FLUTTER_DIR}"
  flutter analyze lib/
  flutter test
  cd "${REPO_ROOT}"

  bash "${REPO_ROOT}/scripts/check-asc-doppler.sh"

  log "Writing local signing (Capacitor + Flutter LocalSigning.xcconfig)"
  DOPPLER_PROJECT="${DOPPLER_PROJECT}" DOPPLER_CONFIG="${DOPPLER_CONFIG}" bun run ios:local-signing

  TEAM="$(grep DEVELOPMENT_TEAM ios/LocalSigning.xcconfig | awk '{print $3}')"
  [[ -n "${TEAM}" ]] || fail "Missing DEVELOPMENT_TEAM in ios/LocalSigning.xcconfig"

  BUILD_NUMBER="$(read_build_number)"
  log "Build number from pubspec.yaml: ${BUILD_NUMBER} (must exceed latest ASC Capacitor build)"

  # shellcheck source=app-build-env.sh
  source "${REPO_ROOT}/scripts/app-build-env.sh"
  log "Build date stamp: ${BUILD_DATE}"

  log "Ensuring App Store Connect app record for org.purplelife.app"
  doppler run --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" -- \
    node scripts/asc-ensure-app.mjs

  # shellcheck source=flutter-build-dirs.sh
  source "${REPO_ROOT}/scripts/flutter-build-dirs.sh"
  prepare_flutter_ios_build_dir
  log "iOS build output: ${FLUTTER_IOS_BUILD_LINK} (symlinked at flutter/build/ios)"

  export PATH="${FLUTTER_DIR}/ios/scripts:${PATH}"

  mkdir -p "$(dirname "${ARCHIVE_PATH}")" "${EXPORT_DIR}"
  rm -rf "${ARCHIVE_PATH}" "${EXPORT_DIR:?}"/*

  log "Preparing Flutter iOS deps (pub get, SPM off)"
  cd "${FLUTTER_DIR}"
  flutter pub get
  flutter config --no-enable-swift-package-manager >/dev/null 2>&1 || true

  log "Compiling Flutter Release (no codesign, build ${BUILD_NUMBER})"
  LUCIQ_TOKEN=""
  if LUCIQ_TOKEN="$(doppler secrets get LUCIQ_APP_TOKEN --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" --plain 2>/dev/null)"; then
    log "Luciq SDK token loaded from Doppler (${DOPPLER_PROJECT}/${DOPPLER_CONFIG})"
  else
    log "WARN: LUCIQ_APP_TOKEN missing; TestFlight build will ship without Luciq dart-define"
  fi
  doppler run --project "${FLUTTER_DOPPLER_PROJECT}" --config "${FLUTTER_DOPPLER_CONFIG}" -- bash -c '
    flutter build ios --release --no-codesign \
      --build-number="'"${BUILD_NUMBER}"'" \
      --build-name=1.0.0 \
      --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
      --dart-define=LUCIQ_APP_TOKEN="'"${LUCIQ_TOKEN}"'" \
      --dart-define=BUILD_DATE="'"${BUILD_DATE}"'"
  '

  WORKSPACE="${FLUTTER_DIR}/ios/Runner.xcworkspace"
  DERIVED_DATA="${DERIVED_DATA:-/tmp/purpledrw-flutter-dd}"
  rm -rf "${DERIVED_DATA}"
  log "Archiving signed Release build (Runner.xcworkspace, derivedData ${DERIVED_DATA})"
  xcodebuild \
    -workspace "${WORKSPACE}" \
    -scheme Runner \
    -configuration Release \
    -sdk iphoneos \
    -archivePath "${ARCHIVE_PATH}" \
    -derivedDataPath "${DERIVED_DATA}" \
    DEVELOPMENT_TEAM="${TEAM}" \
    CODE_SIGN_STYLE=Automatic \
    FLUTTER_BUILD_NUMBER="${BUILD_NUMBER}" \
    FLUTTER_BUILD_NAME="1.0.0" \
    -allowProvisioningUpdates \
    "${ASC_AUTH_ARGS[@]}" \
    archive

  [[ -d "${ARCHIVE_PATH}" ]] || fail "Archive missing at ${ARCHIVE_PATH}"

  log "Uploading to App Store Connect / TestFlight (team ${TEAM})"
  xcodebuild \
    -exportArchive \
    -archivePath "${ARCHIVE_PATH}" \
    -exportPath "${EXPORT_DIR}" \
    -exportOptionsPlist "${EXPORT_OPTIONS}" \
    DEVELOPMENT_TEAM="${TEAM}" \
    -allowProvisioningUpdates \
    "${ASC_AUTH_ARGS[@]}"

  log "Upload complete. Open App Store Connect → TestFlight → Purple for Life."
  log "Build processing usually takes 5–15 minutes before it is installable."
  log "This replaces the Capacitor WebView binary when testers install build ${BUILD_NUMBER}."

  log "Querying App Store Connect for latest builds..."
  cd "${REPO_ROOT}"
  doppler run --project "${DOPPLER_PROJECT}" --config "${DOPPLER_CONFIG}" -- \
    node scripts/asc-list-builds.mjs
}

main "$@"
