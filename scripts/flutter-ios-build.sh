#!/usr/bin/env bash
# Flutter iOS release build with /tmp ios output (iCloud xattr workaround).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER_DIR="${REPO_ROOT}/flutter"

# shellcheck source=flutter-build-dirs.sh
source "${REPO_ROOT}/scripts/flutter-build-dirs.sh"

log() {
  printf '[flutter-ios-build] %s\n' "$*"
}

prepare_flutter_ios_build_dir
log "iOS build output: ${FLUTTER_IOS_BUILD_LINK} (symlinked at flutter/build/ios)"

if [[ -z "${DEVELOPER_DIR:-}" ]]; then
  if [[ -x /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild ]]; then
    export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
  elif [[ -x /Applications/Xcode-beta.app/Contents/Developer/usr/bin/xcodebuild ]]; then
    export DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer
  fi
fi
export PATH="${FLUTTER_DIR}/ios/scripts:${PATH}"

cd "${FLUTTER_DIR}"
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build ios --release --no-codesign "$@"

log "Done. Web preview unaffected: ./scripts/flutter-web-serve.sh"
