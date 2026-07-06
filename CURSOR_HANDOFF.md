# Cursor Handoff

Operational state of the PurpleLife project for the next agent or engineer. Last updated: 2026-07-06 ~14:15 ET (TestFlight observability rule + TF21 triage).

**Recent (2026-07-06 ~14:15 ET): Permanent TestFlight observability rule.** `.cursor/rules/flutter-testflight-observability.mdc` now `alwaysApply: true`: triage **all** Luciq crashes + ASC feedback before/after every upload. TF21 triage: ASC **18** screenshot submissions, **0** crash logs; Luciq MCP **0** crashes/bugs on `flutter-purple` beta. Share Beta Feedback requires TestFlight **2.3+** and enabled group feedback (not internal-vs-external); alternatives in `mem/observability/testflight-beta-feedback.md`. Commands: `bun run ios:check-tf-feedback`, Luciq MCP `list_crashes`.

**Recent (2026-07-06 ~13:10 ET): TestFlight 1.0 (21) LIVE.** `flutter/pubspec.yaml`
`1.0.0+21`. Gates: `flutter analyze lib/` clean, `flutter test` **135/135**.
`doppler run --project purple-life --config prd -- bun run ios:testflight` →
**EXPORT SUCCEEDED**. ASC: **1.0 (21) processing=VALID**, internal + external
**IN_BETA_TESTING** (Founding Team). Includes native reset deep link
(`auth_deep_link.dart`), `friendlyAuthError`, glass migration on top 5 screens.
**Verify on device:** forgot-password → email → `org.purplelife.app://reset-password`
→ reset screen. `bun run ios:check-asc-builds` to poll status.

**Prior (2026-07-06 ~10:32 ET): Password-reset E2E verified + TTL UX LIVE.** Worker
Version ID **`079af4f1-eccb-4789-8c7c-648ba7d55621`**. Recovery TTL **`mailer_otp_exp=3600`**
(1 hour). UX: reset-sent warns latest-email-only + TTL; expired reset steers to sign-in
with password first. Verify: `curl -s https://www.purplelife.org/assets/auth-recovery-*.js`
(chunk name changes per build). Flutter auth tests **9/9**. TF21+ still required for native
`org.purplelife.app://reset-password`. Runbook: `mem/auth-password-reset.md`.

**Prior (2026-07-06 ~10:30 ET): `pmt@eigital.com` blocked on forgot-password loop — use temp password, not reset email.** Corporate `@eigital.com` mail quarantines Purple recovery emails: Resend shows **delivered** (`notify.purplelife.org`) but inbox never receives them (6+ recovery sends 2026-07-06, all `sent` in `email_send_log`, Resend `last_event: delivered`). **Ops:** rotate temp password via `auth.admin.updateUserById` (Doppler `SERVICE_ROLE_KEY`); value not stored in repo/docs. User should **sign in with temp password**, change password in Account, and **stop using forgot-password** until IT allowlists `notify.purplelife.org` (or uses a non-corporate email). No alternate email on profile (only `pmt@eigital.com` + phone). Runbook: `mem/auth-password-reset.md` incident table.

**Prior (2026-07-06 ~09:45 ET): Auth password-reset fixes LIVE on prod.** Worker
Version ID **`bdf1f37a-9fbf-41f5-b0dc-46cbae616c94`**. Admin reset uses
`resetPasswordForEmail` (not `generateLink`); web forgot-password shows rate-limit
friendly copy; expired reset CTA → `/sign-in?reset=expired`; recovery email webhook
fallback redirect → `/reset-password`. Verify: `curl -s -o /dev/null -w '%{http_code}'
https://www.purplelife.org/reset-password` (200). Native deep-link reset still
requires **TF21+** (TF20 lacks `auth_deep_link.dart`). Runbook: `mem/auth-password-reset.md`.

**Prior (2026-07-06 ~09:40 ET): Auth and password reset fixes.** Incident on
`pmt@eigital.com` (primary live-data QA account): post-migration import left **no
password hash** in `auth.users`; ops set a **temporary password via Supabase Admin
API** (value not in repo or docs). Reset emails then appeared expired because (1)
multiple recovery sends invalidate earlier OTPs, and (2) web `/reset-password` did
not run PKCE `exchangeCodeForSession` before showing the form. **Web fix (uncommitted
WIP):** `src/lib/auth-recovery.ts` `bootstrapRecoverySessionFromUrl()` +
`src/routes/reset-password.tsx` bootstrap on mount. **Native fix (same WIP):**
`flutter/lib/core/auth/auth_deep_link.dart` handles
`org.purplelife.app://reset-password` via `app_links` + `getSessionFromUrl`;
`auth_redirect_uris.dart`, `reset_password_screen.dart`, Android intent filter.
**Supabase:** `org.purplelife.app://reset-password` added to Auth redirect allow
list (dashboard). **Not on TestFlight yet:** TF20 lacks native deep-link code;
**TF21+** upload required for device reset flow. Full runbook:
`mem/auth-password-reset.md`; issues in `docs/OPEN-ISSUES.md`
(`auth-reset-pkce-web`, `auth-reset-native-tf21`).

**Prior (2026-07-06 ~09:10 ET): Oura native redirect verified.** Owner registered
`org.purplelife.app://oauth-oura-callback` in Oura Cloud. Live probe: authorize URL
with that `redirect_uri` returns **HTTP 302** to Oura login; unregistered URI returns
**400 invalid_request**. Flutter `wearable_oauth_test.dart` **14/14 PASS**. Whoop native
URI still needs console registration. Device E2E (Tools → Connect → token row in
`oura_tokens`) pending on TF20 iPhone.

**Prior (2026-07-06 ~08:10 ET): TestFlight 1.0 (20) shipped.** Bumped
`flutter/pubspec.yaml` to `1.0.0+20` (previous latest was 19 VALID), gates PASS
(`flutter analyze` clean, `flutter test` 124/124), uploaded via `doppler run
--project purple-life --config prd -- bun run ios:testflight`
(`** EXPORT SUCCEEDED **`). ASC: **1.0 (20) processing=VALID,
internal=IN_BETA_TESTING, external=IN_BETA_TESTING** — added to the external
"Founding Team" group (`8ad416f5-8248-48e6-9951-03af3f932b6c`) and submitted
Beta App Review via `scripts/asc-add-build-to-group.mjs 20 "Founding Team"`
(now committed; recovers a helper written during an earlier uncommitted
session). Stale Capacitor build 1 already `expired=true` from a prior fix,
no action needed this round. **Safety note:** extensive uncommitted WIP was
already in the tree (native file/image pickers, AI insights repo, care
dashboard edits) from a different, unrelated session; it was stashed before
the build so only verified code shipped, then restored byte-for-byte after
(`git stash pop`, no conflicts) — still uncommitted, untouched. Only the
version bump + the recovered script were committed: **`879bf8f`**, pushed to
both `lovable/redesign` and `main` (fast-forward, now identical). Full detail:
`docs/HANDOFF.md` 2026-07-06T12:10:00Z log entry.

**Prior:** `POST /api/care/accept`, `POST /api/care/decline`, `GET /api/care/incoming-invites` **deployed to prod** via `doppler run --project cursor-cloudflare --config prd_cloudlfare -- env CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 bunx wrangler deploy --config wrangler.deploy.jsonc` (the account-ID override was required; the first attempt without it uploaded the Worker fine but failed the zone-route attach step). **Worker Version ID `07bbab77-f4de-4501-89c0-e22a52e60941`.** Verified live with curl (no auth): all three routes return **401**, not 404; homepage/`/sign-in` unaffected. Deployed from `main`/`lovable/redesign` @ `d31d2a8` (branches identical). Full detail: `docs/HANDOFF.md` 2026-07-06T02:25:00Z log entry; issue closed in `docs/OPEN-ISSUES.md` `care-accept-server-route`.

**Prior (2026-07-06 ~06:10 ET):** Deleted **22** untracked `" 2"`-suffixed duplicate files + `.flutter-web-serve.pid`. Gates PASS (`check:em-dash`, `tsc`, `flutter analyze`, `flutter test` 124/124). Committed and pushed on `lovable/redesign`: **`574ac0b`** (care incoming-invites route + Flutter client), **`362b9b6`** (auth screen parity), docs commit in same push. **`main` fast-forwarded** to match. Full detail: `docs/HANDOFF.md` 2026-07-06T06:10:00Z log entry.

**Prior (2026-07-06 care close-out):** `care-accept-server-route` P0 closed: new `GET /api/care/incoming-invites` Worker route + Flutter rewire off RLS-blocked direct queries. Deploy NOT run, needs operator approval.

**Prior:** Luciq MCP wired (`luciq:sync-secrets`, `luciq:install-mcp`); `ios:check-luciq` returns `status: "mcp"` (REST 401 expected). Restart Cursor for MCP crash triage on **Flutter - Purple - Beta**.

## AI Worker JSON routes for Flutter (2026-07-06, tsc-only slice, no deploy)

Added three Flutter-callable Worker routes fronting the web-only AI server
fns: `POST /api/ai/summarize-report`, `POST /api/ai/metric-insight`,
`POST /api/ai/daily-insight-cards`. New `src/lib/ai-insights.server.ts`
mirrors `care.server.ts`'s pattern (plain functions taking a user-scoped
Supabase client built from the caller's Bearer JWT + explicit `userId`; RLS
enforces per-user ownership). Logic mirrors `summarizeReport`
(`src/lib/reports.functions.ts`) and `getMetricInsight`/
`getDailyInsightCards` (`src/lib/report-trends.functions.ts`) as of this
commit — those originals were **not modified**. Verify: `bunx tsc --noEmit`
**PASS**. **Not done:** Flutter client wiring, `flutter-api-cors.ts`
allow-list entry (needed for Flutter web), and deploy. Full detail:
`docs/HANDOFF.md` 2026-07-06T02:15:00Z log entry; open item tracked in
`docs/OPEN-ISSUES.md` (Insights/reports AI section).

## Luciq MCP + Doppler (2026-07-05)

| Item | Detail |
|------|--------|
| Sync | `bun run luciq:sync-secrets` — `LUCIQ_OAUTH_TOKEN` from `servers-teamkeys/dev` → `purple-life/prd` as `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` |
| Cursor MCP | `bun run luciq:install-mcp` — merges into `~/.cursor/mcp.json`; **restart Cursor** |
| Check | `bun run ios:check-luciq -- --json` → `dashboardApiConfigured: true`, `status: "mcp"` |
| Triage | Luciq MCP → **Flutter - Purple** beta (`slug=flutter-purple`, `list_crashes`); legacy REST 401 with MCP token is expected |
| Verified 2026-07-05 | MCP HTTP OK; **0 crashes** in Luciq for `flutter-purple`/`purple` beta (ASC crash API also empty) |
| SDK | `LUCIQ_APP_TOKEN` unchanged (TestFlight `--dart-define`) |

Scripts: `scripts/luciq-sync-doppler-secrets.sh`, `scripts/install-luciq-mcp-cursor.sh`, `scripts/luciq-fetch-reports.mjs`.

**Main merge (2026-07-05):** **`main@7fd1bc2`** merged from `lovable/redesign`; gates PASS; pushed to GitHub. No prod deploy.

| Item | Value |
|------|--------|
| Merge tip | `7fd1bc2` (fast-forward from `311d466`) |
| Push | `origin/main` updated |
| Gates | em-dash, live-data, unique-images, lovable-auth, tsc, build:prod, flutter analyze lib/, flutter test 91/91 |
| Deploy | **Not run** (manual approval required) |
## Flutter web cutover (plan only, 2026-07-05)

| Item | Path / command |
|------|----------------|
| Runbook | `docs/FLUTTER-WEB-CUTOVER.md` |
| Prod web build | `./scripts/flutter-web-build-prod.sh` → `flutter/build/web` |
| Local preview | `./scripts/flutter-web-serve.sh --rebuild` → `:8765` |
| TanStack dev (keep) | `bun run dev` → `:8080` for Lovable design + Worker API dev |
| Prod deploy | **Blocked** — needs `server.ts` routing + owner approval |

**Worker changes (future):** merge Flutter into `dist/client/_flutter/`, path dispatch in `src/server.ts`, optional `run_worker_first` in `wrangler.deploy.jsonc`. DNS unchanged.


## Integration verification (2026-07-05 ~09:22 ET)

**Branch:** `lovable/redesign` · **HEAD:** `e1cd69dbeb76d56ed3965ccd9339868e181ab331` (`e1cd69d` feat(flutter): luciq_flutter crash reporting)

| Gate | Status |
|------|--------|
| `git pull origin lovable/redesign` | **Already up to date** (re-fetch at ~09:22 ET, no settings/TF commits) |
| `flutter analyze lib/` | **PASS** (0 issues) |
| `flutter test` | **46/46 PASS** |
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** (release build, Drift wasm copied, :8765 restarted) |
| `curl http://127.0.0.1:8765/` | **200** |
| Browser `#/settings` | **PASS** — hub cards + scroll sections (YOUR HEALTH, PEOPLE, conditions, AI, export) |
| Browser `#/account` | **PASS** — stays on `#/account`; city text field visible (`e.g. Brooklyn`); timezone label "New York" |

**Verify:**
```bash
git pull origin lovable/redesign && git rev-parse HEAD
cd flutter && flutter analyze lib/ && flutter test
./scripts/flutter-web-serve.sh --rebuild
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/
# Browser: http://127.0.0.1:8765/#/settings and /#/account (signed-in session)
```

**Session start:** read `docs/HANDOFF.md` (snapshot + log), `docs/DECISIONS.md`, and
`docs/OPEN-ISSUES.md` first (`.cursor/rules/00-handoff.mdc`). This file is extended
operational detail; append task completion to `docs/HANDOFF.md` before claiming done.

## TestFlight 1.0 (15) — install this build (2026-07-05 ~08:05 ET)

**Install TestFlight build:** **1.0 (15)** (`processing=VALID`, ASC build id `e85ac1a5-f547-4cb1-b51b-aa091191ba15`, uploaded 2026-07-05 05:01 PT). Replaces **TF14**, which shipped **before** Settings/`#/account` (`99e836c`) and native Oura (`98d1ec8`).

| Fix | Commit / detail |
|-----|-----------------|
| **Settings scroll** | Settings hub sections scroll correctly (`563f7c2` + compile fix `92e0c0b`) |
| **`#/account` deep link** | `RouterRefreshNotifier`, stable GoRouter, `resolvePlatformInitialLocation()` — no bounce to `#/today` (`99e836c`) |
| **Oura native** | Custom-scheme OAuth deep link + inline Tools errors (`98d1ec8`) |
| **Apple Health** | Keychain connect flag, no bool auth gate, user-visible errors (`92e0c0b` health slice) |

| Gate | Status |
|------|--------|
| `flutter analyze lib/` | **PASS** (0 issues) |
| `flutter test` | **46/46 PASS** |
| `pubspec` | **1.0.0+15** |
| ASC | **1.0 (15) VALID** |

**Verify:**
```bash
doppler run --project purple-life --config prd -- node scripts/asc-list-builds.mjs
cd flutter && flutter analyze lib/ && flutter test
```
1. Install **1.0 (15)** from TestFlight (not 14).
2. Cold-open `purplelife://` or web `#/account` — stays on Account.
3. Tools → Oura connect (native deep link return).
4. Tools → Apple Health Connect + Sync now.

**Upload:** `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer doppler run --project purple-life --config prd -- bun run ios:testflight` (build 15, 2026-07-05).

---

## Settings + Account P0 (2026-07-05 ~08:00 ET) — in TF15

**Fix:** `#/account` no longer bounces to `#/today` on cold hash nav. Root cause was GoRouter recreation on auth changes; now uses stable router + `RouterRefreshNotifier` + `resolvePlatformInitialLocation()`. `Scaffold.endDrawer` burger menu restored (replaces custom overlay). Settings round 2 (`563f7c2`) merged with WIP.

| Gate | Status |
|------|--------|
| `flutter analyze lib/features/settings/ lib/shell/ lib/features/account/` | **PASS** |
| `flutter test` | **46/46 PASS** |
| Browser `#/account` hash | **PASS** (stays on `#/account`, not `#/today`) |
| Browser `#/settings` hash | **PASS** |
| `pubspec` build | **1.0.0+15** (superseded by TF15 ASC upload) |

**Verify:**
```bash
cd flutter && flutter analyze lib/features/settings/ lib/shell/ lib/features/account/ && flutter test
./scripts/flutter-web-serve.sh --rebuild
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/
# Browser: http://127.0.0.1:8765/#/account and /#/settings (sign in first for profile form)
```

## Apple Health TF14 (2026-07-05 ~07:52 ET) — shipped

**Install TestFlight build:** **1.0 (14)** (`processing=VALID`, `internal=IN_BETA_TESTING`, uploaded 2026-07-05 04:49 PT). Replace TF13 for Apple Health verification.

| Fix | Detail |
|-----|--------|
| **Auth gate** | iOS `requestAuthorization` no longer gates on bool (write-only signal); sets Keychain connect flag after sheet (matches Capacitor `health-ios.ts`) |
| **Auth types** | iOS omits VO2_MAX; single `SLEEP_ASLEEP` in auth request; staged sleep read at query time |
| **Persistence** | `FlutterSecureStorage` with `first_unlock_this_device`; verify-after-write on connect flag |
| **Errors** | `HealthServiceException` + SnackBar/`_lastError` on connect, sync, read, Worker failures in Tools panel + welcome card |
| **Entitlements** | `Runner.entitlements` `com.apple.developer.healthkit`; `Info.plist` `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription` unchanged |

**Verify on device (TF14):**
```bash
# ASC
doppler run --project purple-life --config prd -- node scripts/asc-list-builds.mjs
# Gates (already run pre-upload)
cd flutter && flutter analyze lib/features/health/ && flutter test test/health_service_test.dart
```
1. Install **1.0 (14)** from TestFlight.
2. Tools → Apple Health → **Connect** → grant HealthKit sheet.
3. Expect SnackBar "Apple Health connected" or explicit yellow error (never silent fail).
4. **Sync now** → `apple_health_tokens.last_sync_at` updates when samples exist.

**Commit:** `92e0c0b` (health_service, apple_health_panel, welcome card, pubspec `+14`). Upload via `DEVELOPER_DIR=Xcode-beta bun run ios:testflight`.

## Morning compile fix (2026-07-05 ~07:50 ET) — gates green

**Fix:** Restored `tools_screen.dart` class structure (missing `_pollOuraBackfill` brace), `health_providers.dart` import on `apple_health_panel.dart`, `WearableOAuthListener` in `app.dart`, closed `wearable_oauth_test.dart` group, dynamic `medsForDayProvider` date in `today_screen_render_test.dart`.

| Gate | Status |
|------|--------|
| `flutter analyze lib/` | **PASS** (0 issues) |
| `flutter test` | **44/44 PASS** |
| `curl :8765` | **200** after `./scripts/flutter-web-serve.sh --rebuild` |

**WIP preserved:** Oura OAuth deep link, inline Tools errors, Apple Health panel hardening, Worker CORS for Flutter web (`src/lib/flutter-api-cors.ts`).

## Morning verdict (2026-07-05 ~07:45 ET) — superseded by TF14

**Install TestFlight build:** **1.0 (14)** VALID (see Apple Health TF14 section above). TF13 obsolete for HealthKit fix verification.

| Question | Verdict | Evidence |
|----------|---------|----------|
| Settings fixed? | **Yes on TF14** | `563f7c2` hub + scroll sections; `#/account` hash fix in this session. Travel mode still placeholder. |
| Apple Health connect on TF14? | **Fix shipped, device QA pending** | Auth bool gate removed; Keychain flag; user-visible errors. Install **1.0 (14)** and retest Connect + Sync. |
| Oura connect? | **In TF14** | Native OAuth deep link + inline Tools errors in `92e0c0b`. |
| Gates | **Green** | `flutter analyze lib/`: **0 issues**. `flutter test`: **44/44 PASS**. |
| Phase 5 cutover | **NO-GO** | Account hash redirect; device Apple Health QA on TF14 still required. |

**Completed overnight agents:** Settings round 2 (`563f7c2`, pushed); verify-fleet 3 cycles (docs updated).

**Incomplete / never finished:** Apple Health TF14 (`d053`), Apple Health+Oura e2e (`df80`), Oura backend (`f28feec8`), Settings exhaustive (`d3cfe9f7`), morning doc (`2f2445d3`, no `FLUTTER-MORNING-STATUS.md`), deep test (`aee59c3e`).

**User this morning:** Stay on **TF13** for now. Do not expect Settings round 2 or Apple Health fixes until agents finish WIP, gates green, and **TF14** uploads. No manual QA checklist needed from you.

**Ops:** `:8765` listener was zombie (empty reply); `./scripts/flutter-web-serve.sh --rebuild` restarted at ~07:45 ET.

## Settings + Account web parity round 2 (2026-07-05 overnight)

Fixed broken Settings hub imports on `lovable/redesign` (committed `settings_screen.dart` referenced missing `settings_hub.dart` / `platform_flags.dart`). Wired sub-routes and Account fields to match web.

| Area | Change |
|------|--------|
| **Hub** | `SettingsHubCards` extracted; 3-column grid on wide viewports |
| **Flags** | `platformFlagsProvider` gates Community row (same as web `app_settings`) |
| **Routes** | `/contact` form → `contact_messages`; `/settings/privacy` in-app copy; `/settings/how-purple-thinks` full article; `/reports` labs link |
| **Data** | Client-side ZIP export + soft-delete/restore (web `data-export.ts` parity) |
| **About** | Privacy row → in-app `/settings/privacy` (not external only) |
| **Account** | Hub cards; theme preference persisted (`purple-theme` / SharedPreferences); invite code via Worker `POST /api/account/personal-share-code` |
| **Worker** | New `src/routes/api/account/personal-share-code.ts` (needs deploy for invite in prod) |

**Verify:**
```bash
cd flutter && flutter analyze lib/features/settings/ lib/features/account/ && flutter test   # 34/34 PASS
./scripts/flutter-web-serve.sh --rebuild   # Doppler cursor-cloudflare/prd_cloudlfare
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/   # 200
```

**Browser (`:8765`, rebuilt bundle):** Settings strings present in `main.dart.js`; MCP canvas still poor for Flutter scroll/hash (`#/settings` may not stick on cold hash nav; use bottom-nav Settings tab or drawer). **Travel mode** remains placeholder (web trip CRUD + server-fn schedule gen not ported).

**Still open:** `#/account` hash redirect to Today (pre-existing); full light/system theme rendering; Travel mode screen; Worker deploy for invite API.

## Overnight verify-fleet final (2026-07-05, 3 cycles)

**Schedule:** 15 min initial wait, then cycles at ~02:02 / ~02:50 / ~23:22 ET (30 min spacing; cycle 3 after other agents landed).

| Gate | Cycle 1 | Cycle 2 | Cycle 3 (final) |
|------|---------|---------|-----------------|
| `flutter analyze lib/` | PASS | PASS | **PASS** (0 issues) |
| `flutter test` | 27/27 | 27/27 | **34/34** |
| `curl :8765` | 200 | 200 | **200** (was DOWN mid-gap; `--rebuild` restored) |
| ASC build **11** VALID | **PASS** | **PASS** | **PASS** |
| ASC latest | 11+12 | 11+12 | **13** also VALID (install **1.0 (13)** for beta) |

**Browser (`pmt@eigital.com`):** Today/Meds/Journal/Vitals/Settings hub/Tools **PASS** with real data. Tools OAuth (Oura+Whoop) landed on Flutter web. **Account `#/account` Broken** (redirects to Today). Settings inline sections not scrollable in MCP canvas. Prod hero scores **–** vs Flutter **87/82/58**. **NO-GO** Phase 5 cutover unchanged.

**P0 for other agents:** Account hash redirect; prod hero score dash; Vitals Symptom Radar NO DATA; Settings MCP scroll; mid-rebuild Loading Purple hang; endDrawer unverified in MCP.

Full matrix: `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md` → **Overnight verify fleet**. No commits from verify agent.


| Package | Locked | Latest (pub) | Decision |
|---------|--------|------------|----------|
| `health` | **13.3.1** | 13.3.1 | **Keep** — already current; Apple Health blockers are app-side (`hasPermissions` null), not package version |
| `supabase_flutter` | **2.15.4** | 2.15.4 | **Keep** — at max within `^2.9.0` |
| `url_launcher` | **6.3.2** | 6.3.2 | **Keep** |
| `app_links` | **6.4.1** | 7.2.0 | **Skip major** — OAuth/deep links work on 6.x; 7.x needs migration |
| `go_router` | **14.8.1** | 17.3.0 | **Skip major** — no OAuth/Health blocker in patch line |

**Actions:** No `pubspec.yaml` / `pubspec.lock` changes. `flutter pub upgrade` on blocker set: no-op. **27/27** `flutter test` PASS; `flutter analyze` 8 issues (health uncommitted slice + tests/tools, unchanged by audit).

**iOS health-agent poll:** 6×5 min (~30 min) on `flutter/ios/Runner/Info.plist` + `Runner.entitlements` — **no changes** vs repo; **no TestFlight 14 upload**.

**ASC:** `ios:check-asc-builds` — **1.0 (13)** `processing=VALID`, `internal=IN_BETA_TESTING` (latest install for beta).


## Verify-fleet Cycle 3 (2026-07-05 ~23:05 ET)

Agent-owned browser QA on `:8765` vs `https://www.purplelife.org` (`pmt@eigital.com`, ~390px MCP).

| Gate | Result |
|------|--------|
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** — `curl :8765` **200** |
| `flutter analyze lib/` | **WARN** — 3 issues on uncommitted `health/` + `sharing_screen.dart` (not 0) |
| `flutter test` | **PASS** **27/27** |
| `check:em-dash` (docs) | **PASS** |
| ASC `ios:check-asc-builds` | **PASS** — **1.0 (12)** + **1.0 (11)** VALID |

| Route | Flutter | Prod | Verdict |
|-------|---------|------|---------|
| Today | PASS (87/82/58, narrative, doses) | PASS (hero –, signals HRV/RHR/SpO₂) | **Partial** |
| Vitals | PASS (Readiness LATEST, Radar NO DATA) | PASS (My Body rich narrative) | **Partial** |
| Meds | PASS (63%, Crestor/asprin Taken) | PASS (+ streak, all-meds) | **Partial** |
| Journal | PASS (May 26 entry, filters) | PASS | **Good** |
| Settings hub | PASS (Account/Settings/Tools cards) | PASS (+ Lab/Sharing/Travel below) | **Partial** |
| Tools | PASS (Oura+Whoop connected) | PASS (+ 90d stats, HAE panel) | **Partial** |
| Account `#/account` | **FAIL** — redirects to Today | PASS | **Broken** |
| Care `#/care` | PASS (empty invite state) | — | **Partial** |
| Burger endDrawer | Unverified (MCP coords) | — | **Partial** |
| Sign out | Skipped (session preserve) | — | Open |

**Evidence:** MCP screenshots — Flutter Today scores + gold avatar; Meds timeline 63%; Journal light canvas; Tools Oura 16d / Whoop 3m; Settings hub; prod Today hero dashes vs Flutter 87/82/58; prod My Body 90-day copy; prod Tools HAE Test button.

**P0 for fix agents:** `#/account` redirect; burger drawer MCP/semantics; analyze clean on health slice before next TF upload.

Full matrix: `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md` Cycle 3.

## Overnight phase sweep (2026-07-05)

Flutter features agent (excluding settings/health): hydration repository + screen, risk forecast drilldown, seizure logging form, vitals 7-day metric trends. **34/34** `flutter test`; analyze 0 errors.

## Apple Health overnight fleet (2026-07-05)

**Root cause (recap):** iOS `health` plugin `hasPermissions()` returns `null` for READ; connect flow must trust `requestAuthorization` + secure-storage flag (matches Capacitor `health-ios.ts`).

**This session (`a655ca2`, pubspec **1.0.0+13**):**
- `health_service.dart`: iOS auth without VO2_MAX; staged sleep (LIGHT+REM+DEEP) aggregation; device-auth gating.
- `native_health_autosync.dart` + `native_health_startup.dart`: visit-mode sync (3h throttle on `apple_health_tokens.last_sync_at`), wired in `AuthGate`.
- `apple_health_panel.dart`: web-import note, connected badge, HealthKit copy parity; reload `last_sync_at` from DB after sync.
- `sharing_screen.dart`: full `AppleHealthPanel` (web `AppleHealthCard` on Settings/sharing).
- `welcome_apple_health_card.dart` + `welcome_screen.dart`: optional connect row (web `WelcomeAppleHealthConnect`).
- `wearable_sync.dart`: pull-to-refresh + Today sync includes native HealthKit when device authorized.
- `sync_status_bar.dart`: native iOS `_appleConnected` from HealthKit auth OR token; Tools sync hint when only Apple connected.
- `vitals_screen.dart`: pull-to-refresh triggers wearable + native health sync.
- `health_providers.dart`: shared `healthServiceProvider` + `nativeHealthSyncProvider`.

**Analyze fix (`89d2910`):** settings lint for TestFlight gate — `file_download_web.dart` deprecated import ignore, `const _ThinkCard` on How Purple thinks, `GoRouter.of(this.context)` after account delete; data export helpers + Your data section wiring.

**Verify (agent):**
```bash
cd flutter && flutter analyze lib/features/health/ lib/features/vitals/sync_status_bar.dart lib/features/today/wearable_sync.dart lib/shell/auth_gate.dart  # 0 issues
cd flutter && flutter test test/health_service_test.dart   # 4/4 pass
```

**Verify (iOS device / TestFlight 1.0 (12)):** Dart-only changes; rebuild not required for plist. Re-upload **13+** only if native/ios changes land later.
1. Tools → Apple Health → Connect → HealthKit sheet.
2. Grant sleep/HRV/steps/HR → snackbar sync complete; status **Last synced** from `apple_health_tokens.last_sync_at`.
3. Deny → yellow Settings guidance.
4. Pull-to-refresh on Today/Vitals → native sync when authorized.
5. Airplane mode → offline queue; online auto-flush via `SyncService`.

**USB device:** `00008150-00192C141A87801C` not detected this session (`flutter devices` → macOS + Chrome only). Install TestFlight **1.0 (13)** (`573a788d-cbda-4335-8c69-0e07995db804`, uploaded 2026-07-04 20:09 PT).

**Upload (done):** `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer doppler run --project purple-life --config prd -- bun run ios:testflight` → build **13** uploaded and **VALID**. Analyze gate fix: commit **89d2910** (`flutter analyze lib/` 0 issues; **34/34** tests).

**Commits:** Apple Health `151f491`; analyze/settings gate `89d2910` on `lovable/redesign` (push after handoff sync).

## Ship complete (2026-07-05 ~02:50 ET)

| Item | State |
|------|--------|
| Branch | `lovable/redesign` @ **918c766** (pushed to `origin`) |
| Flutter gates | `flutter analyze lib/` PASS; **27/27** tests |
| `check:em-dash` | PASS |
| Worker prod | **c3ee806d-f9c0-421b-9186-e56c4a7448e5** (`doppler run … CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 bunx wrangler deploy -c wrangler.deploy.jsonc`) |
| Whoop routes | `GET /api/health/whoop-config` → **200** on `www.purplelife.org` |
| TestFlight | **1.0 (12)** `processing=VALID`, `internal=IN_BETA_TESTING` (install latest Flutter native build) |

**Manual (owner console only):** Register OAuth redirect URIs if not already present — prod `https://www.purplelife.org/oauth/whoop/callback`, `https://www.purplelife.org/oauth/oura/callback`; native `org.purplelife.app://oauth-whoop-callback` / `org.purplelife.app://oauth-oura-callback` in Whoop/Oura developer apps.

**Not committed (local junk):** `.flutter-web-serve*.pid`, `Generated 2.xcconfig`, `flutter_export_environment 2.sh`, `flutter/ios/Flutter/Developer.xcconfig` (machine Xcode path).

## Overnight morning summary (2026-07-05)

| Wave | Agent | Result |
|------|-------|--------|
| A Settings + Account | settings-fleet | Hub parity wired; browser QA partial (scroll/blocker) |
| B Apple Health + Tools | health-tools-fleet | HealthKit auth fix + Tools OAuth; **1.0 (12)** ships plist/OAuth |
| C Core tabs | core-fleet | Today/Vitals/Journal/Meds gaps closed; **27/27** tests |
| D Care/Sharing/Reports | routes-fleet | Partial list screens; no invite/upload |
| E Typography | design-fleet | (see design parity section) |
| F Verify | verify-fleet | Cycle 1–3 **complete** (2026-07-05 ~23:05 ET); see Cycle 3 table below |
| **G Ship** | **ship-fleet** | **Package audit: no pub upgrades.** Native hash stable 6×10 min poll; **no duplicate TF upload** (build **12** already VALID, same native code as poll baseline). ASC confirmed **1.0 (12)** `processing=VALID`. |

**Install TestFlight:** Purple for Life → **1.0 (12)** (Apple Health plist + OAuth URL scheme). Build **11** still VALID; build **10** rejected.

## Wave G ship-fleet — package audit + TestFlight (2026-07-05 ~02:36 UTC)

**1. `flutter pub outdated` (blocker packages):**

| Package | Locked | Latest | Action |
|---------|--------|--------|--------|
| `health` (Flutter HealthKit; not Capgo) | **13.3.1** | current | **Keep** — no resolvable bump in outdated report |
| `supabase_flutter` | **2.15.4** (transitive `supabase` 2.13.4) | current | **Keep** — not flagged outdated |
| `go_router` | **14.8.1** | 17.3.0 | **Keep** — major jump; no settings/health blocker |
| Other notable | `drift` 2.28→2.34, `connectivity_plus` 6→7, `flutter_riverpod` 2→3 | — | **Skip** — not blocker scope; minimal semver rule |

14 lockfile entries upgradable via `flutter pub upgrade`; 20 constrained below latest major. **No `pubspec.yaml` changes applied.**

**2. Fleet stability poll (6 cycles × 10 min, max ~50 min):**

- `flutter/ios` + `pubspec.yaml` + `pubspec.lock` status hash **unchanged** all 6 polls (`bc0d8666…`).
- `flutter/lib` changed **60 → 76** files then stable (Dart-only fleet work).
- **Decision:** per operator rule, **do not upload** when native layer unchanged and **1.0 (12)** already VALID with same native code.

**3. ASC poll:** `bun run ios:check-asc-builds` → **1.0 (12)** `processing=VALID`, `internal=IN_BETA_TESTING`, uploaded 2026-07-04 18:55 PT. No build **13** needed overnight.

**4. Skipped:** `bun run ios:testflight` (would duplicate build 12). No commit (operator directive).

## Overnight verify fleet (2026-07-05)

**Cycle 2 (~02:50 ET):** Gates unchanged (analyze PASS, **27/27** test, `:8765` 200, ASC **11+12** VALID). Today spot-check PASS; `#/tools` nav flaky (redirected to Today). Cycles 3 pending.

## Wave 3 Care + Sharing + Reports (2026-07-04 overnight)

Partial web parity (read-only lists, no invite/edit/upload flows yet):

- **`/care`** (`care_index_screen.dart`): People you care for + my caregivers; links to `/care/:ownerId` dashboards and `/settings/sharing`.
- **`/settings/sharing`** (`sharing_screen.dart`): Lists `care_relationships` as owner (my caregivers) and as caregiver (people sharing with me). Empty states, not placeholders.
- **`/settings/reports`** (`reports_hub_screen.dart`): Read-only hub from `report_documents` + `medical_reports` (metric counts via `report_metrics`). **`/reports` redirects** to `/settings/reports`.
- **Drawer Care** → `/care` (was `/settings/sharing`).
- **Repositories:** extended `care_repository.dart`; new `reports/reports_repository.dart`.
- **Compile fix:** `SyncTables` in `sync_service.dart` changed from `abstract final class` to `abstract class` so `static const` members compile (blocked `flutter test`).

**Verify:**
```bash
cd flutter && flutter analyze lib/features/care/ lib/features/settings/sharing_screen.dart lib/features/reports/ lib/shell/
cd flutter && flutter test   # 27/27 pass
```

**Still web-only:** invite caregiver, scope editing, report upload/reprocess, metric trends drilldown.

## Tools integrations slice (2026-07-04 overnight)

- **Oura/Whoop connect in-app:** `flutter/lib/features/tools/wearable_oauth.dart` opens provider OAuth via `url_launcher` (external browser). Oura config/exchange uses Supabase `oura-sync` edge fn; Whoop uses Worker `GET /api/health/whoop-config` + `POST /api/health/whoop-exchange` (new routes mirror `whoop.functions.ts`).
- **OAuth callbacks:** GoRouter routes `/oauth/oura/callback` and `/oauth/whoop/callback` (`wearable_oauth_callback_screen.dart`). Native deep links via `app_links`: `org.purplelife.app://oauth-oura-callback` / `oauth-whoop-callback` (same as Capacitor `src/lib/native/wearable-oauth.ts`). **Native URL scheme `org.purplelife.app` registered in `flutter/ios/Runner/Info.plist` (`CFBundleURLTypes`) and `flutter/android/app/src/main/AndroidManifest.xml` (Oura/Whoop deep-link hosts). Shipped on TestFlight **1.0 (12)**.
- **Sync mode:** `SyncModeSelect` widget on connected cards writes `sync_mode` + `sync_interval_hours` to `oura_tokens` / `whoop_tokens` (web parity).
- **Whoop manual sync** button wired via existing `WorkerClient.postWhoopIncrementalSync()`.
- **Notifications:** Tools section links to Settings with copy on snooze/quiet hours; push alerts still future.
- **Deps:** explicit `app_links`, `url_launcher` in `flutter/pubspec.yaml`.
- **Verify:** `cd flutter && flutter analyze lib/features/tools/ lib/core/api/worker_client.dart lib/shell/ && flutter test` → **27/27 PASS** (includes `test/wearable_oauth_test.dart`).
- **Worker deploy:** Done on **c3ee806d** (2026-07-05); routes live under `src/routes/api/health/whoop-*.ts`.

## Apple Health parity audit + fix (2026-07-05)

**Gap matrix (web/Capacitor vs Flutter before this fix):**

| Area | Web/Capacitor | Flutter before | Status |
|------|---------------|----------------|--------|
| iOS auth (`hasPermissions` null) | Trust `requestAuthorization` + secure flag | Fixed overnight | **Done** |
| `isCoreAuthorized` / partial grants | `health-ios.ts` | `health_service.dart` | **Done** |
| vo2Max omitted from auth | Capgo enum | `health` package types | **Done** |
| Last synced source | `apple_health_tokens.last_sync_at` | Mixed local clock + DB | **Fixed** (reload DB after sync) |
| Connect gate | Device HealthKit auth, not `biometrics` rows | Same | **Done** |
| Native sync API | `POST /api/health/native-sync` | WorkerClient + offline queue | **Done** |
| Tools panel | Connect/Sync/Settings + status dot | Embedded row | **Done** |
| Settings/sharing panel | `AppleHealthCard` / `NativeAppleHealthPanel` | Missing | **Added** (`sharing_screen.dart`) |
| Welcome onboarding step | `WelcomeAppleHealthConnect` | Missing | **Added** (`welcome_apple_health_card.dart`) |
| Web import note | When DB has data but HealthKit not linked | Missing | **Added** |
| Visit/resume auto-sync | Deferred startup + 3h throttle | Missing | **Added** (`native_health_autosync.dart`, `native_health_startup.dart`, `AuthGate`) |
| Vitals sync bar | Apple token + HealthKit hint | Token row only | **Fixed** (native auth OR token; Tools sync hint) |
| Web HAE webhook UI | Full webhook card on web | Web stub on `:8765` | **Expected** (native-only on Flutter web) |
| Sleep aggregation | Single `sleep` type + stages | `SLEEP_LIGHT/REM/DEEP` | **Aligned** (iOS staged sleep) |

**Files (this commit):** `flutter/lib/features/health/*`, `sharing_screen.dart`, `welcome_screen.dart`, `sync_status_bar.dart`, `auth_gate.dart`, `test/health_service_test.dart`.

**Verify (agent):**
```bash
cd flutter && flutter analyze lib/features/health/ && flutter test   # 27/27
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/        # 200
```

**Verify (TestFlight 1.0 (12) on iPhone):** Tools + Settings → Sharing → Apple Health → Connect → grant → Sync → **Last synced** from `apple_health_tokens.last_sync_at`. Resume app → throttled background sync (3h).

**No TestFlight 13 needed** for this commit (Dart-only; plist/entitlements unchanged since build 12).

## Apple Health P0 fix — Flutter native HealthKit (2026-07-04 overnight)

**Root cause:** iOS `health` plugin `hasPermissions()` returns `null` for READ (HealthKit privacy). Connect required `hasPermissions == true`, so authorization failed after a successful HealthKit prompt.

**Fixes (uncommitted):**
- `flutter/lib/features/health/health_service.dart`: iOS auth trusts `requestAuthorization` success + secure-storage flag (matches web `health-ios.ts`); partial grants OK; `openHealthSettings()` via `app-settings:`.
- `flutter/lib/features/health/apple_health_panel.dart`: Tools embedded row (Connect/Sync/Settings); sync-state dot + last-synced; actionable error banners; resume refresh.
- `flutter/lib/features/health/native_health_sync.dart` + `sync_service.dart`: offline queue `queueNativeHealthSync` → Drift flush → `POST /api/health/native-sync`.
- `flutter/ios/Runner/Info.plist`: `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` aligned with Capacitor `ios/App/App/Info.plist`. Entitlement `com.apple.developer.healthkit` unchanged.

**Verify (agent):**
```bash
cd flutter && flutter analyze lib/features/health/ lib/core/offline/sync_service.dart  # 0 errors
cd flutter && flutter test   # 27/27 pass (test/health_service_test.dart)
```

**Verify (iOS device; TestFlight build 12+ after plist change):**
1. Tools → Apple Health → **Connect** → HealthKit sheet.
2. Grant metrics → snackbar sync complete (or empty-samples info).
3. Status shows **Last synced** from `apple_health_tokens.last_sync_at`.
4. Deny → yellow inline Settings guidance (not silent fail).
5. Airplane mode → sync queues offline; online auto-flush.

**Web `:8765`:** Tools shows web stub ("Install Purple iOS app…") — expected.

**Ship note:** TestFlight **1.0 (12)** uploaded 2026-07-04 ~9:54 PM ET (`DEVELOPER_DIR=Xcode-beta`, `bun run ios:testflight`). Plist: Health usage strings, journal privacy keys, `LUCIQAppToken`, OAuth URL scheme; entitlements dropped empty `healthkit.access` array.

## Flutter TestFlight 1.0 (12) — Apple Health + OAuth schemes (2026-07-04 ~9:54 PM ET)

**Status: VALID on TestFlight.** xcodebuild **Upload succeeded** for build **12** (`pubspec.yaml` `1.0.0+12`, upload session ref `8cefed68`). ASC API **1.0 (12)** `processing=VALID` ~10:00 PM ET (poll 2 of 5, ~2.5 min after first poll showed only **1.0 (11)**).

| Item | Value |
|------|-------|
| ASC build | **1.0 (12)** `id=b8077e73-de3c-4d4d-a855-0ef0ca67c3e7`, `processing=VALID`, `internal=IN_BETA_TESTING`, `external=READY_FOR_BETA_SUBMISSION`, uploaded 2026-07-04 18:55:28 PT |
| Prior VALID | **1.0 (11)** `internal=IN_BETA_TESTING` |
| Upload | `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer` + Doppler `purple-life/prd` |
| Gates | `flutter analyze lib/` (0 issues), `flutter test` **27/27** |
| iOS plist | `CFBundleURLTypes` → `org.purplelife.app` (Oura/Whoop native callbacks); updated Health share/update strings; `LUCIQAppToken`; journal mic/camera/photo keys; `ITSAppUsesNonExemptEncryption=false` |
| Entitlements | `com.apple.developer.healthkit` only (removed empty `healthkit.access`) |
| Lint fixes for TF script | `dart fix` prefer_const_constructors (today/hydration); `sign_out_cache_test.dart` explicit `AsyncLoading<T>` types |

**Verify:** `doppler run --project purple-life --config prd -- bun run ios:check-asc-builds` → **1.0 (12)** VALID (confirmed 2026-07-04 ~10:00 PM ET).

**Install:** Purple for Life → **1.0 (12)** (supersedes 11 for HealthKit + OAuth return testing). No ITMS rejection.

## Flutter TestFlight 1.0 (11) — ITMS-90683 fix VALID (2026-07-04 ~9:37 PM ET)

**Status: VALID on TestFlight.** Build **10** rejected (ITMS-90683 missing `NSMicrophoneUsageDescription`). Build **11** adds Capacitor-matched privacy keys to `flutter/ios/Runner/Info.plist`, bumps `pubspec.yaml` to `1.0.0+11`, uploads via `FLUTTER_IOS_BUILD_ROOT=/tmp/purpledrw-flutter-tf11`.

| Item | Value |
|------|-------|
| ASC build | **1.0 (11)** `processing=VALID`, `internal=IN_BETA_TESTING` |
| Upload | `Upload succeeded` ~9:32 PM ET |
| ASC API | Build 11 listed ~4 min after upload |
| Privacy keys added | `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `ITSAppUsesNonExemptEncryption` |
| Verify | `bun run ios:check-asc-builds` |

**Install:** Purple for Life → **1.0 (11)** (Flutter native). Do not use rejected build 10.

## Flutter TestFlight 1.0 (10) — REJECTED (2026-07-04)

First Flutter upload ~9:07 PM ET. Apple rejected with **ITMS-90683** (missing `NSMicrophoneUsageDescription`). Superseded by build **11**.

**This session (`ios:testflight`, no Capacitor):**
- `cd flutter && flutter analyze lib/ && flutter test` → **PASS** (20/20).
- `bun run ios:check-asc` → **PASS**.
- First `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:testflight` attempts failed: concurrent fleet `xcodebuild` on `flutter/build/ios` (`Flutter.framework.dSYM` rsync exit 255; Pods `all-product-headers.yaml` missing; `Failed to receive dependency graph response`). Resolved by waiting for exclusive Xcode, cleaning `DerivedData/Runner-*`, fresh `pod install`, retry.
- Successful archive **CFBundleVersion=10**, `xcodebuild` **EXPORT SUCCEEDED** / `Upload succeeded` ~**21:11 ET** (`/tmp/purple-tf10-final.log`). ASC never listed **1.0 (10)** as VALID; Apple email **ITMS-90683**; fix shipped as build **11**.
- **ASC poll (30 min, 2026-07-04 ~21:27–21:57 ET):** `bun run ios:check-asc-builds` every 3 min (10 polls). **1.0 (10)** never appeared in the API list (not VALID). First new build: **1.0 (11)** `processing=VALID` ~21:36 ET; final poll **1.0 (12)** `processing=VALID` ~21:57 ET. Install **1.0 (12)** or **1.0 (11)** from TestFlight, not build 9/10.

## Flutter-only native app (operator decision 2026-07-04)

**Policy:** Ship **Flutter native only** for iOS/Android store builds going forward. **Do not build or upload Capacitor WebView IPAs** unless explicitly rolling back.

| Track | Status |
|-------|--------|
| **Flutter** (`flutter/ios/`, `bun run ios:testflight`) | **Default** — **1.0 (12)** VALID 2026-07-04; **1.0 (11)** VALID; build 10 rejected ITMS-90683 |
| **Capacitor** (`ios/App/`, `bun run ios:testflight:capacitor`) | **Deprecated** — scripts remain for rollback only |

**ASC history:** TestFlight builds **1–9** Capacitor WebView. **Build 10** rejected (ITMS-90683). **Build 11** VALID. **Build 12** VALID (Flutter native: Apple Health plist + OAuth URL scheme). See `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`.

**Working tree:** branch `lovable/redesign` (uncommitted, 3 commits ahead of origin). TestFlight: install **1.0 (12)** (current VALID); **1.0 (11)** still available.

## Wave 1 Meds slice (2026-07-04 evening)

- **`regenerate_today_pending_doses` RPC** + profile TZ day windows ported in `flutter/lib/features/meds/meds_today.dart` and `meds_repository.dart` (rescue filter + dedupe).
- **GoRouter** nested `/meds/history` and `/meds/:medId` (replaces Navigator stub).
- **Add-med bottom sheet** (`medication_form_sheet.dart`); library row kebab edit/archive/restore.
- **Data-layer fix:** online empty Supabase reads no longer fall back to stale Drift cache.
- Verify: `cd flutter && flutter analyze lib/features/meds/ && flutter test` (20/20 pass).

## Overnight Settings hub parity P0 (2026-07-04 late)

Full Settings hub wired to match web `settings.tsx` section order and Supabase-backed profile fields (Worker-only paths stay honest stubs).

| Area | Change |
|------|--------|
| **Hub layout** | Account / Settings / Tools cards always column stack; Add past history tiles 2-col on wide |
| **Seizure gating** | Past episodes row + tile navigate to `/seizures/new` when `showsSeizureFeatures(conditions)` |
| **Preferences** | Your focus chips + custom condition add (writes `profiles.conditions`); sleep/snooze/water/quiet/digest/floating ask/AI model save + reload via `ValueKey` dropdowns |
| **AI provider** | Writes `profiles.ai_provider` (unchanged, verified) |
| **What I track** | Full `feature_catalog.dart` port; toggles write `profiles.feature_overrides` |
| **Health history** | Archive/restore/add conditions + family history CRUD on `profiles.*` columns |
| **About** | Charter/privacy open `purplelife.org` in browser; GitHub external link (`url_launcher`) |
| **Account locale** | Country/timezone/language dropdowns autosave to `profiles` (was read-only SnackBar) |
| **Routes** | `/settings/how-purple-thinks`, `/seizures/new` placeholder screens |

- **Still Worker-only:** data export/deletion, invite codes, 2FA setup, avatar upload, admin console, appearance Light/System.
- **Verify:** `cd flutter && flutter analyze lib/features/settings/ lib/features/account/account_screen.dart` → **0 issues**; `flutter test` → **27/27 PASS**.
- **Preview (browser QA follow-up 3a8b3a8c, 2026-07-04 ~10:05 PM ET):** **VERIFIED** on `:8765` after `./scripts/flutter-web-serve.sh --rebuild` (Doppler `cursor-cloudflare`/`prd_cloudlfare`; build `main.dart.js` 21:54 ET). `curl http://127.0.0.1:8765` → **HTTP 200** (2817 B HTML, not blank/refused). Cursor browser signed-in session (`e2e-smoke@purplelife.org`); `#/settings` loads full hub (not `SettingsPlaceholderScreen`). **Visible wired sections:** hub cards (Account/Settings/Tools), Your health (Medications, Lab reports), People (Sharing & access), App (Travel mode), Add past history card, Preferences→About order confirmed in `settings_screen.dart` + rebuilt bundle strings (`Preferences`, `AI provider`, `What I track`, `Health history`, `Your data`, `Contact the team`, `About`). **Help/About captured:** Contact the team, Founding charter, Privacy & safety, Open source on GitHub; Admin console for admin user. **Data** section is honest web-only copy (export/deletion), not dead buttons. **PENDING:** burger `endDrawer` did not open via Flutter canvas coordinate clicks (use bottom-nav Settings or `#/settings`); below-fold Preferences/AI/What I track/Health history/Data panels require pointer-swipe scroll in Flutter web (automation flaky, strings present in bundle).

## Page-by-page comparison audit (2026-07-04 evening)

Six parallel read-only agents compared TanStack web (`src/routes/_app/**`) vs Flutter (`:8765`). **No fixes applied yet.** Consolidated report: `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md`.

- **0/55 routes at full parity**; 10 partial, 7 stub, 38 missing.
- **Root causes of "everything broken":** missing `regenerate_today_pending_doses`, profile TZ vs device local for doses, narrative table mismatch (`risk_forecasts` vs `health_narratives`), pull-to-refresh skips Whoop sync, web fail-open to empty cache, journal pending badge bug.
- **Wave 1 (approve before coding):** meds RPC + TZ, add med form, `/meds/history`, narrative + wearable sync, journal pending fix (**done 2026-07-04** — see below).
- Runtime browser QA: **done** 2026-07-04 ~21:00 ET — table in `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md` (Wave 1 + Settings slice; `pmt@eigital.com`; `:8765` vs prod).

### Wave 1 TODAY + SYNC slice (2026-07-04)

- **Narrative:** `TodayRepository` reads `risk_forecasts.ai_narrative` (latest row) first; falls back to `health_narratives` when no forecast narrative.
- **Pull-to-refresh:** Today `_refresh()` calls `syncConnectedWearables()` (Oura edge `oura-sync` + Whoop Worker) before invalidating providers; bumps `SyncStatusBar` `refreshSignal`.
- **Whoop sync:** `WorkerClient.postWhoopIncrementalSync()` → `POST /api/health/whoop-sync` (new Worker route mirroring `whoopIncrementalSync` server fn). Shared helper: `flutter/lib/features/today/wearable_sync.dart`.
- **Selected-day doses:** `medsForDayProvider(dateYmd)` loads doses for date-strip selection (not today-only).
- **Score overlay:** "See the full reading" → `/today/risk` (stub `TodayRiskScreen` until full risk detail ships).
- **Verify:** `cd flutter && flutter analyze lib/features/today/ lib/features/vitals/sync_status_bar.dart lib/core/api/worker_client.dart && flutter test test/today_screen_render_test.dart`

### Wave 1 Journal slice (2026-07-04)

- **`pendingUpload` fix:** `JournalRepository` now marks upload-pending from Drift `SyncQueue` record IDs only (not `status == 'processing'`). Offline banner count uses queue length; entry cards show **reading…** / retry for AI processing and **Pending** only for queued offline writes (web parity).
- **Verify:** `cd flutter && flutter analyze lib/features/journal/ && flutter test test/journal_pending_upload_test.dart test/providers_error_fallback_test.dart`
- **Wave 1 compile unblock (2026-07-04):** fixed parallel-merge type errors in `med_detail_screen.dart` (`AsyncValue<List<MedicationDose>>`), `meds_history_screen.dart` (`MedicationDose` row type), `meds_repository.dart` (`rpc<void>`); `flutter analyze lib/` 0 errors, `flutter test` **20/20** (includes `sign_out_cache_test`, `journal_pending_upload_test`).

### Overnight core-tab gaps slice (2026-07-04 late)

P0/P1 items from `docs/FLUTTER-PAGE-BY-PAGE-COMPARISON.md` for Today / Vitals / Journal / Meds data paths (settings/tools out of scope):

| Fix | Status |
|-----|--------|
| Journal capture multimodal dock (Record/Photo/Video) with honest native-only SnackBar; text save path unchanged | **Done** — `journal_capture_screen.dart` |
| Vitals metric tap → `/vitals/metric/:key` drilldown stub with latest real value | **Done** — `metric_detail_screen.dart`, `vitals_screen.dart` |
| Today condition-aware lede prompts from profile `conditions` | **Done** — `condition_prompts.dart`, `TodayRepository` |
| Seizure quick action when epilepsy/seizure condition | **Done** — `/seizures/new` stub + Today third quick-action tile |
| Hydration link in Today "More for today" | **Done** |
| Fail-open: Today offline fallback keeps profile/narrative/counts (not scores-only) | **Done** — `today_repository.dart` |
| Fail-open: Journal online empty list no longer falls back to stale cache | **Done** — `journal_repository.dart` |

- **Verify:** `cd flutter && flutter analyze lib/ && flutter test` → **27/27 PASS** (2026-07-04 overnight).
- **Still Wave 2+:** full biometric trend charts, native voice/photo journal capture, full seizure log form, OAuth Tools connect.

## Design parity wave (2026-07-04 evening) — VERIFIED

Six-agent fleet ported web design (`src/routes/_app/*`, `en.json`, `design/tokens.json`) to Flutter on disjoint scopes. Acceptance bar: `docs/FLUTTER-DESIGN-PARITY-CHECKLIST.md`. All verified in Cursor browser on `:8765` signed in as `pmt@eigital.com`:

- **Today**: greeting + real AI narrative, horizontal date strip with day view, Readiness/Sleep/Activity strip (87/82/58), Your signals grid, Journal/Meds quick actions, Today's doses. Regression fixed: `CrossAxisAlignment.stretch` in score strip Row threw "infinite height" and blanked the route; guarded by `test/today_screen_render_test.dart`.
- **Meds**: "Your schedule, your record.", 14-day adherence (63%), 24h dose timeline, Taken/Undo/reclassify actions, grouped library.
- **Journal**: web-exact light canvas (#faf8fb + lavender glow), serif header, filters, kebab entry actions, pagination.
- **Vitals**: web title copy, status band colors, Metabolic Health + Hydration sections.
- **Settings/Account/Tools**: web section order, real profile autosave + password change, real Oura/Whoop token state, `AppleHealthPanel` wired in Tools; top-bar sync triggers real `SyncService.syncAll()`.
- `flutter analyze lib/` 0 issues; `flutter test` 16/16 (includes new Today render test). Drift web fix: `database.dart` must NOT import `drift/wasm.dart` directly (breaks VM tests); use `driftDatabase(web: DriftWebOptions(...))` with assets copied by `flutter-web-serve.sh`.

## Phase 5 cutover orchestration (2026-07-04)

| Stage | Doc | Status |
|-------|-----|--------|
| 0 Gap audit | `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` | **Done** — 55 web vs 18 Flutter routes; P0 blockers listed |
| 1 Data stable | `docs/FLUTTER-STAGE1-SIGNOFF.md` | **PASS** — `flutter analyze lib/` 0 issues, `flutter test` 14/14; browser QA on `:8765` (Today Readiness 87 + "Good evening, a.", Meds Crestor+asprin, Vitals Readiness 87). Fixes: Drift `sqlite3.wasm`/`drift_worker.js` copy, `--pwa-strategy=none`, web fail-open + skip Drift cache on online reads, `flutter-web-serve.sh` PID/lock + `0.0.0.0` bind + `nohup` daemon |
| 2 iOS build | `docs/features/PHASE5_2_IOS_BUILD.md` | **Done** — ios-only symlink via `scripts/flutter-build-dirs.sh` + `scripts/flutter-ios-build.sh`; web stays in `flutter/build/web` (no top-level build symlink) |
| 5 TestFlight plan | `docs/FLUTTER-TESTFLIGHT-CUTOVER.md` | **VALID** — Flutter **1.0 (11)** on TestFlight (build 10 rejected ITMS-90683) |
| Orchestrator | `docs/features/PHASE5_CUTOVER_ORCHESTRATOR.md` | Active |

**Install (TestFlight):** Purple for Life → **1.0 (11)** (Flutter native). Build 10 rejected; do not install.


## Flutter TestFlight upload execution (2026-07-04 ~21:00 ET)

- **Gates:** `cd flutter && flutter analyze lib/` 0 issues; `flutter test` **20/20**; `bun run ios:check-asc` PASS (`purple-life/prd`).
- **Xcode:** `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer`.
- **Command:** `FLUTTER_IOS_BUILD_ROOT=/tmp/purpledrw-flutter-tf10-upload bun run ios:flutter-testflight` (after Luciq SPM zip prefetch + isolated `/tmp` ios symlink; avoid parallel `xcodebuild` on shared DerivedData).
- **Upload:** `** EXPORT SUCCEEDED **` + `Upload succeeded` for `purple_app.ipa` at **21:04:40 ET**. Archive `CFBundleVersion` **10**.
- **ASC API:** `filter[version]=10` still empty after ~25 min polling (`bun run ios:check-asc-builds` / direct API). Latest installable VALID remains **1.0 (9)** until build 10 appears.
- **Re-check:** `bun run ios:check-asc-builds` every few minutes until `1.0 (10) processing=VALID`.

## Flutter TestFlight upload (2026-07-04 evening)

- **Gates:** `flutter analyze lib/` 0 issues; `flutter test` 20/20
- **Upload:** `xcodebuild archive` + `-exportArchive` on `flutter/ios/Runner.xcworkspace` with ASC API key; `Upload succeeded` for build **10**
- **Script:** `scripts/flutter-ios-testflight.sh` → `bun run ios:testflight` (Capacitor rollback: `ios:testflight:capacitor`)
- **Build number:** `flutter/pubspec.yaml` `1.0.0+10`
- **Verify ASC:** `bun run ios:check-asc-builds` (expect **1.0 (10)** after processing)
- **Blockers documented:** SPM off, two-step archive (not `flutter build ipa --` auth args), `/tmp` DerivedData, serialize concurrent Xcode agents — see `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`

## Flutter TestFlight infrastructure (2026-07-04)

- **Script:** `scripts/flutter-ios-testflight.sh` (default TestFlight path; Capacitor rollback via `ios:testflight:capacitor` only).
- **Artifacts:** `flutter/ios/ExportOptions.plist`, `ExportOptions-export.plist`, Luciq SPM 19.9.0 in `Runner.xcodeproj`, deferred Luciq in `AppDelegate.swift`, `LUCIQAppToken` in Info.plist, HealthKit entitlement aligned with Capacitor (no empty `healthkit.access`).
- **Build number:** `flutter/pubspec.yaml` `1.0.0+11` (supersedes rejected build 10)
- **Signing:** `ios:local-signing` now writes `flutter/ios/Flutter/LocalSigning.xcconfig` (gitignored) alongside Capacitor `ios/LocalSigning.xcconfig`.
- **Push:** deferred (no `aps-environment` entitlement in Flutter yet).
- **Next command (re-upload):** bump `pubspec.yaml` `+N`, then `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc && bun run ios:testflight`
- **Verify:** `cd flutter && flutter analyze lib/` (0 issues after iOS changes).

## ASC + TestFlight audit (2026-07-04 evening, read-only)

**Credentials:** `bun run ios:check-asc` (Doppler `purple-life/prd`) → **PASS** (all four ASC secrets + `DEVELOPMENT_TEAM` present).

**App record:** Purple for Life · bundle `org.purplelife.app` · ASC Apple ID `6787298041` · team `C3HY4MF66F`.

### All ASC builds (`org.purplelife.app`)

Queried App Store Connect API 2026-07-04 ~9:37 PM ET. **Build 11** Flutter native VALID. Build 10 rejected (ITMS-90683).

| Build | ASC ID | Uploaded (PT) | Processing | Internal beta | External |
|-------|--------|---------------|------------|---------------|----------|
| **1.0 (11)** | `db3a14e0-…` | 2026-07-04 **18:33 PT** | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (10)** | — | 2026-07-04 upload | **REJECTED** (ITMS-90683) | — | — |
| **1.0 (1)** | `87155be5-…` | 2026-07-03 18:36 | VALID | IN_BETA_TESTING | IN_BETA_TESTING |
| **1.0 (2)** | `75a4df42-…` | 2026-07-03 19:20 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (4)** | `2994016a-…` | 2026-07-04 04:56 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (5)** | `6ba914d5-…` | 2026-07-04 07:54 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (6)** | `2e5852e2-…` | 2026-07-04 09:13 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (7)** | `3eff060e-…` | 2026-07-04 11:43 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (8)** | `876899a0-…` | 2026-07-04 11:53 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |
| **1.0 (9)** | `827f5280-…` | 2026-07-04 13:00 | VALID | IN_BETA_TESTING | READY_FOR_BETA_SUBMISSION |

**Latest installable build:** **1.0 (11)** — Flutter native (ITMS-90683 fix).

### Build numbers: Capacitor vs Flutter (repo)

| Track | Path | Marketing | Build (`CFBundleVersion`) | Upload status |
|-------|------|-----------|----------------------------|---------------|
| **Capacitor (rollback)** | `ios/App/App.xcodeproj` | `1.0` | **`9`** | On ASC (build 9) |
| **Flutter (default)** | `flutter/pubspec.yaml` | `1.0.0` | **`11`** | **VALID** on ASC TestFlight |

First Flutter TestFlight upload must use build number **≥ 10** (or bump Capacitor first, then Flutter at N+1). Wire `scripts/flutter-ios-testflight.sh` per `docs/FLUTTER-TESTFLIGHT-CUTOVER.md` (`flutter/ios/ExportOptions.plist` exists; upload script not yet in `package.json`).

### Flutter IPA upload history

**None.** Evidence:

- Git: only Capacitor uploads documented (`4dc438d` build 1, commits through `a34351d` build 8); no commits mention Flutter IPA or `flutter build ipa` upload.
- Scripts: `scripts/native-ios-testflight.sh` (Capacitor) is wired as `bun run ios:testflight`; `scripts/flutter-ios-testflight.sh` is **planned only** (`docs/FLUTTER-TESTFLIGHT-CUTOVER.md`).
- `scripts/flutter-ios-build.sh` runs `flutter build ios --release --no-codesign` (local device build prep, not ASC upload).

### What "9 builds never worked" likely means

The complaint is almost certainly about **Capacitor shell launch failures**, not missing Flutter parity:

| Builds | Known Capacitor issue |
|--------|----------------------|
| **1–2** | Missing bundled `index.html` (`webDir` pointed at TanStack dist with no root HTML); instant WebView crash |
| **3** | Skipped on ASC (never uploaded) |
| **4–5** | Shell fallback committed; Luciq/launch hardening in progress |
| **6–8** | Empty `healthkit.access` entitlement (launch crash); build **8** also shipped AppDelegate HEAD-probe that hijacked WebView to `capacitor://localhost` instead of prod URL |
| **9** | Fix for 6–8 (minimal AppDelegate, entitlement cleanup); **VALID on ASC** — testers may still be on build 8 if TestFlight did not auto-update, or invite not accepted |

**Flutter was never in the TestFlight loop.** Fixes on `:8765` (fail-open repos, burger drawer, design parity) do **not** reach TestFlight until a Flutter IPA is built and uploaded separately.

### First Flutter TestFlight beta checklist

Prerequisites (Stage 5 — owner approval required):

- [ ] Stages 1–4 pass per `docs/features/PHASE5_CUTOVER_ORCHESTRATOR.md` (data stable, iOS release build, page parity bar)
- [ ] `cd flutter && flutter analyze lib/` + `flutter test` green
- [ ] `./scripts/flutter-web-serve.sh --rebuild` — signed-in real data on `:8765`
- [ ] USB smoke: `flutter run --release -d <iphone>` (sign-in, Today, Meds, sign-out)
- [ ] Bump `flutter/pubspec.yaml` to `1.0.0+10` (or `--build-number 10`, must exceed ASC **9**)
- [ ] Add Luciq to `flutter/ios/Runner` (Capacitor has it; Flutter does not yet)
- [ ] Implement + wire `scripts/flutter-ios-testflight.sh`; split `package.json` to `ios:testflight:capacitor` vs Flutter path
- [ ] `flutter/ios/ExportOptions.plist` + Doppler dart-defines for Supabase keys
- [ ] `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc && bun run ios:testflight` (Flutter script)
- [ ] Poll ASC until build **VALID**; assign internal **Development Team**; USB verify before wider testers
- [ ] Rollback plan: keep Capacitor `ios/` until Stage 6; re-point testers to last good Capacitor build if needed

## TestFlight build 9 status check (2026-07-04, 6 PM ET, read-only)

User reported "the TestFlight app does not even load." Investigation (no build/upload/commit):

- **ASC API (Doppler `purple-life/prd`):** build **1.0 (9)** (`827f5280-50d8-4681-992b-f0e2e63dd0e6`, uploaded 2026-07-04 13:00 PT) is `processingState=VALID`, `internalBuildState=IN_BETA_TESTING`, `externalBuildState=READY_FOR_BETA_SUBMISSION`, not expired.
- **Group access:** internal group **Development Team** (`0871a099`) has `hasAccessToAllBuilds=true`, so build 9 is auto-available. Testers: `a@arora.net` state **INSTALLED**, `jaspreet.singh@eigital.org` state **INVITED** (never accepted the TestFlight invite; must accept email invite before anything can install).
- **Prod web (WebView target):** `https://www.purplelife.org` returns HTTP 200 with full HTML; `/today` 200.
- **Uncommitted `ios/` diff matches build 9 exactly:** `CURRENT_PROJECT_VERSION=9`, empty `healthkit.access` entitlement removed, `AppDelegate.swift` minimal (deferred Luciq only; HEAD-probe/fallback-hijack code deleted). No launch blocker found in current code; `ios/App/App/public/` has the committed shell fallback.
- **Most likely cause of "does not load":** the iPhone is still running **build 8** (HEAD-probe WebView hijack + empty entitlement crash). TestFlight does not always auto-update; the tester must open TestFlight and explicitly update to **1.0 (9)**, or delete the app and reinstall from TestFlight. Note the TestFlight app is the **Capacitor shell loading prod web**, not the Flutter app; Flutter has never been uploaded to TestFlight.

**Install steps for the tester:** open **TestFlight** on iPhone → **Purple for Life** → confirm version shows **1.0 (9)** → tap **Update** (or delete the installed app first, then **Install**) → force-quit and reopen. If TestFlight still shows build 8, pull-to-refresh the TestFlight app list.

## TestFlight build 9 launch fix (2026-07-04)

**Root cause for build 6/7/8 not loading:** build 8 still shipped (a) empty `com.apple.developer.healthkit.access` entitlement array (iOS crash on launch) and (b) AppDelegate HEAD-probe logic that hijacked the WebView to `capacitor://localhost` fallback instead of letting Capacitor load `https://www.purplelife.org`.

**Fix (uncommitted, uploaded as build 9):**
- `ios/App/App/App.entitlements`: removed empty `healthkit.access` key; keep `healthkit` only.
- `ios/App/App/AppDelegate.swift`: reverted to minimal launch path (deferred Luciq only, no HEAD probe / fallback shell hijack / launch-marker poison loop).
- `CURRENT_PROJECT_VERSION=9`; `bun run cap sync ios`; `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:testflight` -> **Upload succeeded**.

**Install:** TestFlight → Purple for Life → **1.0 (9)** (internal Development Team). Delete build 8 first, force-quit, reopen.

**Local device verify (2026-07-04):** `aa's iPhone air` (iOS 26.6) via USB — `bun run ios:device-build` installed build **9** Debug and launched `org.purplelife.app` successfully.

## Recent changes (2026-07-04, Flutter Wave 1 AUTH/CACHE P0 #10)

- **Sign-out cache hygiene:** `signOutSessionProvider` in `flutter/lib/auth/auth_state.dart` clears Drift user cache via `SyncService.clearUserCache`, invalidates today/meds/journal/vitals + cached table providers, then calls `AuthRepository.signOut`. Burger menu (`shell_menu_sheet.dart`) and Account screen sign-out paths use the provider (not raw `auth.signOut()`).
- **Test:** `flutter/test/sign_out_cache_test.dart` (2 cases: clears cache + invalidates providers; skips cache when no user).
- **Verify:** `cd flutter && flutter analyze lib/auth lib/core/auth lib/core/providers lib/shell/shell_menu_sheet.dart lib/features/account/account_screen.dart` → 0 issues; `flutter test test/sign_out_cache_test.dart` → 2/2.

## Recent changes (2026-07-04, Flutter Wave 1 ROUTES slice)

- **`/today/risk`:** `TodayRiskScreen` ports web risk drilldown (score arc, readiness band chip, AI narrative, top factors, back to today). Fetches latest row from `risk_forecasts` via `latestRiskForecastProvider`. Today score overlay "See the full reading" now navigates here (was `/vitals`).
- **`/hydration`:** stub `HydrationScreen` with back link to Vitals; Vitals hydration card tap wired via `GlassCard.onTap`.
- **Today signals:** `TodayVitalItem.metric` slugs added; each tile navigates to `/vitals?metric=<slug>` (interim until `/biometrics/:metric` ships).
- **Verify:** `flutter analyze` on route slice files 0 issues; `flutter test test/today_screen_render_test.dart` 2/2 PASS; full suite 17/19 (2 load failures pre-existing meds mock drift in sibling slice).

## Recent changes (2026-07-04, Flutter `:8765` preview repair + Stage 1 PASS)

- **`scripts/flutter-web-serve.sh`:** fixed bash guard (`[[ ... && already_serving ]]` always true); added `--status`, PID file `.flutter-web-serve.pid`, build lock, idempotent start when same pid owns `:8765`; copies `sqlite3.wasm` + `drift_worker.js` after every web build; binds `0.0.0.0` (IPv4+IPv6); builds with `--pwa-strategy=none`; starts `python3 -m http.server` via `nohup`+`disown` (stable daemon). **Stable command:** `./scripts/flutter-web-serve.sh` (rebuild: `--rebuild`).
- **`flutter/lib/`:** web connectivity trusts online (no cross-origin HEAD to prod); data providers `await authRepositoryProvider.future` then `authSessionProvider.valueOrNull`; Drift uses explicit `WasmDatabase.open`; online biometric reads skip Drift cache on web; cache reads fail-open; `SyncService.readCached` try/catch.
- **Browser verification (Cursor MCP, 2026-07-04 ~23:13 ET):** `curl http://127.0.0.1:8765/` **200**; sign-in screen renders; signed-in **pmt@eigital.com** data on `/today` (Readiness **87**), `/meds` (**Crestor** + **asprin**, 2 meds), `/vitals` (Readiness Score **87**). `flutter test` **14/14**.


- Updated `flutter/lib/features/auth/sign_in_screen.dart` to match prod TanStack password-input behavior: added eye-toggle state with show/hide icon, mode-aware password autofill (`current` vs `new`), disabled autocorrect/suggestions for password entry, and preserved focus while toggling visibility.
- Added `_passwordFocusNode` lifecycle management (`dispose`) and disabled eye-toggle interaction while auth submit is in-flight (`_busy`) to prevent accidental state changes mid-submit.
- Verification:
  - `cd flutter && flutter analyze lib/features/auth/sign_in_screen.dart` -> **PASS** (no issues)
  - `cd flutter && flutter analyze` -> **FAIL** due pre-existing unrelated `TodayData` undefined-class error in `flutter/lib/features/today/today_screen.dart` plus existing info-level warnings
  - `./scripts/flutter-web-serve.sh --rebuild` -> **PASS**; rebuilt and serving `flutter/build/web` on `http://localhost:8765` and `http://127.0.0.1:8765`

## Recent changes (2026-07-04, TestFlight build 8 upload + ASC validation)

- Included integrator commits in branch history before upload: `42de935` (Capacitor launch hardening) and `ec8340a` (build 7 baseline bump), then added release commit `a34351d` for web/native crash-fallback diagnostics plus `CURRENT_PROJECT_VERSION=8`.
- Re-ran `bunx cap sync ios` and then `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:testflight` to complete build 8 if needed; archive succeeded but export/upload returned duplicate-version rejection (`bundle version '8' already used`).
- Confirmed this means build 8 was already uploaded previously; no additional version bump was needed in this run.
- Queried App Store Connect API (app `6787298041`) via Doppler `purple-life/prd` credentials: latest build `876899a0-a15f-4892-9f93-b490c3f4701a` has `version=8` (marketing `1.0`), `processingState=VALID`, and beta detail `internalBuildState=IN_BETA_TESTING` (`externalBuildState=READY_FOR_BETA_SUBMISSION`).
- Build install target for testers: TestFlight internal group **Development Team** should install **Purple for Life 1.0 (8)**.

Clarification (2026-07-04): Flutter web preview on `:8765` is the Phase 0-1 signed-in app shell ported from Lovable/TanStack design, so it is not yet identical to production `https://www.purplelife.org` (which still runs full TanStack routes and onboarding UX). Flutter routing now follows the same post-login default rule as prod by checking `profiles.onboarded_at` or `profiles.first_name`: onboarded users land on `/today`, users without onboarding metadata land on `/welcome`.

## Live user safety (2026-07-04)

- Audit scope: uncommitted `lovable/redesign` Flutter fail-open changes + commits `42de935`, `ec8340a`, `a34351d`.
- No destructive SQL/migration/seed/schema changes found in this window.
- Native/TestFlight commits are launch/diagnostics/build-number changes; no bulk DB write logic introduced.
- **Fixed (2026-07-04):** Flutter post-login empty data on `:8765` was caused by fail-open `catch (_) => empty` in Today/Meds/Journal repos and providers, plus schema mismatches (`health_narratives.for_date` → `day`, `medications.is_active` → `active`). Repos now await `authSessionProvider.future`, use `currentSession?.user.id`, fetch Supabase online without swallowing errors, and cache-fallback only when offline/no session. Verify: `cd flutter && doppler run --project cursor-cloudflare --config prd_cloudlfare -- flutter test test/providers_error_fallback_test.dart` then `./scripts/flutter-web-serve.sh --rebuild` and hard-refresh `http://localhost:8765` as `pmt@eigital.com`.
- Sync queue remains non-destructive but inserts are not fully idempotent on retry; monitor duplicate/failed queue items in preview testing.
- Rollout policy: manual deploy only, no force migrations, backup snapshot required before any production rollout.

## TestFlight crash root cause + build 7 status (2026-07-04)

- Crash root cause (build line before this run): iOS launch crash came from the Luciq startup path and an empty `healthkit.access` entitlement payload. Fix line is the current `feat/tf-crash-fix-7` state (`03983ab`): deferred/guarded Luciq startup plus corrected HealthKit entitlement config.
- Capacitor shell fallback check: `capacitor-shell/index.html` exists and `bun run native:sync` repopulates `ios/App/App/public/index.html` (this checkout had `ios/App/App/public` empty before sync).
- Native bootstrap hardening:
  - `capacitor.config.ts`: added `server.allowNavigation` for `www.purplelife.org`, `purplelife.org`, and `auth.purplelife.org`.
  - `src/lib/native/index.ts`: `initNativeApp()` now waits for core plugins (`SplashScreen`/`StatusBar`) before one-time initialization and retries cleanly if initialization throws.
  - `ios/App/App/AppDelegate.swift` already uses guarded/deferred Luciq startup (token guard + delayed `Luciq.start`), verified during simulator archive.
- Verification:
  - `bun run cap sync ios` -> **PASS**.
  - `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc` -> **PASS**.
  - `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:testflight` -> duplicate-build rejection (`bundle version '7' already used`), which indicates build 7 is already uploaded on App Store Connect.
  - ASC API checks (Doppler `purple-life/prd`) confirm build **7** (`id 3eff060e-3092-4816-b10e-955c63205598`) is `processingState=VALID`, beta detail `internalBuildState=IN_BETA_TESTING`, and assigned to internal group **Development Team** (`hasBuild=true`).

## Recent changes (2026-07-04, build 7 observability hardening)

- `capacitor-shell/index.html`: fallback overlay now always reports URL, error text, build label, and retry action; build defaults to static `"7"` when query params are absent.
- Added a minimal shell diagnostics strip hook (`#diag-strip`) controlled by `?diag=1` or native `diag-flag` bridge payloads.
- `src/lib/native/index.ts`: bridge timeout now emits a launch-error payload via both `CustomEvent("purple:native-launch-error")` and `window.postMessage({ source: "purple-native", type: "launch-error" })` when core Capacitor plugins fail to appear within 2.5s.
- Native init now exits cleanly on bridge timeout and captures telemetry (`native.bridge.timeout`) instead of silently continuing.
- Validation for this pass: `bun run tsc --noEmit` (**PASS**) and `ReadLints` clean on edited files.

## Recent changes (2026-07-04, global crash fallback + diagnostics panel)

- Added global React crash boundary and fallback UI under `src/components/error/` (`global-error-boundary.tsx`, `app-crash-fallback.tsx`) and mounted it from `src/routes/__root.tsx`.
- Route-level error handling now shows a user-safe fallback with **Retry**, **Copy error ID**, **Contact support**, and **Open diagnostics** (native) instead of a minimal blank-failure state.
- Added runtime observability module `src/lib/observability/client-errors.ts`:
  - captures `window.onerror` and `window.unhandledrejection`
  - stores `lastError` and `lastSyncError` in `sessionStorage`
  - forwards to Sentry only when `window.Sentry` is available
- Added native diagnostics drawer `src/components/error/native-diagnostics-panel.tsx`, reachable from Account (native trigger button) or `?diag=1`, showing app version, build, bridge readiness, connectivity, last sync error, and last runtime error.
- Instrumented real native sync errors into diagnostics (`src/lib/native/index.ts`, `src/lib/native/health-ios.ts`, `src/lib/native/health-android.ts`) so the panel reflects actual failures.
- Verification: `bunx eslint src/routes/__root.tsx src/components/error/app-crash-fallback.tsx src/components/error/global-error-boundary.tsx src/components/error/native-diagnostics-panel.tsx src/lib/observability/client-errors.ts src/lib/native/capacitor.ts src/lib/native/index.ts src/lib/native/health-ios.ts src/lib/native/health-android.ts` (**PASS**).

## WebView crash triage (2026-07-04, web-side)

- Production checks from shell:
  - `curl -L https://www.purplelife.org/` -> **200**
  - `curl -L https://www.purplelife.org/today` -> **200** (client-only app bootstrap shell)
  - `curl -L https://www.purplelife.org/_app/today` -> **404** (expected internal TanStack route-group path)
- Asset sanity checks: `index-D_6rE9bC.js`, `_app-Bb-QYGPH.js`, `today-i30MHmQy.js`, and `/sw.js` all returned **200**.
- Scoped fix applied in `src/routes/__root.tsx` error recovery: replaced hardcoded service-worker cache list (`purple-shell-v2`..`v15`) with dynamic deletion of every cache key prefixed by `purple-shell-v`.
- Why this matters: production service worker currently uses `purple-shell-v17`; old recovery code could leave current bad caches behind and strand users on repeated boot errors.

## Right-edge drawer pass (2026-07-04, noon)

- Replaced native shell burger placeholder with a true right-edge slide-over drawer in `flutter/lib/shell/native_app_shell.dart` (`_menuOpen` state + right-to-left `AnimatedSlide` panel overlay).
- Added menu panel implementation in `flutter/lib/shell/shell_menu_sheet.dart` (`ShellMenuPanel`), wired routes for **Account / Settings / Tools / Care / Sign out**, and removed all `"Menu integration point"` snackbar behavior from shell chrome.
- Added explicit semantics metadata for the top-right burger button in `flutter/lib/shell/top_bar.dart` (`Semantics` label + `ValueKey('top-bar-menu-button')`) to improve browser automation targeting.
- Drawer behavior now matches requirement: overlays content, dark scrim, dismiss on tap-outside, and swipe-to-dismiss via rightward horizontal drag velocity.
- Verification commands:
  - `cd flutter && flutter analyze lib/shell/native_app_shell.dart lib/shell/shell_menu_sheet.dart` (**PASS**)
  - `cd flutter && flutter test` (**PASS**, 7/7)
  - `cd flutter && flutter analyze` (shows 2 pre-existing info-level issues in `test/widget_test.dart`, unchanged by this pass)
  - `./scripts/flutter-web-serve.sh --rebuild` (release rebuild completed; listener restarted on `http://127.0.0.1:8765`)
- Apple-width follow-up: the burger drawer now clamps to `max(260, min(0.72 * viewport, 280 phone / 320 tablet))` and uses inset row separators so the menu reads as a narrow right-edge list, not a wide floating card.
- Browser MCP evidence captured under `/var/folders/.../cursor/screenshots/`:
  - `flutter-before-settings-nav-click-unlocked.png` (Settings entry state)
  - `flutter-settings-before-burger.png` / `flutter-settings-after-burger-attempt.png` (burger interaction attempts on Settings)
  - `flutter-drawer-before-open-2.png` / `flutter-drawer-open-today-2.png` (Today interaction attempts)
  - Note: Flutter canvas required manual semantics activation via CDP click on `flt-semantics-placeholder`; top-right burger clicks still did not actuate through MCP despite route/button refs working elsewhere. Manual local click verification is still recommended.

## Mac QA sweep (2026-07-04)

Full verification on `lovable/redesign` at local Flutter web preview (`http://127.0.0.1:8765`).

### Git status (`git status --short`)

```
 M CURSOR_HANDOFF.md
 M docs/testflight-setup.md
 M flutter/lib/app.dart
 M flutter/lib/core/api/worker_client.dart
 M flutter/lib/core/auth/auth_repository.dart
 M flutter/lib/core/offline/sync_service.dart
 M flutter/lib/core/providers/core_providers.dart
 M flutter/lib/features/journal/journal_capture_screen.dart
 M flutter/lib/features/journal/journal_repository.dart
 M flutter/lib/features/journal/journal_screen.dart
 M flutter/lib/features/meds/meds_repository.dart
 M flutter/lib/features/meds/meds_screen.dart
 M flutter/lib/features/today/today_repository.dart
 M flutter/lib/features/today/today_screen.dart
 M flutter/lib/features/vitals/vitals_screen.dart
 M flutter/lib/shell/native_app_shell.dart
 M ios/App/App.xcodeproj/project.pbxproj
 M scripts/flutter-web-serve.sh
 M scripts/native-ios-testflight.sh
?? .cursor/rules/flutter-web-preview.mdc
?? flutter/lib/core/offline/database.g.dart
?? flutter/lib/shell/shell_menu_sheet.dart
?? flutter/test/providers_error_fallback_test.dart
```

### Build gates

| Gate | Result |
|------|--------|
| `dart run build_runner build --delete-conflicting-outputs` | **PASS** (24 outputs, incremental, ~12s) |
| `flutter analyze lib/` | **PASS** (zero issues) |
| `flutter test` | **PASS** (7/7: 4 provider fallbacks + 3 widget smoke) |
| `bun run check:em-dash` | **PASS** (`src/` + `public/`); changed `flutter/lib/**/*.dart` manually grep-clean (no U+2014) |
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** (release web build ~21s; listener on :8765) |

### Browser MCP route sweep @ http://127.0.0.1:8765

Signed-in session (no "Could not load" on any route). Empty/connect onboarding states render as expected.

| Route | Result | Notes |
|-------|--------|-------|
| `#/today` | **PASS** | Welcome empty state; sync banner; bottom nav |
| `#/vitals` | **PASS** | NO DATA metric rows; connect prompt |
| `#/meds` | **PASS** | "No medications yet" empty state |
| `#/journal` | **PASS** | "Your story starts here" empty state |
| `#/settings` | **PASS** | Settings hub with Account/Tools/Sharing links |
| `#/account` | **PASS** | Profile/security/appearance placeholders |
| `#/tools` | **PASS** | Oura/Whoop/Apple Health connect cards |
| **Burger menu** | **MCP BLOCKED** | Flutter canvas receives focus in Cursor Browser, but MCP clicks did not trigger `IconButton` actions; manual local verification still required |

### Drawer follow-up (2026-07-04, right-edge panel)

- Drawer width narrowed to Apple-style sizing: `shellMenuDrawerWidth()` = `min(280px phone / 320px tablet, 72% viewport)` (was fixed 304px); scrim at 40% black.
- Updated `flutter/lib/shell/native_app_shell.dart` to use a dedicated scaffold key and deferred `openEndDrawer()` callback wired from `TopBar.onMenuTap` to avoid same-frame drawer race conditions.
- Verification: `cd flutter && flutter test` **PASS** (7/7). `flutter analyze` reports two pre-existing info-level issues in `test/widget_test.dart` (missing `shared_preferences` test dependency + deprecated `anonKey` usage).
- Rebuilt preview with `./scripts/flutter-web-serve.sh --rebuild` and confirmed listener on `:8765`; screenshot automation reached `#/today` but could not complete a reliable burger-tap action in MCP because Flutter canvas clicks were not actuating handlers.

### Phase 0-1 stubs still not implemented

| Area | Route / file | Gap |
|------|----------------|-----|
| AI chat | `/chat`, `/chat-care` | `chat_screen.dart` stub; streaming UI Phase 3+ |
| Sharing / caregivers | `/settings/sharing` | `SharingScreen` placeholder copy only |
| Travel mode | `/settings/travel` | `SettingsPlaceholderScreen` |
| Labs / reports | `/settings/reports` | Placeholder; Tools "Lab reports" `onTap: () {}` |
| Contact | `/settings/contact` | Placeholder |
| Med add/edit form | `/meds` | SnackBar "Medication form coming in a later phase" |
| Account profile | `/account` | Avatar, password, 2FA, region, subscription, invite rows are integration points |
| Tools notifications | `/tools` | Phone alarms row placeholder |
| Tools travel / lab links | `/tools` | Travel mode + lab reports `onTap: () {}` |
| Care dashboard biometrics | `/care/:ownerId` | `_BiometricsPlaceholder` + "Add biometric integration point" |
| Wearable OAuth in Flutter | Tools connect buttons | UI only; no Oura/Whoop OAuth flow in Flutter yet |
| Marketing site | `/`, pricing, etc. | TanStack React on prod web only |
| Full Lovable design parity | all screens | Charts, heroes, Oura imagery not ported |
| Flutter TestFlight / Play | n/a | Not shipped; owner approval required |

**Commit status:** all gates green; **not committed** (operator request only).

## Max-agent fleet (2026-07-04 afternoon)

Parallel Cursor agents (two waves, ~15+ subagents total) on disjoint scopes under `flutter/`, `ios/`, and `scripts/`. Parent closeout agent #2 ran after **90s** sibling wait on `lovable/redesign`.

| Wave | Scope | Outcome |
|------|-------|---------|
| **Data-loading fleet** | Today, Vitals, Meds, Journal repos/screens; `SyncService`, `WorkerClient`, auth | Fail-open empty states; no "Could not load…" on web; `health_narratives.day` column fix; `medications.active` (not `is_active`); web skips native health worker calls |
| **Closeout #2** (2026-07-04 12:14 ET) | `build_runner`, `flutter analyze lib/`, `flutter test`, `./scripts/flutter-web-serve.sh --rebuild`, `curl :8765` | **ALL PASS** — see gate table below |
| **Max fleet** | Burger `endDrawer`, TestFlight build 6 prep, browser QA, bottom-nav clip, handoff | Drawer wired; build number bumped locally; docs sync (this section) |

### Closeout #2 gates (2026-07-04)

| Gate | Result |
|------|--------|
| `dart run build_runner build --delete-conflicting-outputs` | **PASS** (20 outputs, incremental, ~15s) |
| `flutter analyze lib/` | **PASS** (zero issues) |
| `flutter test` | **PASS** (7/7: 4 provider fallbacks + 3 widget smoke) |
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** (release web build ~34s; listener restarted on :8765) |
| `curl http://127.0.0.1:8765` | **200** (SimpleHTTP serving `build/web`) |

**`git diff --stat flutter/`:** 17 files, **729 insertions / 520 deletions**; untracked `database.g.dart`, `shell_menu_sheet.dart`, `providers_error_fallback_test.dart`.

**Sibling touchpoints (all uncommitted):** `app.dart`, `core_providers.dart`, `auth_repository.dart`, `worker_client.dart`, `sync_service.dart`, Today/Meds/Journal/Vitals repos + screens, `care_dashboard_screen.dart`, `care_repository.dart`, `bottom_nav.dart`, `native_app_shell.dart`, **`shell_menu_sheet.dart`** (new), `database.g.dart` (generated), `providers_error_fallback_test.dart` (new), `ios/App/App.xcodeproj` (build **6**), `scripts/flutter-web-serve.sh`, `scripts/native-ios-testflight.sh`, `.cursor/rules/flutter-web-preview.mdc` (new).

## Burger drawer requirement (Flutter shell)

User rejected the Phase 0–1 **"Menu integration point" SnackBar** and a **bottom-right floating popover**. Required design:

- Top-right hamburger (3-line icon) opens a **right-to-left `Scaffold.endDrawer`** sliding from the **right edge**, panel **flush under the top bar** (not floating in content).
- Width ~280–336px capped; glass/dark surface via `GlassSurface` + Purple tokens.
- Items: **Account** → `/account`, **Settings** → `/settings`, **Tools** → `/tools`, **Care** → `/settings/sharing`, **Sign out** → Supabase sign-out + `/sign-in`.
- Scrim + swipe-to-dismiss; match web React shell menu intent (see `src/components/` app chrome).

**Implementation:** `flutter/lib/shell/shell_menu_sheet.dart` (`ShellMenuEndDrawer`) + `native_app_shell.dart` (`openEndDrawer()` on `TopBar.onMenuTap`). Verify at http://127.0.0.1:8765/#/today after `./scripts/flutter-web-serve.sh --rebuild`.

## Flutter web fixes status (2026-07-04)

| Area | Status |
|------|--------|
| Auth bootstrap | `PurpleApp` waits for Supabase init; web skips flaky `flutter_secure_storage_web` session restore |
| Sync | `SyncService` fail-open (sync errors do not block reads; in-flight dedup; per-table isolation) |
| Repos | Today/Meds/Journal return empty fallbacks on error; Vitals uses calm empty/connect UI |
| Schema | `health_narratives.day` (not `for_date`); `medications.active` (not `is_active`) |
| Worker | Native health sync skipped on web in `WorkerClient` |
| Tests | `providers_error_fallback_test.dart` + widget smoke; **7/7 pass** |
| Preview | `./scripts/flutter-web-serve.sh --rebuild` → http://localhost:8765 (IPv6 `::` bind) |

**Not on TestFlight:** these fixes are **Flutter web/native client only** at `:8765`. Capacitor TestFlight loads **production web** (`www.purplelife.org`), not the local Flutter build.

## TestFlight vs Flutter web (2026-07-04)

| Surface | Build | Where fixes live |
|---------|-------|------------------|
| **App Store Connect (live)** | **1.0 (9)** Capacitor WebView | Loads prod TanStack web; **not Flutter**; internal **Development Team** in beta |
| **Capacitor repo** | **1.0 (9)** | `ios/App/App.xcodeproj` → `CURRENT_PROJECT_VERSION=9`; upload via `bun run ios:testflight` |
| **Flutter (never on ASC)** | **0.1.0 (1)** local only | `flutter/pubspec.yaml` `0.1.0+1`; `:8765` preview fixes do **not** ship via Capacitor TestFlight |

External **Founding Team** still needs build assignment + Beta App Review on whichever ASC build is current.

## Recent changes (2026-07-04, ASC build 7 upload + validation)

- Coordinated with sibling diffs on `lovable/redesign` and bumped `ios/App/App.xcodeproj/project.pbxproj` to `CURRENT_PROJECT_VERSION=7` (Debug + Release) before upload.
- Ran `DEVELOPER_DIR=/Applications/Xcode-beta.app/Contents/Developer bun run ios:check-asc && bun run ios:testflight`; archive + IPA upload completed (`Uploaded App`, `** EXPORT SUCCEEDED **`).
- Verified archive metadata at `build/ios/Purple.xcarchive/Info.plist`: `CFBundleVersion=7` and `uploadedBuildNumber=7`.
- Polled App Store Connect API via Doppler `purple-life/prd` + `scripts/lib/asc-jwt.mjs` until build **1.0 (7)** appeared (`id: 3eff060e-3092-4816-b10e-955c63205598`) with `processingState=VALID`, `internalBuildState=IN_BETA_TESTING`, `externalBuildState=READY_FOR_BETA_SUBMISSION`.
- Crash hardening from prior sessions remains in place on this uploaded line: committed `capacitor-shell/index.html` fallback, Luciq launch-crash instrumentation setup, and API-key based ASC auth in `scripts/native-ios-testflight.sh`.

Positioning: PurpleLife is an AI health journal for any health management (epilepsy was the founding focus; the condition catalog is general).

Development model: the project is edited from both Cursor and Lovable. A whole-app redesign is in progress in Lovable; GitHub `main` syncs both sides. Cursor is the production gatekeeper: review and test every Lovable landing on `main`, then ask the owner before deploying live. Lovable dev tooling (`@lovable.dev/vite-tanstack-config`, `.lovable/`, preview-host checks in `src/lib/med-notifications.ts`) is kept intact on purpose. Do not remove it.

**Mandatory after every task:** sync documentation per `.cursor/rules/post-task-documentation.mdc` (handoff, `docs/`, rules, `AGENTS.md`, `mem/`). Never leave important context only in chat.

## Flutter shell menu integration (2026-07-04)

Superseded by [Burger drawer requirement](#burger-drawer-requirement-flutter-shell) above. Top-right shell menu no longer triggers the placeholder SnackBar; it opens `ShellMenuEndDrawer` via `Scaffold.endDrawer`.

## Flutter fail-open follow-up (2026-07-04)

Journal and Vitals now match the same fail-open behavior already used by Today and Meds on `lovable/redesign`: provider/repository failures resolve to empty data and calm empty-state UI instead of error copy.

| Check | Result |
|------|--------|
| `cd flutter && flutter test` | **PASS** (7/7, includes new `scoreSnapshotProvider` + `journalDataProvider` fallback cases) |
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** (release build succeeded, port 8765 listener restarted) |
| Browser MCP `#/vitals` @ `http://127.0.0.1:8765` | **PASS** (empty-state Vitals screen rendered, no "Could not load vitals") |
| Browser check for Journal error copy | **PASS** via rebuilt bundle + route behavior checks (`flutter/build/web` has no "Could not load entries") |

**Files changed in this follow-up:** `flutter/lib/features/journal/journal_repository.dart`, `flutter/lib/features/journal/journal_screen.dart`, `flutter/lib/features/journal/journal_capture_screen.dart`, `flutter/lib/features/vitals/vitals_screen.dart`, `flutter/lib/features/today/today_repository.dart`, `flutter/test/providers_error_fallback_test.dart`.

## Flutter fleet closeout (2026-07-04)

Parallel agents finished edits under `flutter/`; closeout agent ran gates after a **120s** sibling wait on branch `lovable/redesign`.

**`git diff --stat flutter/`:** 10 files, **601 insertions / 414 deletions**; untracked `database.g.dart`, `test/providers_error_fallback_test.dart`.

| Gate | Result |
|------|--------|
| `dart run build_runner build --delete-conflicting-outputs` | **PASS** (60 outputs, Drift/json_serializable, ~74s) |
| `flutter analyze lib/` | **PASS** (zero issues) |
| `flutter test` | **PASS** (5/5: widget smoke + `providers_error_fallback_test.dart` for Today/Meds empty fallbacks) |
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** (release web build ~105s; CanvasKit) |
| `curl http://127.0.0.1:8765` | **200** (server bound `::` on port 8765) |
| Browser MCP `#/today`, `#/vitals`, `#/meds` @ http://127.0.0.1:8765 | **PASS** (no "Could not load" errors; empty/welcome states render) |

**Fixes (uncommitted on `lovable/redesign`, 10 files / +601 −414):** fail-open `SyncService` (sync errors no longer block Supabase reads; in-flight dedup; per-table/per-row isolation); skip native health sync on web in `WorkerClient`; Today/Meds repos query `medications.active` (not `is_active`) and return empty fallbacks instead of throwing; Today/Meds/Vitals screens show onboarding empty states instead of "Could not load"; `providers_error_fallback_test.dart` covers Today/Meds provider fallbacks.

**Sibling agent touchpoints:** `app.dart`, `core_providers.dart`, `worker_client.dart`, `sync_service.dart`, `today_repository.dart` + `today_screen.dart`, `meds_repository.dart` + `meds_screen.dart`, `vitals_screen.dart`, generated `database.g.dart`, `test/providers_error_fallback_test.dart`.

**Commit status:** gates green (`flutter test` 7/7); **not committed** (19 modified + 4 untracked on `lovable/redesign`; commit only when operator requests).

**Local preview:** `./scripts/flutter-web-serve.sh` (background) at http://localhost:8765 / http://127.0.0.1:8765.

## Machine switch handoff (2026-07-04)

**Git save commit:** `50a1122` on `origin/lovable/redesign` (includes `AGENTS.md` + continual-learning index sync after Flutter session).

**Purpose:** User changing computers. All in-progress Flutter work is committed and pushed on `lovable/redesign` (commit hash recorded in git log after push).

### Done (Phase 0-1, not full site parity)

- **`flutter/`** multi-platform scaffold (`org.purplelife.app`), `design/tokens.json` bridge, Drift offline core, Supabase auth client, Worker API client, GoRouter shell (auth gate, glass nav, offline banner).
- **Screens (signed-in app only):** sign-in, Today, Vitals, Journal (+ capture), Meds, Settings hub, Account, Tools (partial), Care dashboard, Chat route stubs.
- **Health:** Apple Health panel + native sync hooks (`health` package wiring); not full wearable OAuth in Flutter yet.
- **Web MVP:** release build + `./scripts/flutter-web-serve.sh` on port **8765** (IPv6 `::` bind).
- **Docs/rules:** `docs/LOVABLE-FLUTTER-SYNC.md`, `mem/flutter-lovable-workflow.md`, `.cursor/rules/flutter-lovable-sync.mdc`.

### Not done (explicit)

- **Marketing site** (`/`, pricing, about, features, community, contact, trust): still **TanStack React** on `https://www.purplelife.org` only.
- **Full Lovable design parity** in Flutter (heroes, charts, Oura-style imagery, marketing layout).
- **Data on Flutter web:** fixed auth bootstrap race (`PurpleApp` waits for Supabase init), `is_active` → `active` column bug in Today repo, Doppler key pass-through in `flutter-web-serve.sh`. Run `dart run build_runner build` after fresh clone (or commit `database.g.dart`). Sign in at http://localhost:8765 after `./scripts/flutter-web-serve.sh --rebuild`.
- **UI polish:** bottom nav icon clipping reported; not fixed in this save.
- **Chat / AI:** routes stubbed only; no streaming Worker AI UI.
- **Reports, admin, sharing/travel settings:** stubs or absent.
- **Flutter TestFlight / Play:** not shipped; owner approval required.

### Product split (do not confuse)

| Surface | Stack | Scope |
|---------|-------|--------|
| Public marketing + current prod app | Lovable design on web, Worker deploy | Full website |
| **Flutter** | Cursor-owned `flutter/` | **Signed-in health journal app only** (Phase 0-1) |
| Interim native store | **Capacitor** iOS shell loading prod web | TestFlight **1.0 (6)** on ASC; Flutter `:8765` changes remain local-only until separately shipped |

Lovable remains **design source** on `lovable/redesign`; Cursor ports tokens and screens after merges.

### New machine (exact commands)

```bash
git clone https://github.com/AstroAii/purpledrw.git
cd purpledrw
git checkout lovable/redesign
# Doppler: cursor-cloudflare / prd_cloudlfare (VITE_SUPABASE_PUBLISHABLE_KEY, etc.)

cd flutter
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# From repo root: rebuild web with Supabase anon key baked via dart-define, then serve
./scripts/flutter-web-serve.sh --rebuild
# Open http://localhost:8765 or http://127.0.0.1:8765 (not file://)
```

Manual build equivalent:

```bash
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bash -c 'cd flutter && flutter build web --release --base-href=/ \
  --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"'
```

Optional defines: `SUPABASE_URL` (default `https://auth.purplelife.org`), `SITE_URL`, `WORKER_API_BASE_URL`.

**Verify:** `cd flutter && flutter analyze lib/ && flutter test`

### Debugging "Could not load" on Flutter web

1. Confirm release build used Doppler `VITE_SUPABASE_PUBLISHABLE_KEY` as `SUPABASE_ANON_KEY`.
2. Sign in again (session / refresh token in secure storage on web can fail across rebuilds).
3. Check browser devtools network to `auth.purplelife.org` and Worker API calls (401 vs CORS vs empty RLS).
4. Offline banner: app may show cache miss before first successful sync.



## Orientation

- Product and architecture: `docs/ARCHITECTURE.md`
- Feature inventory and route map: `docs/FEATURES.md`
- Sync and release runbook: `docs/SYNC-AND-RELEASE.md`
- Lovable redesign gatekeeper: `docs/LOVABLE-REDESIGN-WORKFLOW.md` (baseline `7086ffa`)
- Lovable design → Flutter sync: `docs/LOVABLE-FLUTTER-SYNC.md`, `mem/flutter-lovable-workflow.md`, `flutter/README.md`
- Lovable preview env parity: `docs/LOVABLE-ENV-PARITY.md`
- Lovable exit + Cloudflare cutover plan: `docs/LOVABLE-MIGRATION.md`
- Supabase manual deploy procedure: `docs/manual-deploy-bundle.md`
- OAuth provider setup: `docs/oauth-provider-setup.md`
- Native iOS/Android (Capacitor): `docs/native-app-setup.md` (HealthKit checklist, sync model)
- Durable decisions: `mem/index.md` (no em dashes, footer visibility, metric naming, native HealthKit, post-task documentation)
- Editor rules: `.cursor/rules/` (conventions, server functions, Cloudflare constraints, lovable-redesign-workflow, **flutter-lovable-sync**, **post-task-documentation**)

## Quick facts

| Item | Value |
|------|-------|
| Brand / domain | Purple, `https://www.purplelife.org` |
| Framework | TanStack Start 1.168, React 19, Vite 7, Tailwind 4 |
| Runtime | Cloudflare Worker (`wrangler.deploy.jsonc`, entry `src/server.ts`, `nodejs_compat`) |
| Package manager | bun (commands below) |
| Database | Supabase project `xxnzmfzsjplrutrgbzxy` (Purple Life, us-east-2), ~100+ migrations, edge functions deployed |
| Git heads | `lovable/redesign` at **`a34351d`** (includes crash-fallback release slice + build 8 bump); unrelated Flutter/docs work remains uncommitted |
| Production deploy | Worker `purplelife`, version **`af1200ed-ac7f-4182-9021-d455a276fbce`** (2026-07-04, native layout + sync time + caregiver toolbar + crash shell) |
| TestFlight | **ASC live: 1.0 (9)** — **Capacitor WebView only** (8 VALID builds on ASC: 1,2,4–9; build 3 skipped). Bundle `org.purplelife.app`, ASC `6787298041`. **No Flutter IPA ever uploaded** (`flutter/pubspec.yaml` still `0.1.0+1`). Capacitor `ios/` at build **9**; Flutter local build **1**. Upload script: `scripts/native-ios-testflight.sh`. See [ASC + TestFlight audit](#asc--testflight-audit-2026-07-04-evening-read-only). |
| Dev server | `bun run dev` on port 8080 |
| Flutter web (local) | **`http://localhost:8765`** or **`http://127.0.0.1:8765`** (address bar only, not `file://`). Start: `./scripts/flutter-web-serve.sh` (binds `::` for IPv6 localhost). `--rebuild` adds `--base-href=/`. Keepalive: background loop restarts server if port 8765 dies. Cursor browser: open side panel to this URL each session (rule: `.cursor/rules/flutter-web-preview.mdc`). |
| E2E local | `bun run test:e2e` (boots dev server unless `E2E_BASE_URL` set) |
| E2E prod | `bun run test:e2e:prod` (580 tests, 5 viewports, ~1.5h; Doppler creds) |
| Lint/format | `bun run lint`, `bun run format` |
| Quality gates | `check:em-dash`, `check:live-data` (incl. `check-no-fake-vitals.mjs`), `check:lovable-auth`, `check:unique-images`, `check:supabase-types`, `check:entry-budget` |
| DB live-data scan | `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bun run check:live-data:db` |
| Seeds | `bun run seed:research` (needs `OPENAI_API_KEY` + service role) |
| Flutter Phase 0 | **`flutter/` integrated** (2026-07-04): scaffold, design tokens, offline core (Drift), shell/router, feature stubs. Runbook: `docs/LOVABLE-FLUTTER-SYNC.md`, `flutter/README.md` |
| Flutter Phase 1 | **Complete + fleet hardening** (2026-07-04): fail-open data screens, burger `endDrawer`, provider fallbacks. `flutter analyze lib/` zero issues; `flutter test` **7/7** pass |
| Flutter scope | **Signed-in app only** (Phase 0/1). Not the full website. See [Flutter scope vs full website](#flutter-scope-vs-full-website-honest) below. |

## Flutter scope vs full website (honest)

**What Flutter is today:** a signed-in health journal app shell, not a port of the entire Purple website.

| In Flutter (Phase 0/1) | Not in Flutter yet |
|------------------------|-------------------|
| Sign-in, Today, Vitals, Journal, Meds | Marketing pages (`/`, `/pricing`, `/about`, `/features`, `/community`, `/contact`, `/trust`) |
| Settings hub, Account, Tools, Care dashboard | Admin console, reports PDF export |
| Chat route stubs (`/chat`, `/chat-care`) | Streaming AI chat UI |
| Offline banner, loading skeletons, Drift cache | Full Oura/Whoop OAuth flows (Tools panel is partial stub) |
| Design tokens + liquid glass widgets | Marketing hero photos, metric chart visuals, Oura-style imagery |

**Production website today:** TanStack Start on Cloudflare Worker at `https://www.purplelife.org` (marketing + signed-in app). **Flutter web local preview** at `http://localhost:8765` is the native client only; it does not serve marketing routes.

**Why images look missing in Flutter:** React uses optimized JPEG heroes and moment photos from `src/assets/*.jpg` (via vite imagetools in `src/lib/calm-images/` and `src/components/today/hero-score-card.tsx`). Those assets are **not ported** to Flutter yet. Flutter currently has design tokens (`flutter/assets/design/tokens.json`) and a logo placeholder (`flutter/assets/branding/purple_logo.png`, copied from `public/icon-512.png`).

**Design source:** Lovable on `lovable/redesign` remains the visual source of truth. Cursor ports screens and assets into Flutter screen by screen after each merge. Full asset plan: `docs/LOVABLE-FLUTTER-SYNC.md` section "Missing assets plan".

**Phase 2 roadmap (next):** deepen Today/Vitals/my-health Supabase parity; pull-to-refresh sync; port chart widgets and key imagery into `flutter/assets/`; decide whether marketing stays React-only or gets a Flutter Web slice; wire logo and heroes into sign-in and Today when screens are touched.

## Recent changes (2026-07-04, max-agent fleet closeout #2)

- **Closeout #2:** 90s sibling wait, then `build_runner` (20 outputs), `flutter analyze lib/` (clean), `flutter test` **7/7**, web `--rebuild` (~34s), `curl :8765` **200**.
- **Diff:** 17 modified + 3 untracked under `flutter/` (+729/−520); includes Care dashboard/repo, `bottom_nav.dart`, burger drawer shell.
- **Fleet status:** all gates green; changes **uncommitted** on `lovable/redesign` (HEAD `c122e31`). Operator must say **"commit and push"** to ship.

## Recent changes (2026-07-04, max-agent fleet + handoff)

- **Fleet:** ~15+ parallel subagents on fail-open data loading, burger `endDrawer`, TestFlight build 6 prep, browser QA; all changes **uncommitted** on `lovable/redesign`.
- **Flutter web:** Today/Vitals/Meds/Journal show empty/connect states (no error copy); `flutter test` **7/7**; preview at http://127.0.0.1:8765.
- **Burger menu:** `ShellMenuEndDrawer` replaces SnackBar/popover; right-edge drawer under top bar per user design.
- **TestFlight:** ASC still **1.0 (5)**; repo locally bumped to **6** for next Capacitor upload (Flutter fixes do not auto-ship to TestFlight).
- **Commit:** operator must say **"commit and push"** — nothing from this fleet is on GitHub yet.

## Recent changes (2026-07-04, Flutter fleet closeout)

- **Gates (120s sibling wait):** `build_runner` (60 outputs), `flutter analyze lib/` (clean), `flutter test` (5/5), web `--rebuild` (~105s), curl **200** on port 8765.
- **Diff:** 10 modified Dart files under `flutter/lib/` (+601/-414); untracked `database.g.dart` + `providers_error_fallback_test.dart`.
- **Uncommitted:** sibling agent edits across core providers, repos, screens, and generated Drift code; ready for operator commit when requested.

## Recent changes (2026-07-04, Flutter web data screens)

- Fixed Today narrative query column mismatch in `flutter/lib/features/today/today_repository.dart` (`health_narratives.day` instead of `for_date`) so live narrative fetch can succeed.
- Updated Meds async error fallback UI in `flutter/lib/features/meds/meds_screen.dart` to a non-error empty state ("No medications yet") with refresh action.
- Re-ran gates: `cd flutter && dart run build_runner build --delete-conflicting-outputs && flutter analyze lib/ && flutter test` (all pass).
- Rebuilt preview with `./scripts/flutter-web-serve.sh --rebuild`; browser checks on `http://127.0.0.1:8765/#/today`, `#/vitals`, and `#/meds` now show data-capable layouts with honest empty states, not "Could not load" errors.

## Recent changes (2026-07-04, session: machine sync + TestFlight 5 + Flutter data fixes)

- **Branch:** `lovable/redesign` checked out locally; uncommitted session work (Flutter fixes, TestFlight script, build 5).
- **TestFlight 1.0 (5):** `bun run ios:testflight` succeeded after `scripts/native-ios-testflight.sh` gained App Store Connect API key auth (`-authenticationKeyPath` etc., no Xcode Apple ID login). ASC processing **VALID**; internal testers on **Development Team** can install.
- **Flutter data loading:** auth bootstrap gate in `app.dart`; try/catch empty fallbacks in Today/Meds repos; data providers await `authRepositoryProvider.future`; `flutter-web-serve.sh` Doppler key fix; `database.g.dart` generated via `build_runner`.
- **Flutter web:** `./scripts/flutter-web-serve.sh --rebuild` → http://localhost:8765 (HTTP 200). `flutter analyze lib/` clean; `flutter test` 3/3.

## Recent changes (2026-07-04, memory sync 50a1122)

- **`50a1122`** on `lovable/redesign`: synced `AGENTS.md` and continual-learning index after Flutter session; handoff git head updated from `eb9b3e4`.

## Recent changes (2026-07-04, Flutter scope documentation)

- Documented honest Flutter scope (signed-in app only, not full website) in this handoff and `docs/LOVABLE-FLUTTER-SYNC.md`.
- Added missing assets inventory and Phase 2 port plan (marketing heroes, metric charts, branding).
- Placeholder logo at `flutter/assets/branding/purple_logo.png` (from `public/icon-512.png`; wire in `pubspec.yaml` when sign-in/top bar needs it).

## Recent changes (2026-07-04, Flutter Phase 1 Agent D web build)

- **`flutter build web --release`** succeeded (CanvasKit via default web renderer; wasm dry-run warns on `flutter_secure_storage_web` only).
- **`flutter/web/index.html`**: document title **Purple**, favicon `favicon.png`, meta description updated.
- **Compile fix:** removed duplicate `AccountScreen` / `ToolsScreen` placeholders from `lib/features/settings/settings_placeholder_screen.dart` (real screens live under `features/account/` and `features/tools/`).
- **Local preview:** **`http://localhost:8765`** serves `flutter/build/web` (`./scripts/flutter-web-serve.sh` from repo root; `--rebuild` runs Doppler release build with `--base-href=/`).
- **Fix (2026-07-04):** prior serve used `--bind 127.0.0.1` only; macOS `localhost` often hits IPv6 `::1` first (connection refused). Script now binds **`::`** so both URLs return HTTP 200. **Blank black screen (2026-07-04):** Flutter 3.44 default PWA SW registers then unregisters and reloads clients on activate, leaving a dark `#0a0710` body until CanvasKit paints. Local preview build now passes **`--pwa-strategy=none`** (empty `flutter_service_worker.js`, `_flutter.loader.load()` with no SW). `flutter/web/index.html` shows a **Loading Purple** spinner until `flutter-first-frame`. If an old SW is cached, hard-refresh or clear site data once. WASM web build not default; CanvasKit loads from `/canvaskit/` (same origin, no CORS).

**Build commands:**

```bash
cd flutter
flutter pub get
dart run build_runner build --delete-conflicting-outputs
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build web --release --base-href="/" --pwa-strategy=none \
  --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"
cd build/web && python3 -m http.server 8765 --bind ::
```

## Flutter Phase 0 (complete)

Multi-platform client under `flutter/` (iOS, Android, web, macOS, Windows). Phase 0 agents merged and integrated:

| Layer | Path | Status |
|-------|------|--------|
| Scaffold | `flutter/` project, `org.purplelife.app` | Done |
| Design | `design/tokens.json`, `lib/design/` | Done |
| Offline core | `lib/core/` Drift + auth + sync | Done |
| Shell | `lib/shell/` GoRouter, nav, auth gate | Done |
| Features | `lib/features/` today, vitals, sign-in stubs | Done |

**Run locally** (publishable key from Doppler, never commit):

```bash
cd flutter
flutter pub get
dart run build_runner build --delete-conflicting-outputs
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter run --dart-define=SUPABASE_ANON_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY"
```

Optional defines: `SUPABASE_URL` (default `https://auth.purplelife.org`), `SITE_URL`, `WORKER_API_BASE_URL`.

**Verify:** `cd flutter && flutter analyze lib/ && flutter test`


**Flutter web (local preview):** open **`http://localhost:8765`** or **`http://127.0.0.1:8765`** in the address bar only. Do not use `file://` or paste repo paths.

```bash
# from repo root (foreground; Ctrl+C to stop)
./scripts/flutter-web-serve.sh

# rebuild release web then serve
./scripts/flutter-web-serve.sh --rebuild

# dev server (flutter run web-server, hot reload)
./scripts/flutter-web-serve.sh --dev
```

Verify: `curl -s -o /dev/null -w '%{http_code}' http://localhost:8765/` should print `200` (IPv4 and IPv6).

If `flutter/build/web` is missing, the script runs `doppler run ... flutter build web --release --base-href=/` with `SUPABASE_ANON_KEY` from `VITE_SUPABASE_PUBLISHABLE_KEY`.


**Integration fixes (2026-07-04):** unified `main.dart`/`app.dart` (`MaterialApp.router` + `PurpleTheme` + core provider bootstrap); renamed app auth state to `AppAuthState` (avoids Supabase `AuthState` collision); added `PurpleColors`/`ShellContentColumn` shell helpers; aligned shell glass widgets with design `GlassSurface` API; fixed `supabaseClientProvider` init order; router `initialLocation` `/sign-in`; removed duplicate `services/connectivity_service.dart` and agent placeholder markdown files; Drift `build_runner` codegen wired.

**Phase 1 integration (2026-07-04, Agent F):** merged Agents A/B/C router routes; added `ChatScreen`/`ChatCareScreen` stubs at `/chat` and `/chat-care`; `OfflineBanner` on all shell routes; loading skeletons on Today, Vitals, Journal, Meds, Care; lint cleanup (`flutter analyze lib/` zero issues); `flutter test` 3/3 pass.

**Open (Phase 2+):** my-health route, marketing imagery/charts in asset bundle, streaming chat UI, caregiver sharing flows, i18n ARB sync, native HealthKit/Connect OAuth, full wearable OAuth, store builds (owner approval required). Marketing pages stay on React unless Phase 5 chooses Flutter Web for public routes.

## Flutter Phase 1 screen map

| Route | Status |
|-------|--------|
| `/sign-in`, `/today`, `/vitals`, `/journal`, `/journal/new`, `/meds` | Functional |
| `/settings`, `/account`, `/tools`, `/care/:ownerId` | Functional (partial stubs inside) |
| `/settings/sharing`, `/settings/travel`, `/settings/reports`, `/settings/contact` | Stub |
| `/chat`, `/chat-care` | Stub (routes wired) |

## Current hosting state

Production runs on the Cloudflare Worker `purplelife` at `https://www.purplelife.org`
(DNS cutover complete). Supabase live data is on ref `xxnzmfzsjplrutrgbzxy` with
branded auth at `https://auth.purplelife.org`.

- OAuth: `supabase.auth.signInWithOAuth()` on prod/local; `lovable.auth` only on Lovable preview hosts (`isLovablePreviewHost()` in `src/lib/lovable-preview.ts`).
- Email: queue delivery via Resend (`/api/email/queue/process`), Supabase send-email hook at `/api/email/auth/webhook`, Resend bounce/complaint webhook at `/api/email/suppression`.
- AI: Anthropic Claude is the platform default (`src/lib/ai-gateway.server.ts`); Lovable gateway remains only as a last-resort fallback for Lovable previews without an Anthropic key.
- Health data UI: HIPAA-ready empty states on `/vitals` and `/my-health` when no biometrics (no sample numbers, no DemoBadge). CI guard: `scripts/check-no-fake-vitals.mjs`.

**Deploy model (during Lovable redesign):** manual only. `.github/workflows/deploy.yml`
triggers on `workflow_dispatch`, not on push to `main`. Cursor runs the gatekeeper
checklist in `docs/LOVABLE-REDESIGN-WORKFLOW.md`, then asks the owner before deploy.
Local path: `bun run build:prod` then `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bash -c 'export CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0; bunx wrangler deploy -c wrangler.deploy.jsonc'`.
Cron Triggers fan out from `scheduled()` in `src/server.ts` through a `SELF` service binding.

## Session audit (2026-07-03, Cursor restart recovery)

Subagent transcripts under `agent-transcripts/0b183bba-c600-4c86-8d1a-9e91eafaf7bc/subagents/`. Many agents were interrupted mid-run; code landed in the working tree and was finished/deployed by the parent audit.

| Agent | Task | Status | Key files | Deployed |
|-------|------|--------|-----------|----------|
| `04e7fd10` | Apple Health connect fix | **COMPLETE** (audit) | `health-ios.ts` (vo2Max removed from AUTH_READ_TYPES; `isCoreAuthorized` partial-grant), `use-native-apple-health.ts` | Yes (`ede63b48`) |
| `f6754ada` | TestFlight status | **COMPLETE** | ASC scripts, `docs/testflight-setup.md` | N/A (build 2 on ASC) |
| `46d73269` | native-sync backend verify | **COMPLETE** | `native-health.server.ts`, `/api/health/native-sync` | Yes (prior `9a6481ac`) |
| `5f7a1ee2` | Capgo HealthKit research | **COMPLETE** | research only | N/A |
| `58ac1f1a` | Native touch UX polish | **COMPLETE** (audit) | `styles.css` (`touch-action`, `.glass-press`), `bottom-nav.tsx`, `mobile-top-bar.tsx`, native route guards | Yes (`ede63b48`) |
| `a42091a9` | Sync time display fix | **COMPLETE** (audit) | `use-native-apple-health.ts` (`lastSyncAt`), `apple-health.server.ts` (`touchAppleHealthSync`) | Yes (`ede63b48`) |
| `ef7c0f78` | Deploy pending fixes | **COMPLETE** (audit) | all pending web changes | Yes (`ede63b48`) |
| `47e4d2d7` | Glass tokens (1/10) | **COMPLETE** | `styles.css` (`--glass-*`, `.glass-surface/card/nav/pill/press`) | Yes (`ede63b48`) |
| `3f2f0052` | Glass nav (2/10) | **COMPLETE** (audit) | `bottom-nav.tsx`, `mobile-top-bar.tsx` (`nav-glass-bar`, `nav-glass-top`) | Yes (`ede63b48`) |
| `ef01512c` | Glass Today (3/10) | **COMPLETE** (audit) | `today.tsx`, `date-strip.tsx` | Yes (`ede63b48`) |
| `3fb73c3f` | Glass vitals (4/10) | **COMPLETE** (audit) | `vitals.tsx`, `metric-card.tsx`, `score-tile.tsx` | Yes (`ede63b48`) |
| `e130114e` | Glass sheets (5/10) | **COMPLETE** | `sheet.tsx`, `dialog.tsx`, `drawer.tsx`, `alert-dialog.tsx` | Yes (`ede63b48`) |
| `b238a89a` | Glass settings (6/10) | **COMPLETE** (audit) | `account.tsx`, `tools.tsx`, `sheet-page.tsx` | Yes (`ede63b48`) |
| `fcb0f70a` | Glass journal (7/10) | **COMPLETE** (audit) | `journal.index.tsx`, `entry-card.tsx` | Yes (`ede63b48`) |
| `48d2522a` | Glass meds (8/10) | **COMPLETE** (audit) | `today-panel.tsx` | Yes (`ede63b48`) |
| `042a4af2` | Glass auth (9/10) | **COMPLETE** (audit) | `sign-in.tsx` (`glass-card`, `glass-input`, `glass-cta`) | Yes (`ede63b48`) |
| `cf296b43` | Glass reports+deploy (10/10) | **COMPLETE** (audit) | report components + `chat.tsx` bubbles; Worker deploy | Yes (`ede63b48`) |

**Figma MCP:** `plugin-figma-figma` requires auth (`mcp_auth`); tokens were not extracted from the iOS 27 kit. Glass values follow Apple HIG liquid-glass range (blur 24 to 36px, rgba fills, `@supports` fallbacks) in `styles.css`.

**iOS device:** `bun run ios:device-build` succeeded on **aa's iPhone Air** (`A3AE3F17-7880-5C6E-A421-95229F9ECD48`). Fixed `scripts/native-ios-device-build.sh` UUID parsing (device names with spaces broke `awk $3`).

**User action after deploy:** Force-quit Purple on iPhone, reopen so the WebView loads `ede63b48` assets from `https://www.purplelife.org`. Then test **Settings → Connect Apple Health** (partial HealthKit grants should now connect).

## Phase 0 Flutter foundation (2026-07-04, parallel agents)

Six agents scaffold the Flutter multi-platform client while Lovable stays the web design source on `lovable/redesign`.

| Agent | Task | Status | Key outputs |
|-------|------|--------|-------------|
| 1/6 | Flutter project scaffold | In progress | `flutter/` app, `pubspec.yaml`, platform folders |
| 2/6 | `design/tokens.json` bridge | **COMPLETE** | `design/tokens.json`, `flutter/lib/design/*`, `design/README.md` |
| 3/6 | Supabase client + env | In progress | `flutter/lib/core/supabase/`, Doppler-local env pattern |
| 4/6 | Design system widgets | In progress | `flutter/lib/design_system/` consuming tokens |
| 5/6 | CI analyze/test | In progress | Workflow or script for `flutter analyze` / `flutter test` |
| 6/6 | Documentation + runbook | **COMPLETE** | `docs/LOVABLE-FLUTTER-SYNC.md`, `mem/flutter-lovable-workflow.md`, `flutter/README.md`, `.cursor/rules/flutter-lovable-sync.mdc`, `AGENTS.md`, handoff |

**Phase 0 status:** **COMPLETE** (integration pass 2026-07-04). All six agent outputs merged; `flutter analyze lib/` zero errors; `flutter test` passes. Phase 1: auth + live data wiring per `docs/LOVABLE-FLUTTER-SYNC.md`.

## Recent changes (2026-07-04, Phase 0 Flutter integration pass)

- **Flutter web local:** URL `http://localhost:8765` (browser only); `scripts/flutter-web-serve.sh` serves `flutter/build/web` on port 8765.
- **Integration:** Unified `app.dart` (`MaterialApp.router`, `PurpleTheme.dark()`, `routerProvider`, auth + connectivity bootstrap). Fixed auth layering (`AppAuthState` vs Supabase `AuthState`), `supabaseClientProvider` init order, shell/design API mismatches (`PurpleColors`, `ShellContentColumn`, token-based `GlassSurface`). Drift codegen via `build_runner`. Removed duplicate `services/connectivity_service.dart` and agent placeholder markdown. Router starts at `/sign-in`. Sign-in wrapped in `Scaffold` for Material ancestor.

## Recent changes (2026-07-04, Phase 0 Flutter scaffold Agent 1/6)

- **`flutter/` project scaffold:** `flutter create` with `--org org.purplelife --project-name purple_app`; platforms enabled (iOS, Android, web, macOS, Windows). Entry: `lib/main.dart` + `lib/app.dart`; `core/config/app_config.dart` (dart-define, default `https://auth.purplelife.org`); `core/constants/app_constants.dart`. Bundle ID `org.purplelife.app` on iOS/Android. Strict `analysis_options.yaml`. See `flutter/README.md`.

## Recent changes (2026-07-04, Phase 0 design tokens)

- **Agent 2/6 design tokens:** Added `design/tokens.json` (colors, glass, layout, spacing, radius, touch, typography) extracted from `src/styles.css`. Flutter layer: `flutter/lib/design/tokens.dart`, `purple_theme.dart`, `glass_surface.dart`, `glass_card.dart`, `glass_nav_bar.dart`; asset copy at `flutter/assets/design/tokens.json`. Flow documented in `design/README.md`.

## Recent changes (2026-07-04, TestFlight upload 1.0 build 4)

- **TestFlight upload:** Ran full gate sequence (`check:em-dash`, `check:native-shell`, `native:sync`, `ios:local-signing`, `ios:check-asc`, `ios:testflight`). First attempts failed (DerivedData disk I/O, corrupt SwiftPM Luciq artifact cache, `Package.swift` modified during resolve, SIGKILL on 8 GB RAM). Recovery: wipe `org.swift.swiftpm` + App DerivedData, pre-resolve packages, retry with `IDEBuildOperationMaxNumberOfConcurrentCompileTasks=1`. Final run: **ARCHIVE + EXPORT SUCCEEDED**, `Upload succeeded`, package processing on ASC. No build bump (still **1.0 (4)**). Optional `ios:device-build` skipped (no USB iPhone detected).

## Recent changes (2026-07-04, 5-issue bugfix ship)

- **Production web deploy (`af1200ed`):** Native layout scroll containment in `native-app-shell.tsx` (FAB `z-50` above nav), calendar-day sync labels in `sync-status.tsx`, unified glass toolbar on `care.$ownerId.tsx`, TSC fix (`canWrite` on `JournalPanel`). Gates: `check:em-dash`, `check:native-shell`, `tsc --noEmit`, `build:prod` all pass.
- **TestFlight 1.0 (4):** Archive succeeded once; export failed (`ditto: Cannot get real path` for Desktop archive path). Use `ARCHIVE_PATH=/tmp/Purple.xcarchive` on retry. Subsequent upload attempts blocked by Xcode OOM (SIGKILL 137) and corrupted SPM/DerivedData from parallel retries; clear `~/Library/Developer/Xcode/DerivedData/App-*` and `~/Library/Caches/org.swift.swiftpm/artifacts` before next run.

## Recent changes (2026-07-04, TestFlight launch crash)

- **TestFlight launch crash on iOS 27 (build 4 fix):** Root cause was missing bundled `index.html`. Committed code still had `webDir: "dist/client"` (TanStack Start emits no root HTML); `capacitor-shell/index.html` existed only as an untracked local file, so ASC builds 1–2 shipped without a WebView fallback and Capacitor crashed at launch. Fix: commit `capacitor-shell/index.html`, keep `webDir: "capacitor-shell"`, add `scripts/check-native-shell.mjs` (runs before device/TestFlight builds), harden `ios:device-build` to always `native:sync`. Luciq: enable launch-crash sync, drop `.floatingButton` (UIKit conflict risk on iOS 26+). `CURRENT_PROJECT_VERSION=4`. Verified Release archive + USB install on iPhone Air iOS 27.

## Recent changes (2026-07-03, TestFlight + ASC)

- **Native touch + responsiveness (2026-07-03, Agent 7/8):** Optimistic `NativeConnectivityGate` (soft background ping, offline only on `navigator.offLine` or strict retry); `NativeRouteGuard`/`NativeAppBootstrap` use `useAuth()` instead of async `getSession()`; faster Capacitor bridge poll in `use-native-app.ts`; `html.native-app` applied optimistically during bridge detection; CSS fixes for closed sheet `pointer-events`, z-index stacking, `.sheet-link` press feedback. `check:em-dash` pass; debug build installed on connected iPhone.
- **Apple Health connect + liquid glass deploy (2026-07-03 night):** Removed `vo2Max` from iOS `AUTH_READ_TYPES` (Capgo enum rejects it); authorization uses `isCoreAuthorized` (any core type granted). `lastSyncAt` from `apple_health_tokens` drives "Last synced just now". Liquid glass design system across nav, Today, vitals, sheets, settings, journal, meds, auth, reports, chat. Prod deploy `ede63b48`. iPhone Air debug build reinstalled via fixed `ios:device-build` script.
- **Luciq crash reporting + launch fix (2026-07-03 evening):** Integrated Luciq SDK 19.9.0 via SPM (`luciqai/luciq-ios-sdk`), init in `AppDelegate.swift`, token via Doppler `LUCIQ_APP_TOKEN` → `LocalSigning.xcconfig`. Added `capacitor-shell/index.html` (TanStack Start has no `index.html` in dist); `webDir` now `capacitor-shell`. Hardened `initNativeApp()` try/catch; med reminders check permissions before prompt. `CURRENT_PROJECT_VERSION=2`. **TestFlight build 2 uploaded**; **debug build installed and launched on iPhone Air** (no crash). `scripts/native-ios-device-build.sh` now auto-installs + launches on connected device.
- Owner created ASC app **Purple for Life** (Apple ID `6787298041`, bundle `org.purplelife.app`).
- `bun run ios:check-asc`: all four Doppler secrets present (`purple-life/prd`).
- First `bun run ios:testflight`: export failed (missing `NSHealthUpdateUsageDescription` in `Info.plist`).
- Added `NSHealthUpdateUsageDescription` to `ios/App/App/Info.plist`; second upload **succeeded** (1.0 / build **1**).
- ASC co-browse: subtitle, Health & Fitness category, content rights, promotional text, description, keywords, review notes, E2E demo creds, manual release. Screenshots captured to `test-results/asc-screenshots/` via `scripts/capture-asc-screenshots.mjs`.
- ASC co-browse (2026-07-03 evening): Support URL `https://www.purplelife.org/contact`, Copyright `ideaTree Inc. 2026`, age-ratings wizard complete (Medical/Treatment None, Health/Wellness Yes, 4+ global), build **1.0 (1)** attached to version 1.0.
- ASC still open: upload 4 iPhone 6.5" screenshots (browser MCP cannot file-upload), App Privacy questionnaire (Admin, not started), then **Add for Review**.

Redesign baseline on `main`: commit `7086ffa` (perf/responsive/native foundation).

## Native app track (Capacitor)

Thin hybrid shell: WebView loads production (`capacitor.config.ts`), native
plugins bridge through `src/lib/native/*` without bundling `@capacitor/*` into
the web build. Full runbook: `docs/native-app-setup.md`. Durable decision:
`mem/native-app-healthkit.md`.

### Implemented in repo (ships with web deploy)

| Area | Location | Notes |
|------|----------|-------|
| Capacitor config | `capacitor.config.ts` | `server.url` = `https://www.purplelife.org` |
| Runtime bridge | `src/lib/native/capacitor.ts` | `isNativeApp()`, `callPlugin()`, web no-op |
| Shell init | `src/lib/native/index.ts` | Status bar, splash hide, Android back button |
| Local dose reminders | `src/lib/native/index.ts` | `scheduleNativeMedReminders()` via Capacitor Local Notifications |
| Native auth OAuth | `src/lib/native/oauth.ts`, `social-sign-in-buttons.tsx` | System browser + `org.purplelife.app://auth-callback` deep link |
| Native wearable OAuth | `src/lib/native/wearable-oauth.ts` | Oura/Whoop system browser + `org.purplelife.app://oauth-{oura,whoop}-callback` |
| Native shell | `NativeAppShell`, `NativeRouteGuard`, `NativeConnectivityGate`, `AppPage`, `shell-routes.ts` | Dedicated app chrome; marketing blocked; offline retry |
| Native notifications | `native-notifications-panel.tsx` | Local notification permission on Tools (native); web phone alarms hidden |
| Legal in-app | `/settings/privacy`, `/settings/terms` | Native route guard redirects `/privacy` and `/terms` |
| Native health bridge | `src/lib/native/health-ios.ts`, `health-android.ts`, `health.ts` | `@capgo/capacitor-health` via `Health` plugin; iOS HealthKit + Android Health Connect daily aggregation |
| Native health sync | `src/lib/native-health.functions.ts`, `src/lib/native-health.server.ts`, `/api/health/native-sync` | Authenticated upsert into `biometrics` (`apple_health`, `health_connect`) |
| Apple Health UI | `apple-health-connection.tsx`, `apple-health-card.tsx` | Web: Health Auto Export webhook; native iOS: HealthKit Connect + `syncNativeHealthBatch` (Settings, Tools, onboarding step 2) |
| Startup hook | `src/components/common/deferred-startup.tsx` | Skips web SW reminders when `isNativeApp()` |
| npm scripts | `package.json` | `native:install`, `native:add`, `native:sync`, `native:open:*` |
| Web Apple Health webhook | `/api/public/hooks/apple-health` | Push-only Health Auto Export for browser users |
| Native projects in git | `ios/` (`6ba6997`), `android/` (`2710085`) | HealthKit entitlements, `Info.plist` usage strings, `org.purplelife.app` OAuth URL scheme, `@capgo/capacitor-health` wired in both platforms |
| Live DB for native health/push | `native_push_tokens`, `biometrics.health_connect` | Migrations applied on `xxnzmfzsjplrutrgbzxy` (2026-07-03) |

### Agent-automated (no manual operator GUI steps)

The agent runs these end to end via scripts, Doppler, and APIs. Do not hand off dashboard or Xcode GUI work for items in this table.

| Area | Command / path | Notes |
|------|----------------|-------|
| Capacitor sync | `bun run native:sync` | Copies web assets and plugin config into `ios/` and `android/` |
| iOS simulator build | `scripts/native-ios-build.sh` | `xcode-select`, `native:sync`, `pod install` when a Podfile exists (CapApp-SPM skips pods), `xcodebuild` Debug simulator |
| Worker deploy | `bun run build:prod` + `wrangler deploy` | Doppler `cursor-cloudflare` / `prd_cloudlfare` |
| Supabase migrations / DDL | Management API `POST /v1/projects/{ref}/database/query` | CLI `db query --linked` may 403; see `docs/manual-deploy-bundle.md` |
| Edge functions | `bunx supabase@latest functions deploy <name> --project-ref xxnzmfzsjplrutrgbzxy` | |
| Doppler secrets | `doppler run --project cursor-cloudflare --config prd_cloudlfare -- ...` | Agent resolves keys; do not ask the user for manual env mapping |
| Native health backend | `/api/health/native-sync`, `native-health.server.ts` | Shipped `1a24bd8`, deploy `9a6481ac` |

### Environment-blocked (machine or account limits, not operator GUI work)

| Blocker | What it blocks | Unblocks when |
|---------|----------------|---------------|
| **`/Applications/Xcode.app` missing** | `xcodebuild` if script cannot find Xcode | Agent auto-detects `~/Downloads/Xcode-beta.app`, `/Applications/Xcode.app`, or `mdfind`. Uses `DEVELOPER_DIR` when `xcode-select` still points at CLT. |
| **iOS Simulator runtimes** | Launch app in Simulator | Install an iOS simulator runtime in Xcode Settings, or use a USB iPhone (required for real HealthKit) |
| **Apple 2FA / signing without API token** | Device signing, TestFlight archive | Add App Store Connect API key to Doppler `purple-life` (`APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY` .p8 contents). Runbook: `docs/testflight-setup.md`, `bun run ios:testflight` |
| **APNs / FCM credentials** | Native push delivery (`native_push_tokens` table is live) | Wire APNs/FCM secrets into Worker and send path |
| **Store developer accounts** | TestFlight / Play internal track submission | App Store Connect + Play Console accounts active |

### Apple signing and team access

If the agent is blocked on code signing, provisioning profiles, or team ID:

1. Ask the user for **`DEVELOPMENT_TEAM`** in Doppler `purple-life` / `prd` (or `cursor-cloudflare` / `prd_cloudlfare`), **or** full Apple Developer Program access (API key or account the agent can use for signing). Native secrets live in Doppler project **`purple-life`** (`DEVELOPMENT_TEAM` configured 2026-07-03).
2. Do **not** assign manual Xcode GUI steps (open Signing & Capabilities, click through certificates, etc.). The agent configures `DEVELOPMENT_TEAM` in the Xcode project or xcconfig and retries `scripts/native-ios-build.sh` / `xcodebuild`.
3. OAuth redirect `org.purplelife.app://auth-callback` is already in native plist/manifest; provider consoles (Supabase, Google, Apple) still need the URL registered if not done yet.

### Sync model

Web deploy updates UI and `src/lib/native/*` JS instantly for installed apps
(next launch). Store release required only for native project changes (plugins,
entitlements, permissions, icons, `capacitor.config.ts` shell changes). See
`docs/native-app-setup.md` section 8.

## Recent changes (2026-07-02 to 2026-07-03)

1. **TestFlight prep commit (2026-07-03, `31f9176` on `lovable/redesign`):** Committed native shell, TestFlight scripts, `scripts/check-asc-doppler.sh`, `bun run ios:check-asc`. ASC API secrets still missing in Doppler; `ios:testflight` fails fast until owner adds keys (see `docs/testflight-setup.md` Step A/B).
1. **Native shell ship (2026-07-03, deploy `9b7f3199`):** All 8 native tasks verified complete: Oura/Whoop native OAuth, `NativeNotificationsPanel`, legal routes, viewport fixes, connectivity gate, shell architecture. Gates passed; prod `/today` HTTP 200.
1. **Native Apple Health UX v2 (2026-07-03, pending deploy):** Larger centered Health Access panel on Tools/Settings native iOS; full-width Connect + **Open Health Settings** link (`app-settings:` via Capacitor App); inline permission-denied message (no toast-only); stricter HealthKit auth (clears stale localStorage when denied). Files: `native-apple-health-panel.tsx`, `use-native-apple-health.ts`, `health-ios.ts` (`openHealthKitSettings`).
1. **TestFlight pipeline (2026-07-03, blocked on API key):** `scripts/native-ios-testflight.sh`, `scripts/asc-ensure-app.mjs`, `ios/ExportOptions.plist`, `bun run ios:testflight`. Release archive succeeds locally; export blocked until App Store Connect app record exists. Needs Doppler `APP_STORE_CONNECT_*` secrets. Runbook: `docs/testflight-setup.md`.
1. **Native app experience (2026-07-03, pending deploy):** `NativeAppShell` + `AppShellRouter`; `NativeRouteGuard`; `NativeConnectivityGate`; `NativeAppBootstrap` (cold start off marketing `/`); welcome/journal hide tab chrome; OAuth cold-start via `initNativeOAuthDeepLink()`; OAuth account deletion without password; camera/mic plist + `PrivacyInfo.xcprivacy`; push registration disabled until APNs; native med reschedule. Docs: `mem/native-app-experience.md`, `docs/native-app-store-review.md`.
1. **HealthKit permission gate (2026-07-03, `7029637`, deploy `cbb9fb47`):** Native iOS no longer treats account `biometrics` rows (`source=apple_health` from webhook/HAE/import) as "connected". `getHealthKitAuthorizationStatus()` uses `@capgo/capacitor-health` `checkAuthorization` plus a device localStorage flag set only after successful `requestAuthorization`. UI: not authorized shows "Connect Apple Health" only (no Sync now); authorized shows Sync now + sync state from data freshness; stale web-import note when DB has data but HealthKit not linked. Files: `health-ios.ts`, `use-native-apple-health.ts`, `apple-health-connection.tsx`, `apple-health-card.tsx`.
1. **Native Apple Health UX (2026-07-03, `bebe166`, deploy `27be89de`):** Settings `/settings/sharing` shows HealthKit connect/sync on native iOS (no webhook/HAE/ZIP); welcome onboarding adds optional step 2 "Connect with devices and apps"; PWA install banner hidden in native app; `/apple-health-import` redirects native iOS to Settings. Shared hooks: `use-native-ios.ts`, `use-native-apple-health.ts`. Gates: `check:em-dash`, `tsc`, `build:prod`.
1. **Native HealthKit/push ship (2026-07-03, `1a24bd8`, deploy `9a6481ac`):** `native_push_tokens` + `biometrics` `health_connect` source applied on live `xxnzmfzsjplrutrgbzxy` via Management API; native health/push server functions, `/api/health/native-sync`, Capacitor health bridges, docs (`docs/native-oauth-setup.md`, `docs/android-health-connect-setup.md`). Gates: `check:em-dash`, `tsc --noEmit`, `build:prod`.
1. **iOS / PWA mobile fixes (2026-07-03, `19d8d4d`, deploy `321a9227`):** Date strip edge padding + margin parity with Today column; mobile nav sheet scroll containment + GitHub link removed; PWA install banner platform detection (`src/lib/pwa-platform.ts`) with iOS Safari vs Chrome guidance; keyboard focus helper + 16px inputs on mobile; Apple Health Tools copy (Health Auto Export steps, no HealthKit on web); manifest `start_url` `/today`, `display_override`.
2. **Lovable merge (2026-07-03):** Today `DateStrip`, historical day view, date-aware vitals, sign-in redesign; follow-up commit removed score-tile date gating (`d209c34`). Deploy `bd28333c`.
2. **Lovable redesign merged and deployed** to prod; OAuth host split, home images restored from Lovable CDN breakage.
2. **Auth fixes:** MFA-aware reset password, duplicate-email signup message, supabase-js 2.110.0.
3. **HIPAA data cleanup:** removed fake health metrics; empty states + connect prompts; `check-no-fake-vitals.mjs` CI guard.
4. **CI:** `check:lovable-auth`, CI on `lovable/redesign` pushes, `check:live-data:db` auto-resolves Doppler `SERVICE_ROLE_KEY`.
5. **Docs:** `docs/SYNC-AND-RELEASE.md` runbook; post-task documentation rule (`.cursor/rules/post-task-documentation.mdc`).
6. **Post-deploy smoke (2026-07-03):** `routes-smoke` + `today` on `desktop-1024` against prod: 17 passed.
7. **Full prod e2e (2026-07-03):** 445 passed, 32 skipped, 89 flaky, 12 hard failures (mostly stale `samuel-fixes.spec.ts` + tablet web-vitals budgets). HIPAA `integrations-vitals` tests passed on all viewports.
8. **Native app docs (2026-07-03):** Expanded `docs/native-app-setup.md` (HealthKit execution checklist, web vs store sync model), `mem/native-app-healthkit.md`, handoff native track tables (agent-automated vs environment-blocked).
9. **Native HealthKit wiring (2026-07-03):** `health-ios.ts` migrated to `@capgo/capacitor-health` (`Health` plugin, same as Android); `health.ts` routes iOS permissions/read; `apple-health-connection.tsx` native Connect + `syncNativeHealthBatch`; health helpers re-exported from `src/lib/native/index.ts`.
10. **Native projects committed (2026-07-03):** `ios/` (`6ba6997`), `android/` (`2710085`) with HealthKit entitlements, OAuth URL scheme, Health Connect plugin wiring.
11. **Native iOS build (2026-07-03):** `scripts/native-ios-build.sh` uses `xcode-select` at `/Applications/Xcode-beta.app` (Xcode 27.0). Simulator and **device builds succeed**; signing via Doppler `purple-life`/`DEVELOPMENT_TEAM` + Apple Development cert. **Install blocked** until iPhone Developer Mode is enabled (Settings → Privacy & Security). `bun run ios:device-build` for USB install.

## Environment variables

In the local `.env` (values not committed beyond this machine):

- `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Production secrets live in Doppler `cursor-cloudflare` / `prd_cloudlfare`. Agent runs operational commands via `doppler run` automatically; do not ask the user for manual dashboard work unless truly blocked.

Referenced in code but NOT present locally (production needs them; several block local testing of those paths):

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | Platform-default AI (chat, insights, care profiles, edge functions) |
| `RESEND_API_KEY` | Email delivery (`/api/email/queue/process`) |
| `RESEND_WEBHOOK_SECRET` | Resend bounce/complaint webhook (`/api/email/suppression`) |
| `SEND_EMAIL_HOOK_SECRET` | Supabase send-email hook verification (`/api/email/auth/webhook`) |
| `EMAIL_PREVIEW_SECRET` | Email template preview routes |
| `SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Cron, email enqueue, admin functions, seeds, `check:live-data:db` |
| `CRON_SECRET` | All `/api/public/cron/*` endpoints |
| `PUBLIC_SITE_URL` | Email links, share links, unsubscribe headers |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET` | Wearable OAuth |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Optional per-user AI provider choices (and embeddings seeds for OpenAI) |
| `LOVABLE_API_KEY` | Legacy fallback only: lets Lovable previews run AI without an Anthropic key |

## Known gaps and sharp edges

1. **Supabase CLI 403s** on this project; migrations and edge functions are deployed manually via Management API or `bunx supabase@latest functions deploy` (`docs/manual-deploy-bundle.md`).
2. **CI/CD committed but dormant until GitHub secrets exist**: `.github/workflows/ci.yml` and `deploy.yml` need `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the `VITE_SUPABASE_*` values as repository secrets.
3. **Repo-wide lint debt**: `bun run lint` fails with thousands of pre-existing prettier errors across the codebase. New code should be prettier-clean; a one-shot `bun run format` cleanup is a separate decision because of the diff size. Lint is intentionally not in CI yet.
4. **Email queue pump scheduling**: the pump is a Supabase pg_cron job (`process-email-queue`, 5s interval) that POSTs to the app with the vault-stored service-role key. Its URL must point to `https://www.purplelife.org/api/email/queue/process`.
5. **`src/routeTree.gen.ts` is generated.** Never hand-edit; it regenerates from `src/routes/` during dev/build.
6. **`vite.config.ts` is a wrapper.** Do not add tanstackStart/react/tailwind/tsconfig-paths/cloudflare plugins manually while `@lovable.dev/vite-tanstack-config` is in place; duplicates break the build. The import must stay pointed at `dist/index.js` (the ESM build); the bare specifier resolves to the CJS build, which crashes config loading on Node 22+.
7. **E2E debt:** `tests/e2e/samuel-fixes.spec.ts` has 12 persistent prod failures (verify-sent button copy, prescriber label). Not blocking HIPAA empty-state work.
8. **External webhook pointers** at cutover: Stripe webhook, Supabase send-email hook, Resend webhook, Google/Apple OAuth redirect URLs, Oura/Whoop redirect URIs (prod URLs registered).

## Decisions made (2026-06-11)

1. Email provider: Resend.
2. Platform-default AI provider: Anthropic Claude.
3. Canonical public GitHub repository: `AstroAii/purpledrw`.
4. Worker name: `purplelife`; deploys go directly to Cloudflare.
5. Dual development continues in Cursor and Lovable; do not remove Lovable dev tooling.

## How to verify a change (cheapest first)

When reviewing Lovable changes, follow the full checklist in
`docs/LOVABLE-REDESIGN-WORKFLOW.md` and `docs/SYNC-AND-RELEASE.md`. Minimum gates:

1. `bun run check:em-dash` (lint is currently red repo-wide; lint only your changed files)
2. `bun run check:live-data`, `bun run check:lovable-auth`, and `bun run check:unique-images`
3. `bunx tsc --noEmit` and `bun run build:prod` + `bun run check:entry-budget`
4. `doppler run ... bun run check:live-data:db` when seeds or marketing data touched
5. `bunx playwright test tests/e2e/responsive-sweep.spec.ts -g "public routes"` for UI changes
6. `bun run test:e2e:prod` before asking the owner to deploy live (or after deploy for full confidence)

For Worker behavior: `wrangler dev` against the built output.

## Conventions snapshot

- Server code: `*.functions.ts` (RPC, auth middleware, zod) + `*.server.ts` (secrets, dynamic import only). Details in `.cursor/rules/server-functions.mdc`.
- 404 (not 403) on cross-user access; audit log after sensitive writes; RLS on every table.
- No em dashes anywhere, ever (CI gate).
- i18n strings through i18next; SSR renders `en` then hydrates locale.
- Footer only on marketing/auth pages, never inside `AppShell`.
- Post-task documentation mandatory: `.cursor/rules/post-task-documentation.mdc`.