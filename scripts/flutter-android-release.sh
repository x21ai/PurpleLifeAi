#!/usr/bin/env bash
# Build Purple Flutter Android release artifacts (AAB + optional APK).
#
# Does not upload to Google Play. Release signing requires an owner upload keystore.
# See docs/STEP8-FLUTTER-REBUILD.md and docs/templates/play-store-automation-plan.md.
#
# Usage:
#   ./scripts/flutter-android-release.sh           # appbundle (Play upload target)
#   ./scripts/flutter-android-release.sh --apk     # also build apk for sideload QA
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
FLUTTER_DOPPLER_PROJECT="${FLUTTER_DOPPLER_PROJECT:-x21}"
FLUTTER_DOPPLER_CONFIG="${FLUTTER_DOPPLER_CONFIG:-prd_cloudflare}"
BUILD_APK=false

log() { printf '[flutter-android-release] %s\n' "$*"; }
fail() { printf '[flutter-android-release] ERROR: %s\n' "$*" >&2; exit 1; }

for arg in "$@"; do
  case "${arg}" in
    --apk) BUILD_APK=true ;;
    -h|--help)
      sed -n '1,12p' "$0"
      exit 0
      ;;
    *) fail "Unknown argument: ${arg}" ;;
  esac
done

# shellcheck source=app-build-env.sh
source "${REPO_ROOT}/scripts/app-build-env.sh"

cd "${FLUTTER_DIR}"
flutter pub get

log "Running Flutter analyze + test"
flutter analyze lib/
flutter test

KEY_PROPS="${FLUTTER_DIR}/android/key.properties"
has_upload_key=false
if [[ -n "${PURPLE_UPLOAD_STORE_FILE:-}" && -n "${PURPLE_UPLOAD_STORE_PASSWORD:-}" && -n "${PURPLE_UPLOAD_KEY_ALIAS:-}" && -n "${PURPLE_UPLOAD_KEY_PASSWORD:-}" ]]; then
  if [[ ! -f "${PURPLE_UPLOAD_STORE_FILE}" ]]; then
    fail "PURPLE_UPLOAD_STORE_FILE is set but the keystore file is missing. Do not commit the keystore."
  fi
  has_upload_key=true
elif [[ -f "${KEY_PROPS}" ]]; then
  missing=""
  for key in storeFile storePassword keyAlias keyPassword; do
    if ! grep -Eq "^[[:space:]]*${key}[[:space:]]*=" "${KEY_PROPS}"; then
      missing="${missing} ${key}"
    fi
  done
  if [[ -n "${missing}" ]]; then
    fail "flutter/android/key.properties is missing:${missing}. Do not commit that file or the keystore."
  fi
  has_upload_key=true
fi

if [[ "${has_upload_key}" != "true" ]]; then
  fail "Play upload signing needs an owner keystore and Play Console access. Set PURPLE_UPLOAD_STORE_FILE, PURPLE_UPLOAD_STORE_PASSWORD, PURPLE_UPLOAD_KEY_ALIAS, and PURPLE_UPLOAD_KEY_PASSWORD, or create gitignored flutter/android/key.properties. This script will not sign a Play bundle with the debug key."
fi

log "Building appbundle (release) with the upload keystore and Doppler dart-defines"
doppler run --project "${FLUTTER_DOPPLER_PROJECT}" --config "${FLUTTER_DOPPLER_CONFIG}" -- bash -c '
  # shellcheck source=lib/flutter-dart-defines.sh
  source "'"${REPO_ROOT}"'/scripts/lib/flutter-dart-defines.sh"
  mapfile -t _dart_flags < <(flutter_dart_define_flags)
  flutter build appbundle --release "${_dart_flags[@]}"
'

AAB="${FLUTTER_DIR}/build/app/outputs/bundle/release/app-release.aab"
[[ -f "${AAB}" ]] || fail "AAB missing at ${AAB}"
log "AAB: ${AAB}"

if [[ "${BUILD_APK}" == "true" ]]; then
  log "Building APK (release) for sideload QA"
  doppler run --project "${FLUTTER_DOPPLER_PROJECT}" --config "${FLUTTER_DOPPLER_CONFIG}" -- bash -c '
    # shellcheck source=lib/flutter-dart-defines.sh
    source "'"${REPO_ROOT}"'/scripts/lib/flutter-dart-defines.sh"
    mapfile -t _dart_flags < <(flutter_dart_define_flags)
    flutter build apk --release "${_dart_flags[@]}"
  '
  APK="${FLUTTER_DIR}/build/app/outputs/flutter-apk/app-release.apk"
  [[ -f "${APK}" ]] || fail "APK missing at ${APK}"
  log "APK: ${APK}"
fi

log "Done. Upload to Play Console is manual until android:play-upload is implemented."
