#!/bin/sh
# Xcode Run Script wrapper for `xcode_backend.sh build`.
set -eu

export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode-beta.app/Contents/Developer}"
export PATH="${PROJECT_DIR}/scripts:${PATH}"

strip_codesign_detritus() {
  build_root="${PROJECT_DIR}/../build/ios"
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

run_backend() {
  /bin/sh "${FLUTTER_ROOT}/packages/flutter_tools/bin/xcode_backend.sh" build
}

if run_backend; then
  exit 0
fi

strip_codesign_detritus
run_backend
