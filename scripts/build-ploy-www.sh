#!/usr/bin/env bash
# Build Ploy Astro dist for www.purplelife.org (site URL + live-data client flag).
# Requires ploy-staging source tree (merge PR #44 or checkout cursor/ploy-astro-staging-5b1c).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLOY="$ROOT/ploy-staging"
SITE="${PUBLIC_SITE_URL:-https://www.purplelife.org}"

if [[ ! -f "$PLOY/package.json" ]]; then
  if [[ -d "$PLOY/dist/client" && -f "$PLOY/dist/server/entry.mjs" ]]; then
    echo "build-ploy-www: ploy-staging source missing; using existing dist/ (merge PR #44 to rebuild)."
    exit 0
  fi
  echo "build-ploy-www: ploy-staging/package.json not found and dist/ is incomplete." >&2
  echo "Merge https://github.com/x21ai/PurpleLifeAi/pull/44 (ploy-staging tree) first." >&2
  exit 1
fi

cd "$PLOY"
bun install

ASTRO_CONFIG="astro.config.mjs"
if [[ ! -f "$ASTRO_CONFIG" ]]; then
  echo "build-ploy-www: missing $ASTRO_CONFIG" >&2
  exit 1
fi

# Astro `site` must match www for canonical URLs and sitemap (Ploy reserves string literal).
cp "$ASTRO_CONFIG" "${ASTRO_CONFIG}.bak"
node -e "
const fs = require('fs');
const site = process.env.SITE;
let c = fs.readFileSync('$ASTRO_CONFIG', 'utf8');
if (!c.includes('site:')) throw new Error('site: not found in astro.config.mjs');
c = c.replace(/site: \"https:\\/\\/[^\"]+\"/, 'site: \"' + site + '\"');
fs.writeFileSync('$ASTRO_CONFIG', c);
" SITE="$SITE"
trap 'mv -f "${ASTRO_CONFIG}.bak" "$ASTRO_CONFIG"' EXIT

VITE_STAGING_LIVE_DATA=1 bun run build
echo "build-ploy-www: ok → ploy-staging/dist (site=$SITE)"
