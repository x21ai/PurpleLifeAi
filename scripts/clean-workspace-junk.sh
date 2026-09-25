#!/usr/bin/env bash
# Remove local artifacts that must never ship: PID locks, Playwright output,
# and macOS Finder duplicate copies ("name 2.ext"). Safe to run anytime.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

prune=( -path ./node_modules -o -path ./.git -o -path ./flutter/ios/Pods -o -path ./flutter/build -o -path ./dist )

echo "[clean-workspace] Removing PID locks..."
rm -f .flutter-web-serve.pid .flutter-web-serve\ *.pid .preview-design-serve.pid .preview-design-serve\ *.pid

echo "[clean-workspace] Removing test-results/..."
rm -rf test-results

echo "[clean-workspace] Removing macOS duplicate copies (* 2.*) outside deps/build..."
find . \( "${prune[@]}" \) -prune -o -name '* 2.*' -print -exec rm -rf -- {} +

echo "[clean-workspace] Done."
git status -sb
