#!/usr/bin/env bash
# Bundle-check www hybrid Worker entry without deploying to purplelife.
# Creates ephemeral TanStack stubs when dist/server/server.js is missing (trunk CI break).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node scripts/check-www-ploy-production.mjs
node --experimental-strip-types --test ploy-staging/worker/www-routing.test.ts

STUB_DIR=""
cleanup() {
  if [[ -n "$STUB_DIR" && -d "$STUB_DIR" ]]; then
    rm -rf "$STUB_DIR"
  fi
  if [[ -f dist/server/server.js ]] && [[ -n "${TANSTACK_STUB_CREATED:-}" ]]; then
    rm -f dist/server/server.js
    rmdir dist/server 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ ! -f ploy-staging/dist/server/entry.mjs ]]; then
  echo "verify-www-ploy-entry: missing ploy-staging/dist/server/entry.mjs" >&2
  echo "Run bun run build:ploy:www (needs PR #44 source) or merge ploy-staging tree." >&2
  exit 1
fi

if [[ ! -f dist/server/server.js ]]; then
  mkdir -p dist/server
  cat > dist/server/server.js <<'EOF'
export default {
  async fetch() {
    return new Response("tanstack stub", { status: 501 });
  },
  async scheduled() {},
};
EOF
  export TANSTACK_STUB_CREATED=1
  echo "verify-www-ploy-entry: using ephemeral TanStack stub (full build blocked on trunk CI)."
fi

OUTDIR="$(mktemp -d)"
STUB_DIR="$OUTDIR"
echo "verify-www-ploy-entry: wrangler dry-run → $OUTDIR"

bunx wrangler deploy -c wrangler.deploy.ploy.jsonc --dry-run --outdir="$OUTDIR" >/dev/null

if [[ ! -f "$OUTDIR/www-entry.js" && ! -f "$OUTDIR/worker.js" && ! -f "$OUTDIR/index.js" ]]; then
  ls -la "$OUTDIR" >&2
  echo "verify-www-ploy-entry: bundle output missing www-entry.js" >&2
  exit 1
fi

echo "verify-www-ploy-entry: PASS (hybrid entry bundles; live deploy is operator-owned after #47 merge)."
