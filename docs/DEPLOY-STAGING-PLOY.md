# Ploy Astro staging (staging.purplelife.org)

Temporary **Ploy redesign** host with **live production data**. Production at
https://www.purplelife.org is unchanged (`purplelife` Worker + `wrangler.deploy.jsonc`).

## Architecture

| Layer | Worker | Role |
|-------|--------|------|
| Production | `purplelife` | www.purplelife.org, TanStack app, all API logic |
| Staging | `purplelife-staging` | staging.purplelife.org, Ploy Astro UI |

**Data:** staging binds the **same production D1 + R2** as www (no fork):

| Binding | Resource | Production ID / name |
|---------|----------|-------------------|
| `DB` | D1 `purplelifeai` | `8d0be2b3-84ec-4581-86f4-6b372ec1d5d7` |
| `STORAGE` | R2 `purplelifeai` | bucket `purplelifeai` |
| `PROD` | Service | Worker `purplelife` (API proxy) |

**Request routing on staging:**

1. `/api/public/design-preview/session` — minted on staging (prod D1 user lookup + shared `AUTH_JWT_SECRET`)
2. `/api/*` — proxied to prod `purplelife` (same JWT, same D1 queries)
3. Everything else — Ploy Astro static/SSR from `ploy-staging/dist/client`

Config: `wrangler.staging.jsonc` (account `08e766e92db74bc7ef14c6b5c86bddf0`).

## Auth on staging

Every visitor is auto-signed in as the **founding-team account** (full prod D1/R2 fidelity):

| Field | Value |
|-------|-------|
| Email | `pmt@eigital.com` |
| User id | `bb160030-2ed6-45d7-8a5a-7f6f7879e9bb` |

Flow (same pattern as `purplelife-design.eigital.workers.dev`):

1. Astro client calls `GET /api/public/design-preview/session`
2. Staging Worker reads `auth_users` from **production D1**
3. Mints HS256 JWT with `AUTH_JWT_SECRET` (must match prod Worker)
4. Client stores token in `localStorage` (`purple-cf-session`)
5. Data fetches go to `POST /api/data/query` (proxied to prod)

Real sign-in (`POST /api/auth/sign-in`) also works via prod proxy if you add a sign-in form later.

## DNS

`staging.purplelife.org` must route to Worker `purplelife-staging`:

```
staging.purplelife.org  CNAME  purplelife-staging.<account>.workers.dev
```

Or attach the custom domain in Cloudflare Workers dashboard (zone `purplelife.org`, account eigital).
Wrangler route is already declared in `wrangler.staging.jsonc`.

**Do not** point `www` or apex at staging.

## Build and deploy

```bash
# 1. Build Astro with live-data client flag
bun run build:staging:ploy

# 2. Deploy staging Worker only (prod deploy unchanged)
bun run deploy:staging:ploy
```

First-time / after prod secret rotation, copy secrets from prod `purplelife` onto `purplelife-staging`:

```bash
# Required for session mint + proxied API auth
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  bunx wrangler secret put AUTH_JWT_SECRET -c wrangler.staging.jsonc'
```

Optional (AI pages when wired): `ANTHROPIC_API_KEY`. Omit wearable OAuth secrets on staging unless testing connect flows.

Set `PUBLIC_SITE_URL` is already in `wrangler.staging.jsonc` vars.

## Verify

```bash
BASE=https://staging.purplelife.org

# Session bootstrap (200 + access_token; sub = pmt user id)
curl -sS "$BASE/api/public/design-preview/session" | jq '.user.id, .access_token[:24]'

# Ploy Today shell (200, new design)
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/today/"

# Proxied API (401 without token, 200 with token)
TOKEN=$(curl -sS "$BASE/api/public/design-preview/session" | jq -r .access_token)
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":"biometrics","mode":"select","select":"recorded_at","limit":1}' \
  "$BASE/api/data/query"
```

Browser: open `/today` — status chips and narrative should reflect **live** pmt data (not Empty day / Sample day toggles).

Journal and meds live pages (same session + proxy):

```bash
# Journal entry count for pmt
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"journal_entries","mode":"select","select":"id","limit":500}' \
  "$BASE/api/data/query" | jq '.data | length'

# Active medications + today's doses
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"medications","mode":"select","select":"id,name","filters":[{"op":"eq","col":"active","val":1}],"limit":100}' \
  "$BASE/api/data/query" | jq '.data | length'

DAY=$(date -u +%Y-%m-%d)
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"table\":\"medication_doses\",\"mode\":\"select\",\"select\":\"id,status\",\"filters\":[{\"op\":\"gte\",\"col\":\"scheduled_at\",\"val\":\"${DAY}T00:00:00.000Z\"},{\"op\":\"lte\",\"col\":\"scheduled_at\",\"val\":\"${DAY}T23:59:59.999Z\"}],\"limit\":100}" \
  "$BASE/api/data/query" | jq '.data | length'

# Page shells (200)
for p in /journal/ /journal/new/ /meds/ /meds/history/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done
```

Browser: `/journal` lists live entries; `/journal/new` inserts to D1; `/meds` and `/meds/history` show live medication and dose rows (counts match API above).

## Security warning

Staging is **public**. Anyone with the URL can browse **all of pmt@eigital.com's production data** until the Worker is removed or auth is tightened. Share only with design/engineering. Not HIPAA-safe for external audiences.

## Tear down

```bash
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  bunx wrangler delete purplelife-staging -c wrangler.staging.jsonc
```

Remove `staging.purplelife.org` DNS when done. Production `purplelife` Worker is unaffected.

## Production deploy (unchanged)

```bash
bun run build:prod
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  bunx wrangler deploy -c wrangler.deploy.jsonc'
```
