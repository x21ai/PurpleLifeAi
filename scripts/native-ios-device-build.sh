#!/usr/bin/env bash
# Build Purple iOS app for a physical device (HealthKit requires hardware).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf '[native-ios-device-build] %s\n' "$*"
}

fail() {
  printf '[native-ios-device-build] ERROR: %s\n' "$*" >&2
  exit 1
}

cd "${REPO_ROOT}"

DOPPLER_PROJECT="${DOPPLER_PROJECT:-x21}"
DOPPLER_CONFIG="${DOPPLER_CONFIG:-prd}"

log "Resolving DEVELOPMENT_TEAM from Doppler ${DOPPLER_PROJECT}/${DOPPLER_CONFIG}"
DOPPLER_PROJECT="${DOPPLER_PROJECT}" DOPPLER_CONFIG="${DOPPLER_CONFIG}" bun run ios:local-signing

log "Syncing Capacitor iOS shell"
(cd "${REPO_ROOT}" && bun run native:sync)
node "${REPO_ROOT}/scripts/check-native-shell.mjs"

XCODE_APP=""
for candidate in "/Applications/Xcode.app" "/Applications/Xcode-beta.app" "/Users/${USER}/Downloads/Xcode-beta.app"; do
  if [[ -d "${candidate}/Contents/Developer" ]]; then
    XCODE_APP="${candidate}"
    export DEVELOPER_DIR="${candidate}/Contents/Developer"
    break
  fi
done
if [[ -z "${XCODE_APP:-}" ]]; then
  selected="$(xcode-select -p 2>/dev/null || true)"
  if [[ -n "${selected}" && "${selected}" != *"CommandLineTools"* ]]; then
    export DEVELOPER_DIR="${selected}"
  fi
fi
[[ -n "${DEVELOPER_DIR:-}" ]] || fail "Xcode.app not found"

TEAM="$(grep DEVELOPMENT_TEAM ios/LocalSigning.xcconfig | awk '{print $3}')"
[[ -n "${TEAM}" ]] || fail "Missing DEVELOPMENT_TEAM in ios/LocalSigning.xcconfig"

log "Checking for connected iPhone"
if ! xcrun devicectl list devices 2>/dev/null | grep -q "iPhone"; then
  fail "No iPhone connected via USB. Plug in device, trust this Mac, then re-run."
fi

IOS_DIR="${REPO_ROOT}/ios/App"
log "Building for device with team ${TEAM}"
xcodebuild \
  -project "${IOS_DIR}/App.xcodeproj" \
  -scheme App \
  -sdk iphoneos \
  -configuration Debug \
  DEVELOPMENT_TEAM="${TEAM}" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration \
  build

log "Device build succeeded."

DEVICE_ID=""
DEVICE_ID="$(xcrun devicectl list devices 2>/dev/null | awk '/physical/ && /iPhone/ {
  for (i = 1; i <= NF; i++) {
    if ($i ~ /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/) {
      print $i
      exit
    }
  }
}')"
if [[ -z "${DEVICE_ID}" ]]; then
  log "No physical iPhone found for auto-install. Connect device and re-run, or install manually."
  exit 0
fi

APP_PATH="$(find "${HOME}/Library/Developer/Xcode/DerivedData"/App-*/Build/Products/Debug-iphoneos -name 'App.app' -type d 2>/dev/null | head -1)"
if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  fail "App.app not found under DerivedData Debug-iphoneos"
fi

log "Installing ${APP_PATH} on device ${DEVICE_ID}"
xcrun devicectl device install app --device "${DEVICE_ID}" "${APP_PATH}"

log "Launching org.purplelife.app"
xcrun devicectl device process launch --device "${DEVICE_ID}" org.purplelife.app

log "Installed and launched on connected iPhone."
