#!/usr/bin/env bash
# Source before web or Flutter builds to set version/build/date env vars from pubspec.
# Usage: source scripts/app-build-env.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBSPEC="${REPO_ROOT}/flutter/pubspec.yaml"

if [[ -f "${PUBSPEC}" ]]; then
  version_line="$(grep '^version:' "${PUBSPEC}" | head -1 | awk '{print $2}')"
  APP_VERSION="${version_line%%+*}"
  APP_BUILD_NUMBER="${version_line#*+}"
  if [[ "${APP_BUILD_NUMBER}" == "${version_line}" ]]; then
    APP_BUILD_NUMBER="0"
  fi
  export VITE_APP_VERSION="${VITE_APP_VERSION:-${APP_VERSION}}"
  export VITE_APP_BUILD_NUMBER="${VITE_APP_BUILD_NUMBER:-${APP_BUILD_NUMBER}}"
fi

ISO_BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
export VITE_APP_BUILD_DATE="${VITE_APP_BUILD_DATE:-${ISO_BUILD_DATE}}"
export BUILD_DATE="${BUILD_DATE:-${VITE_APP_BUILD_DATE}}"
