# Flutter web cutover at www.purplelife.org (Phase 5, Stage 7)

**Status:** Plan and scaffold only. **Do not deploy production** without gate pass and explicit owner approval.

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

### 3. Merge Flutter into deploy assets (to implement)

Add a merge step **after both builds** (not wired in CI yet):

```bash
# Planned layout — implement in scripts/merge-flutter-web-assets.sh (future)
FLUTTER_DEST="dist/client/_flutter"
rm -rf "${FLUTTER_DEST}"
mkdir -p "${FLUTTER_DEST}"
cp -R flutter/build/web/. "${FLUTTER_DEST}/"
```

Using a `_flutter/` prefix avoids filename collisions with TanStack hashed assets (`assets/*.js`).

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
| 2 | `scripts/merge-flutter-web-assets.sh` | **New (future)** — copy `flutter/build/web` → `dist/client/_flutter/` |
| 3 | `package.json` | **Future** — `"build:prod:flutter-web"`: TanStack build + Flutter build + merge |
| 4 | `src/server.ts` | **Future** — `isFlutterAppPath()`, static asset routing, SPA fallback via `ASSETS` |
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

# Prod-style Flutter web build
./scripts/flutter-web-build-prod.sh

# Preview (local static server)
./scripts/flutter-web-serve.sh --rebuild
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8765/

# TanStack gates (unchanged)
bun run check:em-dash && bun run check:supabase-types && bunx tsc --noEmit && bun run build
```

## Deploy blockers (current)

| Blocker | Detail |
|---------|--------|
| **flutter-phase5-nogo** | Feature gaps vs TanStack `_app` (Vitals depth, Tools stats, Settings export/2FA, journal capture, reports). |
| **No merge + server dispatch** | `merge-flutter-web-assets.sh` and `src/server.ts` routing not implemented yet. |
| **Manual deploy policy** | Redesign phase: owner approval required (`docs/SYNC-AND-RELEASE.md`). |
| **E2E coverage** | Playwright prod smoke assumes TanStack `_app` routes. |
| **Partial route map** | Admin/biometrics/reports routes lack Flutter ports; need fallback strategy. |
| **Staging** | No `workers.dev` Flutter cutover smoke yet (recommended before prod). |

## Operator sign-off

Reply `approved` with explicit prod deploy consent after gates pass and staging smoke. Until then, this document is the implementation spec only.
