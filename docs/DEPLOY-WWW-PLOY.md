# www.purplelife.org Ploy Astro flip (hybrid Worker)

**Status:** Infra ready in repo. **Owner GO received 2026-09-24** (merge PR #47, then deploy Worker `purplelife` with this runbook). Agents must **not** deploy unless the operator explicitly asks. Step 6 dry-run notes: `ploy-purplelife-source/STEP6-WWW-FLIP-DRYRUN.md`.

Production **www** today still uses TanStack UI via `wrangler.deploy.jsonc` + `src/server.ts`. This document covers the **future** flip to Ploy Astro UI while keeping TanStack API handlers in-process.

## Architecture

| Host | Worker | UI | API / OAuth / crons |
|------|--------|-----|---------------------|
| www (today) | `purplelife` | TanStack SSR | TanStack in `dist/server/server.js` |
| staging (now) | `purplelife-staging` | Ploy Astro | **Proxied** to `purplelife` via `PROD` binding |
| **www (after flip)** | `purplelife` | Ploy Astro | TanStack **in-process** (no `PROD` proxy) |

```
Request → purplelife (www.purplelife.org)
  /api/*, /oauth/*  → dist/server/server.js (TanStack)     [unchanged behavior]
  scheduled crons   → TanStack scheduled handler           [unchanged]
  everything else   → ploy-staging/dist (Ploy Astro)       [new UI layer]
```

**Auth:** Real production sign-in only (`POST /api/auth/sign-in`, JWT in `purple-cf-session`). No `DESIGN_PREVIEW` auto-mint on www.

**Bindings:** Same production D1/R2/KV as staging (eigital account):

| Binding | Resource | ID / name |
|---------|----------|-----------|
| `DB` | D1 `purplelifeai` | `8d0be2b3-84ec-4581-86f4-6b372ec1d5d7` |
| `STORAGE` | R2 `purplelifeai` | bucket `purplelifeai` |
| `CACHE` | KV `purplelifeai` (eigital) | `9226585702aa4be694ac74981d9859c4` |
| `SELF` | Service | Worker `purplelife` (cron self-dispatch) |

Config file: `wrangler.deploy.ploy.jsonc` (account `08e766e92db74bc7ef14c6b5c86bddf0`).
Do not copy POS-account CACHE id `73356a0e339447059bdddc33b93f26a9` into this file;
Cloudflare error 10041 (KV namespace not found on the account).

Entry: `ploy-staging/worker/www-entry.ts`.

## Prerequisites (before flip)

1. Merge **PR #44** (`ploy-staging/` source + staging Worker).
2. Merge **PR #45** (OAuth/CORS on www API).
3. Trunk CI green (`bun run build` / `build:prod`).
4. Step 6 GO table signed off (`ploy-purplelife-source/STEP6-WWW-FLIP-DRYRUN.md`).
5. Record rollback Worker version id (`wrangler versions list` on current `purplelife`).

**Do not delete** `purplelife-staging` until post-flip QA passes.

## Build (local / CI)

Full www bundle = TanStack API build + Ploy Astro www build:

```bash
# TanStack server (needs Doppler prd_cloudlfare for VITE_* bake)
bun run build:prod

# Ploy Astro for www (needs ploy-staging source from PR #44)
bun run build:ploy:www

# Or both:
bun run build:www-ploy
```

Ploy build sets `site: https://www.purplelife.org` and `VITE_STAGING_LIVE_DATA=1` for live D1 client pages.

`scripts/build-ploy-www.sh` must pass `SITE` as an environment variable into the node rewrite (`SITE="$SITE" node -e "..."`). A trailing `SITE="$SITE"` after `node -e` is argv, so `process.env.SITE` is undefined and Astro fails with Invalid URL (`site: "undefined"`).

## Verify entry bundles (safe, no deploy)

```bash
bun run verify:www-ploy-entry
```

Uses `wrangler deploy --dry-run` against `wrangler.deploy.ploy.jsonc`. If `dist/server/server.js` is missing (trunk CI break), the script uses an ephemeral stub so the hybrid router still compiles.

## Deploy (operator only, after GO)

```bash
bun run build:www-ploy

doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler deploy -c wrangler.deploy.ploy.jsonc'
```

**Dry-run only (no live deploy):**

```bash
bun run deploy:www-ploy:dry-run
```

Secrets (`AUTH_JWT_SECRET`, OAuth keys, `CRON_SECRET`, etc.) remain on Worker `purplelife`; no new Worker name. Compare with prod via `wrangler secret list -c wrangler.deploy.jsonc`.

## Post-flip smoke

```bash
BASE=https://www.purplelife.org

# API still TanStack
curl -sS -o /dev/null -w "sign-in route %{http_code}\n" -X POST "$BASE/api/auth/sign-in" \
  -H 'content-type: application/json' -d '{}'

# Ploy UI shells
for p in / /today/ /journal/ /meds/ /login/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done

# Design preview mint must NOT exist on www
curl -sS -o /dev/null -w "design-preview %{http_code}\n" \
  "$BASE/api/public/design-preview/session"   # expect 404
```

Browser: sign in at `/login`, confirm live `/today` data, OAuth redirects still hit `/oauth/*/callback`.

## Rollback

Redeploy previous TanStack-only bundle:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  bunx wrangler deploy -c wrangler.deploy.jsonc'
```

Or roll to a saved version id from pre-flip `wrangler versions list`.

## Related docs

- Staging (unchanged): `docs/DEPLOY-STAGING-PLOY.md` (on PR #44)
- Step 6 GO/NO-GO: `ploy-purplelife-source/STEP6-WWW-FLIP-DRYRUN.md`
- OAuth/CORS: `docs/OAUTH-CORS-AUDIT.md` (PR #45)
