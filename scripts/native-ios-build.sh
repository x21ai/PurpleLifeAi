#!/usr/bin/env bash
# Idempotent iOS simulator build for Purple Capacitor shell.
# Requires full Xcode at /Applications/Xcode.app (not Command Line Tools only).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
XCODE_APP="/Applications/Xcode.app"
XCODE_DOWNLOAD="/Applications/Xcode.appdownload"
XCODE_DEV="${XCODE_APP}/Contents/Developer"
IOS_DIR="${REPO_ROOT}/ios/App"
PROJECT="${IOS_DIR}/App.xcodeproj"
SCHEME="App"
SDK="iphonesimulator"

log() {
  printf '[native-ios-build] %s\n' "$*"
}

fail() {
  printf '[native-ios-build] ERROR: %s\n' "$*" >&2
  exit 1
}

require_xcode_app() {
  if [[ -d "${XCODE_APP}" ]]; then
    return 0
  fi
  if [[ -d "${XCODE_DOWNLOAD}" ]]; then
    fail "Xcode is still downloading at ${XCODE_DOWNLOAD}. Wait for App Store install to finish (Xcode.app in /Applications), then re-run this script."
  fi
  fail "Xcode.app not found at ${XCODE_APP}. Install Xcode from the App Store, then re-run."
}

ensure_xcode_select() {
  local current=""
  current="$(xcode-select -p 2>/dev/null || true)"
  if [[ "${current}" == "${XCODE_DEV}" ]]; then
    log "xcode-select already points to ${XCODE_DEV}"
    return 0
  fi
  log "Setting active developer directory to ${XCODE_DEV}"
  if [[ "$(id -u)" -eq 0 ]]; then
    xcode-select -s "${XCODE_DEV}"
  elif sudo -n true 2>/dev/null; then
    sudo -n xcode-select -s "${XCODE_DEV}"
  else
    fail "Run once: sudo xcode-select -s ${XCODE_DEV}"
  fi
}

accept_xcode_license_if_needed() {
  if xcodebuild -checkFirstLaunchStatus >/dev/null 2>&1; then
    return 0
  fi
  log "Completing Xcode first launch / license (may require sudo once)"
  if [[ "$(id -u)" -eq 0 ]]; then
    xcodebuild -runFirstLaunch || true
    xcodebuild -license accept || true
  elif sudo -n true 2>/dev/null; then
    sudo -n xcodebuild -runFirstLaunch || true
    sudo -n xcodebuild -license accept || true
  fi
}

sync_capacitor_ios() {
  log "Syncing Capacitor iOS project from repo root"
  (cd "${REPO_ROOT}" && bun run native:sync)
}

run_pod_install_if_needed() {
  if [[ -f "${IOS_DIR}/Podfile" ]]; then
    log "Running pod install in ${IOS_DIR}"
    (cd "${IOS_DIR}" && pod install --repo-update)
    return 0
  fi
  log "No Podfile (CapApp-SPM); skipping pod install"
}

resolve_xcodebuild_invocation() {
  XCODEBUILD_PROJECT=(-project "${PROJECT}")
  if [[ -f "${IOS_DIR}/App.xcworkspace" ]]; then
    XCODEBUILD_PROJECT=(-workspace "${IOS_DIR}/App.xcworkspace")
  elif [[ -d "${IOS_DIR}/App.xcworkspace" ]]; then
    XCODEBUILD_PROJECT=(-workspace "${IOS_DIR}/App.xcworkspace")
  fi
}

build_simulator() {
  [[ -d "${PROJECT}" ]] || fail "Missing ${PROJECT}. Run: bun run native:add && bun run native:sync"

  resolve_xcodebuild_invocation
  log "Building ${SCHEME} for iOS Simulator (${SDK})"
  xcodebuild \
    "${XCODEBUILD_PROJECT[@]}" \
    -scheme "${SCHEME}" \
    -sdk "${SDK}" \
    -destination 'generic/platform=iOS Simulator' \
    -configuration Debug \
    CODE_SIGNING_ALLOWED=NO \
    build
}

main() {
  require_xcode_app
  ensure_xcode_select
  accept_xcode_license_if_needed
  sync_capacitor_ios
  run_pod_install_if_needed
  build_simulator
  log "Simulator build succeeded"
}

main "$@"
