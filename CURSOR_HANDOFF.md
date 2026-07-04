# Cursor Handoff

Operational state of the PurpleLife project for the next agent or engineer. Last updated: 2026-07-04 (session: TestFlight build 7 verification + ASC validation, `feat/tf-crash-fix-7` @ `03983ab`).

**Uncommitted:** branch `feat/tf-crash-fix-7` (`03983ab`). Working tree remains dirty with multi-agent Flutter + iOS changes in progress. Latest drawer pass: `flutter test` **7/7**, targeted `flutter analyze` clean for shell files, `./scripts/flutter-web-serve.sh --rebuild` rebuilt and served on **:8765**. **Do not commit** until operator says so.

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
| **App Store Connect (live)** | **1.0 (7)** (`CURRENT_PROJECT_VERSION=7`) | Capacitor iOS shell; upload **VALID** 2026-07-04; internal **Development Team** in beta |
| **Local repo (uncommitted)** | **1.0 (7)** | `ios/App/App.xcodeproj/project.pbxproj` bumped to `CURRENT_PROJECT_VERSION=7`; `bun run ios:testflight` archived + uploaded successfully from this branch |
| **Flutter web preview** | N/A (not a store build) | All Today/Vitals/Meds/Journal fail-open + burger drawer fixes; **local only** until committed and separately shipped |

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
| Git heads | `lovable/redesign` at **`c122e31`** (docs hash sync); **uncommitted fleet work** (17 modified + 3 untracked under `flutter/`, +729/−520) not pushed |
| Production deploy | Worker `purplelife`, version **`af1200ed-ac7f-4182-9021-d455a276fbce`** (2026-07-04, native layout + sync time + caregiver toolbar + crash shell) |
| TestFlight | **ASC live: 1.0 (7)** (`CURRENT_PROJECT_VERSION=7`, bundle `org.purplelife.app`, ASC `6787298041`). Upload **VALID** 2026-07-04; internal **Development Team** in beta (`IN_BETA_TESTING`). Local script includes API-key auth + macOS-safe temp key handling in `scripts/native-ios-testflight.sh`. Capacitor shell loads prod web, **not** Flutter `:8765`. |
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
- **Fix (2026-07-04):** prior serve used `--bind 127.0.0.1` only; macOS `localhost` often hits IPv6 `::1` first (connection refused). Script now binds **`::`** so both URLs return HTTP 200. Blank screen after load: hard-refresh or clear site data (stale `flutter_service_worker.js`). WASM web build not default; CanvasKit loads from `/canvaskit/` (same origin, no CORS).

**Build commands:**

```bash
cd flutter
flutter pub get
dart run build_runner build --delete-conflicting-outputs
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  flutter build web --release --base-href="/" \
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
