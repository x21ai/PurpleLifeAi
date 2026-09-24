#!/usr/bin/env bash
# Build Purple Flutter Android release artifacts (AAB + optional APK).
#
# Does not upload to Google Play (Play signing automation not implemented yet).
# See docs/STEP8-FLUTTER-REBUILD.md and docs/templates/play-store-automation-plan.md.
#
# Usage:
#   ./scripts/flutter-android-release.sh           # appbundle (Play upload target)
#   ./scripts/flutter-android-release.sh --apk     # also build apk for sideload QA
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"
FLUTTER_DOPPLER_PROJECT="${FLUTTER_DOPPLER_PROJECT:-cursor-cloudflare}"
FLUTTER_DOPPLER_CONFIG="${FLUTTER_DOPPLER_CONFIG:-prd_cloudlfare}"
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

log "Release signing uses debug keystore until Play upload keystore is configured"
log "See flutter/android/app/build.gradle.kts and docs/STEP8-FLUTTER-REBUILD.md"

log "Building appbundle (release) with Doppler dart-defines"
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
