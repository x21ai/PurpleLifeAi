#!/usr/bin/env bash
# Copy Luciq MCP/API token from servers-teamkeys (source) to purple-life/prd (runtime).
# Never prints secret values.
set -euo pipefail

SOURCE_PROJECT="${LUCIQ_SOURCE_DOPPLER_PROJECT:-servers-teamkeys}"
SOURCE_CONFIG="${LUCIQ_SOURCE_DOPPLER_CONFIG:-dev}"
TARGET_PROJECT="${LUCIQ_TARGET_DOPPLER_PROJECT:-purple-life}"
TARGET_CONFIG="${LUCIQ_TARGET_DOPPLER_CONFIG:-prd}"
SOURCE_SECRET="${LUCIQ_SOURCE_SECRET:-LUCIQ_OAUTH_TOKEN}"
TARGET_TOKEN_SECRET="${LUCIQ_TARGET_TOKEN_SECRET:-LUCIQ_API_TOKEN}"
TARGET_EMAIL="${LUCIQ_ACCOUNT_EMAIL:-pmt@eatos.com}"

log() { printf '[luciq-sync] %s\n' "$*"; }

if ! command -v doppler >/dev/null 2>&1; then
  log 'ERROR: doppler CLI not found'
  exit 1
fi

TOKEN=""
if ! TOKEN="$(doppler secrets get "$SOURCE_SECRET" \
  --project "$SOURCE_PROJECT" \
  --config "$SOURCE_CONFIG" \
  --plain 2>/dev/null)"; then
  log "ERROR: missing $SOURCE_SECRET in Doppler $SOURCE_PROJECT/$SOURCE_CONFIG"
  exit 1
fi

if [[ -z "${TOKEN//[[:space:]]/}" ]]; then
  log "ERROR: $SOURCE_SECRET is empty in $SOURCE_PROJECT/$SOURCE_CONFIG"
  exit 1
fi

doppler secrets set \
  "$TARGET_TOKEN_SECRET=$TOKEN" \
  "LUCIQ_ACCOUNT_EMAIL=$TARGET_EMAIL" \
  --project "$TARGET_PROJECT" \
  --config "$TARGET_CONFIG" \
  >/dev/null

log "Synced $SOURCE_PROJECT/$SOURCE_CONFIG:$SOURCE_SECRET"
log "  -> $TARGET_PROJECT/$TARGET_CONFIG:$TARGET_TOKEN_SECRET"
log "  -> $TARGET_PROJECT/$TARGET_CONFIG:LUCIQ_ACCOUNT_EMAIL ($TARGET_EMAIL)"
log 'Run: bun run ios:check-luciq -- --json'
