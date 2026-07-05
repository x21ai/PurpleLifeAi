#!/bin/sh
# Xcode scheme pre-action wrapper for `xcode_backend.sh prepare` (release_unpack_ios).
set -eu

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode-beta.app/Contents/Developer}"
export PATH="${SRCROOT}/scripts:${PATH}"

strip_codesign_detritus() {
  build_root="${SRCROOT}/../build/ios"
  if [ ! -d "${build_root}" ]; then
    return 0
  fi
  for config_dir in "${build_root}"/*-iphoneos; do
    if [ ! -d "${config_dir}" ]; then
      continue
    fi
    xattr -cr "${config_dir}" 2>/dev/null || true
  done
}

run_prepare() {
  /bin/sh "${FLUTTER_ROOT}/packages/flutter_tools/bin/xcode_backend.sh" prepare
}

if run_prepare; then
  exit 0
fi

strip_codesign_detritus
run_prepare
