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

1. `/api/public/design-preview/session` — **disabled** for public (`404` when `STAGING_REAL_AUTH=1`); operator bypass only (see below)
2. `/api/*` — proxied to prod `purplelife` (same JWT, same D1 queries)
3. Everything else — Ploy Astro static/SSR from `ploy-staging/dist/client`

Config: `wrangler.staging.jsonc` (account `08e766e92db74bc7ef14c6b5c86bddf0`).

## Auth on staging (production-shaped)

Staging uses the **same sign-in path as www**: `POST /api/auth/sign-in` (proxied to prod `purplelife`), JWT in `localStorage` as `purple-cf-session`, then `Authorization: Bearer` on `POST /api/data/query`.

**Testers:**

1. Open https://staging.purplelife.org/login (or `/sign-in`)
2. Sign in with a production account (default QA user: `pmt@eigital.com`)
3. Password is **not** in the repo; operators use the known founding-team password from Doppler / internal runbook (same credential as www)
4. After sign-in, live pages (`/today`, `/journal`, `/meds`, `/reports`, `/tools`, etc.) load production D1/R2 for that user
5. Sign out from the amber staging banner (clears session, returns to `/login`)

| Field | Default QA user |
|-------|-----------------|
| Email | `pmt@eigital.com` |
| User id | `bb160030-2ed6-45d7-8a5a-7f6f7879e9bb` |

**Design-preview auto-mint (operator only):**

Public `GET /api/public/design-preview/session` returns **404** when `DESIGN_PREVIEW=0` and `STAGING_REAL_AUTH=1` (current default).

For curl/smoke without a password, set Worker secret `DESIGN_PREVIEW_BYPASS_SECRET` and pass header `X-Purple-Design-Preview-Secret: <value>`. Do not share the secret in docs or chat.

**www unchanged:** production Worker `purplelife` and `wrangler.deploy.jsonc` are not modified by staging auth.

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

# Public mint disabled (404)
curl -sS -o /dev/null -w "design-preview session %{http_code}\n" \
  "$BASE/api/public/design-preview/session"

# Login page (200)
curl -sS -o /dev/null -w "/login %{http_code}\n" "$BASE/login/"

# Real sign-in (password from operator; never commit)
# doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c '
#   curl -sS "$BASE/api/auth/sign-in" -H "Content-Type: application/json" \
#     -d "{\"email\":\"pmt@eigital.com\",\"password\":\"$E2E_PASSWORD\"}" | jq ".user.id, .access_token[:24]"
# '
TOKEN="<paste access_token from sign-in or browser localStorage purple-cf-session>"

# Proxied API (401 without token, 200 with token)
curl -sS -o /dev/null -w "data/query %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"table":"biometrics","mode":"select","select":"recorded_at","limit":1}' \
  "$BASE/api/data/query"

# Ploy Today shell (200; data chips need browser sign-in first)
curl -sS -o /dev/null -w "/today %{http_code}\n" "$BASE/today/"
```

Browser:

1. Open `/login`, sign in as `pmt@eigital.com`
2. Open `/today` — status chips and narrative should reflect **live** pmt data (not Empty day / Sample day toggles)
3. Amber banner shows signed-in email; **Sign out** clears session

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

Reports and tools (same session):

```bash
# Report documents count
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"report_documents","mode":"select","select":"id,title,status","limit":100}' \
  "$BASE/api/data/query" | jq '.data | length'

# Wearable / Apple Health token status (no secrets)
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"oura_tokens","mode":"select","select":"last_sync_at,expires_at","limit":1}' \
  "$BASE/api/data/query" | jq '.data'
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"whoop_tokens","mode":"select","select":"last_sync_at,expires_at","limit":1}' \
  "$BASE/api/data/query" | jq '.data'
curl -sS -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"table":"apple_health_tokens","mode":"select","select":"last_sync_at,last_webhook_at","limit":1}' \
  "$BASE/api/data/query" | jq '.data'

for p in /reports/ /reports/documents/ /documents/ /tools/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done
```

Browser: `/reports` and `/reports/documents` list live `report_documents`; `/tools` shows Oura, Whoop, and Apple Health connection status from token tables (read-only; OAuth on www).

## Security warning

Staging is **public**, but live data pages require **sign-in** (production password). Do not commit passwords or bypass secrets. Share staging URL only with design/engineering who have founding-team credentials. Not HIPAA-safe for external audiences.

Operator bypass (`DESIGN_PREVIEW_BYPASS_SECRET`) mints a JWT without password; treat like a live credential.

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
