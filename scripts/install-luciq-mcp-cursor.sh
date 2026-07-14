#!/usr/bin/env bash
# Merge Luciq HTTP MCP into ~/.cursor/mcp.json using Doppler (never commit tokens to repo).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/doppler-purple-life.sh
source "${REPO_ROOT}/scripts/lib/doppler-purple-life.sh"

MCP_JSON="${CURSOR_MCP_JSON:-$HOME/.cursor/mcp.json}"
DOPPLER_PROJECT="${LUCIQ_DOPPLER_PROJECT:-servers-teamkeys}"
DOPPLER_CONFIG="${LUCIQ_DOPPLER_CONFIG:-dev}"
TOKEN_SECRET="${LUCIQ_TOKEN_SECRET:-LUCIQ_OAUTH_TOKEN}"
EMAIL="${LUCIQ_ACCOUNT_EMAIL:-pmt@eatos.com}"
MCP_URL="https://api.luciq.ai/api/mcp"

log() { printf '[luciq-mcp] %s\n' "$*"; }

if ! command -v doppler >/dev/null 2>&1; then
  log 'ERROR: doppler CLI not found'
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  log 'ERROR: jq required (brew install jq)'
  exit 1
fi

TOKEN=""
if ! TOKEN="$(doppler secrets get "$TOKEN_SECRET" \
  --project "$DOPPLER_PROJECT" \
  --config "$DOPPLER_CONFIG" \
  --plain 2>/dev/null)"; then
  log "Trying ${PURPLE_DOPPLER_PROJECT}/${PURPLE_DOPPLER_CONFIG} ${PURPLE_LUCIQ_API_SECRET} fallback..."
  if ! TOKEN="$(doppler secrets get "${PURPLE_LUCIQ_API_SECRET}" \
    --project "${PURPLE_DOPPLER_PROJECT:-x21}" \
    --config "${PURPLE_DOPPLER_CONFIG:-prd}" \
    --plain 2>/dev/null)"; then
    log "ERROR: no token in $DOPPLER_PROJECT/$DOPPLER_CONFIG or ${PURPLE_DOPPLER_PROJECT:-x21}/${PURPLE_DOPPLER_CONFIG:-prd}"
    log 'Run: bun run luciq:sync-secrets'
    exit 1
  fi
fi

if [[ -z "${TOKEN//[[:space:]]/}" ]]; then
  log 'ERROR: Luciq token is empty'
  exit 1
fi

mkdir -p "$(dirname "$MCP_JSON")"
if [[ -f "$MCP_JSON" ]]; then
  cp "$MCP_JSON" "${MCP_JSON}.bak"
  log "Backed up existing config to ${MCP_JSON}.bak"
else
  echo '{"mcpServers":{}}' >"$MCP_JSON"
fi

TMP="$(mktemp)"
jq --arg url "$MCP_URL" --arg email "$EMAIL" --arg token "$TOKEN" \
  '.mcpServers.luciq = {
    "url": $url,
    "headers": {
      "Email": $email,
      "Token": $token
    }
  }' "$MCP_JSON" >"$TMP"
mv "$TMP" "$MCP_JSON"

if ! jq empty "$MCP_JSON" 2>/dev/null; then
  log 'ERROR: generated invalid JSON; restore from .bak if needed'
  exit 1
fi

log "Updated $MCP_JSON with luciq MCP server (token from Doppler, not printed)."
log 'Restart Cursor, then verify Luciq MCP shows connected.'
log 'Dashboard project: Flutter - Purple - Beta'
