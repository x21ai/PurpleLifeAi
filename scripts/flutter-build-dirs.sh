#!/usr/bin/env bash
# Shared Flutter build directory helpers.
# iOS artifacts go to /tmp to avoid iCloud Desktop xattr codesign failures.
# Web preview uses a real flutter/build/web in the repo (port 8765).
set -euo pipefail

FLUTTER_IOS_BUILD_ROOT="${FLUTTER_IOS_BUILD_ROOT:-/tmp/purpledrw-flutter-build}"
FLUTTER_IOS_BUILD_LINK="${FLUTTER_IOS_BUILD_LINK:-${FLUTTER_IOS_BUILD_ROOT}/ios}"

flutter_build_dirs_repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "${script_dir}/.." && pwd
}

flutter_build_dirs_flutter_dir() {
  echo "$(flutter_build_dirs_repo_root)/flutter"
}

# Ensure flutter/build is a real directory (not a legacy top-level symlink).
# Preserves web/ from /tmp when migrating away from the old workaround.
ensure_flutter_build_local() {
  local flutter_dir build_dir legacy_target web_tmp

  flutter_dir="$(flutter_build_dirs_flutter_dir)"
  build_dir="${flutter_dir}/build"

  if [[ ! -L "${build_dir}" ]]; then
    mkdir -p "${build_dir}"
    return 0
  fi

  legacy_target="$(readlink "${build_dir}")"
  web_tmp=""

  if [[ -d "${legacy_target}/web" ]]; then
    web_tmp="$(mktemp -d "${TMPDIR:-/tmp}/purpledrw-flutter-web.XXXXXX")"
    mv "${legacy_target}/web" "${web_tmp}/"
  fi

  rm "${build_dir}"
  mkdir -p "${build_dir}"

  if [[ -n "${web_tmp}" && -d "${web_tmp}/web" ]]; then
    mv "${web_tmp}/web" "${build_dir}/"
    rmdir "${web_tmp}" 2>/dev/null || true
  fi
}

# Point flutter/build/ios at /tmp so iOS framework copies skip iCloud xattrs.
prepare_flutter_ios_build_dir() {
  local flutter_dir build_dir ios_link

  ensure_flutter_build_local

  flutter_dir="$(flutter_build_dirs_flutter_dir)"
  build_dir="${flutter_dir}/build"
  ios_link="${build_dir}/ios"

  mkdir -p "${FLUTTER_IOS_BUILD_ROOT}"
  mkdir -p "${FLUTTER_IOS_BUILD_LINK}"

  if [[ -e "${ios_link}" && ! -L "${ios_link}" ]]; then
    rm -rf "${ios_link}"
  elif [[ -L "${ios_link}" ]]; then
    rm "${ios_link}"
  fi

  ln -sf "${FLUTTER_IOS_BUILD_LINK}" "${ios_link}"
}

web_build_artifacts_complete() {
  local web_dir="$1"
  local f

  for f in index.html main.dart.js flutter_bootstrap.js; do
    [[ -f "${web_dir}/${f}" ]] || return 1
  done
}
