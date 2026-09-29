#!/usr/bin/env bash
# Build Ploy Astro dist for staging.purplelife.org in the same live-data mode as www.
# Site canonicals stay on staging. Copy flags match production so home is not a design preview.
# Requires a prior TanStack build (dist/client/assets and dist/server/server.js).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLOY="$ROOT/ploy-staging"
# Hardcoded. Do not read PUBLIC_SITE_URL: a www shell export would bake the wrong host.
SITE="https://staging.purplelife.org"

if [[ ! -f "$PLOY/package.json" ]]; then
  echo "build-ploy-staging: ploy-staging/package.json not found." >&2
  exit 1
fi

cd "$PLOY"
bun install

ASTRO_CONFIG="$PLOY/astro.config.mjs"
if [[ ! -f "$ASTRO_CONFIG" ]]; then
  echo "build-ploy-staging: missing $ASTRO_CONFIG" >&2
  exit 1
fi

ASTRO_CONFIG_BACKUP="${ASTRO_CONFIG}.bak"
cp "$ASTRO_CONFIG" "$ASTRO_CONFIG_BACKUP"
SITE="$SITE" node -e "
const fs = require('fs');
const site = process.env.SITE;
let c = fs.readFileSync('$ASTRO_CONFIG', 'utf8');
if (!c.includes('site:')) throw new Error('site: not found in astro.config.mjs');
c = c.replace(/site: \"https:\\/\\/[^\"]+\"/, 'site: \"' + site + '\"');
fs.writeFileSync('$ASTRO_CONFIG', c);
"
trap 'mv -f "$ASTRO_CONFIG_BACKUP" "$ASTRO_CONFIG"' EXIT

VITE_STAGING_LIVE_DATA=1 VITE_PUBLIC_SITE_ENV=production bun run build

if [[ ! -d "$ROOT/dist/client/assets" ]]; then
  echo "build-ploy-staging: missing TanStack dist/client/assets; run bun run build:prod first." >&2
  exit 1
fi
rm -rf "$PLOY/dist/client/assets"
cp -R "$ROOT/dist/client/assets" "$PLOY/dist/client/assets"

cd "$ROOT"
node scripts/check-staging-ploy-live.mjs --built
echo "build-ploy-staging: ok → ploy-staging/dist (site=$SITE, live copy)"
