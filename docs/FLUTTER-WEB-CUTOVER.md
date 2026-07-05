# Flutter web cutover at www.purplelife.org (Phase 5, Stage 7)

**Status:** Scaffold + staging checklist ready. **Do not deploy production** without gate pass, staging smoke, and explicit owner approval.

**Goal:** Serve the signed-in Purple app from **Flutter web** on the same host as today (`www.purplelife.org`), while **marketing pages** stay TanStack SSR. DNS unchanged (Worker routes stay on `purplelife.org` zone).

**Related:** [`FLUTTER-TESTFLIGHT-CUTOVER.md`](FLUTTER-TESTFLIGHT-CUTOVER.md) (native store), [`LOVABLE-FLUTTER-SYNC.md`](LOVABLE-FLUTTER-SYNC.md), [`SYNC-AND-RELEASE.md`](SYNC-AND-RELEASE.md), [`features/PHASE5_CUTOVER_ORCHESTRATOR.md`](features/PHASE5_CUTOVER_ORCHESTRATOR.md)

## Architecture after cutover

| Surface | Before | After Flutter web cutover |
|---------|--------|---------------------------|
| Marketing `/`, `/pricing`, `/about`, … | TanStack SSR on Worker | **Unchanged** (TanStack SSR) |
| Signed-in app `/today`, `/meds`, … | TanStack `_app/*` on web | **Flutter web** SPA |
| Worker `/api/*`, crons, webhooks | TanStack API routes | **Unchanged** |
| iOS/Android store | Flutter native IPA (TestFlight) | **Unchanged** (already Flutter) |
| DNS | `www.purplelife.org` → Worker `purplelife` | **Unchanged** |
| Lovable preview | Hosted `lovable/redesign` | **Unchanged** (design source) |
| Local TanStack dev `:8080` | Cursor gates + backend | **Stays** for Lovable design and Worker API work (see below) |

## Pre-cutover gates (NO-GO until pass)

From [`OPEN-ISSUES.md`](OPEN-ISSUES.md) **`flutter-phase5-nogo`** and design parity docs:

- [ ] `flutter analyze lib/` + `flutter test` pass
- [ ] `./scripts/flutter-web-build-prod.sh` succeeds
- [ ] `./scripts/flutter-web-serve.sh --rebuild` signed-in smoke on `:8765` (real data, no fake vitals)
- [ ] Route parity vs TanStack `_app/*` (admin, biometrics depth, reports upload, journal voice/photo are known gaps)
- [ ] Playwright prod smoke updated for Flutter web paths (or scoped skip documented)
- [ ] Owner explicit approval for prod deploy

## Build pipeline

### 1. Flutter web (production)

```bash
./scripts/flutter-web-build-prod.sh
```

Output: `flutter/build/web/` with:

| Artifact | Purpose |
|----------|---------|
| `index.html` | Flutter SPA shell |
| `main.dart.js`, `flutter_bootstrap.js` | App bundle |
| `assets/` | Fonts, icons, token JSON |
| `canvaskit/` or `skwasm/` | Web renderer (CanvasKit default) |
| `sqlite3.wasm`, `drift_worker.js` | Drift offline DB on web (copied from `flutter/web/`) |

**Dart-defines** (from Doppler `cursor-cloudflare` / `prd_cloudlfare`):

| Define | Source | Default if omitted |
|--------|--------|------------------|
| `SUPABASE_ANON_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` | **Required** (build fails at runtime) |
| `SUPABASE_URL` | hardcoded in `AppConfig` | `https://auth.purplelife.org` |
| `SITE_URL` | script | `https://www.purplelife.org` |
| `WORKER_API_BASE_URL` | script | `https://www.purplelife.org/api` |

Build flags match local preview: `--base-href="/"`, `--pwa-strategy=none`, `--no-tree-shake-icons`.

### 2. TanStack (unchanged)

```bash
bun run build:prod
```

Output: `dist/client/` (marketing + legacy `_app` bundles) and `dist/server/server.js`.

### 3. Merge Flutter into deploy assets

```bash
./scripts/merge-flutter-web-assets.sh
# Or full pipeline:
bun run build:prod:flutter-web
```

Layout: `dist/client/_flutter/` (copied from `flutter/build/web/`). Prefix avoids collisions with TanStack hashed assets.

## Worker static routing vs TanStack fallback

Today (`wrangler.deploy.jsonc`):

```jsonc
"main": "dist/server/server.js",
"assets": {
  "directory": "dist/client",
  "binding": "ASSETS"
}
```

All HTML currently flows through `src/server.ts` → TanStack Start SSR. Flutter cutover adds **path-based dispatch** in `src/server.ts` **before** `getServerEntry().fetch()`.

### Route classes

| Class | Examples | Handler |
|-------|----------|---------|
| **API / cron / webhooks** | `/api/*`, `/oauth/*/callback` (Worker exchange) | Worker (TanStack API routes) — **always first** |
| **Marketing SSR** | `/`, `/pricing`, `/about`, `/features`, `/charter`, `/contact`, `/privacy`, `/terms`, `/how-purple-thinks` | TanStack SSR (keep edge cache in `server.ts`) |
| **Flutter static files** | `/_flutter/*`, `/main.dart.js`, `/flutter_bootstrap.js`, `/canvaskit/*`, `/sqlite3.wasm`, `/drift_worker.js` | `env.ASSETS.fetch()` from merged `dist/client` |
| **Flutter app paths** | See list below | `env.ASSETS.fetch()` → `/_flutter/index.html` (SPA fallback, 200) |
| **Legacy TanStack app** (rollback) | same paths if flag off | TanStack `_app/*` SSR |

### Flutter app path prefix list

From `flutter/lib/shell/routes.dart` (`AppRoutes` + protected paths):

```
/sign-in
/welcome
/today
/vitals
/seizures/new
/hydration
/journal
/meds
/settings
/account
/tools
/care
/chat
/chat-care
/contact
/reports
/oauth/oura/callback
/oauth/whoop/callback
```

Prefix match: `/meds/123`, `/vitals/metric/hrv`, `/care/:ownerId`, `/settings/sharing`, etc.

**Not yet in Flutter** (stay TanStack until ported — blockers): `/admin/*`, `/biometrics/*`, `/my-health*`, `/insights`, `/timeline`, `/friends/*`, `/community-new`, `/apple-health-import`, `/condition/*`, full `/reports/*` drilldowns. Cutover options: (a) delay until parity, (b) serve TanStack fallback for those paths only, (c) Flutter placeholder screens.

### Planned `src/server.ts` flow (pseudocode)

```typescript
// 1. Flutter API CORS preflight (existing)
// 2. If pathname.startsWith("/api/") → TanStack (existing)
// 3. If isFlutterStaticAsset(pathname) → env.ASSETS.fetch(request)
// 4. If FLUTTER_WEB_CUTOVER && isFlutterAppPath(pathname) → ASSETS fetch /_flutter/index.html
// 5. If isCacheableMarketingRequest → TanStack + edge cache (existing)
// 6. Default → TanStack
```

Feature flag: `FLUTTER_WEB_CUTOVER` env var on Worker (default `false` until deploy).

### CORS update

`src/lib/flutter-api-cors.ts` today allows `http://127.0.0.1:8765` and `http://localhost:8765`. After cutover, same-origin Flutter on `www.purplelife.org` needs no CORS for most API calls. Keep localhost origins for `:8765` dev preview. Add `https://www.purplelife.org` only if any cross-origin Worker calls remain.

## Exact Worker / repo changes (plan only — do not deploy)

| # | File / config | Change |
|---|---------------|--------|
| 1 | `scripts/flutter-web-build-prod.sh` | **Done** — prod Flutter web build |
| 2 | `scripts/merge-flutter-web-assets.sh` | **Done** — copy `flutter/build/web` → `dist/client/_flutter/` |
| 3 | `package.json` | **Done** — `"build:prod:flutter-web"`: TanStack build + Flutter build + merge |
| 4 | `src/server.ts` | **Done (stub)** — `isFlutterAppPath()`, static asset routing, SPA fallback via `ASSETS` (gated `FLUTTER_WEB_CUTOVER`) |
| 5 | `src/lib/flutter-api-cors.ts` | **Future** — extend origins if needed |
| 6 | `wrangler.deploy.jsonc` | **Optional** — `"assets": { "run_worker_first": true }` so `/api/*` never serves static files by accident |
| 7 | `.github/workflows/deploy.yml` | **Future** — call Flutter web build in deploy job when cutover enabled |
| 8 | `tests/e2e/*` | **Future** — prod smoke for Flutter `/today` instead of TanStack `_app` |

**DNS:** No change. `www.purplelife.org/*` and `purplelife.org/*` stay routed to Worker `purplelife` per existing `wrangler.deploy.jsonc` routes.

**Deploy command (unchanged, manual only):**

```bash
bun run build:prod   # + merge step when implemented
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler deploy -c wrangler.deploy.jsonc
# Override CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 if Doppler has POS account
```

## Rollback plan

1. Set Worker secret / var `FLUTTER_WEB_CUTOVER=false` (or remove `src/server.ts` dispatch) and redeploy **previous** TanStack-only `dist/`.
2. No DNS rollback. No Supabase rollback (same backend).
3. Native TestFlight Flutter IPAs unaffected (bundled UI, not prod web).
4. Keep `flutter/build/web` artifacts and `_flutter/` merge out of deploy until a verified staging cutover (recommended: `workers.dev` or branch preview).

Rollback time target: one Worker redeploy (< 5 min) if TanStack `dist/` artifact is retained.

## When `:8080` TanStack dev retires vs stays

| Concern | `:8080` (`bun run dev`) | `:8765` (`./scripts/flutter-web-serve.sh`) |
|---------|-------------------------|---------------------------------------------|
| **Lovable design iteration** | **Keep indefinitely.** Lovable owns TanStack UI on `lovable/redesign`; Cursor reviews merges here. | N/A for marketing/design |
| **Marketing page edits** | **Keep** until marketing moves off TanStack (not planned). | N/A |
| **Worker API / secrets / SSR** | **Keep** — only local runtime with full Worker parity via Vite + `src/server.ts`. | Flutter web calls prod Worker APIs (`WORKER_API_BASE_URL`) |
| **Signed-in app UX review** | **Optional after cutover** — TanStack `_app` becomes legacy/rollback reference. | **Primary** for Flutter app QA |
| **CI gates** | **Keep** — `tsc`, `build`, Playwright smoke, em-dash, types checks run against TanStack tree. | `flutter analyze` + `flutter test` separate |

**Summary:** `:8080` does **not** retire when Flutter web ships on prod. It remains the Lovable design sync surface, marketing dev server, and Worker/backend dev environment. Only the **production** signed-in web experience moves from TanStack `_app` to Flutter web. `:8765` stays the local Flutter web preview (parity with prod Flutter routes after cutover).

## Verification (local, pre-prod)

```bash
# Flutter gates
cd flutter && flutter analyze lib/ && flutter test

# Full cutover build (TanStack + Flutter web + merge)
bun run build:prod:flutter-web

# Merge only (after both builds exist; safe to re-run)
./scripts/merge-flutter-web-assets.sh

# Preview (local static server; all routes served by Flutter, not Worker dispatch)
./scripts/flutter-web-serve.sh --rebuild
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8765/
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8765/today

# TanStack gates (unchanged)
bun run check:em-dash && bun run check:supabase-types && bunx tsc --noEmit && bun run build

# Deploy bundle dry-run (no publish; confirms dist/client/_flutter in ASSETS)
doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c '
  CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler deploy -c wrangler.deploy.jsonc --dry-run
'
```

## Staging smoke (`workers.dev`, no prod deploy)

**Purpose:** Validate Worker path dispatch (`FLUTTER_WEB_CUTOVER=true`) before touching
`www.purplelife.org`. Staging uses a **separate Worker name** and **no zone routes** so prod
DNS is unchanged.

### Prerequisites

- [ ] `bun run build:prod:flutter-web` exits 0
- [ ] `dist/client/_flutter/index.html` and `dist/client/_flutter/main.dart.js` exist
- [ ] `./scripts/merge-flutter-web-assets.sh` re-run succeeds (idempotent)
- [ ] `wrangler deploy --dry-run` reports ASSETS binding with `_flutter/` artifacts
- [ ] `flutter analyze lib/` and `flutter test` pass on `lovable/redesign`

### Staging deploy (agents run; owner approval for prod only)

```bash
# 1. Build merged artifact (same as prod cutover)
bun run build:prod:flutter-web

# 2. Deploy to workers.dev ONLY (no purplelife.org routes)
doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c '
  CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler deploy -c wrangler.deploy.jsonc \
    --name purplelife-staging \
    --routes "" \
    --var FLUTTER_WEB_CUTOVER:true
'

# 3. Note the workers.dev URL from deploy output, e.g.:
#    https://purplelife-staging.<account>.workers.dev
```

**Rollback staging:** redeploy with `--var FLUTTER_WEB_CUTOVER:false` or delete the
`purplelife-staging` Worker in Cloudflare dashboard. Prod unaffected.

### HTTP smoke checklist

Replace `STAGING` with the deploy URL (no trailing slash). All checks use `curl -sS -o /dev/null -w '%{http_code}\n'`.

| # | Request | Expected | Pass |
|---|---------|----------|------|
| 1 | `GET STAGING/` | `200` TanStack marketing HTML (not Flutter shell) | [ ] |
| 2 | `GET STAGING/pricing` | `200` TanStack SSR | [ ] |
| 3 | `GET STAGING/today` | `200` Flutter SPA (`/_flutter/index.html` body) | [ ] |
| 4 | `GET STAGING/meds` | `200` Flutter SPA | [ ] |
| 5 | `GET STAGING/sign-in` | `200` Flutter SPA | [ ] |
| 6 | `GET STAGING/_flutter/main.dart.js` | `200` JS bundle | [ ] |
| 7 | `GET STAGING/_flutter/sqlite3.wasm` | `200` Drift wasm | [ ] |
| 8 | `GET STAGING/_flutter/drift_worker.js` | `200` Drift worker | [ ] |
| 9 | `GET STAGING/api/health` (or known public API) | `200` or `401`, not static 404 | [ ] |
| 10 | `GET STAGING/oauth/oura/callback` | Worker handler (not Flutter 404) | [ ] |

**Body spot-checks (optional):**

```bash
curl -sS "STAGING/today" | head -5          # expect Flutter index.html (<!DOCTYPE html> + flutter_bootstrap)
curl -sS "STAGING/" | head -5               # expect TanStack/React SSR markup, not flutter_bootstrap
curl -sS "STAGING/_flutter/main.dart.js" | wc -c   # expect multi-MB bundle (> 1_000_000)
```

### Signed-in functional smoke (staging)

Use Doppler E2E creds (`E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` from
`cursor-cloudflare` / `prd_cloudlfare`). Reference account with rich data:
`pmt@eigital.com` (see `docs/FLUTTER-STAGE1-SIGNOFF.md`).

| # | Flow | Expected | Pass |
|---|------|----------|------|
| 11 | Sign in at `STAGING/sign-in` | Lands on `/today`; no infinite spinner | [ ] |
| 12 | `/today` | Real scores or honest empty state; no fake vitals | [ ] |
| 13 | `/meds` | Dose list loads (cache or network) | [ ] |
| 14 | `/vitals` | Shell loads; symptom radar may be empty (known gap) | [ ] |
| 15 | `/journal` | Entries list or empty state | [ ] |
| 16 | `/tools` | Wearable connect cards render | [ ] |
| 17 | Burger menu → Account / Settings | `endDrawer` opens; navigation works | [ ] |
| 18 | Deep link `STAGING/meds/history` (if routed) | Flutter SPA 200, client router resolves | [ ] |

### OAuth / API notes for staging

- Staging hostname is **not** registered in Oura/Whoop redirect URIs by default. Wearable
  OAuth connect on staging may fail until `https://purplelife-staging.<account>.workers.dev/oauth/*/callback`
  is added in provider consoles (or test OAuth only on prod `:8080` / local `:8765`).
- Flutter web on staging calls `WORKER_API_BASE_URL=https://www.purplelife.org/api` (baked at
  build). API smoke on staging validates **routing**, not cross-host API unless build defines
  are changed to point at staging.
- For full API+Flutter integration smoke, either (a) add staging Worker API base to Flutter
  build defines, or (b) run cutover smoke on prod with flag off first, then staging with same
  host (owner decision).

### Staging → prod promotion gate

Do **not** set `FLUTTER_WEB_CUTOVER=true` on prod `purplelife` Worker until:

1. All HTTP smoke rows 1–10 pass on `purplelife-staging.*.workers.dev`
2. Signed-in rows 11–17 pass (or documented known gaps accepted)
3. `flutter-phase5-nogo` gaps reviewed with owner
4. Explicit owner reply `approved` for prod deploy (`docs/SYNC-AND-RELEASE.md`)

Prod promotion (manual only, after approval):

```bash
bun run build:prod:flutter-web
doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c '
  CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID:-08e766e92db74bc7ef14c6b5c86bddf0} \
  bunx wrangler deploy -c wrangler.deploy.jsonc --var FLUTTER_WEB_CUTOVER:true
'
```

## Deploy blockers (current)

| Blocker | Detail |
|---------|--------|
| **flutter-phase5-nogo** | Feature gaps vs TanStack `_app` (Vitals depth, Tools stats, Settings export/2FA, journal capture, reports). |
| **Staging smoke not executed** | Checklist below is documented; `purplelife-staging` workers.dev deploy + rows 1–17 still pending. |
| **Manual deploy policy** | Redesign phase: owner approval required for prod (`docs/SYNC-AND-RELEASE.md`). |
| **E2E coverage** | Playwright prod smoke assumes TanStack `_app` routes; update or scope-skip before prod flag on. |
| **Partial route map** | `/admin/*`, `/biometrics/*`, `/my-health*`, `/insights`, `/timeline`, `/friends/*`, `/community-new`, `/apple-health-import`, `/condition/*`, full `/reports/*` lack Flutter ports; need TanStack fallback or delay. |
| **OAuth redirect URIs** | Oura/Whoop consoles lack `purplelife-staging.*.workers.dev` callbacks; native URI registration still open (`docs/OPEN-ISSUES.md` **oura-native-redirect-console**). |
| **Marketing dual stack** | Flutter GoRouter has marketing routes for `:8765` preview; Worker cutover keeps marketing on TanStack SSR. Confirm intentional before prod. |

## Operator sign-off

Reply `approved` with explicit prod deploy consent after gates pass and staging smoke. Until then, this document is the implementation spec only.
