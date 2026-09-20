# Step 6: www.purplelife.org Ploy Astro flip — dry-run & cutover runbook

**Status:** DRY-RUN ONLY (2026-09-20). **Do not deploy the design flip to `purplelife` (www)** until GO criteria below are met and the operator explicitly approves.

**Context:** Ploy Astro UI + live prod D1/R2 is validated on **staging.purplelife.org** (`purplelife-staging`). **www** still serves TanStack (`purplelife` Worker + `wrangler.deploy.jsonc`). `purplelife-design` Worker was deleted (Step 5).

---

## GO / NO-GO (operator)

| # | Criterion | Status (2026-09-20) | GO? |
|---|-----------|---------------------|-----|
| 1 | Staging smoke pass (login + live pages) | **PASS** (shells 200; Step 3 auth live @ `f75dfcc1`) | Yes |
| 2 | `purplelife-design` removed; www + staging healthy | **PASS** (operator Step 5) | Yes |
| 3 | PR #44 merged to `main` (Ploy + staging infra) | **NO** — draft, CI red | **No** |
| 4 | PR #45 merged to `main` (OAuth/CORS) | **NO** — draft; **deployed to www from branch** but unmerged | **No** |
| 5 | Trunk CI green (`main`) | **NO** — pre-existing `entities`/`vite.config` failure | **No** |
| 6 | **www hybrid Worker entry** (`www-entry.ts` + `wrangler.deploy.ploy.jsonc`) | **NOT IN REPO** — required before flip | **No** |
| 7 | Live-data gaps acceptable or wired | **PARTIAL** — `/reports/new`, vitals, insights still mock on staging | **No** |
| 8 | Responsive / visual QA on staging | **NOT SIGNED OFF** | **No** |
| 9 | OAuth provider consoles (Google/Apple/Whoop) | **PARTIAL** — see blockers §8 | **No** |
| 10 | Rollback version ID recorded | **Operator** — run §5 before flip | Pending |
| 11 | Explicit owner approval for www design flip | **Required** | Pending |

**Verdict today:** **NO-GO** for www design flip. **GO** for continued staging QA and completing merge/infra blockers.

---

## 1. Open PR summary

### PR #44 — [feat(staging): Ploy Astro + live data + auth](https://github.com/x21ai/PurpleLifeAi/pull/44)

| Field | Value |
|-------|-------|
| Branch | `cursor/ploy-astro-staging-5b1c` → `main` |
| State | **Open draft** |
| Head | `b81e55cd` |
| Scope | ~2,627 files — full `ploy-staging/` tree, `wrangler.staging.jsonc`, staging Worker, live-data pages, real auth |
| Deploy target | **`purplelife-staging`** only (staging.purplelife.org) |
| Live deploy | Steps 2–3 reported @ `ee4e187b` / `f75dfcc1` (operator) |
| Merge conflicts | **None** with `main` |
| CI | **All failed** — same pre-existing trunk break (see §3) |

**Delivers:** Staging Worker routing (`staging-entry.ts`), live `/today`, `/journal`, `/meds`, `/reports`, `/tools`, `/login`, prod D1/R2 bindings, proxied `/api/*` → `purplelife`.

**Does not deliver:** www flip Worker, marketing parity sign-off, `/reports/new` live wiring.

### PR #45 — [fix(oauth): CORS + OAuth allowlists](https://github.com/x21ai/PurpleLifeAi/pull/45)

| Field | Value |
|-------|-------|
| Branch | `cursor/oauth-cors-hardening-1547` → `main` |
| State | **Open draft** |
| Head | `97c2f568` |
| Scope | 12 files — `oauth-allowed-origins.ts`, `flutter-api-cors.ts`, callback validation, `check:oauth-cors`, `docs/OAUTH-CORS-AUDIT.md` |
| Deploy target | **`purplelife` (www)** |
| Live deploy | **Operator deployed OAuth/CORS to www from branch** (Step 4); PR **not merged** |
| Merge conflicts | **None** with `main` |
| CI | **All failed** — same trunk break |

**Note:** www may already run hardened CORS/OAuth while `main` lacks those commits until merge + future deploys.

---

## 2. Merge readiness & recommended order

### Trunk blocker (fix first)

All PR CI jobs fail before gates run:

```
ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './decode' is not defined by "exports" in entities/package.json
```

(via `cheerio` → `htmlparser2` when loading `vite.config.ts`). Present on **`main` since ≥ 2026-09-15**. Not caused by #44 or #45.

**Action:** Fix dependency/`entities` resolution on `main`, confirm CI green, then merge PRs.

### Recommended merge order

1. **Fix trunk CI** on `main` (entities/cheerio/vite).
2. **Merge #45** (small, www OAuth/CORS; already deployed — reconcile `main` with prod).
3. **Rebase #44** onto updated `main` if needed; run `bun run build:staging:ploy`; merge #45 already in tree.
4. **Merge #44** (large; brings `ploy-staging/` + staging docs/scripts).
5. **New PR:** www hybrid Worker (`www-entry.ts`, `wrangler.deploy.ploy.jsonc`, `build:ploy:www`, prod env vars) — **required before flip**.
6. Extended staging QA → owner sign-off → **then** www flip deploy.

**Do not merge #44 or #45 while CI is red** unless operator explicitly accepts bypass (not recommended).

---

## 3. Target architecture (www after flip)

Same **hostname** and **Worker name** (`purplelife`); only the **page layer** changes from TanStack SSR to Ploy Astro.

```
Request → purplelife Worker (www.purplelife.org)
  /api/*, /oauth/*  → TanStack server bundle (dist/server/server.js)  [UNCHANGED]
  crons / webhooks  → TanStack scheduled + /api/public/*               [UNCHANGED]
  everything else   → Ploy Astro assets (ploy-staging/dist/client) + SSR [NEW]
```

**Unlike staging:** www does **not** proxy `/api/*` to another Worker — API stays in-process (today’s `src/server.ts` behavior).

**Unchanged after flip:**

| Resource | Notes |
|----------|--------|
| D1 `purplelifeai` | Same database; staging already uses prod D1 `8d0be2b3-…` on eigital account |
| R2 `purplelifeai` | Same bucket |
| OAuth redirect URIs | Still `https://www.purplelife.org/oauth/{google,apple,oura,whoop}/callback` |
| Flutter API | `WORKER_API_BASE_URL=https://www.purplelife.org/api` — no change |
| JWT / auth | `POST /api/auth/sign-in`, `purple-cf-session` localStorage |
| DNS | `www` + apex → Worker `purplelife` |
| `purplelife-staging` | Keep for pre-flip QA until operator retires it |

**Account ID:** Always deploy with `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0` (eigital). Repo `wrangler.deploy.jsonc` may list POS account id — **override at deploy** (see `docs/DECISIONS.md`).

---

## 4. Preflight checks (staging smoke — run before any www flip)

**Base:** `https://staging.purplelife.org`  
**Auth:** Real sign-in (Step 3). Password from operator/Doppler — not in repo.

### 4.1 Automated shell checks

```bash
BASE=https://staging.purplelife.org

# Auth hardening
curl -sS -o /dev/null -w "design-preview mint %{http_code}\n" \
  "$BASE/api/public/design-preview/session"    # expect 404

curl -sS -o /dev/null -w "/login %{http_code}\n" "$BASE/login/"   # expect 200

# Live page shells (200; data requires browser sign-in)
for p in /today/ /journal/ /journal/new/ /meds/ /meds/history/ \
         /reports/ /reports/documents/ /documents/ /tools/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done
```

**2026-09-20 agent check:** mint **404**; `/login`, `/today`, `/journal`, `/meds`, `/reports`, `/tools` all **200**.

### 4.2 Browser QA checklist (signed-in)

1. Open `/login` → sign in as `pmt@eigital.com` (prod password).
2. Amber banner shows email; **Sign out** works.
3. **`/today`** — live status chips + narrative (not sample toggles).
4. **`/journal`** — live entry count; **`/journal/new`** — insert succeeds.
5. **`/meds`**, **`/meds/history`** — live doses (may be empty for pmt).
6. **`/reports`**, **`/reports/documents`** — live `report_documents` (operator smoke: 119 docs).
7. **`/tools`** — Oura / Whoop / Apple token status (read-only).
8. Spot-check mobile width (375px) and desktop (1024px) for layout regressions.

### 4.3 www baseline (must stay healthy — do not flip if red)

```bash
curl -sS -o /dev/null -w "www / %{http_code}\n" https://www.purplelife.org/
curl -sS -o /dev/null -w "www /sign-in %{http_code}\n" https://www.purplelife.org/sign-in
curl -sS -o /dev/null -w "www /api/auth/sign-in OPTIONS %{http_code}\n" \
  -X OPTIONS https://www.purplelife.org/api/auth/sign-in
```

**2026-09-20:** `/` and `/sign-in` **200**.

---

## 5. Rollback plan (www)

**Before flip:** record current production Worker version.

```bash
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler versions list --name purplelife -c wrangler.deploy.jsonc
```

Save the **version id** and deploy timestamp in the handoff log.

### Rollback options (fastest first)

1. **Wrangler rollback** (same config file used for flip deploy):

```bash
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler rollback -c wrangler.deploy.ploy.jsonc   # after flip exists
# Or rollback wrangler.deploy.jsonc if flip used that name
```

2. **Redeploy last-known-good TanStack build** from saved git tag/commit:

```bash
git checkout <pre-flip-commit>
bun run build:prod
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler deploy -c wrangler.deploy.jsonc
```

3. **DNS rollback** — only if Worker routes were changed (not expected; same `purplelife` Worker).

**Data safety:** Flip changes **UI + Worker script only**. D1/R2 are not migrated or wiped. Rollback does not undo user writes made during Ploy UI window.

**Staging fallback:** Keep `staging.purplelife.org` on `purplelife-staging` until www flip is stable 24h+.

---

## 6. Cutover deploy commands (FUTURE — not for dry-run)

**Prerequisite:** `www-entry.ts` + `wrangler.deploy.ploy.jsonc` merged (not in repo as of Step 6).

### 6.1 Pre-deploy (operator)

```bash
# Gates
bun run check:em-dash
bun run check:oauth-cors
bun run check:live-data

# API bundle (TanStack — unchanged)
bun run build:prod

# Ploy Astro for www (prod URL + live data flag — exact script TBD in www PR)
# Proposed:
# VITE_PLOY_LIVE_DATA=1 PUBLIC_SITE_URL=https://www.purplelife.org \
#   bun run build:ploy:www
bun run build:staging:ploy   # interim: same Astro tree; swap when www build script lands
```

### 6.2 Deploy www flip (explicit owner approval only)

```bash
# DRY-RUN: validate bundle size and bindings without publishing
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler deploy -c wrangler.deploy.ploy.jsonc --dry-run

# LIVE (when GO):
CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 \
  doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx wrangler deploy -c wrangler.deploy.ploy.jsonc
```

**Expected config (to be added in follow-up PR):**

| Setting | Value |
|---------|--------|
| `name` | `purplelife` |
| `routes` | `www.purplelife.org/*`, `purplelife.org/*` |
| `main` | `ploy-staging/worker/www-entry.ts` (routes `/api/*` → TanStack, else Astro) |
| `assets.directory` | `ploy-staging/dist/client` |
| D1 / R2 / KV | Same bindings as current `wrangler.deploy.jsonc` |
| `vars.PUBLIC_SITE_URL` | `https://www.purplelife.org` |
| Crons | Preserved from current deploy config |

---

## 7. Post-flip smoke (www)

Run within 15 minutes of deploy; rollback if any P0 fails.

```bash
BASE=https://www.purplelife.org

# Marketing + auth shells
curl -sS -o /dev/null -w "/ %{http_code}\n" "$BASE/"
curl -sS -o /dev/null -w "/sign-in %{http_code}\n" "$BASE/sign-in"
curl -sS -o /dev/null -w "/login %{http_code}\n" "$BASE/login"

# API health (no auth)
curl -sS -o /dev/null -w "POST sign-in unauth %{http_code}\n" \
  -X POST "$BASE/api/auth/sign-in" -H "Content-Type: application/json" -d '{}'

# OAuth CORS preflight (Flutter web dev origin)
curl -sS -o /dev/null -w "OPTIONS care/today %{http_code}\n" \
  -X OPTIONS "$BASE/api/care/today" \
  -H "Origin: http://127.0.0.1:8765" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization"
```

**Browser (signed-in):** Repeat §4.2 on **www** — `/today`, `/journal`, `/meds`, `/reports`, `/tools`.

**Flutter native:** Smoke sign-in + Today on TestFlight build (no rebuild required for UI-only www flip).

**Apple Health webhook:** `GET /api/public/hooks/apple-health?token=…` still returns 200 for valid token.

---

## 8. Blockers still open

| Blocker | Severity | Owner | Notes |
|---------|----------|-------|-------|
| Trunk CI (`entities`/`vite`) | **P0 merge** | Cursor | Blocks #44/#45 merge |
| **`www-entry` Worker not implemented** | **P0 flip** | Cursor | Staging uses `staging-entry.ts` + PROD proxy; www needs in-process API split |
| **`wrangler.deploy.ploy.jsonc` missing** | **P0 flip** | Cursor | No safe deploy path to www yet |
| PR #44 draft + 94k line diff | **P1 merge** | Cursor + review | Needs squash review strategy |
| PR #45 unmerged while www deployed | **P1 drift** | Cursor | Reconcile `main` with prod Worker code |
| `/reports/new` not live on staging | **P2 product** | Cursor | Mock page; follow-up before or after flip |
| Vitals / insights / biometrics depth | **P2 product** | Cursor | Mock on staging |
| Responsive / visual gaps | **P2 QA** | Design + Cursor | No Playwright coverage for Ploy yet |
| **Google Cloud OAuth** (pmt@x21.com) | **P2 auth** | Operator | Confirm `https://www.purplelife.org/oauth/google/callback` registered |
| **Apple Developer** `org.purplelife.web` | **P2 auth** | Operator | Return URL for www Apple sign-in |
| **Whoop native redirect** | **P2 Flutter** | Operator | `org.purplelife.app://oauth-whoop-callback` in Whoop portal (`whoop-native-redirect-console`) |
| Flutter rebuild for OAuth | **P3** | Cursor | Not required for Ploy www flip; required only if bundle/deep links change |
| `wrangler.deploy.jsonc` D1 id vs live | **P2 ops** | Operator | File shows `bfb642b9-…`; staging uses `8d0be2b3-…` on eigital — verify live binding before flip |

---

## 9. Related docs

| Doc | Purpose |
|-----|---------|
| `docs/DEPLOY-STAGING-PLOY.md` | Staging build/deploy (on PR #44 branch) |
| `docs/OAUTH-CORS-AUDIT.md` | OAuth + CORS matrix (PR #45) |
| `mem/native-wearable-oauth-redirects.md` | Oura/Whoop redirect URIs |
| `docs/FLUTTER-WEB-CUTOVER.md` | Separate track (Flutter web on www, not Ploy) |
| `docs/LOVABLE-REDESIGN-WORKFLOW.md` | Lovable vs Cursor ownership |

---

## 10. Dry-run completion log (template)

Operator fills this after running §4–§5 without deploying www:

```
Date (UTC):
Staging deploy commit: f75dfcc1 (confirm current)
Preflight §4.1: PASS / FAIL
Browser §4.2: PASS / FAIL
www baseline §4.3: PASS / FAIL
purplelife version id (pre-flip): ___________
GO / NO-GO for www flip: ___________
Approver:
```
