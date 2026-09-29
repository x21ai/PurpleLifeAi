# Ploy Astro staging (staging.purplelife.org)

**Status:** Repo is ready for the live-data flip. **Do not wrangler deploy from a cloud agent.**
The operator deploys Worker `purplelife-staging` from a Mac with Doppler
`cursor-cloudflare` / `prd_cloudlfare` (Worker secrets). Doppler `x21` / `prd` is the
native iOS project, not this Worker.

Staging serves the **same live Ploy mode as www** (PR #57 hybrid routing). It is not a
design-preview host. It binds the **same production D1, R2, and KV** as www. Do not
pause Supabase and do not wipe data. Staging has **no cron triggers**; Worker
`purplelife` keeps the schedules so jobs are not run twice.

## Architecture

| Host | Worker | UI | API / OAuth |
|------|--------|-----|-------------|
| www | `purplelife` | Ploy Astro live copy | TanStack in-process (`www-entry.ts`) |
| staging | `purplelife-staging` | Ploy Astro live copy | TanStack in-process (same `www-entry.ts`) |

```
Request → purplelife-staging (staging.purplelife.org)
  /api/*, /oauth/*  → dist/server/server.js (TanStack, same code as www)
  scheduled crons   → not registered on this Worker
  assets            → ASSETS binding
  every other path  → ploy-staging/dist (Ploy Astro)
```

Route function: `ploy-staging/worker/www-routing.ts` (Ploy-first).
Entry: `ploy-staging/worker/www-entry.ts`.
Config: `wrangler.staging.jsonc` (account `08e766e92db74bc7ef14c6b5c86bddf0`).

`assets.run_worker_first=true` so prerendered HTML cannot skip the Worker.

| Binding | Resource | ID / name |
|---------|----------|-----------|
| `DB` | D1 `purplelifeai` | `8d0be2b3-84ec-4581-86f4-6b372ec1d5d7` |
| `STORAGE` | R2 `purplelifeai` | bucket `purplelifeai` |
| `CACHE` | KV `purplelifeai` (eigital) | `9226585702aa4be694ac74981d9859c4` |
| `SELF` | Service | Worker `purplelife-staging` |

Do not copy POS-account CACHE id `73356a0e339447059bdddc33b93f26a9` (Cloudflare error 10041).
Do not add a `PROD` service binding. Do not add `triggers.crons`.

**Auth:** `POST /api/auth/sign-in` on the staging host, JWT in `localStorage` as
`purple-cf-session`, then `Authorization: Bearer` on `POST /api/data/query`.
There is no public design-preview session mint. `GET /api/public/design-preview/session`
is a TanStack 404, same as www.

**Copy:** the staging Ploy build sets `VITE_STAGING_LIVE_DATA=1` and
`VITE_PUBLIC_SITE_ENV=production`, with Astro `site` fixed to
`https://staging.purplelife.org`. Home shows "Private health journal", not
"Static design preview" / "Design review build" / "local mock state".

Worker vars:

| Variable | Value |
|---|---|
| `DESIGN_PREVIEW` | `0` |
| `STAGING_REAL_AUTH` | `1` |
| `STAGING_LIVE_DATA` | `1` |
| `DATA_BACKEND` | `cloudflare` |
| `PUBLIC_SITE_URL` | `https://staging.purplelife.org` |

`STAGING_*` names stay because the existing live-data client checks them. They do not
select design-preview copy.

## DNS

`staging.purplelife.org` routes to Worker `purplelife-staging` (already in
`wrangler.staging.jsonc`). Do not point `www` or the apex at this Worker.

## Secrets (before the first hybrid deploy)

In-process TanStack needs the same secret **names** as Worker `purplelife`, especially
`AUTH_JWT_SECRET` (must be the same value as prod or staging tokens will not verify).
Compare names only:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler secret list -c wrangler.deploy.ploy.jsonc'

doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler secret list -c wrangler.staging.jsonc'
```

Put a missing secret from Doppler without printing it. Example for `AUTH_JWT_SECRET`
(repeat for `CRON_SECRET`, OAuth client secrets, and `ANTHROPIC_API_KEY` if those
flows are exercised on staging):

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'printf %s "$AUTH_JWT_SECRET" | CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler secret put AUTH_JWT_SECRET -c wrangler.staging.jsonc'
```

## Build and deploy (operator)

```bash
# TanStack API bundle + Ploy live copy for staging.purplelife.org
bun run build:staging:ploy

# Deploy staging Worker only. Does not deploy purplelife.
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler deploy -c wrangler.staging.jsonc'
```

`bun run deploy:staging:ploy` is the same two steps. `bun run build:prod` needs Doppler
so `VITE_*` on the TanStack bundle matches production. The Ploy half does not read
`PUBLIC_SITE_URL` from the shell; canonicals stay on staging.

Dry-run (no traffic change):

```bash
bun run verify:staging-ploy-entry
# or, after a full build:
bun run deploy:staging:ploy:dry-run
```

Config gate without a build: `bun run check:staging-ploy-live`.

## Post-deploy smoke

```bash
BASE=https://staging.purplelife.org

# Home is live copy. Fail if design-preview marketing is still served.
curl -fsSL "$BASE/" | grep -E \
  'Static design preview|Design review build|local mock state|APIs are not connected' \
  && echo "FAIL: preview copy found" && exit 1
curl -fsSL "$BASE/" | grep -q "Private health journal"

# Real TanStack sign-in (empty body). Expect HTTP 400 and
# {"error":"email and password required"}
# A 200 session mint or a design-preview JSON body is a failure.
curl -sS -D - -o /tmp/staging-signin.json -X POST "$BASE/api/auth/sign-in" \
  -H 'content-type: application/json' -d '{}'
grep -q 'email and password required' /tmp/staging-signin.json

# Design-preview mint is not a staging route. Expect 404.
curl -sS -o /dev/null -w "design-preview %{http_code}\n" \
  "$BASE/api/public/design-preview/session"

# Ploy shells
for p in / /today/ /journal/ /meds/ /login/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done
```

Authenticated read (password from Doppler, never printed). Proves sign-in plus a
user-scoped D1 `profiles` read on the staging host:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  env E2E_BASE_URL=https://staging.purplelife.org bun run test:www-cloudflare-data
```

Browser: open `/`, confirm there is no "Static design preview", "Design review build",
or "local mock state". Sign in at `/login`. `/today`, `/journal`, `/meds`, `/reports`,
and `/tools` load that account's live rows. OAuth callbacks hit `/oauth/*/callback`
on the staging host; provider consoles must already allow that redirect or those
connect buttons stay www-only.

## Rollback

Redeploy the previous `purplelife-staging` version:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler versions list -c wrangler.staging.jsonc'
```

Then roll back to the saved version id. Do not point this config at
`staging-entry.ts` unless the `PROD` service binding is restored with it.
Worker `purplelife` is unchanged by a staging rollback.

## Tear down

```bash
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  bunx wrangler delete purplelife-staging -c wrangler.staging.jsonc
```

Remove the `staging.purplelife.org` route when the host is retired. Production
`purplelife` is unaffected.

## Related

- www hybrid: `docs/DEPLOY-WWW-PLOY.md`
- OAuth/CORS allowlist includes `https://staging.purplelife.org`: `src/lib/oauth-allowed-origins.ts`
