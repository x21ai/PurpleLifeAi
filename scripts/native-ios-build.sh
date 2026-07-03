#!/usr/bin/env bash
# Idempotent iOS simulator build for Purple Capacitor shell.
# Requires full Xcode at /Applications/Xcode.app (not Command Line Tools only).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
XCODE_APP=""
XCODE_DOWNLOAD="/Applications/Xcode.appdownload"
XCODE_DEV=""
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

find_xcode_dev_dir() {
  local selected=""
  selected="$(xcode-select -p 2>/dev/null || true)"
  if [[ -n "${selected}" && "${selected}" != *"CommandLineTools"* && -x "${selected}/usr/bin/xcodebuild" ]]; then
    XCODE_DEV="${selected}"
    if [[ "${selected}" == *".app/Contents/Developer" ]]; then
      XCODE_APP="${selected%/Contents/Developer}"
    fi
    return 0
  fi
  local candidates=(
    "/Applications/Xcode.app"
    "/Applications/Xcode-beta.app"
    "/Users/${USER}/Downloads/Xcode-beta.app"
  )
  local candidate=""
  for candidate in "${candidates[@]}"; do
    if [[ -d "${candidate}/Contents/Developer" ]]; then
      XCODE_APP="${candidate}"
      XCODE_DEV="${candidate}/Contents/Developer"
      return 0
    fi
  done
  local mdfind_hit=""
  mdfind_hit="$(mdfind "kMDItemCFBundleIdentifier == 'com.apple.dt.Xcode'" 2>/dev/null | head -1 || true)"
  if [[ -n "${mdfind_hit}" && -d "${mdfind_hit}/Contents/Developer" ]]; then
    XCODE_APP="${mdfind_hit}"
    XCODE_DEV="${mdfind_hit}/Contents/Developer"
    return 0
  fi
  return 1
}

require_xcode_app() {
  if find_xcode_dev_dir; then
    export DEVELOPER_DIR="${XCODE_DEV}"
    if [[ -n "${XCODE_APP}" ]]; then
      log "Using Xcode CLI at ${XCODE_DEV} (${XCODE_APP})"
    else
      log "Using Xcode CLI at ${XCODE_DEV} (from xcode-select)"
    fi
    return 0
  fi
  if [[ -d "${XCODE_DOWNLOAD}" ]]; then
    fail "Xcode is still downloading at ${XCODE_DOWNLOAD}. Wait for install to finish, then re-run."
  fi
  fail "Xcode.app not found. Install Xcode (App Store or Xcode-beta), then re-run."
}

ensure_xcode_select() {
  local current=""
  current="$(xcode-select -p 2>/dev/null || true)"
  if [[ "${current}" == "${XCODE_DEV}" ]]; then
    log "xcode-select already points to ${XCODE_DEV}"
    return 0
  fi
  log "Active developer dir: ${current:-unset}; building with DEVELOPER_DIR=${XCODE_DEV}"
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
