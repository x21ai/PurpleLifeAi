# HANDOFF

Current state of the world. Read this first, every session. Update before any task is
done. Newest entries at the top of the log.

Enforced by `.cursor/rules/00-handoff.mdc`. Extended ops: `CURSOR_HANDOFF.md`.

---

## Current snapshot

**2026-07-06 TF25 fleet merge — journal on main (`5531d06b`), upload pending.**
Journal agent `009fda0f` cherry-picked to `main` as `5531d06b` (keyboard dismiss, Change label,
media honesty). ASC latest **1.0 (24) VALID**; build **25** not on ASC yet. Integrator
`f82c971a` owns `ios:testflight` + push (no duplicate upload). Stack on `main`: auth/sync/data/
today/meds + journal + pubspec **1.0.0+25**.

**2026-07-06 TF25 P0 blank-data fix — ready for upload (`f2ac82d8`).**
Root cause: auth stream loading gap after reinstall (`authSessionProvider` still
`AsyncLoading` while `AuthRepository.currentSession` already restored) left `AuthGate`
blank and `todayDataProvider` returning empty without fetch; compounded by hung Supabase
calls (no timeout) and stale Keychain sessions (`ensureValidSession`). Fix stack:
`00279718` auth validation + gate spinner, `33a4d953` 15s provider fail-open,
`f2ac82d8` `readActiveSession` + **1.0.0+25**. Luciq build **24**: **0 open crashes**.
Verified: `flutter test` **159/159**, `:8765` redirects unauthenticated `/today` → sign-in.

**2026-07-06 TF25/26 Merged Today preview parity (committed, not pushed).**
`flutter/lib/features/today/`: removed dual-score hero for Merged preview layout; horizontal
metric strip always shows Sleep · HRV · Efficiency · Rest HR (em dash empty states) for
sleep-heart conditions; `sleepEfficiencyPct` from `sleep_efficiency_pct`; RECOMMENDED inline
card taps `/plan?segment=recommended` (informational, no lab-order deep links). Meds section,
quick actions, Maya card, protocol teaser, Ask Maya chips unchanged. Verified:
`flutter test test/today*.dart` **6/6**.

**2026-07-06 TF25 audit docs (`7c5f22d8`, not pushed).**
Audit `a198e779`: logged `flutter-today-doses-regression` (partial fix `adf42d6c`) and
`flutter-today-more-for-today-removed` in `docs/OPEN-ISSUES.md`; Today row in
`docs/FLUTTER-CUTOVER-GAP-MATRIX.md` updated for meds visibility. No push (TF25 integrator).

**2026-07-06 TF25 Today meds section restore (committed, not pushed).**
Merged Today regained pre-merge dose schedule card (`today_meds_section.dart`:
`medsForDayProvider`, read-only `TodayMedsSection` with link to full dose flow).
`meds_screen.dart` unchanged (filter chips, `TodayDosePanel` Taken/Snooze/Skip, mark all,
library intact from `1ed98cf` restyle). Quick action **Meds** → `AppRoutes.meds`.
Verified: `flutter test test/today_screen_render_test.dart test/meds_schedule_ux_test.dart`
**6/6**.

**2026-07-06 TF24 auth session validation fix (committed, not pushed).**
Flutter auth: `ensureValidSession()` on bootstrap (refresh + `getUser`, sign-out on invalid
Keychain restore after reinstall), `core/auth/auth_state.dart` gate status, `AuthGate` spinner
instead of blank shrink during `AsyncLoading`, onboarding profile 10s timeout, OAuth deep link
fail-open to `/sign-in?error=session`. Verified: `flutter analyze lib/core/auth/` clean,
auth tests **31/31**. Scope: auth only; no today/data/sync.

**2026-07-06 TF24 Today infinite-loading fix (committed, not pushed).**
`flutter/lib/features/today/`: 15s provider timeouts on `todayDataProvider`,
`scoreSnapshotProvider`, `scoreSnapshotForDayProvider`; fail-open empty `TodayData` with
`loadError` inline banner instead of full-screen error or infinite skeleton. Merged layout
preserved. Verified: `flutter test test/today_screen_render_test.dart` 3/3 + vital items 2/2.

**2026-07-06 Data tab resilient parallel fetch (committed, not pushed).**
`flutter/lib/features/data/`: per-query `_QueryResult.guard` with 12s timeout, partial
`DataScreenSnapshot` + `loadError` banner, `DataLoadingGate` 15s skeleton cap with retry CTA.
Verified: `flutter analyze lib/features/data/` clean. Fixes silent `AsyncLoading` from `5ad1576`
parallel `Future.wait`.

**2026-07-06 TestFlight 1.0 (24) VALID — Founding Team live.**
`main` + `lovable/redesign` @ **`2317b217`** (`a594b77b` merge includes **`cc6c2260`** About build
stamp). Flutter **1.0.0+24**: OAuth (`4430c13`), perf throttle (`5ad15766`), Luciq Settings row,
web legacy redirects. Gates: **`flutter test` 143/143**. ASC **1.0 (24) VALID** (~16:33 ET);
Founding Team **IN_BETA_TESTING** via `asc-add-build-to-group.mjs 24`. Worker **`a25b3da7`**
(eigital `CLOUDFLARE_ACCOUNT_ID`, zone routes bound). **Tester note:** update **22→23** for Merged
UI; **24** adds perf + OAuth + Luciq button + About version line.

**2026-07-06 About version/build date (`cc6c2260`).**
Settings About shows `Version 1.0.0 (24) · Jul 6, 2026` on Flutter (`AppBuildInfo` +
`package_info_plus`) and TanStack (`formatAppBuildLabel`). `BUILD_DATE` injected via
`scripts/app-build-env.sh` into TestFlight, Flutter web serve, and web `vite build`/`dev`.

**2026-07-06 TestFlight 1.0 (23) VALID — Merged fleet shipped.**
`main` + `lovable/redesign` @ **`d1f5675`**. Flutter **1.0.0+23**: 5-tab Merged shell
(Today · Data · FAB · Plan · Ask Maya), `/data` `/plan` `/ask-maya`, dual-score Today,
token restyle across meds/settings/reports/care/chat/data. TanStack: `data.tsx`, `plan.tsx`,
`ask-maya.tsx`, bottom-nav 5-tab, `_app` typography pass. Gates: `flutter analyze` 0 errors,
**135/135** tests. ASC **1.0 (23) VALID**; Founding Team via `asc-add-build-to-group.mjs 23`
(beta review WAITING_FOR_REVIEW). Web Worker deploy attempted (routes API used POS account;
worker bundle uploaded). Matrix ~**68%** weighted Merged parity (`docs/FLUTTER-CUTOVER-GAP-MATRIX.md`).

**2026-07-06 Settings Luciq "Report a problem" row (committed, not pushed).**
Commits **`b1f78e08`** + **`f4530cde`** on `lovable/redesign`: `SettingsHelpSection` in
`settings_hub.dart` calls `Luciq.show()` via `showLuciqReport()` when native Luciq init
succeeds (`luciqInitNotifier`); skipped on web / missing `LUCIQ_APP_TOKEN`. Wired in
`settings_screen.dart` Help section alongside Contact. Verified: `flutter analyze`
`lib/features/settings/` + `luciq_bootstrap.dart` (info-only). No push.

**2026-07-06 Google + Apple OAuth enabled on NEW Supabase (verified).**
Management API check on project **`xxnzmfzsjplrutrgbzxy`**: Google and Apple providers
**enabled** (agent c7052066, 2026-07-06). Branded callback
`https://auth.purplelife.org/auth/v1/callback`. **Login blocker is NOT missing providers** —
remaining gap is Flutter native **`auth-callback`** deep-link handling
(`flutter/lib/core/auth/auth_deep_link.dart`; agent fd0d190b). `LOVABLE-MIGRATION.md` Phase 2
callback line updated (was stale OLD ref).

**2026-07-06 TF23 Merged shell shipped + uploaded (Flutter).**
Commit **`b4a9dc1`** wires 5-tab nav (Today · Data · FAB · Plan · Ask Maya), routes
`/data` `/plan` `/ask-maya`, merged Today + Data/Plan/Ask Maya screens, `pubspec` **1.0.0+23**.
Branch `lovable/redesign` @ **`d1f5675`** (pushed). Gates: analyze clean, **135/135** tests.
TestFlight upload **EXPORT SUCCEEDED** ~16:19 ET; ASC processing (not VALID yet).
`asc-add-build-to-group.mjs 23` pending. `:8765` web rebuild verified HTTP 200.

**2026-07-06 Flutter OAuth P0 fix (committed, not pushed).**
Capacitor-parity Google/Apple OAuth: native `org.purplelife.app://auth-callback`, web origin
`/`, deep link → `/today`, Android intent filter, `SITE_URL` on `:8765` web serve. Verified:
`flutter analyze lib/core/auth/` clean, auth tests 25/25. Owner: Supabase redirect allow list
+ provider enable. No shell/Today Merged changes.

**2026-07-06 Merged styling pass (events, onboarding, shared — committed, not pushed).**
`events_style.dart`, `onboarding_style.dart`, timeline header + offline snackbar comma fix,
welcome onboarding token typography, shared skeleton/hero/narrative via `merged_style.dart`.
Sibling `1ed98cf` covered hydration/seizures/meds/journal. Verified: `flutter analyze` clean
on scope. No push.

**2026-07-06 TF23 Merged fleet serial integrate (pushing).**
`lovable/redesign` @ **`7a8a62c`** (14 commits ahead of origin). Flutter: 5-tab Merged shell,
`/data` `/plan` `/ask-maya`, dual-score Today, token restyle (meds/settings/reports/care/chat).
TanStack: `data.tsx`, `plan.tsx`, `ask-maya.tsx`, bottom-nav 5-tab, `_app` typography pass.
Verified: `flutter analyze` 0 errors, **`flutter test` 135/135**. TestFlight **1.0 (23)** uploading
Founding Team. Matrix ~68% weighted Merged parity. `superpower-design-parity` → production Partial.
Wrangler deploy pending web gates.

**2026-07-06 Merged Today parity slice (Plan / Ask Maya / Today — committed, not pushed).**
Commit `8d3abf7` on `lovable/redesign`. Merged Today: `DateStrip` with day-filtered scores via `scoreSnapshotForDayProvider`,
`TodayDualScoreHero` (readiness arc + sleep card), `TodayPersonalizationStrip` onboarding pill,
single `TodayMayaCard` narrative, metric strip, protocol teaser, Ask Maya chips, inline
recommended card. Ask Maya highlights deep-link `?q=` prompt chip. SF Pro via `PurpleType`
throughout. Verified: `flutter analyze` on scoped paths (info-only), `flutter test
test/today_screen_render_test.dart` 2/2. No shell/router/pubspec/ios changes. No push.

**2026-07-06 TF23 Flutter Data / Vitals merged restyle (committed, not pushed).**
Commit `1d461bb` on `lovable/redesign`: `data_style.dart`, unified Data tab, insights teaser,
metric detail with dated readings. Verified: `flutter analyze` on scope clean. No push.

**2026-07-06 TF23 web _app merged typography pass (committed, not pushed).**
Commit `f11e216` on `lovable/redesign`: `app-hero-title` / `app-section-title` in
`src/styles.css`; all signed-in `_app` routes aligned to Today merged pass (label-eyebrow,
capped `max-w-3xl` where applicable, insights/care narrowed from max-w-4xl). Duplicate Ask
Maya eyebrow removed; insights intro uses `today-lede` not NarrativeBlock. Includes Plan,
Data, Ask Maya routes + nav/i18n from parallel shell slice. Verified: `bunx tsc --noEmit` clean.
No push, no wrangler deploy.

**2026-07-06 TF23 reports / care / chat parity (committed, not pushed).**
Commit `7a3de99` on `lovable/redesign`: shared `lab_upload_prompt.dart` + `merged_style.dart`;
reports empty states use token-backed lab upload card; care dashboard Chat tab opens
`/chat-care` via `getOrCreateDirectThread` (React `ChatPanel` parity); chat shells use
`chat_style.dart` (SF Pro / merged palette). Removed redundant `fontFamily: PurpleType.serif`
overrides in scope. Router untouched (`/chat-care` already wired). Verified:
`flutter analyze lib/features/reports lib/features/care lib/features/chat` (info-only);
`flutter test test/chat_routes_test.dart test/reports_routes_test.dart` pass. No push.

**2026-07-06 TF23 Settings / Account / Tools theme parity (committed, not pushed).**
New `flutter/lib/features/settings/settings_style.dart`: `SheetPalette`, `SheetCanvas`,
`SheetGlass`, SF Pro text helpers, light-mode purple accents from `design/tokens.json`.
Settings hub (scroll), Account sheet, Tools sheet updated for theme-aware colors (dark +
light appearance). React parity: section order/copy unchanged; hub cards on Settings/Account.
`endDrawer` untouched. Verified: `flutter analyze lib/features/settings/ lib/features/account/account_screen.dart lib/features/tools/tools_screen.dart` clean. No router/pubspec/ios changes. No push.

**2026-07-06 Flutter Merged 5-tab shell (complete).**
Bottom nav: Today · Data · FAB · Plan · Ask Maya. Burger `endDrawer`: Account, Settings,
Tools, Care, Sign out (+ Meds in drawer). Routes wired in `router.dart`; legacy `/my-health`
→ `/data`, `/insights` → `/plan`. Commit `7521ef8` on `lovable/redesign`. Verified:
`flutter analyze lib/shell/` clean. No push.

**2026-07-06 Flutter Plan / Ask Maya / metric dates (parallel writer slice).**
New `flutter/lib/features/plan/` (Protocol | Recommended segmented Plan tab; numbered protocol
cards from `dailyInsightCardsProvider`; trait-ranked recommended grid). New
`flutter/lib/features/ask_maya/` (greeting, condition prompt chips, upload labs CTA →
`/reports/new`, chat deep link). Metric detail: latest date · source subtitle, chart x-axis
start/mid/end labels, reading history list via `metricReadingsProvider`. Route constants
`AppRoutes.plan` / `AppRoutes.askMaya` in `routes.dart` (shell agent wires GoRouter).
`traitsForConditions` exported from `condition_prompts.dart`. `purple_theme` displaySmall/titleLarge
use SF Pro serifStyle. Verified: `flutter analyze` on touched paths (info-only). **Shell/router
wiring pending other agent.**

**2026-07-06 Apple system typography (SF Pro stack).**
Signed-in app shell uses platform SF Pro / system-ui stack instead of Inter + Source Serif 4.
Web: `src/styles.css` `--font-sans` / `--font-serif`, removed Google Fonts from `__root.tsx`.
Flutter: `purple_type.dart`, `purple_theme.dart`, key Today/narrative/score screens; tokens updated.
Preview HTML on :8766 updated. Verified: `flutter analyze` clean, `tsc --noEmit` clean, curl 200 on :8766.
Doc: `mem/design/apple-system-typography.md`.

**2026-07-06 Light mode purple accent pass in design preview (not shipped).**
`docs/previews/personalized-dashboard-preview.html` — light mode only (`[data-theme="light"]`) subtle
Apple-grade purple accents from `design/tokens.json` (`#5b2c82`, `#ede4f4`, `#3a1a55`): bottom nav
active pill, focus metric chips, Maya card left accent, protocol/rec category pills, search focus
ring, section eyebrows, primary CTAs, "For your focus" badges (purple not green). Dark mode unchanged.
Matrix notes **light mode accent pass approved**. Verified curl 200 + browser light Merged + Expanded
(Recommended tab) on :8766. **No production Flutter.**

**2026-07-06 Merged mode full page parity in design preview (not shipped).**
User approved **Merged** layout. `docs/previews/personalized-dashboard-preview.html` — all Expanded
screens now reachable in Merged: bottom nav (Today · Data · FAB · Plan · Ask Maya) + toolbar tabs
(Today, Data, Plan, Recommended, Ask Maya, Metric detail). Plan uses Protocol | Recommended
segmented sub-nav with full content. Today strip chips drill to metric detail. Lab order modal
from Data / Recommended / Plan. Classic + Expanded unchanged. Verified curl 200 + browser Merged
light+dark on :8766. Matrix + OPEN-ISSUES updated. **No production Flutter.**

**2026-07-06 Metric detail dated readings in design preview (not shipped).**
`docs/previews/personalized-dashboard-preview.html` Metric detail tab now shows latest
reading card (`34 ms · Jul 6, 2026 · Oura Ring`), chart x-axis dates (Nov 2025 – Jul 2026),
optimal range "as of" date, readings caption + history list. Mock uses `recorded_at`
(biometrics) / `measured_at` (report_metrics). Matrix row updated. Verified curl 200 +
browser on :8766 Metric detail tab (Expanded + dark). **No production Flutter.**

**2026-07-06 Three-mode design preview + Ask Maya rename (not shipped).** User approved
design direction with edits. `docs/previews/personalized-dashboard-preview.html` adds
**Classic / Expanded / Merged** toolbar modes (`sessionStorage.previewLayoutMode`). AI
persona renamed **Ask Maya** in preview + matrix (app name stays Purple). **Classic:** Nori
Today + collapsible Stats, side-by-side phones. **Expanded:** 6-tab Superpower preview.
**Merged:** Classic Today + protocol card + 5-tab nav. Matrix +
`superpower-design-parity` OPEN-ISSUE updated. Serve:
`./scripts/preview-design-serve.sh` → http://127.0.0.1:8766/personalized-dashboard-preview.html.
**No production Flutter/TanStack code.**

**2026-07-06 Lab ordering preview + spec (not shipped).** Preview HTML extended:
Recommended **Order blood panel** hero, 3-step modal (panel / collection / Stripe
placeholder), Data tab empty state (uncheck "Labs uploaded"). Spec:
`docs/previews/LAB-ORDERING-SPEC.md`. OPEN-ISSUES: `lab-ordering-mvp`. MVP =
Phase 1 concierge/deep link; Phase 2 = in-app Stripe + partner API. Serve:
`./scripts/preview-design-serve.sh` → http://127.0.0.1:8766/personalized-dashboard-preview.html.

**2026-07-06 Recommended for you preview tab (design only).** New **Recommended** screen in
`docs/previews/personalized-dashboard-preview.html` — 2-column trait-ranked cards (wearable
sync, HRV, sleep protocol, journal pack, caregiver invite; lab upload when empty). Served at
http://127.0.0.1:8766 (`./scripts/preview-design-serve.sh`). Matrix +
`superpower-design-parity` OPEN-ISSUE updated. **No production routes.** Pending user approval.

**2026-07-06 Permanent TestFlight observability rule + TF21 triage.** Rule
`.cursor/rules/flutter-testflight-observability.mdc` set `alwaysApply: true`: agents
must triage **all** Luciq crashes and ASC beta feedback before/after every
`ios:testflight` upload. TF21: ASC **18** screenshot submissions (0 crash logs);
Luciq MCP **0** crashes/bugs on `flutter-purple` beta. Share Beta Feedback is
TestFlight 2.3+ / iOS version gated, not internal-vs-external; doc:
`mem/observability/testflight-beta-feedback.md`.

**2026-07-06 TestFlight 1.0 (21) shipped with native reset deep link + Flutter WIP.**
Bumped `flutter/pubspec.yaml` to `1.0.0+21`. Gates: `flutter analyze lib/` clean,
`flutter test` **135/135** (fixed `ReportAiSummary` model + reports detail screen;
legacy string `ai_summary` tolerated). Migrated TOP 5 screens from legacy
`glass_helpers.GlassSurface` to `design/glass_surface.dart` (today, vitals,
settings, account, meds). Deleted 7 junk `" 2"` duplicate artifacts. Upload:
`doppler run --project purple-life --config prd -- bun run ios:testflight`
**EXPORT SUCCEEDED** (~13:02 ET). ASC **1.0 (21) processing=VALID**,
`internal=IN_BETA_TESTING`, `external=IN_BETA_TESTING` (Founding Team group via
`scripts/asc-add-build-to-group.mjs 21 "Founding Team"`). TF21 includes
`auth_deep_link.dart`, `reset_password_screen.dart`, `friendlyAuthError` on
sign-in, `?reset=expired` handling. **Device verify pending:** native
`org.purplelife.app://reset-password` flow on iPhone. Commit on
`lovable/redesign` (pushed). `main` fast-forward pending operator policy check.

**2026-07-06 Care + AI Worker API routes deployed to prod.** Worker Version ID
**`8d527d7f-1fe7-4903-8518-7a71f52be25b`** (`CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`). New routes:
`/api/care/today`, `/api/care/journal`, `/api/care/meds`, `/api/care/reports`, `/api/care/report`,
`/api/care/seizures` (POST), `/api/care/incoming-invites` (GET), `/api/ai/daily-insight-cards`,
`/api/ai/metric-insight`, `/api/ai/summarize-report`. Live verify: unauth POST/GET returns **401**
(not 404). Removed accidental duplicate `src/routes/api/care/* 2.ts` files before build. Gates:
`check:em-dash` PASS, `tsc --noEmit` PASS, `build:prod` PASS.

**2026-07-06 Supabase Auth allow list includes Whoop native redirect** (`org.purplelife.app://oauth-whoop-callback` PATCH on project xxnzmfzsjplrutrgbzxy). Whoop Developer Portal registration still manual owner step; see `mem/native-wearable-oauth-redirects.md`.

**2026-07-06 Portable mobile release templates.** Four agent plans in `docs/templates/`:
`testflight-automation-plan.md`, `play-store-automation-plan.md`, `luciq-crash-reporting-plan.md`, `sentry-crash-reporting-plan.md`.

**2026-07-06 Portable TestFlight automation template added.** Copy
`docs/templates/testflight-automation-plan.md` to any project; attach in Cursor and
execute. Documents Purple's ASC API key + xcodebuild upload pattern (no Fastlane, no
Apple ID login) and optional Luciq wiring.

**2026-07-06 Password-reset E2E verified + TTL UX deployed to prod.** Worker Version ID
**`079af4f1-eccb-4789-8c7c-648ba7d55621`** (`CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`).
E2E: `pmt@eigital.com` password grant **PASS**; recover → `email_send_log.sent` within ~4s
**PASS**; pg_cron `process-email-queue` active; `/reset-password` **200** with
`auth-recovery-*.js` chunk (`RECOVERY_LINK_TTL_LABEL` = 1 hour from `mailer_otp_exp=3600`);
admin `generateLink` → `www.purplelife.org/reset-password#access_token&type=recovery`
**PASS**. UX: reset-sent shows latest-email-only + TTL; expired states steer to sign-in
with password first. Flutter auth tests **9/9**. **TF21+** still required for native
`org.purplelife.app://reset-password` deep link (TF20 lacks `auth_deep_link.dart`).
Commit on branch (not pushed). `@eigital.com` corporate mail may quarantine recovery
emails despite Resend delivered.

**2026-07-06 `pmt@eigital.com` temp password rotated (3rd forgot-password report).**
Ops set new temp password via `auth.admin.updateUserById`; sign-in verified against
prod Supabase. Recovery emails at ~14:24 UTC show `sent` in `email_send_log` and
**delivered** in Resend but never reach `@eigital.com` inbox (corporate quarantine).
User instruction: sign in with temp password, change in Account, stop forgot-password
until IT allowlists `notify.purplelife.org`. No alternate email on profile. Doc:
`CURSOR_HANDOFF.md`, `mem/auth-password-reset.md`.

**2026-07-06 Auth password-reset fixes DEPLOYED to prod.** Worker Version ID
**`bdf1f37a-9fbf-41f5-b0dc-46cbae616c94`** on `www.purplelife.org` (eigital account
override). Fixes: admin `resetPasswordForEmail` with prod redirect (not
`generateLink`), web forgot-password rate-limit friendly errors, expired reset link
→ `/sign-in?reset=expired`, recovery email webhook fallback redirect to
`/reset-password`. Flutter `?reset=expired` on sign-in already in tree (TF21+ for
native deep links). Gates: `check:em-dash` PASS, `tsc --noEmit` PASS,
`build:prod` PASS. Auth Flutter tests **10/10**; full `flutter test` **130/132**
(2 failures pre-existing reports AI WIP). curl: `/reset-password` and `/sign-in`
**200**. Commit pending push (operator did not request push).

**2026-07-06 TestFlight 1.0 (20) shipped + external Founding Team group confirmed.**
Bumped `flutter/pubspec.yaml` to `1.0.0+20` (no build 20 existed yet; latest was
**19 VALID**). `flutter analyze lib/` clean, `flutter test` **124/124**, then
`doppler run --project purple-life --config prd -- bun run ios:testflight`
**uploaded successfully** (`** EXPORT SUCCEEDED **`). ASC processing finished in
~5 min: **1.0 (20) processing=VALID**. Added build 20 to the external **"Founding
Team"** group (`8ad416f5-8248-48e6-9951-03af3f932b6c`) and submitted Beta App
Review via `scripts/asc-add-build-to-group.mjs 20 "Founding Team"` (recovered
from an earlier uncommitted session and now committed) — review cleared in
under a minute (expedited re-review, group already had an approved build).
**Final state: internal=IN_BETA_TESTING, external=IN_BETA_TESTING.** Stale
Capacitor **build 1** was already `expired=true` from the prior
`tf-login-wrong-surface` fix; nothing to do there this round.
**Working-tree safety:** found extensive uncommitted WIP already in the tree
(native `file_picker`/`image_picker` pickers wired into care chat/reports,
AI insights repository, care dashboard/settings/vitals edits, `care.server.ts`/
`report-trends.functions.ts`/`reports.functions.ts`/`routeTree.gen.ts`) from a
prior/concurrent session, not authored by this task. To avoid shipping
unverified WIP to external testers, **stashed it (`git stash push -u`) before
building**, built+shipped from the clean verified baseline, then **`git stash
pop`** restored it byte-for-byte afterward (confirmed via diff: no conflicts,
no data loss) — it remains uncommitted and untouched, exactly as found. Only
the pubspec version bump and the recovered `asc-add-build-to-group.mjs` script
were committed. Commit **`879bf8f`** on top of `5f971c3`/`5681373` (overnight
vite CVE patch, already committed, not yet pushed) — all three pushed together.
**`origin/main` and `origin/lovable/redesign` both now at `879bf8f`** (fast-
forward, no merge conflicts; `main` was 3 commits behind, brought current via
`git push origin lovable/redesign:main`).
**Install for testers:** TestFlight app → Purple for Life → update to build
**20** (external testers on the Founding Team group see it now); new installs
via the public TestFlight link if one exists, otherwise an invite is required
for the "Founding Team" group.

**2026-07-06 overnight deps security patch on `lovable/redesign` @ `5681373`.** Bumped
`vite` to `^7.3.5` (lock resolves **7.3.6**); added Bun + pnpm overrides for
`undici>=7.28.0`, `ws>=8.21.0`, `js-yaml@4.2.0` (pinned 4.x, not 5.x). `bun audit`
down from **13** (5 high) to **2 low** (`@babel/core`, `esbuild` dev-server Windows
only). Gates: `check:em-dash`, `check:live-data`, `check:unique-images`,
`check:lovable-auth`, `check:supabase-types`, `bun run build` **PASS**.
`check:entry-budget` still **FAIL** pre-existing (273885 gz vs 269000 budget, unchanged
on old vite). Unrelated WIP in working tree (`reports.functions.ts`, care API routes)
not in commit.

**2026-07-06 care-accept-server-route DEPLOYED to prod.** `POST /api/care/accept`,
`POST /api/care/decline`, `GET /api/care/incoming-invites` are now **live** on
`www.purplelife.org` (Worker Version ID **`07bbab77-f4de-4501-89c0-e22a52e60941`**,
deployed from `main`/`lovable/redesign` @ `d31d2a8`, both identical). Verified via
curl (no auth): all three return **401** `{"error":"Unauthorized"}`, not 404;
homepage and `/sign-in` unaffected (200). First deploy attempt failed the zone-route
attach step because Doppler's `CLOUDFLARE_ACCOUNT_ID` resolved to the POS account;
retried with `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0` (eigital) and
it succeeded — see `doppler-cloudflare-account-id` in OPEN-ISSUES. Gates before
deploy: `check:em-dash` and `bun run build:prod` both PASS. **Found and preserved
uncommitted WIP** in the working tree at task start (new incomplete
`src/routes/api/care/{today,meds,journal,seizures,reports}.ts` calling
not-yet-implemented `care.server.ts` functions) — stashed before build/deploy so
only verified code shipped. **Left in the stash (`stash@{1}`, not popped)**
rather than restored: a concurrent agent session was found actively writing to
this same working tree during this task (Flutter chat/reports/dashboard work,
`ai-insights.server.ts`, new `/api/ai/*` routes, `package.json`/`bun.lock`/
`pubspec.yaml` changes all appeared mid-task, none made by this agent), so
popping the older stash back would have collided with that newer, still-in-
progress work on the same files. See the log entry below for the exact
recovery command for whoever owns that stash.

**2026-07-05 AI Worker routes added (Flutter-callable), tsc-only slice, no deploy.**
New `POST /api/ai/summarize-report`, `POST /api/ai/metric-insight`,
`POST /api/ai/daily-insight-cards` Worker routes front the existing web-only AI
server fns (`summarizeReport`/`getMetricInsight`/`getDailyInsightCards`) via a
new `src/lib/ai-insights.server.ts` (mirrors the `care.server.ts` pattern:
plain functions taking a user-scoped Supabase client + explicit `userId`, RLS
enforces ownership). `bunx tsc --noEmit` **PASS**. **Not yet wired into
Flutter** (no `flutter/` client changes in this slice) and **not deployed**.
See Log entry below for details.

**2026-07-06 WIP landed + junk cleanup on `lovable/redesign`.** Deleted **22** untracked
`" 2"`-suffixed macOS duplicate files (mostly under `flutter/build/`, Linux/Windows
ephemeral symlinks, `Podfile 2`, `xcrun 2`) plus `.flutter-web-serve.pid`. Kept untracked
`flutter/ios/Flutter/Developer.xcconfig` (local Xcode-beta path fix). Gates **PASS:**
`check:em-dash`, `tsc --noEmit`, `bun run build`, `flutter analyze lib/`, `flutter test`
**124/124**. Commits on `lovable/redesign`: **`574ac0b`** (care incoming-invites route +
Flutter client), **`362b9b6`** (auth screen parity + friendly errors), docs commit
`docs: audit cleanup, care close-out, and branch sync log` on same branch tip. **No prod deploy**
(owner approval required; care routes still 404 on prod until deploy).

**2026-07-06 care-accept-server-route P0 close-out: routes complete + verified, deploy NOT run (needs approval).**
Closed the last piece of the caregiver invite loop and root-caused the actual "dead
invites card" bug (the concurrent full-audit entry below caught this work mid-edit
before it was finished/committed; now complete). **New:** `GET /api/care/incoming-invites`
Worker route + `listIncomingInvitesForUser` (`src/lib/care.server.ts`), added to the
Flutter CORS allow-list (`src/lib/flutter-api-cors.ts`). `/api/care/{accept,decline}.ts`
(written 2026-07-05) re-read and confirmed correct, no changes needed. **Root cause of
the dead invites card:** it was **Flutter's** `IncomingCareInvitesCard`, not web's — web's
card already correctly calls the service-role `listIncomingCareInvites` TanStack server
fn; Flutter's `CareRepository._loadIncomingCareInvites`/`declineIncomingCareInvite` did
direct client `.select()`/`.update()` against `care_relationships`, which
`care_rel_caregiver_select` (`auth.uid() = caregiver_id`, `NULL` pre-accept) always
returns 0 rows for. **Fixed** both Flutter methods to call the Worker routes instead
(mirrors the already-correct `acceptInvite` → `/api/care/accept` pattern); removed the
now-dead `_currentUserEmail()` helper. **Verified:** `bun run tsc` clean, `bun run
build:prod` succeeds end-to-end (client + SSR bundles), `flutter analyze lib/` clean,
`flutter test` **124/124**. **Also fixed:** removed **22** stray untracked `" 2"`-suffixed duplicate files
(mostly Flutter build/ephemeral artifacts; none git-tracked) that were failing
`check:em-dash` on this checkout.
**NOT deployed** — prod deploy requires explicit operator approval; exact command is in
OPEN-ISSUES `care-accept-server-route`. Until deployed, Flutter's care-invite
accept/decline/list all still 404 against `www.purplelife.org`.

**2026-07-06 full repo audit (read-only, no deploy).** Ran all quality/ops gates
on `lovable/redesign@c912a68` (local up to date with origin). **Real committed
code is clean**: `flutter analyze`/`flutter test` (116/116), `check:live-data`,
`check:unique-images`, `check:lovable-auth` all **PASS**; Luciq MCP confirms
**0 crashes** on both `purple` (iOS) and `flutter-purple` beta apps; ASC
**1.0 (19) VALID**, internal+external `IN_BETA_TESTING`. **Two working-tree-only
FAILs, both traced to uncommitted local artifacts, not to pushed code:**
(1) `check:em-dash` fails solely on a stray untracked duplicate file
(`src/lib/flutter-web-routing 2.ts`), not on any real `src/`/`public/` file;
(2) `bunx tsc --noEmit` fails on an uncommitted, undocumented WIP route
(`src/routes/api/care/incoming-invites.ts` + modified `care.server.ts`) whose
`routeTree.gen.ts` was never regenerated. **58 untracked `" 2"`-suffixed
duplicate files** (macOS-style copy artifacts) are scattered across
`src/`, `scripts/`, `flutter/`, `ios/`, `mem/`, `supabase/migrations/`; six under
`src/routes/**` corrupted the working-tree `routeTree.gen.ts` with phantom
routes. New issues logged: `audit-tsc-uncommitted-invites-route`,
`audit-repo-duplicate-junk-files` (`docs/OPEN-ISSUES.md`). **`main` is 34 commits
behind `origin/lovable/redesign`** (merge base `4f69041`); no new commits on
`main` since the last sync. **No deploy performed; owner approval required
before any `main` merge or prod deploy** per standing policy. Full gate table
and closure matrix in the log entry below.

**2026-07-06 tf-login-wrong-surface investigated + fixed (TestFlight distribution, not Flutter code).**
Tester report of a "web Welcome back! login page" on TestFlight was **not a Flutter bug**:
`sign_in_screen.dart`/`welcome_screen.dart` were verified correct (code read, `flutter analyze`
clean, `flutter test` 116/116, live render via `flutter-web-serve.sh`). Root cause: the external
**"Founding Team"** beta group still had the **pre-cutover Capacitor build 1.0 (1)** (uploaded
2026-07-03, `expired=false`) active; Capacitor loads **live** `www.purplelife.org` at runtime, so
a tester stuck on that never-updated install sees the real web sign-in copy. Separately, the
newest Flutter build **1.0 (19)** had never been submitted to the external group at all (external
testers' latest available was **18**). **Fixed via ASC API:** expired build 1, added build 19 to
the external group, submitted it for Beta App Review — **cleared within ~2 minutes**, confirmed
`external=IN_BETA_TESTING` on re-poll. Full detail: OPEN-ISSUES `tf-login-wrong-surface`
(resolved) and log entry below. **No app code changed, no new TestFlight build needed (still
1.0 (19)). Only remaining step is the reporting tester deleting + reinstalling from TestFlight.**

**2026-07-05 orchestrated fix fleet — SHIPPED to TestFlight as 1.0 (19).** Waves 1+2 landed on `lovable/redesign`, pushed to origin (`4d84721`), iOS archive + ASC upload **succeeded** (`** EXPORT SUCCEEDED **`). 11 slices integrated (meds / vitals / biometrics / reports / insights / ask-purple + care-chat / nav+timeline / settings depth + regression fixes; care-accept client wiring + new `/api/care/*` Worker routes; docs). Gates: `flutter analyze lib/` **clean**, `flutter test` **116/116**.

**Not done — HANDED TO CURSOR** (see the "TF19 ship + Cursor handoff" log entry below and OPEN-ISSUES `care-accept-server-route`): (1) **DEPLOY** the new `/api/care/accept`+`/api/care/decline` Worker routes to web prod (written, `tsc`+`build` pass, NOT deployed); (2) caregiver invite-accept still **not functional end-to-end** — the in-app invites card is dead code (client RLS returns 0 rows; needs a server-listed source); (3) **Wave-3 native pickers** → reports upload + chat attachments still non-functional on device; (4) AI features (insights noticing/pattern cards, reports AI-explain) remain **web-only** (no Flutter endpoint); (5) **on-device verification** of TF19 (checklist in log entry).

**`origin/lovable/redesign` @ `4d84721`** (pubspec **1.0.0+19**, pushed 2026-07-05). **`main` @ `ef05394`** unchanged — the fleet is **NOT merged to `main`**, and the Cloudflare web-prod deploy of the care-API routes is a **separate owner-gated step, NOT done**.

**TestFlight 1.0 (19):** **VALID** (ASC 2026-07-05). Install **19** for waves 1+2 fleet.
  New ASC (2026-07-06): "Unable to login", "Error is wrong". Luciq: **0 crashes** TF16–19.

**Next action (Cursor):** Tester **delete + reinstall** from TestFlight (build **19**, external group fixed);
  then `flutter-auth-screen-parity` if login errors persist; deploy `/api/care/{accept,decline}`;
  design P0 (typography, whitespace; burger drawer needs owner decision).

---

## Log

### 2026-07-06T20:52:00Z — Journal merge into TF25 stack (integrator handoff)

- **Requested** — When journal agent `8d907f3f` commits, merge into TF25/26 upload via integrator
  `f82c971a`; no duplicate upload.
- **Done** — Cherry-picked `009fda0f` → `main` @ `5531d06b` (journal capture keyboard, Change label,
  media honesty). Verified: `flutter analyze lib/features/journal/` clean,
  `journal_pending_upload_test` **2/2**. ASC still at **1.0 (24) VALID**; build 25 not uploaded.
  No `ios:testflight` started from this agent (integrator serial owner).
- **Issues** — Integrator prior upload attempt hit duplicate Pod `* 2.*` files; pod clean done.
  Other fleet slices (more-for-today `8b729ea4`, sign-in UI `feda313c`) still on `lovable/redesign`
  only; integrator polling.
- **Stand / next** — Integrator `f82c971a`: merge remaining fleet commits, `flutter test` 160+,
  `ios:testflight` build **25**, poll VALID, push `main`.
- **Who / where** — Cursor merge subagent, local, `main` @ `5531d06b`.
- **Timestamp** — 2026-07-06T20:52:00Z

### 2026-07-06T20:48:00Z — TF24 blank-data P0 → TF25 fix

- **Requested** — TestFlight **1.0 (24)** report: app loads but no data, stuck/slow after
  delete+reinstall; investigate auth, Today/Data providers, error swallowing; fix + TF25 if severe.
- **Done** — Root cause: (1) `authSessionProvider` loading window after Keychain restore made
  `AuthGate` render `SizedBox.shrink` and data providers skip fetch (`valueOrNull` null); (2) stale
  invalid restored sessions; (3) hung Supabase with no provider timeout. Fixes:
  `flutter/lib/core/auth/auth_state.dart` (`readActiveSession`, `authGateStatusProvider`),
  `auth_gate.dart` spinner + session-error redirect, `auth_repository.dart` `ensureValidSession`,
  `today_repository.dart` 15s `_guardTodayProviderLoad`, `data_providers.dart` per-query guards,
  `today_screen.dart` / `data_screen.dart` fail-open banners. **pubspec 1.0.0+25** (`f2ac82d8`).
  Luciq MCP `list_crashes` app_versions `1.0.0 (24)`: **0 crashes**.
- **Issues** — `:8765` rebuild was slow; verified HTTP 200 + sign-in redirect only (E2E sign-in
  not run in this slice). TF25 not uploaded to ASC yet.
- **Stand / next** — `bun run ios:flutter-testflight` (or project script) for **1.0 (25)**;
  Founding Team after VALID; operator retest reinstall path.
- **Who / where** — Cursor subagent, local, `main` @ `f2ac82d8`.
- **Timestamp** — 2026-07-06T20:48:00Z.

### 2026-07-06T20:43:00Z — TF25/26 Merged Today preview parity

- **Requested** — Align Flutter Merged Today with approved
  `personalized-dashboard-preview.html` Merged mode: metric strip (Sleep/HRV/Efficiency/Rest HR
  with empty states), onboarding pill, Maya card, protocol teaser, Ask Maya chips, inline
  RECOMMENDED (Plan link only), meds section, quick actions. Scope: `flutter/lib/features/today/`
  only. Commit for TF25/26 integrator.
- **Done** — Commit `89cf2d00` on `lovable/redesign`: removed dual-score hero for strip-first
  layout; `TodayMetricStrip` fixed four chips with em dash empty states; `sleepEfficiencyPct` on
  `ScoreSnapshot` + `sleep_efficiency_pct` in repository; `TodayRecommendedInline` taps
  `/plan?segment=recommended` with "See on Plan" CTA (no lab-order deep links). Meds section
  unchanged (`adf42d6c`). Verified: `flutter test test/today*.dart` **6/6**.
- **Issues** — None. Prior partial commit `3f26445e` (repository-only) superseded by this slice.
- **Stand / next** — TF25/26 integrator merges with other fleet slices; no push from this agent.
- **Who / where** — Cursor subagent, local, `lovable/redesign` @ `89cf2d00`.
- **Timestamp** — 2026-07-06T20:43:00Z

### 2026-07-06T20:50:00Z — TF25 audit OPEN-ISSUES + gap matrix (docs only)

- **Requested** — From audit `a198e779`: brief OPEN-ISSUES entries for Today doses regression
  and removed "More for today"; update gap matrix Today meds row. Docs commit only, no push.
- **Done** — `docs/OPEN-ISSUES.md`: `flutter-today-doses-regression`, `flutter-today-more-for-today-removed`.
  `docs/FLUTTER-CUTOVER-GAP-MATRIX.md`: Today row notes (TodayMedsSection `adf42d6c`, remaining gaps).
- **Issues** — None; code fix already in `adf42d6c`.
- **Stand / next** — TF25 integrator merges doc commit with fleet slices.
- **Who / where** — Cursor subagent, local, `lovable/redesign`.
- **Timestamp** — 2026-07-06T20:50:00Z

### 2026-07-06T20:45:00Z — TF25 Today meds section restore

- **Requested** — Restore meds data and "take medications" lost in Merged Today design.
  Re-add today's dose panel on Today; ensure meds_screen dose flow intact; Meds quick action
  opens working dose flow. Scope: `flutter/lib/features/meds/` + today quick actions only.
- **Done** — New `today_meds_section.dart` (`medsForDayProvider`, `TodayMedsSection` read-only
  dose card restored from pre-merge `759cbff`). Wired into merged `today_screen.dart` after
  quick actions; pull-to-refresh invalidates meds provider. `meds_screen.dart` already had full
  `TodayDosePanel` (Taken/Snooze/Skip, mark all, filter chips, library) from `1ed98cf`; no edits.
  Meds route remains on shell drawer (`shell_menu_sheet.dart`), not bottom tab. Tests updated.
  Verified: `flutter test test/today_screen_render_test.dart test/meds_schedule_ux_test.dart` **6/6**.
- **Issues** — Today dose card is read-only summary; full dose actions on `/meds` only (same as
  pre-merge). No push (TF25 integrator merges).
- **Stand / next** — Parent TF25 fleet merge; integrator lands with other disjoint slices.
- **Who / where** — Cursor subagent, local, `lovable/redesign` (pre-commit).
- **Timestamp** — 2026-07-06T20:45:00Z

### 2026-07-06T20:42:00Z — TF24 auth session validation (invalid restore / AsyncLoading gate)

- **Requested** — CRITICAL TF24: app loads, no data, stuck/slow after reinstall. Fix auth
  session refresh, fail-open to sign-in, don't hang AsyncLoading. Scope: `flutter/lib/core/auth/`,
  `auth_gate.dart` only.
- **Done** — `auth_repository.dart`: `ensureValidSession()` after secure restore (refresh expired,
  `getUser` verify, sign-out on hard failure); `isAuthenticated` ignores expired sessions.
  New `core/auth/auth_state.dart`: `authGateStatusProvider`, bootstrap helpers.
  `auth_gate.dart`: spinner during loading, session-error redirect, 10s onboarding timeout.
  `auth_deep_link.dart`: reject null/expired OAuth session → `/sign-in?error=session`.
  Tests: `auth_gate_test.dart`, `auth_session_validation_test.dart`. Verified:
  `flutter analyze lib/core/auth/` clean; auth tests **31/31**.
- **Issues** — Sign-in screen does not yet show copy for `?error=session` (follow-up UI).
- **Stand / next** — Parent fleet merge with Today/Data slices; TF25 upload after full gate pass.
- **Who / where** — Cursor subagent, local, `lovable/redesign` (pre-commit).
- **Timestamp** — 2026-07-06T20:42:00Z

### 2026-07-06T20:38:00Z — Data tab resilient parallel fetch

- **Requested** — Fix silent `AsyncLoading` from `5ad1576` parallel `Future.wait` on Data tab:
  per-query error handling, partial data, timeout, loading skeleton max duration + error CTA.
- **Done** — `flutter/lib/features/data/data_providers.dart`: `_QueryResult.guard` (12s timeout),
  `DataScreenSnapshot.loadError` / `failedQueries`, parallel lab+today via record `.wait`.
  `data_screen.dart`: `DataLoadingGate` (15s cap), `DataLoadErrorCard`, `DataPartialLoadBanner`.
  New widgets: `data_load_error.dart`, `data_loading_gate.dart`. Verified:
  `flutter analyze lib/features/data/` clean.
- **Issues** — None. No push.
- **Stand / next** — Parent fleet merge; optional `flutter test` on full suite.
- **Who / where** — Cursor subagent, local, `lovable/redesign` (pre-commit).
- **Timestamp** — 2026-07-06T20:38:00Z

### 2026-07-06T20:36:00Z — TF24 ship complete (VALID + Founding Team + Worker deploy)

- **Requested** — Ship TF24 after TF23: merge `cc6c2260` About build info, OAuth/perf/Luciq commits;
  `pubspec` 1.0.0+24; gates; Founding Team; wrangler deploy (eigital account); push `main`.
- **Done** — Merged `lovable/redesign` → `main` @ **`a594b77b`** (includes **`cc6c2260`**).
  **`flutter test` 143/143**. ASC **1.0 (24) VALID** (upload ~16:29 ET; re-upload redundant).
  `asc-add-build-to-group.mjs 24 "Founding Team"` → Added. `build:prod` PASS; wrangler deploy
  **`a25b3da7-dc73-4b4f-bc3f-11e869245bed`** with `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`.
  Pushed `main` + `lovable/redesign` @ **`2317b217`**.
- **Issues** — Re-upload attempt failed (build 24 already on ASC). Luciq/ASC triage for build 24
  pending full MCP pass.
- **Stand / next** — Testers on **22** install **24** (or **23** then **24**); verify OAuth login +
  Settings About line on device.
- **Who / where** — Cursor subagent, local, `main@2317b217`.
- **Timestamp** — 2026-07-06T20:36:00Z.


- **Requested** — Show exact version, build number, and build date in Settings About on
  Flutter and TanStack; inject `BUILD_DATE` at TestFlight and web build time.
- **Done** — `flutter/lib/core/config/app_build_info.dart` + `package_info_plus`;
  `src/lib/app-build-info.ts`; About footers in `settings_sections.dart` and
  `about-section.tsx`; `scripts/app-build-env.sh` + `with-app-build-env.sh`; BUILD_DATE
  dart-define in `flutter-ios-testflight.sh`, `flutter-web-serve.sh`,
  `flutter-web-build-prod.sh`; web `dev`/`build` wrap with build env. Tests:
  `flutter/test/app_build_info_test.dart`. Commit **`cc6c2260`**.
- **Issues** — Dev without build env shows Unknown date.
- **Stand / next** — Include in TF24 upload; About shows ship date on device.
- **Who / where** — Cursor agent, local, `lovable/redesign@cc6c2260`.
- **Timestamp** — 2026-07-06T20:30:00Z.

### 2026-07-06T20:26:00Z — TF23 ASC VALID poll + Founding Team + observability triage

- **Requested** — Poll ASC until build 23 VALID; add to Founding Team; run TF feedback + Luciq
  checks; update `CURSOR_HANDOFF.md`; note OAuth `4430c13` and perf commits are after TF23 → TF24.
- **Done** — Polled `ios:check-asc-builds` (~2 min); **1.0 (23) VALID** uploaded 13:20 PT.
  `asc-add-build-to-group.mjs 23 "Founding Team"` → Added (beta review 422: already valid).
  `ios:check-tf-feedback` → 19 ASC screenshot submissions. `ios:check-luciq` → SDK OK, MCP mode.
  Luciq MCP `list_crashes` filter `1.0.0 (23)` → **0 open**. Updated `CURSOR_HANDOFF.md` build
  matrix + triage; refreshed `docs/HANDOFF.md` snapshot.
- **Issues** — TF23 does not include OAuth fix (`4430c13`) or perf throttle (`5ad1576`); testers
  on login errors need TF24. ASC duplicate-narrative feedback predates TF22 fix; may recur on TF23
  if Flutter Today still duplicates (verify on device).
- **Stand / next** — Founding Team install **1.0 (23)** for Merged UI; upload **TF24** for OAuth +
  perf + Luciq Settings row + About build info.
- **Who / where** — Cursor subagent, local, `main@bfaf648e`.
- **Timestamp** — 2026-07-06T20:26:00Z.

### 2026-07-06T20:25:00Z — TF23 Merged fleet serial integrate + TestFlight ship

- **Requested** — Serial merge of extended Merged wave (shell/data/plan/ask, meds/journal,
  settings, reports/care, web `_app` pass); wire 5-tab nav; gap matrix; gates; TF23 Founding Team;
  push `lovable/redesign` + ff `main`; handoff.
- **Done** — Merged at `d1f5675`: 5-tab `bottom_nav.dart`, routes `/data` `/plan` `/ask-maya`,
  `today_merged_widgets.dart`, Data/Plan/Ask Maya screens, token restyle (meds/settings/reports/care),
  TanStack `data.tsx`/`plan.tsx`/`ask-maya.tsx`, SF Pro typography. Fixed settings scroll test
  (`PurpleTheme.dark()`). `flutter analyze` 0 errors, **`flutter test` 135/135**. `pubspec` 1.0.0+23.
  `ios:testflight` **EXPORT SUCCEEDED**; ASC **1.0 (23) VALID**; Founding Team
  `asc-add-build-to-group.mjs 23`. `main` + `origin/lovable/redesign` synced @ `d1f5675`.
  `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` ~68% Merged parity. `build:prod` gates pass; wrangler deploy
  uploaded worker (route API failed on POS account id).
- **Issues** — cf5e97cf / 26beb5b9 agent commits never landed (superseded by b4a9dc1 fleet).
  Wrangler zone routes need eigital `CLOUDFLARE_ACCOUNT_ID`. OAuth native callback still P0
  (`flutter-oauth-auth-callback`). Device QA on TF23 Merged tabs pending.
- **Stand / next** — Founding Team installs **1.0 (23)**; device sign-off on Today/Data/Plan/Ask Maya;
  redeploy Worker with correct account if web Merged routes needed on prod immediately.
- **Who / where** — Cursor serial owner subagent, local, `main@d1f5675`.
- **Timestamp** — 2026-07-06T20:25:00Z.

### 2026-07-06T20:25:00Z — Settings Luciq report row

- **Requested** — Add "Report a problem" row in Flutter Settings that calls `Luciq.show()` when
  luciq_flutter initialized; skip web; manual trigger alongside shake per observability guidance.
- **Done** — `luciq_bootstrap.dart`: `luciqReportAvailable()`, `showLuciqReport()`,
  `luciqInitNotifier` after successful `Luciq.init`. `settings_hub.dart`: `SettingsHelpSection`
  with conditional Report a problem row + Contact. `settings_screen.dart`: wired Help section.
  Commits `b1f78e08`, `f4530cde`. `flutter analyze lib/features/settings/` clean (info-only).
- **Issues** — Row hidden until ~1s post-launch Luciq init; web/local analyze never show row.
  Device QA on TF build with `LUCIQ_APP_TOKEN` pending.
- **Stand / next** — TF device tap "Report a problem" opens Luciq UI; no push unless operator asks.
- **Who / where** — Cursor subagent, local, `lovable/redesign@f4530cde`.
- **Timestamp** — 2026-07-06T20:25:00Z.

### 2026-07-06T21:30:00Z — OAuth providers verified on NEW Supabase (doc-only)

- **Requested** — Doc-only commit from OAuth verify agent c7052066: confirm Google + Apple
  enabled on `xxnzmfzsjplrutrgbzxy`, fix stale `LOVABLE-MIGRATION.md` Phase 2 callback, record
  that login blocker is Flutter `auth-callback` code (fd0d190b) not missing Supabase providers.
- **Done** — Management API verification 2026-07-06: Google and Apple providers **enabled** on
  project `xxnzmfzsjplrutrgbzxy`. Updated `docs/LOVABLE-MIGRATION.md` Phase 2 (OLD ref
  `lzuodgpqseijhhyzgfky` callback → `https://auth.purplelife.org/auth/v1/callback`; status
  DONE). `docs/OPEN-ISSUES.md`: new `flutter-oauth-auth-callback` (P0 login blocker in
  `auth_deep_link.dart`, not provider config). Current snapshot refreshed.
- **Issues** — Flutter Google/Apple sign-in still fails until `auth-callback` deep-link path
  completes session exchange (fd0d190b scope). Supabase redirect allow list must include
  `org.purplelife.app://auth-callback` (separate verify).
- **Stand / next** — Fix Flutter `auth-callback` handler (fd0d190b); device QA Google/Apple on
  TF23+ after deep-link fix.
- **Who / where** — Cursor OAuth verify doc subagent, local, `lovable/redesign@d1f5675`.
- **Timestamp** — 2026-07-06T21:30:00Z.

### 2026-07-06T20:20:00Z — Merged shell wiring + TF23 upload (b4a9dc1)

- **Requested** — Complete uncommitted Merged WIP: wire router/bottom_nav 5-tab nav, Today merged
  layout, integrate Data/Plan/Ask Maya, analyze/test, commit, bump 1.0.0+23, TestFlight upload,
  Founding Team group, push branches.
- **Done** — Commit **`b4a9dc1`**: `bottom_nav.dart` → `AppRoutes.plan`/`askMaya`; `router.dart`
  routes for PlanScreen/AskMayaScreen/DataScreen; merged Today (`today_merged_widgets.dart`,
  `today_screen.dart` rewrite); `data/` providers + screen; preview serve script + lab spec doc;
  `today_screen_render_test.dart` updated for merged layout; `pubspec.yaml` **1.0.0+23**. Gates:
  analyze clean, **135/135** tests. TestFlight: **EXPORT SUCCEEDED** upload build 23
  (~16:19 ET). `:8765` rebuild HTTP 200.
- **Issues** — ASC API not yet listing 1.0 (23) (processing); `asc-add-build-to-group.mjs 23`
  failed "No build found" (retry when VALID). First upload attempt interrupted (SIGTERM on
  xcodebuild archive).
- **Stand / next** — `bun run ios:check-asc-builds` until 1.0 (23) VALID →
  `asc-add-build-to-group.mjs 23 "Founding Team"` → Luciq/ASC triage per TF observability rule.
- **Who / where** — Cursor subagent (Merged ship slice), local, `lovable/redesign@b4a9dc1`.
- **Timestamp** — 2026-07-06T20:20:00Z.

### 2026-07-06T20:45:00Z — TF23 Merged fleet serial integrate + TestFlight 23

- **Requested** — Serial integrator: merge parallel fleet WIP, fix analyze/tests, rebuild
  `:8765`, update gap matrix/handoff/OPEN-ISSUES, ship TF23 Founding Team, push
  `lovable/redesign`, ff `main`, wrangler deploy if web `_app` changed.
- **Done** — Integrated 14 commits on `lovable/redesign@7a8a62c`: Flutter Merged 5-tab shell +
  restyle, TanStack `data`/`plan`/`ask-maya` routes, docs sync. Fixed analyze regressions
  (GlassSurface imports, SheetPalette test theme, today_merged_widgets types). Verified:
  `flutter analyze` 0 errors, **`flutter test` 135/135**, curl 200 on `:8765`. Docs: gap matrix
  Merged % table, `superpower-design-parity` → Partial, `CURSOR_HANDOFF.md`.
- **Issues** — Stage 5 still NO-GO (~68% Merged parity). P1: reports/care/chat depth, lab order,
  Recommended grid, push notifications, Oura OAuth console.
- **Stand / next** — Confirm ASC VALID for 1.0 (23); triage `ios:check-tf-feedback`; device QA
  Merged tabs on TF23.
- **Who / where** — Cursor serial integrator subagent, local, `lovable/redesign@7a8a62c`.
- **Timestamp** — 2026-07-06T20:45:00Z.

### 2026-07-06T20:35:00Z — Merged styling pass (events, onboarding, shared widgets)

- **Requested** — Disjoint scope: hydration, seizures, nutrition (none), events/timeline,
  onboarding, chat, shared widgets; Merged styling pass; no em dashes; analyze + commit; no push;
  no router.
- **Done** — `events_style.dart`, `onboarding_style.dart`; timeline `EventsPageHeader` + offline
  snackbar comma fix; welcome screen token typography; `loading_skeleton`, `score_hero`,
  `narrative_block` use `merged_style.dart`. Hydration/seizures/chat landed in sibling commit
  `1ed98cf`. Verified: `flutter analyze` clean on scope.
- **Issues** — Nutrition feature absent in Flutter. Care chat message rows still inline alphas.
- **Stand / next** — Parent merge; browser QA on :8765 timeline + welcome.
- **Who / where** — Cursor subagent, local, `lovable/redesign@7d0c1a5`.
- **Timestamp** — 2026-07-06T20:35:00Z.

### 2026-07-06T20:10:00Z — Merged Today dual hero + date strip (Flutter slice)

- **Requested** — Disjoint scope `flutter/lib/features/plan/`, `ask_maya/`, `today/`: Merged Today
  with dual score hero, personalization strip, single narrative, date strip; preview HTML Merged
  parity; SF Pro via PurpleType; a86829c pattern; `flutter analyze` + commit; no push; no
  shell/router/pubspec/ios.
- **Done** — Commit `8d3abf7`: `TodayDualScoreHero`, `TodayPersonalizationStrip`,
  `TodayRecommendedInline`; `today_screen.dart` wires `DateStrip` + `scoreSnapshotForDayProvider`;
  Ask Maya `?q=` chip highlight; render tests updated.
- **Issues** — Plan unchanged this slice (landed a86829c). Plan `?segment=recommended` query awaits
  router wiring. Analyze info-only on pre-existing `recommended_catalog.dart` const hints.
- **Stand / next** — Parent merge; browser QA on `:8765/#/today` after rebuild.
- **Who / where** — Cursor subagent, local, `lovable/redesign@14fcbd1`.
- **Timestamp** — 2026-07-06T20:10:00Z.

### 2026-07-06T20:15:00Z — Flutter Data / Vitals / Insights merged restyle

- **Requested** — Restyle disjoint Data feature scope per merged preview: unified Data tab,
  metric detail with dates, SF Pro + purple accents, capped column; fold/restyle Insights;
  preserve offline sync and empty states; `flutter analyze` + commit; no push, no router.
- **Done** — Added `data_style.dart`, `data_insights_teaser.dart`; restyled Data tab widgets,
  metric detail (back to Data, dated readings, stat boxes), Vitals/Biometrics/My Health
  headers, Insights section headers. Verified: `flutter analyze` on scope clean.
- **Issues** — Full Insights screen remains at `/insights` (teaser on Data when cards exist).
- **Stand / next** — Parent merge; browser QA on :8765 after `flutter-web-serve --rebuild`.
- **Who / where** — Cursor subagent, local, `lovable/redesign@1d461bb`.
- **Timestamp** — 2026-07-06T20:15:00Z.

### 2026-07-06T22:15:00Z — TF23 web _app merged typography pass

- **Requested** — EXTENDED TF23 wave scope `src/routes/_app/` only: SF Pro via `.app-route`,
  max-w-3xl capped column, remove duplicate narratives, section typography per Today merged
  pass (5930f3d); priority biometrics/reports/insights/my-health/meds/journal/settings/chat/care/vitals;
  `bunx tsc --noEmit`; commit `src/`; no push; no wrangler deploy.
- **Done** — Commit `f11e216`: `app-hero-title`, `app-section-title` in `styles.css`; hero/lede
  updates across all `_app` routes; insights `max-w-4xl`→`max-w-3xl`, intro `today-lede`;
  care.index `max-w-4xl`→`max-w-3xl`; Ask Maya duplicate eyebrow removed; ReportSectionTitle
  uses `app-section-title`. Also includes Plan/Data/Ask Maya routes + nav/i18n from parallel slice.
- **Issues** — `chat-care` stays `max-w-6xl` (wide chat layout). Biometrics index stays
  `max-w-5xl` per convention. HANDOFF updated; not pushed.
- **Stand / next** — Parent TF23 wave: remaining slices or browser QA on `:8080` signed-in routes.
- **Who / where** — Cursor subagent, local, `lovable/redesign@f11e216`.
- **Timestamp** — 2026-07-06T22:15:00Z.

### 2026-07-06T21:10:00Z — TF23 reports / care / chat parity

- **Requested** — EXTENDED TF23 wave disjoint scope: `flutter/lib/features/reports/`,
  `care/`, `chat/`; merged design tokens, SF Pro, lab upload CTA consistent with preview;
  React parity for reports/*, care/*, chat, chat-care; analyze + commit; no push; no shell
  router unless `/chat-care` missing (already wired).
- **Done** — Commit `7a3de99`: `lab_upload_prompt.dart` (empty card + upload button),
  `merged_style.dart`, `chat_style.dart`; reports metrics/documents/trend empty states use
  token-backed lab upload card; care dashboard Chat tab calls `getOrCreateDirectThread` and
  navigates to `/chat-care?thread=`; removed redundant `PurpleType.serif` fontFamily overrides;
  Ask Purple / Care chat headers use merged palette helpers. Verified: `flutter analyze` on
  scope (info-only); `chat_routes_test` + `reports_routes_test` pass.
- **Issues** — Care dashboard hydration tab still gated (no Worker route). Bulk report zip /
  re-run extraction remains web-only (noted in documents screen).
- **Stand / next** — Parent merges remaining TF23 slices; no push until fleet gate passes.
- **Who / where** — Cursor agent, `lovable/redesign` @ `7a3de99`, local macOS.
- **Timestamp** — 2026-07-06T21:10:00Z

### 2026-07-06T20:45:00Z — TF23 Settings / Account / Tools theme parity

- **Requested** — EXTENDED TF23 wave disjoint scope: settings/, account/, tools/; merged design
  (SF Pro, purple light accents, scroll settings hub); React parity; analyze + commit; no push;
  no router/pubspec/ios; endDrawer unchanged.
- **Done** — New `settings_style.dart` (`SheetPalette`, `SheetCanvas`, `SheetGlass`, input/eyebrow
  helpers). Updated `settings_hub.dart`, `settings_screen.dart`, `settings_sections.dart`,
  `account_screen.dart`, `tools_screen.dart` for theme-aware token colors (light purple accents +
  dark unchanged behavior). Account bottom padding aligned to 32px shell inset. Verified:
  `flutter analyze` on touched paths clean.
- **Issues** — Settings sub-routes (privacy, sharing, travel, etc.) still use legacy
  `CanvasBackground` hardcoded dark; follow-up slice if light appearance needed there.
- **Stand / next** — Parent fleet merge; browser verify Settings/Account/Tools in light + dark on :8765.
- **Who / where** — Cursor TF23 settings agent · local · uncommitted until parent commit
- **Timestamp** — 2026-07-06T20:45:00Z

### 2026-07-06T20:10:00Z — Flutter Merged 5-tab shell navigation

- **Requested** — Wire 5-tab nav (Today · Data · FAB · Plan · Ask Maya), burger endDrawer, legacy
  tab redirects, analyze shell, commit (no push).
- **Done** — `router.dart`: `/data`, `/plan` (optional `?segment=recommended`), `/ask-maya`;
  redirects `/my-health` → `/data`, `/insights` → `/plan`. `bottom_nav.dart`: expanded Data/Plan
  active detection (vitals, biometrics, reports, timeline). `native_app_shell.dart` + `routes.dart`
  + `auth_gate.dart` unchanged (already correct). Commit `7521ef8` on `lovable/redesign`.
- **Issues** — Legacy `MyHealthScreen` / `InsightsScreen` remain in repo for reference; deep links
  from in-app buttons to `/my-health` now land on Data tab.
- **Stand / next** — Parent fleet: verify `:8765` Merged nav in browser; run `flutter test` if needed.
- **Who / where** — Cursor shell agent · local · `lovable/redesign@7521ef8`
- **Timestamp** — 2026-07-06T20:10:00Z

### 2026-07-07T02:15:00Z — Flutter Plan / Ask Maya / metric dates (parallel writer)

- **Requested** — Parallel writer slice: Plan tab (Protocol | Recommended), Ask Maya landing,
  metric detail dated readings/history, SF Pro typography theme tokens, route constants only.
- **Done** — `flutter/lib/features/plan/plan_screen.dart`, `recommended_catalog.dart`;
  `flutter/lib/features/ask_maya/ask_maya_screen.dart`; `metric_detail_screen.dart` (date · source,
  chart ticks, history list); `vitals_repository.dart` (`MetricReading`, `metricReadingsProvider`);
  `routes.dart` (`AppRoutes.plan`, `AppRoutes.askMaya`); `condition_prompts.dart`
  (`traitsForConditions`); `purple_theme.dart` displaySmall/titleLarge.
- **Issues** — GoRouter routes + bottom nav wiring owned by shell agent; screens not reachable until
  merged. `flutter analyze` info-only (prefer_const_constructors in catalog).
- **Stand / next** — Shell agent: register `/plan` and `/ask-maya` in `router.dart` + bottom nav.
- **Who / where** — Cursor parallel writer · local · uncommitted
- **Timestamp** — 2026-07-07T02:15:00Z

### 2026-07-07T01:00:00Z — Apple system typography (SF Pro stack)

- **Requested** — Use Apple SF Pro system font across signed-in app (not Inter + Source Serif 4).
  Update web CSS, Flutter tokens/theme, preview HTML, docs. Commit.
- **Done** — Web: `src/styles.css` (`--font-sans`, `--font-serif`, `.body-serif`, `.today-lede`),
  `src/routes/__root.tsx` (removed Google Fonts load, splash uses system stack). Flutter:
  `flutter/lib/design/purple_type.dart`, `purple_theme.dart`, `journal_style.dart`,
  `sharing_screen.dart`, `narrative_block.dart`, `score_hero.dart`, `today_screen.dart`,
  `flutter/web/index.html`. Tokens: `design/tokens.json`, flutter copies, `tokens.dart`.
  Preview: `docs/previews/personalized-dashboard-preview.html`. Docs: `mem/design/apple-system-typography.md`,
  matrix one-liner, `CURSOR_HANDOFF.md`.
- **Issues** — `google_fonts` kept in pubspec (unused; optional marketing). Web `.font-serif` class
  name unchanged but now maps to SF Pro Display stack (not a serif face).
- **Stand / next** — Rebuild Flutter web preview (`./scripts/flutter-web-serve.sh --rebuild`) to
  pick up typography on :8765; operator push when ready.
- **Who / where** — Cursor agent · local · uncommitted
- **Timestamp** — 2026-07-07T01:00:00Z

### 2026-07-06T20:00:00Z — Light mode purple accent pass (design preview)

- **Requested** — In light mode preview, use subtle Apple-grade purple accents (not heavy); dark
  mode unchanged. Apply across Merged + Expanded screens. Note in matrix. Verify curl + browser.
- **Done** — `docs/previews/personalized-dashboard-preview.html`: added `[data-theme="light"]` CSS
  block for nav active pill, focus chips, Maya card, protocol/rec cards, category pills, focus
  badges, search focus ring, section eyebrows, CTAs, lab hero. `docs/previews/SUPERPOWER-PURPLE-FEATURE-MATRIX.md`:
  light mode accent pass approved note. `docs/HANDOFF.md` snapshot. Verified curl **200** + browser
  light mode Merged Today + Expanded Today/Recommended on http://127.0.0.1:8766.
- **Issues** — Preview uncommitted. Production tokens not yet synced to Flutter/TanStack.
- **Stand / next** — User reviews light mode accents; proceed to Flutter P0 when approved.
- **Who / where** — Cursor agent · local · uncommitted on working tree
- **Timestamp** — 2026-07-06T20:00:00Z

### 2026-07-07T00:15:00Z — Merged mode full page parity (design preview)

- **Requested** — User approved Merged layout; add all Expanded screens to Merged mode (not just
  Today + partial nav). Plan should contain Protocol + Recommended; metric detail drill-down; lab
  order modal; Classic/Expanded unchanged.
- **Done** — `docs/previews/personalized-dashboard-preview.html`: Plan tab with Protocol |
  Recommended segmented sub-nav (full content via `renderPlanMerged`); toolbar adds Recommended
  tab (6 screens in Merged); Today strip chips tappable to metric detail; `planSubTab` state;
  `renderProtocol`/`renderRecommended` optional `skipHeader`. Docs: `SUPERPOWER-PURPLE-FEATURE-MATRIX.md`,
  `CURSOR_HANDOFF.md`, `OPEN-ISSUES.md` (`superpower-design-parity` Merged approved, preview complete).
  Verified curl 200 + browser click-through Merged on :8766.
- **Issues** — Production Flutter/TanStack P0 still pending (`superpower-design-parity`). Preview
  uncommitted.
- **Stand / next** — User reviews Merged preview; when ready, implement Merged shell in Flutter
  (GoRouter 5-tab + Plan segments).
- **Who / where** — Cursor agent, local, uncommitted.
- **Timestamp** — 2026-07-07T00:15:00Z

### 2026-07-06T19:52:00Z — Metric detail temporal context (design preview)

- **Requested** — Metric detail screen in design preview must show date and which date each
  data point is from (latest card, chart x-axis, history list, optimal range as-of). All layout
  modes; light + dark. Verify :8766. No production Flutter.
- **Done** — Updated `docs/previews/personalized-dashboard-preview.html`: `metricHistory` mock
  with `recorded_at`/`measured_at`, `renderMetric()` latest card, dated chart with SVG
  `<title>` hovers, optimal range "as of", readings caption + list. CSS for new components.
  Updated `docs/previews/SUPERPOWER-PURPLE-FEATURE-MATRIX.md` metric detail rows. curl 200 +
  browser Metric detail tab PASS (Expanded/dark).
- **Issues** — Production `MetricShell` / Flutter port still deferred.
- **Stand / next** — User approval on dated metric detail pattern before Flutter/TanStack port.
- **Who / where** — Cursor subagent, local, uncommitted.
- **Timestamp** — 2026-07-06T19:52:00Z

### 2026-07-06T23:50:00Z — Three layout modes + Ask Maya rename (design preview)

- **Requested** — User-approved design edits: rename Ask Purple → Ask Maya in preview + docs;
  add Classic / Expanded / Merged layout modes with sessionStorage persistence; verify :8766
  all modes + light/dark. No production Flutter. No commit unless ready.
- **Done** — Extended `docs/previews/personalized-dashboard-preview.html`: toolbar segmented
  control (Classic / Expanded / Merged), dual-phone Classic view, collapsible Stats, Merged
  5-tab nav + hybrid Today. Renamed Ask Maya labels/chips throughout preview. Updated
  `docs/previews/SUPERPOWER-PURPLE-FEATURE-MATRIX.md`, `docs/OPEN-ISSUES.md`,
  `CURSOR_HANDOFF.md`, `docs/HANDOFF.md`. Verified curl 200 on :8766.
- **Issues** — Production implementation deferred; Expanded bottom nav still 5 tabs (Recommended
  via screen tab only, unchanged from prior).
- **Stand / next** — User picks target mode (likely Merged) for Flutter/TanStack P0 slice plan.
- **Who / where** — Cursor subagent, local, uncommitted on working tree.
- **Timestamp** — 2026-07-06T23:50:00Z

### 2026-07-06T21:00:00Z — Lab ordering preview + implementation spec

- **Requested** — Audit codebase for lab ordering; extend design preview (Recommended hero,
  3-step modal, Data empty state); write `LAB-ORDERING-SPEC.md`; docs sync; verify :8766.
  No production Stripe/partner integration.
- **Done** — Extended `docs/previews/personalized-dashboard-preview.html`: **Order blood panel**
  hero on Recommended (condition copy), 3-step modal (panel / collection / Stripe placeholder),
  Data **No labs yet** empty state + "Labs uploaded" toolbar toggle. Created
  `docs/previews/LAB-ORDERING-SPEC.md`. Updated `SUPERPOWER-PURPLE-FEATURE-MATRIX.md`,
  `docs/OPEN-ISSUES.md` (`lab-ordering-mvp`), `CURSOR_HANDOFF.md`, `docs/HANDOFF.md`.
- **Issues** — Production blocked on lab partner, Stripe lab SKUs, provider-of-record, legal.
- **Stand / next** — Owner picks Phase 1 (concierge/deep link) vs Phase 2 (in-app Stripe).
- **Who / where** — Cursor subagent, local, uncommitted on working tree.
- **Timestamp** — 2026-07-06T21:00:00Z

### 2026-07-06T20:00:00Z — Recommended for you preview tab (Purple marketplace parity)

- **Requested** — Add Purple-branded "Recommended for you" tab to design preview (not generic
  e-commerce); trait-ranked cards from `profiles.conditions`; light/dark; docs + verify :8766.
- **Done** — Extended `docs/previews/personalized-dashboard-preview.html` with **Recommended**
  screen: 2-column grid (wearable sync, HRV, sleep protocol, journal pack, caregiver invite;
  lab upload when `hasLabs` false), trait scoring (`sleep_critical`, `cardiovascular`,
  `seizure_prone`), personalization rules card, "For your focus" badges. Updated
  `docs/previews/SUPERPOWER-PURPLE-FEATURE-MATRIX.md` (Marketplace → Purple Recommended, P1),
  `docs/OPEN-ISSUES.md` (`superpower-design-parity`), `CURSOR_HANDOFF.md`. Verified curl **200**
  + browser on http://127.0.0.1:8766/personalized-dashboard-preview.html (Recommended tab,
  dark + light toggle).
- **Issues** — No production routes. No canvas file in repo to update (prior log referenced
  `purple-personalized-today-stats.canvas.tsx` from parallel session; not present here).
- **Stand / next** — User approves Recommended P1 scope; then implement ranking API + shell tab.
- **Who / where** — Cursor subagent, local, uncommitted on working tree.
- **Timestamp** — 2026-07-06T20:00:00Z

### 2026-07-06T19:45:00Z — Superpower multi-screen design preview (approval gate)

- **Requested** — Expand design previews with Superpower-inspired features; multi-screen HTML
  with light/dark, sleep+heart focus, real Purple data shapes; gap matrix + docs; browser
  verify on :8766; no production code.
- **Done** — Expanded `docs/previews/personalized-dashboard-preview.html` (Today, Data,
  Protocol, Recommended/Tools placeholder, Ask Maya, Metric detail). Created
  `docs/previews/SUPERPOWER-PURPLE-FEATURE-MATRIX.md`, `scripts/preview-design-serve.sh`.
  Updated `docs/OPEN-ISSUES.md` (`superpower-design-parity`), `CURSOR_HANDOFF.md`, canvas
  `purple-personalized-today-stats.canvas.tsx`. Verified curl **200** +
  browser load at http://127.0.0.1:8766/personalized-dashboard-preview.html.
- **Issues** — Production implementation blocked pending user approval. Recommended tab is
  design-only (replaces Superpower marketplace with trait-ranked Tools cards).
- **Stand / next** — User reviews preview + matrix; approve P0 list before Flutter/TanStack
  implementation.
- **Who / where** — Cursor subagent, local, uncommitted on working tree.
- **Timestamp** — 2026-07-06T19:45:00Z

### 2026-07-06T18:15:00Z — Permanent TestFlight observability + Share Beta Feedback research

- **Requested** — Answer whether Luciq + ASC feedback are triaged every TestFlight release;
  why external testers miss "Share Beta Feedback" on screenshots; create permanent rule and docs.
- **Done** — Ran `ios:check-luciq` (status `mcp`, SDK configured), `ios:check-tf-feedback`
  (18 ASC screenshot submissions, 0 crash logs). Luciq MCP `list_crashes` / `list_bugs` for
  `flutter-purple` and `purple` beta: **zero** open items for TF21. Created
  `mem/observability/testflight-beta-feedback.md`. Upgraded
  `.cursor/rules/flutter-testflight-observability.mdc` to `alwaysApply: true` with before/after
  upload triage gate. Updated `AGENTS.md`, `CURSOR_HANDOFF.md`, `mem/index.md`.
- **Issues** — ASC crash API still empty for screenshot-only reports (`tf-crash-report` open,
  low urgency). External testers on old TestFlight/iOS need alternate feedback paths documented
  in mem note.
- **Stand / next** — Enforce rule on TF22+; onboard Founding Team with TestFlight app
  Send Beta Feedback + shake when screenshot menu missing.
- **Who / where** — Cursor agent, local, `lovable/redesign` (uncommitted docs/rule).
- **Timestamp** — 2026-07-06T18:15:00Z

### 2026-07-06 — TestFlight 1.0 (21) Flutter ship + gates

- **Requested** — Complete TF21 TestFlight upload and pending Flutter/auth/design work
  (gates, glass migration, native reset deep link, commit+push `lovable/redesign`).
- **Done** — Fixed `ReportAiSummary` model + `reports_detail_screen.dart` compile errors;
  `reports_detail_model_test` + `widget_test` pass. `flutter analyze lib/` clean;
  `flutter test` **135/135**. Migrated `GlassSurface` on today/vitals/settings/account/meds
  to `design/glass_surface.dart`. Deleted 7 `" 2"` junk artifacts. Bumped
  `flutter/pubspec.yaml` to `1.0.0+21`. `ios:check-asc` PASS; `ios:testflight` upload
  **EXPORT SUCCEEDED**; ASC **1.0 (21) VALID**, external Founding Team
  `IN_BETA_TESTING` via `asc-add-build-to-group.mjs 21 "Founding Team"`. Committed all
  `flutter/` WIP (care chat pickers, AI insights repo, reports AI summary, settings
  polish, glass migration) + docs; pushed `lovable/redesign`.
- **Issues** — Native `org.purplelife.app://reset-password` device E2E not run this
  session (needs iPhone + corporate email quarantine may block recovery). Liquid-glass
  sign-in layout parity vs web still open (`flutter-auth-screen-parity` partial). Care
  dashboard Worker routes deployed separately (`fd1c06b`); Flutter client wired in this
  commit but not browser-verified on `:8765`.
- **Stand / next** — Tester on TF21: forgot-password → email → app opens reset screen →
  new password → sign-in. Rebuild `:8765` if validating Flutter web locally.
- **Who / where** — Cursor subagent (Flutter/TestFlight owner), `lovable/redesign`.
- **Timestamp** — 2026-07-06T17:10:00Z

### 2026-07-06 — Deploy care + AI Worker API routes

- **Requested** — Deploy pending Worker routes (care API, `/api/ai/*`, server libs); verify live;
  confirm Whoop native redirect on Supabase allow list; commit `src/` (no Flutter).
- **Done** — Reviewed `care.server.ts`, `ai-insights.server.ts`, `/api/ai/*`, care routes,
  `flutter-api-cors.ts`, `reports.functions.ts`, `report-trends.functions.ts`. Deleted duplicate
  `* 2.ts` care route files; `routeTree.gen.ts` regen via `build:prod`. `check:em-dash` PASS;
  `tsc --noEmit` PASS; `doppler ... bun run build:prod` PASS; `wrangler deploy` → Version ID
  **`8d527d7f-1fe7-4903-8518-7a71f52be25b`**. curl prod: care + AI routes **401** unauthenticated. Supabase GET auth config:
  `org.purplelife.app://oauth-whoop-callback` already in `uri_allow_list` (no PATCH needed).
- **Issues** — `incoming-invites` is GET-only (POST returns SPA HTML 200); use GET for auth probe.
- **Stand / next** — Flutter client can wire to deployed endpoints; Whoop Developer Portal native
  URI still manual owner step.
- **Who / where** — Cursor parallel subagent (Worker deploy), local tree.
- **Timestamp** — 2026-07-06T16:57:56Z

### 2026-07-06 — Supabase Auth allow list: Whoop native redirect

- **Requested** — Add `org.purplelife.app://oauth-whoop-callback` to Supabase Auth
  `uri_allow_list` if missing; document Whoop portal manual step in
  `mem/native-wearable-oauth-redirects.md`.
- **Done** — GET `.../v1/projects/xxnzmfzsjplrutrgbzxy/config/auth`; PATCH appended
  Whoop URI (HTTP 200). Updated `mem/native-wearable-oauth-redirects.md` (Supabase
  allow list table + Whoop Developer Portal manual registration note).
- **Issues** — Whoop Developer Portal redirect URIs still require owner manual
  registration (no API).
- **Stand / next** — Owner adds native + web Whoop URIs in Whoop developer portal.
- **Who / where** — Cursor subagent (command execution), local tree, uncommitted.
- **Timestamp** — 2026-07-06T16:55:50Z

### 2026-07-06T15:12:00Z — Split TestFlight and Luciq portable plans

- **Requested:** Separate `.md` files for TestFlight and Luciq so each can be attached
  independently to other Cursor chats.
- **Done:** Rewrote `docs/templates/testflight-automation-plan.md` (TestFlight only);
  added `docs/templates/luciq-crash-reporting-plan.md` (Luciq SDK + MCP + agent scripts).
  Each cross-links the other.
- **Issues:** None.
- **Stand / next:** Copy either file to target repo; attach + operator trigger phrase at bottom.
- **Who / where:** Cursor agent, local, uncommitted.
- **Timestamp:** 2026-07-06T15:12:00Z

### 2026-07-06T15:05:00Z — Portable TestFlight automation plan template

- **Requested:** Create a `.md` file explaining Purple's TestFlight/ASC setup that can
  be attached to other Cursor chats for execution (eatOS and other apps).
- **Done:** Added `docs/templates/testflight-automation-plan.md` — placeholders, audit
  checklist, file list, xcodebuild upload pattern, optional GHA + Luciq, verification
  gates, operator trigger phrase. References Purple scripts as source.
- **Issues:** None. Template is copy-paste portable; target project must still do one-time
  ASC API key generation in browser.
- **Stand / next:** Copy file to target repo or attach from purpledrw; operator stores ASC
  secrets; agent executes Phase 2 checklist.
- **Who / where:** Cursor agent, local, uncommitted.
- **Timestamp:** 2026-07-06T15:05:00Z

### 2026-07-06T14:32:00Z — Password-reset full E2E + TTL UX deploy

- **Requested:** Full E2E password-reset matrix for `pmt@eigital.com`; fix UX gaps
  (TTL copy, latest-email-only, expired-state sign-in hint); deploy; Flutter auth tests;
  commit (no push).
- **Done:** E2E matrix run against prod Supabase + `www.purplelife.org`. Password grant
  **PASS**. Recover POST **PASS** (after 60s cooldown); `email_send_log.status=sent` in ~4s;
  pg_cron `process-email-queue` active. `/reset-password` **200**; prod serves
  `auth-recovery-*.js` with `exchangeCodeForSession` + `1 hour` TTL label.
  Admin `generateLink` verify → `www.purplelife.org/reset-password` with recovery session
  tokens (**PASS**). UX shipped: `sign-in.tsx` reset-sent TTL + latest-email-only;
  `reset=expired` steers to password sign-in; `reset-password.tsx` dual CTAs (sign in /
  request new link). Flutter: `recoveryLinkTtlLabel`, updated copy, auth tests **9/9**.
  Gates: `check:em-dash` PASS, `tsc --noEmit` PASS, `build:prod` PASS. Deployed Worker
  **`079af4f1-eccb-4789-8c7c-648ba7d55621`**. TTL discovered: `mailer_otp_exp=3600` (1h).
  Committed auth-reset slice only (excluded unrelated WIP).
- **Issues:** Early recover attempts hit 429 rate limit during test burst; Supabase
  Management API `email_send_log` query intermittently OOM on Redis. `@eigital.com`
  corporate mail may quarantine recovery despite Resend delivered (pre-existing).
  TF21+ still needed for native deep-link reset on device.
- **Stand / next:** Upload TF21+ with `auth_deep_link.dart`; IT allowlist for
  `notify.purplelife.org` if `pmt@eigital.com` needs inbox delivery.
- **Who / where:** Cursor subagent, local `lovable/redesign` working tree.
- **Timestamp:** 2026-07-06T14:32:00Z

### 2026-07-06T14:30:00Z — pmt@eigital.com temp password rotation (eigital quarantine)

- **Requested:** 3rd report of no password-reset email for `pmt@eigital.com` (~10:24 AM
  ET); set new temp password, verify sign-in, check email_send_log + Resend, do not
  trigger another recovery send.
- **Done:** Rotated temp password via `auth.admin.updateUserById` (Doppler
  `SERVICE_ROLE_KEY`); `signInWithPassword` against prod **PASS**. Queried
  `email_send_log` (2 recovery rows last 30 min, latest `sent` 14:23:14 UTC).
  Resend latest (`eb814bc7-544a-4588-a606-d3e1c7031655`, 14:24:01 UTC):
  **`last_event: delivered`**. Prior temp password `PurpleTempba90bac1!` **invalid**.
  No alternate email on profile. Updated `CURSOR_HANDOFF.md`.
- **Issues:** `@eigital.com` corporate mail quarantines Purple recovery emails despite
  Resend delivery. User blocked on forgot-password loop until IT allowlists sender.
- **Stand / next:** User signs in with new temp password, changes in Account; IT
  allowlists `notify.purplelife.org` or user adds personal email.
- **Who / where:** Cursor subagent, local `lovable/redesign` working tree.
- **Timestamp:** 2026-07-06T14:30:00Z

### 2026-07-06T13:45:00Z — Auth password-reset fixes deployed to prod

- **Requested:** Complete stalled auth audit fixes (admin reset, rate-limit errors,
  expired-link redirect, recovery email fallback), run gates, deploy to prod, commit
  (no push unless asked).
- **Done:** `src/lib/admin-users.functions.ts` uses `resetPasswordForEmail` with
  `https://www.purplelife.org/reset-password`; `sign-in.tsx` rate-limit mapping in
  `friendlyAuthError` + used in `handleForgotPassword`; `reset-password.tsx` expired
  CTA → `/sign-in?reset=expired`; `webhook.ts` recovery fallback to `/reset-password`.
  Flutter auth slice committed (deep links, reset screen, tests). Deployed Worker
  **`bdf1f37a-9fbf-41f5-b0dc-46cbae616c94`**. curl `/reset-password` + `/sign-in` 200.
- **Issues:** Full `flutter test` 130/132 (reports AI WIP compile errors unrelated).
  Native reset deep links still need TF21+ upload.
- **Stand / next:** Push commit when operator asks; TF21 for native reset on device.
- **Who / where:** Cursor agent, local `lovable/redesign`/`main` working tree.
- **Timestamp:** 2026-07-06T13:45:00Z

### 2026-07-06T12:10:00Z — TestFlight 1.0 (20) ship + external Founding Team group

- **Requested:** Publish a new Flutter build to TestFlight if not already current,
  and make sure the external "Founding Team" beta group actually has it (external
  testers are not auto-added).
- **Done:**
  1. `git fetch origin main lovable/redesign` — both already at the tip local
     `lovable/redesign` was 2 commits ahead of (`5681373`, `5f971c3`, pending push).
  2. `doppler run --project purple-life --config prd -- node scripts/asc-list-builds.mjs`
     → latest was **1.0 (19) VALID**, no build 20 existed.
  3. Found extensive **uncommitted WIP** already in the working tree (native
     `file_picker`/`image_picker` pickers, care chat/reports/dashboard/settings/vitals
     edits, `ai_insights_repository.dart`, `care.server.ts`, `report-trends.functions.ts`,
     `reports.functions.ts`, `routeTree.gen.ts`) — not part of this task and not
     verified/tested as a unit. `git stash push -u` to get a clean, previously-verified
     tree before building, so the TestFlight upload only contains reviewed code plus the
     version bump.
  4. Bumped `flutter/pubspec.yaml` → `1.0.0+20`. `flutter analyze lib/` clean;
     `flutter test` **124/124**.
  5. First upload attempt failed (`could not find included file 'Developer.xcconfig'`)
     because that machine-local Xcode-beta path fixup was untracked and got stashed
     with `-u` along with everything else; recovered just that file (and the also-
     stashed, previously-uncommitted `scripts/asc-add-build-to-group.mjs` helper) via
     `git checkout <untracked-stash-commit> -- <path>` + `git reset` to keep them
     untracked/unstaged as appropriate, then retried.
  6. `doppler run --project purple-life --config prd -- bun run ios:testflight` →
     `** ARCHIVE SUCCEEDED **` / `** EXPORT SUCCEEDED **`, upload confirmed complete.
  7. Polled `asc-list-builds.mjs` every ~90s; **1.0 (20) processing=VALID** within
     ~5 minutes, `internal=IN_BETA_TESTING` (auto), `external=READY_FOR_BETA_SUBMISSION`
     (not auto, as expected).
  8. Beta groups for app `6787298041`: `0871a099-...` "Development Team" (internal=true),
     `8ad416f5-8248-48e6-9951-03af3f932b6c` "Founding Team" (internal=false) — matches
     the group ID given in the request.
  9. `doppler run --project purple-life --config prd -- node scripts/asc-add-build-to-group.mjs 20 "Founding Team"`
     → added build 20 to the group, submitted Beta App Review
     (`betaReviewState=WAITING_FOR_REVIEW`).
  10. Checked stale Capacitor **build 1** — already `expired=true` from the prior
      `tf-login-wrong-surface` fix (2026-07-06 earlier session); no action needed.
  11. Re-polled ~1 minute later: **external=IN_BETA_TESTING** (expedited re-review,
      group already had an approved build in rotation).
  12. `git stash pop` restored the WIP exactly as found (verified via `git diff` on
      `pubspec.yaml`: version line and the WIP's `file_picker`/`image_picker` lines both
      present, no conflict markers). Committed only the version bump + the recovered
      `asc-add-build-to-group.mjs` script as **`879bf8f`**. Pushed `lovable/redesign`
      (`e67e04e..879bf8f`, includes the pending overnight vite CVE patch commits), then
      fast-forwarded `main` to match via `git push origin lovable/redesign:main`
      (`e67e04e..879bf8f`, no checkout needed, no conflicts). Both branches now
      identical at `879bf8f` on `origin`.
- **Final ASC state (build 1.0 (20)):** `processing=VALID`,
  `internal=IN_BETA_TESTING`, `external=IN_BETA_TESTING`.
- **Install instruction for testers:** Open the **TestFlight** app on the device
  → **Purple for Life** → tap **Update** (build 20 is now live for the "Founding
  Team" external group and the internal Development Team group). Testers who
  never installed need an invite to the "Founding Team" group (or the public link
  if one has been generated in ASC) before TestFlight will show the app at all.
- **Issues:** None blocking. The WIP left in the tree (native pickers, AI insights
  repo, care dashboard edits) is still uncommitted and **not part of build 20** —
  it was deliberately excluded from this ship since it was never verified as a
  unit; whoever owns that WIP should commit or resume it separately. Same for the
  `" 2"`-suffixed duplicate junk files and `test-results/` — untouched, pre-existing,
  not cleaned up in this task (out of scope).
- **Stand / next:** TestFlight 1.0 (20) is live for both internal and external
  groups; no further action needed for this request. Next real work: land the
  native-pickers WIP (or discard if abandoned), and the `care.server.ts`/AI Worker
  routes WIP still sitting uncommitted.
- **Who / where:** Cursor agent, `lovable/redesign`/`main` @ `879bf8f`.
- **Timestamp:** 2026-07-06T12:10:00Z.

### 2026-07-06T02:20:00Z — overnight deps: vite + transitive CVE overrides

- **Requested:** Bump vite to >=7.3.5; add bun overrides for undici>=7.28.0,
  ws>=8.21.0, js-yaml>=4.2.0 if safe; `bun install`, full gates; commit if green.
- **Done:** `package.json` vite `^7.3.5`; root `overrides` + mirrored `pnpm.overrides`
  for `undici`, `ws`, `js-yaml@4.2.0` (pinned 4.2.0 because `>=4.2.0` pulled 5.x).
  `bun install`; lock: vite **7.3.6**, undici **7.28.0**, ws **8.21.0**, js-yaml **4.2.0**.
  Commit **`5681373`** on `lovable/redesign`.
- **Issues:** `check:entry-budget` still fails pre-existing (same 273885 gz on old vite).
  `bun audit` residual 2 low (babel, esbuild Windows dev-server). Unrelated WIP tsc errors
  in working tree not touched.
- **Stand / next:** None for deps; optional follow-up: entry-budget split or esbuild override.
- **Who / where:** Cursor dependency-cve-scanner subagent, `lovable/redesign` @ `5681373`.
- **Timestamp:** 2026-07-06T02:20:00Z.

### 2026-07-06T02:25:00Z — care-accept-server-route DEPLOYED (wrangler deploy, prod verified)

- **Requested:** `git pull origin main`; run `check:em-dash` + `build:prod`; deploy
  via `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bunx
  wrangler deploy --config wrangler.deploy.jsonc`; verify `/api/care/{accept,
  decline,incoming-invites}` are live (not 404) on prod; update HANDOFF +
  OPEN-ISSUES; commit docs only if changed; push `main` + `lovable/redesign`.
- **Done:**
  - Repo was on `lovable/redesign` @ `d31d2a8`; `main` was already identical
    (`git rev-list --left-right --count main...lovable/redesign` → `0 0`).
    `git pull origin main` was a no-op (already up to date).
  - Found uncommitted working-tree WIP unrelated to this task at session start:
    modified `docs/FLUTTER-CUTOVER-GAP-MATRIX.md`, `CURSOR_HANDOFF.md`,
    `flutter/lib/features/insights/insights_widgets.dart`/`insights_screen.dart`,
    `src/lib/flutter-api-cors.ts`, `src/lib/care.server.ts` (docblock only), plus
    untracked `src/routes/api/care/{today,meds,journal,seizures,reports}.ts` and
    `mem/native-wearable-oauth-redirects.md`. Inspected the new route files: they
    `await import("@/lib/care.server")` and call `caregiverReadTodayForUser`
    (and siblings) which **do not exist** in `care.server.ts` yet (only
    `acceptCareInviteForUser`/`declineCareInviteForUser`/
    `listIncomingInvitesForUser` are exported) — this WIP would fail
    `tsc`/`build:prod` if built. **Stashed it** (`git stash push -u -m "wip:
    caregiver dashboard backlog routes..."`) so the deploy only shipped
    already-committed, already-verified code. Did **not** pop it back: partway
    through this task, a **concurrent agent session** was found actively
    writing to this same checkout (new Flutter chat/reports/dashboard files,
    `ai-insights.server.ts`, `/api/ai/*` routes, `package.json`/`bun.lock`/
    `pubspec.yaml`/`pubspec.lock` changes, `routeTree.gen.ts` regeneration —
    none made by this agent, all appeared between the stash and the docs
    commit). Popping the older stash into that live, overlapping dirty tree
    risked a collision on `care.server.ts`, `insights_widgets.dart`, and the
    `/api/care/{today,meds,journal,seizures,reports}.ts` filenames (the
    concurrent session appears to already be re-doing/extending this exact
    backlog). Left as **`stash@{1}`: "wip: caregiver dashboard backlog routes
    (incomplete, unrelated to care-accept-server-route deploy)"** for the
    owner of that concurrent work to reconcile explicitly (`git stash show -p
    stash@{1}` to inspect, `git stash drop stash@{1}` once confirmed
    superseded, or apply to a separate branch/worktree if still needed).
  - Gates on the clean, stashed tree: `bun run check:em-dash` **PASS**;
    `bun run build:prod` **PASS** (client + SSR + server bundle, `✓ built in
    11.34s`).
  - Deploy attempt 1: `doppler run --project cursor-cloudflare --config
    prd_cloudlfare -- bunx wrangler deploy --config wrangler.deploy.jsonc` — Worker
    script, assets (268 files), and cron triggers uploaded successfully, but
    **failed** the zone-route attach step: `A request to the Cloudflare API
    (/accounts/c7f99ecba0ace852de43684ec8a44612/workers/scripts/purplelife/routes)
    failed.` (`c7f99ecba0ace852de43684ec8a44612` is the POS account, not eigital
    — matches the known `doppler-cloudflare-account-id` issue).
  - Deploy attempt 2 (with override): `doppler run --project cursor-cloudflare
    --config prd_cloudlfare -- env
    CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0 bunx wrangler deploy
    --config wrangler.deploy.jsonc` — **succeeded**. Routes listed:
    `www.purplelife.org/*`, `purplelife.org/*` (zone `purplelife.org`); cron
    schedules `* * * * *`, `0 * * * *`, `0 6 * * *`, `0 15 * * 7` all deployed.
    **Current Version ID: `07bbab77-f4de-4501-89c0-e22a52e60941`.**
  - Verified live via curl (no `Authorization` header):
    - `POST https://www.purplelife.org/api/care/accept` → **401**
      `{"error":"Unauthorized"}`
    - `POST https://www.purplelife.org/api/care/decline` → **401**
      `{"error":"Unauthorized"}`
    - `GET https://www.purplelife.org/api/care/incoming-invites` → **401**
      `{"error":"Unauthorized"}`
    - Control checks: `GET /` → 200, `GET /sign-in` → 200, `GET
      /api/care/nonexistent-route-xyz` → 404 (confirms the 401s above are real
      route hits, not a catch-all).
  - Updated `docs/OPEN-ISSUES.md`: marked `care-accept-server-route` resolved
    (deploy) with full detail, reconfirmed `doppler-cloudflare-account-id` with
    today's evidence. Updated `docs/HANDOFF.md` Current snapshot (this entry).
- **Issues:** The caregiver-dashboard-reads backlog (`caregiverReadToday`,
  `caregiverReadMeds`, `caregiverReadJournal`, `caregiverReadSeizures`,
  `caregiverReadReports` — see the "Extended 2026-07-05 (Wave-2 fleet)" entry
  under `care-accept-server-route` in OPEN-ISSUES) is now **partially
  scaffolded but incomplete and uncommitted**: Worker route files exist for
  5 of those but the `care.server.ts` functions they call do not. Do not build
  or deploy from this working tree until those functions are implemented (they
  will fail `tsc`). The older, narrower version of this same WIP from before
  this task's deploy is sitting in `git stash@{1}` (unpopped, see above) —
  reconcile or drop it rather than losing track of two divergent copies.
  Doppler's stored `CLOUDFLARE_ACCOUNT_ID` still resolves to the POS account —
  every future `wrangler deploy` needs the explicit env override until that is
  fixed at the source (Doppler dashboard/API, not done here — out of scope for
  this task and no destructive/account-level change was made).
- **Stand / next:** Care-accept/decline/incoming-invites loop is now
  end-to-end functional in prod (Flutter can call these on `www.purplelife.org`
  with a real bearer token). Next: implement the missing `care.server.ts`
  caregiver-read functions for the stashed WIP routes, then repeat this same
  gate-build-deploy-verify cycle for them.
- **Who / where:** Cursor agent (ops deploy subagent), local, `main` @
  `d31d2a8` (+ this docs commit) / `lovable/redesign` kept in sync.
- **Timestamp:** 2026-07-06T02:25:00Z

### 2026-07-06T02:15:00Z — AI Worker JSON routes for Flutter (summarizeReport / getMetricInsight / getDailyInsightCards), tsc-only slice

- **Requested:** Add Worker JSON routes for Flutter-callable AI, fronting
  `summarizeReport`, `getMetricInsight`, `getDailyInsightCards` as POST routes
  under `src/routes/api/ai/`, following existing Worker patterns
  (`care.server.ts` / server-fn-import pattern). Disjoint slice: explicitly
  **not** `care/*` (sibling-owned). Scope was `tsc --noEmit` verification
  only — no deploy, no push, no Flutter client wiring.
- **Done:**
  - New `src/lib/ai-insights.server.ts`: `summarizeReportForUser`,
    `getMetricInsightForUser`, `getDailyInsightCardsForUser` — plain
    functions taking an already user-scoped Supabase client (created from the
    caller's Bearer JWT, so RLS enforces per-user ownership on
    `report_documents`/`report_metrics`/`metric_insights`/`vitals_log`) plus
    an explicit `userId`. Logic/prompts are a byte-for-byte mirror of the
    existing web-only `createServerFn` handlers in
    `src/lib/reports.functions.ts` (`summarizeReport`) and
    `src/lib/report-trends.functions.ts` (`getMetricInsight`,
    `getDailyInsightCards`) as of this commit; those originals were **not**
    modified (zero shared-file edit risk with any parallel slice touching
    those files). Also exports `AiInsightsApiError` for typed 404s (report
    not found / cross-user).
  - New Worker routes (`createFileRoute` + `server.handlers.POST`, same
    manual-Bearer-auth shape as `src/routes/api/care/{accept,decline}.ts`):
    - `POST /api/ai/summarize-report` — body `{ id: uuid, force?: boolean }`
    - `POST /api/ai/metric-insight` — body `{ metricKey: string, force?: boolean }`
    - `POST /api/ai/daily-insight-cards` — body `{ force?: boolean }` (body may be `{}`)
    All three: `Authorization: Bearer <supabase access token>` required, JSON
    body parsed unconditionally (Flutter web omits `Content-Type`), errors
    returned as `{ error: string }` with a real HTTP status.
  - `src/routeTree.gen.ts` picked up the three new routes automatically (a
    background dev/watch process regenerated it); diff reviewed, contains
    only the three new route imports/registrations.
- **Issues:**
  - **Not wired into Flutter yet** — no `flutter/lib/features/**` or
    `care_repository.dart`-equivalent client changes in this slice. The
    Flutter app still shows the honest AI gap-states
    (`docs/DECISIONS.md` 2026-07-05 entry) until a client PR calls these
    routes.
  - **Not added to `src/lib/flutter-api-cors.ts` allow-list** — Flutter web
    (CORS) callers will be blocked until that list is updated; native/mobile
    callers are unaffected (no CORS). Follow-up needed before Flutter web can
    use these routes.
  - **Not deployed** — Worker routes only exist in this working tree/branch
    until built + deployed per `docs/manual-deploy-bundle.md`.
  - `getMetricInsightForUser`/`getDailyInsightCardsForUser` intentionally do
    **not** auto-run AI on first call without `force=true` (matches the
    original web behavior: avoid surprise billing); callers must pass
    `force: true` once to generate, after which the cached result is
    returned on subsequent calls for the same day/latest reading.
- **Stand / next:** Routes exist and type-check; next action is (a) add the
  three paths to `src/lib/flutter-api-cors.ts` if Flutter web needs them, (b)
  wire a Flutter repository/service to call them (mirrors
  `care_repository.dart`), (c) deploy the Worker once a parent/integrator
  slice merges and runs the full gate suite (`check:em-dash`,
  `check:live-data`, `check:unique-images`, `tsc`, `build`), (d) mark
  `getDailyInsightCards`/`summarizeReport`/`getMetricInsight` resolved in
  `docs/OPEN-ISSUES.md` once Flutter wiring + deploy are both confirmed
  end-to-end (left as partially-open below since only the Worker side landed).
- **Who / where:** Subagent (disjoint AI-routes slice), local checkout,
  branch `lovable/redesign` (uncommitted at time of writing; parent
  integrator to commit/merge).
- **Timestamp:** 2026-07-06T02:15:00Z

### 2026-07-06T06:10:00Z — audit cleanup, WIP commits, branch sync (no deploy)

- **Requested:** Delete all untracked `" 2"`-suffixed duplicate files and
  `.flutter-web-serve*.pid/.lock`; regenerate `routeTree.gen.ts` for
  `/api/care/incoming-invites`; run gates; commit WIP in logical commits (care,
  auth, docs); push `lovable/redesign`; fast-forward `main`; skip prod deploy;
  update HANDOFF with cleanup + commit SHAs.
- **Done:**
  - Deleted **22** duplicate artifacts + `.flutter-web-serve.pid` (0 remaining on
    disk). Did not delete `flutter/ios/Flutter/Developer.xcconfig` (legitimate
    local Xcode-beta `DEVELOPER_DIR` override).
  - Regenerated `routeTree.gen.ts` via `bun run build` (registers
    `/api/care/incoming-invites`).
  - Gates: `check:em-dash` **PASS**, `tsc --noEmit` **PASS**, `flutter analyze
    lib/` **PASS**, `flutter test` **124/124 PASS**.
  - Commits: **`574ac0b`** `feat(care): add incoming-invites Worker route for
    Flutter`; **`362b9b6`** `feat(flutter): auth screen parity and friendly error
    messages`; docs commit on branch tip (this log entry).
- **Issues:** Prod deploy **NOT run** (explicit skip per standing policy). Care
  Worker routes (`/api/care/{accept,decline,incoming-invites}`) still need
  `wrangler deploy` before Flutter end-to-end care invites work on prod.
- **Stand / next:** Owner approval for prod deploy; on-device verify care invites
  after deploy.
- **Who / where:** Cursor agent, local, `lovable/redesign` → `main` sync.
- **Timestamp:** 2026-07-06T06:10:00Z

### 2026-07-06T02:45:00Z — care-accept-server-route P0 close-out (routes complete, deploy pending approval)

- **Requested:** Close as much of `care-accept-server-route` as possible (P0). Read
  `accept.ts`/`decline.ts`/`care.server.ts`; verify `bun run tsc && bun run build:prod`;
  check Flutter `acceptInvite`/decline wiring; fix `IncomingCareInvitesCard` dead code
  by implementing a minimal Worker `GET /api/care/incoming-invites` or document the exact
  blocker; deploy via `wrangler deploy` only if gates pass (ask before prod deploy
  otherwise); update OPEN-ISSUES + HANDOFF with deploy status.
- **Done:**
  - Read `src/routes/api/care/accept.ts`, `decline.ts`, `src/lib/care.server.ts` in
    full — both routes correct and unchanged, mirror the `acceptInvite`/
    `declineIncomingCareInvite` TanStack server fns exactly (same checks/order/messages).
  - **Root-caused the "dead code" invites card.** Traced both the web
    (`src/components/care/incoming-care-invites-card.tsx`) and Flutter
    (`flutter/lib/features/care/incoming_care_invites_card.dart`) cards plus their data
    sources. Web's card correctly calls `listIncomingCareInvites` (service-role TanStack
    server fn in `src/lib/care.functions.ts`) — **not** dead code. Flutter's
    `CareRepository._loadIncomingCareInvites` did a **direct Supabase client `.select()`**
    on `care_relationships` filtered by `invite_email`, and `declineIncomingCareInvite`
    a direct `.update()` — both silently return 0 rows / no-op under RLS, because
    `care_rel_caregiver_select` (`supabase/migrations/20260527094605_...sql`) is
    `USING (auth.uid() = caregiver_id)`, and `caregiver_id` is `NULL` on a still-pending
    (not-yet-accepted) invite. This is the actual bug the OPEN-ISSUES note was describing.
  - **Added `GET /api/care/incoming-invites`** (`src/routes/api/care/incoming-invites.ts`)
    fronting a new `listIncomingInvitesForUser` in `src/lib/care.server.ts` (byte-for-byte
    mirror of `listIncomingCareInvites`'s query/join/expiry-filter logic, service role).
    Added the path to `FLUTTER_CORS_PATHS` in `src/lib/flutter-api-cors.ts`.
  - **Rewired Flutter** (`flutter/lib/features/care/care_repository.dart`):
    `_loadIncomingCareInvites` now does an authenticated `GET` to the new Worker route
    instead of the RLS-blocked direct select; `declineIncomingCareInvite` now does a
    `POST /api/care/decline` instead of the RLS-blocked direct update (mirrors the
    already-correct `acceptInvite` → `POST /api/care/accept`). Removed the now-unused
    `_currentUserEmail()` helper (flagged by `flutter analyze`).
  - **Gates, all green:** `bun run tsc` (exit 0, no errors), `bun run build:prod`
    (client + SSR bundles built successfully after a clean `dist/` — an unrelated stale
    `dist/server/assets` dir caused one transient `ENOTEMPTY` on the first attempt),
    `flutter analyze lib/` (0 issues), `flutter test` (**124/124**, no regressions).
  - **Repo hygiene (blocking prerequisite):** `bun run build:prod`'s prebuild
    `check:em-dash` gate was failing on a stray untracked `src/lib/flutter-web-routing 2.ts`
    (an em dash in a macOS-style duplicate-save file, not in any real tracked source).
    Found and removed **~50 untracked `" 2.<ext>"` duplicate files** across `src/`,
    `scripts/`, `flutter/test/`, `flutter/ios/`, `flutter/macos/`, `ios/App/`, `mem/`,
    `supabase/migrations/`, plus stale `.flutter-web-serve*.pid/.lock` files in repo
    root. Verified each had a byte-identical or near-identical tracked counterpart before
    deleting (none were git-tracked, so this is a pure no-op for git history). This also
    resolves the concurrent full-audit agent's `audit-repo-duplicate-junk-files` and
    `audit-tsc-uncommitted-invites-route` findings (see OPEN-ISSUES, both marked resolved).
  - Updated OPEN-ISSUES `care-accept-server-route` with the full fix detail and the exact
    deploy command; refreshed this HANDOFF's Current snapshot.
- **Issues / NOT done:**
  - **Deploy NOT run.** Per `.cursor/rules/no-manual-operator-work.mdc` /
    `agent-orchestration-safety.mdc`, prod deploy needs explicit operator approval before
    running, and this task explicitly said to ask rather than deploy unilaterally. Exact
    command, ready to run on approval: `doppler run --project cursor-cloudflare --config
    prd_cloudlfare -- bunx wrangler deploy -c wrangler.deploy.jsonc` (from repo root,
    after `bun run build:prod`; add `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0`
    if Doppler resolves the wrong Cloudflare account per `doppler-cloudflare-account-id`).
  - Until that deploy runs, Flutter's care-invite accept, decline, and incoming-invites
    list all still 404 against `www.purplelife.org` — no functional change for real users
    yet, only unblocks it pending the deploy.
  - This session ran in the same working tree as a concurrent Flutter auth-screen-parity
    agent (`flutter/lib/core/auth/auth_repository.dart`,
    `flutter/lib/features/auth/sign_in_screen.dart`, `flutter/test/friendly_auth_error_test.dart`
    left modified/untracked, not touched by this session). Only `care.server.ts`,
    `flutter-api-cors.ts`, `routeTree.gen.ts`, the new `incoming-invites.ts`, and
    `care_repository.dart` are this session's changes; commit scope should stay disjoint
    from the auth-parity work.
  - Caregiver dashboard tabs (`caregiverReadToday`/`caregiverReadMeds`/etc.) and the
    insights/reports AI Worker-route backlog in OPEN-ISSUES `care-accept-server-route`
    remain **fully open**, untouched by this pass — still the next-largest chunk of that
    issue.
- **Stand / next:** Get operator approval and run the `wrangler deploy` command above;
  then verify live with an authenticated `curl` against
  `https://www.purplelife.org/api/care/incoming-invites` (expect 401 without a bearer
  token, 200 `{invites:[...]}` with one) and a real Flutter TestFlight accept/decline
  round-trip. After that, pick up the caregiver-dashboard Worker-route backlog.
- **Who / where:** Cursor (subagent, care-accept-server-route P0) · darwin ·
  `lovable/redesign` (uncommitted at write time; concurrent auth-parity work also
  uncommitted in the same tree).
- **Timestamp:** 2026-07-06T02:45:00Z

### 2026-07-06T02:30:00Z — full audit (all gates, ops checks, branch divergence, closure matrix)

- **Requested:** Full audit: read handoff trio + gap matrix, run all quality
  gates, run ops checks (ASC builds, TF feedback, Luciq), summarize `git
  status`, compare `origin/main` vs `origin/lovable/redesign`, produce a
  prioritized closure matrix, append this log entry with a gate table. No prod
  deploy.
- **Done — gate results:**

  | Gate | Command | Result | Detail |
  |------|---------|--------|--------|
  | Em dash | `bun run check:em-dash` | **FAIL (false positive)** | 1 hit, but only in untracked junk `src/lib/flutter-web-routing 2.ts:25`; 0 hits in any tracked file |
  | Live data | `bun run check:live-data` | **PASS** | no test/placeholder data; no fake vitals |
  | Unique images | `bun run check:unique-images` | **PASS** | 16/16 marketing assets used by exactly one route |
  | Lovable auth guard | `bun run check:lovable-auth` | **PASS** | all `lovable.auth` usage host-guarded |
  | TypeScript | `bunx tsc --noEmit` | **FAIL (working tree only)** | 1 error: `src/routes/api/care/incoming-invites.ts(18,38)` — uncommitted route not in generated `routeTree.gen.ts`; HEAD tree confirmed clean |
  | Flutter analyze | `flutter analyze lib/` | **PASS** | 0 issues |
  | Flutter test | `flutter test` | **PASS** | 116/116 |
  | ASC builds | `bun run ios:check-asc-builds` | **PASS (info)** | 1.0(19) VALID, internal+external `IN_BETA_TESTING`; 15–18 also VALID |
  | TF feedback | `bun run ios:check-tf-feedback` | **PASS (info)** | 15 submissions pulled; newest 2 (2026-07-06) are `flutter-auth-screen-parity` ("Unable to login", "Error is wrong") |
  | Luciq crashes | `bun run ios:check-luciq -- --json` + Luciq MCP `list_crashes` | **PASS** | script returns `status:"mcp"` (REST 401 expected); direct MCP call for `purple` (iOS) and `flutter-purple` (Flutter) beta apps both return **zero crashes** |

  Net: **every gate failure traces to an uncommitted, local-only artifact.**
  Nothing pushed to `origin/lovable/redesign` is broken.

- **Done — git status summary:** clean check-out of `lovable/redesign`
  (`c912a68`, matches `origin/lovable/redesign`, no divergence). Working tree
  has: 1 modified tracked file (`src/routeTree.gen.ts`, corrupted by the junk
  duplicate route files, see below); 1 modified tracked file
  (`src/lib/care.server.ts`, real uncommitted WIP); 1 new untracked real file
  (`src/routes/api/care/incoming-invites.ts`, real uncommitted WIP, referenced
  by `flutter/lib/features/care/care_repository.dart:742`); **58 untracked
  `" 2"`-suffixed duplicate files** across `src/components/`, `src/lib/`,
  `src/routes/_app/`, `src/routes/api/`, `scripts/`, `flutter/test/`,
  `flutter/ios/`, `flutter/macos/`, `ios/App/`, `mem/`,
  `supabase/migrations/` (diffed the migration one: byte-identical to the real
  file; diffed `whoop-sync 2.ts`: identical except its own route-path string);
  13 stale `.flutter-web-serve*.pid`/`.lock` files (confirmed **no process
  currently listening on :8765**, not an active port conflict, just leaked pid
  files from past sessions); plus 2 legitimate local-only artifacts
  (`flutter/ios/Flutter/Developer.xcconfig` from `ios:local-signing`,
  `.flutter-web-serve.pid` from the last live run). Logged both real findings as
  new OPEN-ISSUES: `audit-tsc-uncommitted-invites-route`,
  `audit-repo-duplicate-junk-files`.
- **Done — branch divergence:** `git fetch origin` — `origin/lovable/redesign`
  @ `c912a68` is **34 commits ahead of `origin/main`** (`4f69041`), **0 commits
  behind**; merge base `4f69041`. `main` has not moved since the last
  documented sync; the entire TF19 wave-1+2 fleet (11 slices) plus the
  2026-07-06 audit/login-fix docs commits are on `lovable/redesign` only. No
  merge conflict risk detected (fast-forward possible).
- **Done — prioritized closure matrix:** see table below (also serves as "top
  10 items to close").

  | # | Issue ID | Status | Blocker | Owner | Effort | Done criteria |
  |---|----------|--------|---------|-------|--------|----------------|
  | 1 | `audit-tsc-uncommitted-invites-route` | New, open | `routeTree.gen.ts` stale for uncommitted route | Cursor | S (~15 min) | `bunx tsc --noEmit` exits 0; route + regenerated tree committed with a HANDOFF entry |
  | 2 | `audit-repo-duplicate-junk-files` | New, open | 58 stray `" 2"` files + 13 stale pid/lock files | Cursor | S (~30 min) | Files deleted; `check:em-dash` + `tsc` green from duplicate-removal alone; `flutter-web-serve.sh` pid naming fixed |
  | 3 | `care-accept-server-route` | Partial (accept/decline written, not deployed; incoming-invites WIP uncommitted) | Care-API Worker routes not deployed to prod; 14-route backlog for caregiver dashboard + AI | Cursor (deploy is agent-owned; going live may need owner nod) | L (multi-day) | All P0 care routes deployed; Flutter invites card live-wired; on-device verified |
  | 4 | `flutter-auth-screen-parity` | Open | Raw Supabase error strings, no forgot-password, plain Material vs web glass layout | Cursor | M (~1 day) | `friendlyAuthError` ported; forgot-password flow; `GlassCard`/token styling matches `sign-in.tsx` |
  | 5 | `tf-settings-shell-nav` | Open, blocked | Tester wants left burger + left-to-right slide; conflicts with `AGENTS.md` right-drawer rule | Owner decision → Cursor | M | Owner picks drawer side; shell updated; TF re-verify |
  | 6 | `lovable-redesign-merge` | Open | 34 commits ahead of `main`, unmerged | Cursor (merge), Owner (deploy approval) | M | Gate pass on `main`; fast-forward merge; deploy still owner-gated |
  | 7 | `oura-native-redirect-console` | Open, blocked | Native OAuth redirect URI not registered in Oura developer console (no API) | Owner (3rd-party console) | S | `org.purplelife.app://oauth-oura-callback` registered; native connect succeeds on device |
  | 8 | `tf-heading-typography` + `tf-bottom-whitespace` | Open | Need screen ID from screenshot + type-scale/safe-area fix | Cursor | S–M | Matches web `design/tokens.json` scale; safe-area padding fixed; TF re-verify |
  | 9 | Wave-3 native pickers (reports upload, chat attachments) | Open | No `image_picker`/`file_picker` deps added yet | Cursor | M | Upload + attachment send functional on physical device |
  | 10 | On-device TF19 verification checklist | Open | No physical device/simulator available in this environment | Owner (device) or Cursor (simulator) | S | 6-item checklist from the 2026-07-05T20:45 log entry all PASS |

- **Issues / NOT done:** Did not touch code or delete any junk files (audit is
  read-only by design; both new findings are logged for a future task to fix).
  Did not merge `main`, did not deploy anything.
- **Stand / next:** Next agent: (1) quick win — delete the 58 `" 2"` files +
  stale pid/lock files, regenerate `routeTree.gen.ts` via one `bun run dev`/`build`
  pass, commit `incoming-invites.ts` + `care.server.ts` + regenerated tree
  together with its own HANDOFF entry, re-run `check:em-dash` + `tsc --noEmit`
  to confirm both green; (2) then resume the `care-accept-server-route`
  backlog and `flutter-auth-screen-parity`; (3) owner decisions still pending:
  settings burger-drawer side, Oura console redirect URI, `main` merge +
  prod deploy timing.
- **Who / where:** Cursor (full-audit subagent) · darwin ·
  `lovable/redesign@c912a68` (no commits made this session besides this doc
  update).
- **Timestamp:** 2026-07-06T02:30:00Z

### 2026-07-06T01:55:00Z — tf-login-wrong-surface root-caused and remediated via ASC API (no code change)

- **Requested:** Investigate `welcome_screen.dart`, `sign_in_screen.dart`, `auth_gate.dart`,
  `shell/router.dart` for the reported "Welcome back!" web-style login on TF19; check for a
  WebView/URL-load fallback or `FlutterDeepLinkingEnabled` issue; fix if the Flutter copy was
  reverted; run `flutter analyze`/`flutter test`; document; report whether TF20 is needed. Builds
  on the prior triage entry below (2026-07-06T01:45:00Z, auth routing audit).
- **Done:**
  - **Confirmed no Flutter regression.** Read all 4 requested files + `shell/routes.dart`;
    `sign_in_screen.dart` renders "Purple" (serif) / "Sign in" or "Create your account" /
    email+password `GlassCard` / purple `FilledButton` "Sign in" / outlined "Continue with
    Google"/"Continue with Apple" / "Need an account? Create one" — correct native design.
    `git log --follow` shows it unchanged since the 2026-07-04 cutover commit `918c766` through
    TF12-19 (no revert). Grepped all of `flutter/lib` for `webview|WebView|purplelife.org`: zero
    WebView usage; the only `purplelife.org` hits are inert "manage in the web app" copy in
    Settings/Account/Tools, none in the auth path. `resolvePlatformInitialLocation` only reads the
    URL fragment when `kIsWeb`; native always falls back to `/sign-in`. Ran
    `flutter analyze lib/features/auth/` (clean) and `flutter test` (**116/116**, incl.
    `widget_test.dart: PurpleApp renders sign-in shell`). Rendered the real compiled screen via
    `./scripts/flutter-web-serve.sh` (idle port 8765, started + verified with a browser
    screenshot) — matches the intended design, not the reported web copy.
  - **Found the actual root cause via ASC API** (`purple-life`/`prd` key, `scripts/lib/asc-jwt.mjs`):
    `GET /v1/apps/6787298041/betaGroups` → external group **"Founding Team"**
    (`8ad416f5-8248-48e6-9951-03af3f932b6c`). `GET .../betaGroups/{id}/builds` → that group had
    builds **1, 13, 18** assigned, with build **1** (`87155be5-…`, uploaded 2026-07-03, i.e.
    **before** the 7/4 Capacitor→Flutter cutover) still `expired=false`. Capacitor's
    `capacitor.config.ts` loads **live** `https://www.purplelife.org` at runtime (confirmed by
    the "Capacitor shell loads production" note in `AGENTS.md`), and `src/routes/sign-in.tsx`
    contains "Welcome back!" / "Login Now" / "Create a new account now" verbatim — an exact match
    for the tester's report. Separately, current build **1.0 (19)**
    (`860f85fe-4072-4b51-b7fd-bb0a12366b08`) had **never been submitted to the external group**
    (`externalBuildState=READY_FOR_BETA_SUBMISSION`); external testers' newest available build was
    still **18**.
  - **Remediated (App Store Connect API, no manual dashboard clicks):**
    1. `PATCH /v1/builds/87155be5-…` `{expired:true}` → `200`. Forces any tester still on the
       Capacitor install to update on next TestFlight open instead of silently reopening it.
    2. `POST /v1/betaGroups/8ad416f5-…/relationships/builds` adding build 19 → `204`.
    3. `POST /v1/betaAppReviewSubmissions` for build 19 → `201`,
       `betaReviewState: WAITING_FOR_REVIEW` (Apple-side gate required before the external group
       actually receives a build). **Re-polled `bun run ios:check-asc-builds` ~2 minutes later:
       build 19 now shows `external=IN_BETA_TESTING`** — review cleared fast (expedited re-review
       since the group already had a prior approved build). Fix is fully live on the ASC side.
  - **Docs:** OPEN-ISSUES `tf-login-wrong-surface` marked resolved with full evidence trail
    (superseding the "Raised" entry from the 01:45 triage); this log entry; Current snapshot
    refreshed.
- **Issues / NOT done:**
  - Beta App Review cleared (confirmed `external=IN_BETA_TESTING`), but **cannot force the
    reporting tester's device to update** — they must open TestFlight and update (ideally
    delete-and-reinstall to guarantee the old Capacitor binary is discarded) rather than relaunch
    the existing home-screen icon.
  - `flutter-auth-screen-parity` (raw `e.toString()` Supabase errors, no forgot-password, no
    web-parity two-panel glass layout) remains **open** and separate — a real Flutter UX gap for
    testers already on genuine Flutter builds, intentionally untouched here since the reported bug
    was the wrong-surface issue, not sign-in polish.
- **Stand / next:** **No Flutter/app code changed. No TF20 needed for this fix** — it was a
  TestFlight distribution/beta-group gap, not a build defect. Next: poll
  `bun run ios:check-asc-builds` for build 19 `external=IN_BETA_TESTING`, then have the reporting
  tester delete + reinstall Purple from TestFlight and re-verify the "Purple" / "Sign in" screen.
  `flutter-auth-screen-parity` queued as separate follow-up work.
- **Who / where:** Cursor (subagent, TestFlight-distribution fix) · darwin ·
  `lovable/redesign@59caa42` (no git commits this session; ASC-only changes).
- **Timestamp:** 2026-07-06T01:55:00Z

### 2026-07-06T01:50:00Z — TF19 tester issues audit

- **Done:** ASC 15 submissions; build **1.0 (19) VALID**; Luciq 0 crashes on `flutter-purple`/`purple`.
  Confirmed open: `tf-settings-shell-nav`, `tf-heading-typography`, `tf-bottom-whitespace`,
  `care-accept-server-route` (undeployed). New: `flutter-auth-screen-parity` (raw auth errors).
- **Stand / next:** Deploy care Worker routes; fix Flutter sign-in UX; owner decision on left burger;
  TF20 for design + auth fixes after verify.
- **Who / where:** [TF19 audit agent](c412a736-7e53-463d-9b7a-e2ea4394391f) · `lovable/redesign@59caa42`
- **Timestamp:** 2026-07-06T01:50:00Z

### 2026-07-06T01:45:00Z — TF19 login screenshot triage (auth routing audit)

- **Report:** Login page shows web "Welcome back!" / "Login Now" — wrong for Flutter TF19.
- **Finding:** Strings are **TanStack web only** (`src/routes/sign-in.tsx`). TF19 builds Flutter
  Runner via `flutter-ios-testflight.sh`. No Flutter routing bug found. Likely **Capacitor/stale
  install** (build ≤9 loads prod web) or tester not on build 19.
- **ASC (new):** 2026-07-06 "Unable to login", "Error is wrong" from a@arora.net (15 submissions total).
- **Stand / next:** Tester delete + reinstall **1.0 (19)**; verify "Purple App" + "Sign in" headline;
  if still web UI on build 19, escalate (would contradict codebase). Login-fix agent in flight.
- **Who / where:** Cursor coordinator + [auth routing agent](72657b3f-5f2c-4021-b8eb-4456ba83619e)
- **Timestamp:** 2026-07-06T01:45:00Z

### 2026-07-05T20:45:00Z — TF19 ship + Cursor handoff (waves 1+2 fleet)

- **Requested:** After the fleet completed + gates passed, commit everything, push live, build/upload TestFlight, and write a proper handoff — operator is moving next steps to Cursor.
- **Done:**
  - **Integrated 11 branches** onto `wave2-base` then fast-forwarded `lovable/redesign`: `wave1-{meds,vitals,nav-timeline,care-reports}` (Wave 1) + `wave2-{foundation,biometrics,reports,insights,askpurple,carechat,caredash,careapi,docs,settings,reviewfix}` (Wave 2). Each landed with `flutter analyze lib/` + `flutter test` gate; final combined gate **analyze clean + 116/116**.
  - **Bumped** `flutter/pubspec.yaml` → **1.0.0+19** (`4d84721`).
  - **Pushed** `origin/lovable/redesign` `4f69041..4d84721` (32 commits; no divergence).
  - **Built + uploaded TF19:** `doppler run --project purple-life --config prd -- bun run ios:testflight` → `** EXPORT SUCCEEDED **`, `Upload succeeded`, `Uploaded Runner`. ASC processing at upload time (build 19 not yet listed; 18 latest VALID).
  - **Feature scope shipped:** meds edit-data-loss fix + history tokens; vitals VO₂/elevated-band regressions + My Health conditions/DNA cards; **biometrics** 18-metric hub (range/compare, ±1σ baseline, per-source, pins); **reports** fl_chart trends + detail depth (signed-URL view/share, delete, panel grouping, processing-poll) + documents filters; **insights** vitals tiles/records counts/seizure heatmap/trends; **ask-purple** action cards + markdown/citations + 10/day limit + save-to-journal; **care-chat** realtime + thread mgmt (new/group/mute/leave); **care-dashboard** biometrics depth + honest gap-states + `/care/:ownerId/reports/:reportId` route; **nav** Meds→Insights + timeline dose actions + inbox badge; **settings** OAuth deep-link fix (`FlutterDeepLinkingEnabled=false`), welcome rewrite + conditions, 2FA (`supabase.auth.mfa`), export enrichment, `/settings/terms` + privacy cards, sharing partial; **web** new `src/routes/api/care/{accept,decline}.ts` + `src/lib/care.server.ts` (tsc + build pass).
  - **Review:** independent Wave-1 audit ran; its 1 BLOCKER (timeline dose actions not flushing before refetch) + 2 should-fixes were fixed in `wave2-reviewfix` and verified (116/116).
  - **Decisions:** ship Ask-Purple 10/day limit **as-is for all native users** (no Pro flag yet); push + TF now (operator-approved). Native pickers deferred to Wave 3.
- **Issues / NOT done (handed to Cursor):**
  - **DEPLOY care-API Worker routes.** `/api/care/accept`+`/api/care/decline` are written + build-verified but **NOT deployed** to web prod. Until deployed, the Flutter `acceptInvite` POST 404s.
  - **Caregiver invite-accept not functional end-to-end** even after deploy: the in-app `IncomingCareInvitesCard` is **dead code** (client RLS SELECT on `care_relationships` returns 0 rows for the invitee; web uses service-role `listIncomingCareInvites`). Needs a server-listed source before the Accept button surfaces. Also `decline` still does an RLS-blocked silent 0-row update client-side until rewired to `/api/care/decline`.
  - **Caregiver dashboard tabs** (Meds/Journal/Seizures/Reports/Today/Hydration/Chat) render honest gap-states — need Worker routes fronting `caregiverRead*` server fns (full list in OPEN-ISSUES `care-accept-server-route`, with `care.functions.ts` line refs + the `phi_access_log` requirement for `caregiverReadReport`).
  - **AI features web-only:** insights "noticing"/pattern cards, reports AI-explain (`getDailyInsightCards`, `computeUserPatterns`, `summarizeReport`, `getMetricInsight`, `getVitalsSnapshot`) — no Flutter endpoint; gap-stated, not faked.
  - **Wave-3 native pickers:** reports upload + care-chat attachments are non-functional on device (no `image_picker`/`file_picker`; send-attachment stubbed, receive/render done).
  - **On-device verification NOT done** (no simulator here): TF19 checklist — (a) OAuth Connect deep-link after the `FlutterDeepLinkingEnabled=false` change; (b) fl_chart rendering (biometrics/reports/insights); (c) biometrics pin write to `profiles.biometrics_pinned` (column confirmed present in types); (d) report **delete** under RLS (`report_documents` DELETE + `storage.reports.remove` + `phi_access_log` INSERT); (e) dose-action sync flush; (f) 2FA enroll/verify.
  - **`main` NOT updated** — fleet is only on `lovable/redesign`; web-prod Cloudflare deploy is a separate owner-gated step.
  - Residual `fontFamily:'Georgia'` in `apple_health_panel.dart` + `wearable_oauth_callback_screen.dart` (non-blocking).
- **Stand / next (Cursor):** ① poll `bun run ios:check-asc-builds` for **1.0 (19) VALID**, tester install; ② deploy `/api/care/*` routes (+ Flutter `decline` rewire) then re-source the invites card; ③ expose caregiver-dashboard + AI Worker routes per OPEN-ISSUES; ④ Wave-3 native pickers; ⑤ run the on-device checklist; ⑥ decide `main` merge + web-prod deploy.
- **Who / where:** Claude Code (orchestrated fleet: 5 audits + 4 Wave-1 writers + 6 Wave-2 writers + foundation + careapi + docs + reviewfix + settings + independent review) · darwin · `lovable/redesign@4d84721` (pushed).
- **Timestamp:** 2026-07-05T20:45:00Z

### 2026-07-05T00:00:00Z — Wave-2 reports depth (trend charts, detail actions, documents filters)

- **Requested:** Wave-2 Reports build, client-doable only, edit ONLY `flutter/lib/features/reports/`. (P0) fl_chart trend charts + per-metric sparklines; (P0/P1) report-detail depth (panel-grouped metrics, processing-poll, status pill, signed-URL View/Download/Share, delete); (P1) documents client-side search+filters; wire AI explain/metric-insight only if a callable endpoint exists else honest web-only state. Defer native file upload (no picker deps). Branch `wave2-reports`, worktree off Wave-1+foundation (fl_chart present).
- **Done:**
  - **Trend charts (P0):** new `widgets/trend_chart.dart` — fl_chart `MetricLineChart` (curved line + `HorizontalRangeAnnotation` shaded reference band, out-of-range dots colored via `danger`/`warning` tokens) and `MetricSparkline`. Rendered line+band on `reports_trend_screen.dart` (readings list now shows source report title via joined `report_documents(title)`), sparklines per row on `reports_metrics_screen.dart`. Removed both "charts on web" footers. Added `loadAllMetricSeries` + `allMetricSeriesProvider` (single grouped query feeding grid sparklines).
  - **Report detail (P0/P1):** rewrote `reports_detail_screen.dart` as `ConsumerStatefulWidget`. Panel-grouped metrics (`metric_dictionary.panel` join in repo `_attachPanels`; `ReportDetailData.metricsByPanel`, "other" last). Colored status pill. **Processing poll:** `Timer.periodic` 3s invalidating `reportDetailProvider` while `status==processing`, cancels on ready/failed/dispose. Action bar (44pt): **View file** → `getReportFileUrl` (Supabase `createSignedUrl(path,300)`) opened with `launchUrl(externalApplication)` (native browser, no in-app iframe); **Share link** → copies signed link to clipboard (no `share_plus` dep in app); **Delete** → confirm dialog → `deleteReport` (storage.remove + row delete + `phi_access_log`), invalidates hub/tracked providers, routes back; if RLS blocks, throws → honest "remove from web app" snackbar (no fake success). Failed state now shows `error_message`.
  - **AI explain (server-gap, honest):** `summarizeReport`/`getMetricInsight` are server AI fns (`callAIForUser` + credits) with **no Flutter-callable endpoint** — NOT wired. Detail screen shows the cached `report_documents.ai_summary` when the web app has generated one, else an honest "generated on the web app" card. No fabricated summaries.
  - **Documents (P1):** `reports_documents_screen.dart` → stateful client-side search + single-select category/type/year/status filter chips over the already-loaded `reportsHubProvider` list (chips auto-hidden when <2 options), clear-filters, filtered count header. Bulk-zip + reprocess left deferred and flagged in-copy.
  - **Model/repo:** `report_row.dart` — added `aiSummary`/`errorMessage` to `ReportDocumentRow`; `panel`/`reportTitle`+`copyWith` to `ReportMetricRow` (join-aware `fromMap`); `metricsByPanel`; `ReportFileRef`. `reports_repository.dart` — extended doc selects with `ai_summary,error_message`; `loadMetricSeries` joins `report_documents(title)`; added `getReportFileUrl`, `deleteReport`, `loadAllMetricSeries`, `_attachPanels`. **`loadHub` + all existing method signatures unchanged** (insights still reads `reportsHubProvider`); everything additive.
  - **Tests:** new `test/reports_detail_model_test.dart` (5 tests: join parse, copyWith, metricsByPanel grouping, ai_summary/error_message columns).
- **Issues / server-gaps flagged (honest, not faked):**
  - **AI explain report + per-metric AI insight = server-gap.** `summarizeReport`/`getMetricInsight`/`getDailyInsightCards`/`getMetricTrend` insight run server-side AI (provider + credits); no Worker/RPC/Edge endpoint is exposed to Flutter. Rendered read-only (cached `ai_summary`) or web-only state. Needs an Edge Function/Worker route to enable in-app generation. (Same class as Wave-1 care-accept server-route gap.)
  - **Delete RLS unverified on-device.** `deleteReport` mirrors the web fn but the web `deleteReport` runs as a `createServerFn` — if `report_documents` DELETE / `storage.reports.remove` is not permitted to the auth'd user under RLS, the client delete throws and the UI shows a clear "remove from web app" message rather than silently failing. Verify the DELETE RLS policy (and `phi_access_log` INSERT policy for user==actor) on-device before relying on it.
  - **`metric_dictionary` read assumed RLS-readable** (used only for panel labels); `_attachPanels` is best-effort and returns ungrouped metrics on any failure, so grouping degrades gracefully.
  - Share uses clipboard, not an OS share sheet (no `share_plus`; adding deps was out of scope). Native upload picker deferred to Wave 3 as instructed (upload path untouched).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **96/96** (91 baseline + 5 new). Committed `wave2-reports` @ `b63a131`, **not pushed**. **Next:** on-device verify signed-URL View + Delete RLS; expose an AI-explain endpoint (Edge Fn/Worker) if in-app generation is wanted; Wave-3 native file picker.
- **Who / where:** Claude Code (Wave-2 reports writer) · darwin · wave2-reports@b63a131
### 2026-07-05T00:00:00Z — Wave-2 Ask-Purple parity (action cards, markdown/citations, daily limit, follow-ups, save-to-journal)

- **Requested:** Ask-Purple (AI chat) web→Flutter parity per `wave2-specs/chat.md §1`: (P0) tool-action confirm cards + direct-Supabase executor for 5 kinds; (P0) markdown + `[Source: … ](url)` citation pills; (P1) free-tier 10/day limit; (P1) follow-up chips + Save-to-journal. Branch `wave2-askpurple`, worktree only. Scope: `flutter/lib/features/chat/ask_purple_screen.dart`, `chat_repository.dart`, `chat_copy.dart` (+ new files under `features/chat/`). Did NOT touch `care_chat_*`.
- **Done:**
  - **`chat_repository.dart`:** `sendAskPurple` now yields `AskPurpleChunk{text, proposals}` — parses `tool-proposeAction` parts (`input`/`args` → `{kind, summary, params}`) in addition to `text-delta`/`error`. Added `ProposalKind` enum (5 kinds + labels), `Proposal` model (with `displayParams` filter dropping null/""/empty-array), `ActionResult`. Added `executeAction(Proposal)` — Dart port of server `executePurpleAction`, direct RLS-scoped Supabase writes replicating tables/payloads exactly (`medications` insert w/ `is_rescue`/`active`; `seizure_events` insert w/ `detection_source:'ai_chat'`; `journal_entries` insert `status:'processing'`; `medication_doses` update-by-scheduled_at else insert; `medications` archive update `active:false`+`end_date` YYYY-MM-DD; validation errors name/text/medication_id required). Added `saveAnswerToJournal` (insert `journal_entries` `status:'complete'`, `ai_tags:['ask-purple']`, exact `**Q:**/**Purple:**` body). Provider now injects `supabaseClientProvider`.
  - **New `action_confirm_card.dart`:** `ProposalStatus` enum + `ActionConfirmCard` (kind label, summary, filtered param list, Confirm/Cancel, pending/confirmed→Done/cancelled/failed states), dark-glass via `GlassSurface`, `colorScheme.primary`/`.error`, 44pt targets.
  - **New `citation_text.dart`:** `CitationText` renders assistant markdown via `flutter_markdown` `MarkdownBody`, splits `[Source: …](url)` regex into tappable (primary-tinted) / muted pills, opens links via `url_launcher`. User bubbles stay plain `Text`.
  - **New `ask_limit.dart`:** `AskLimit` — SharedPreferences key `purple-ask-message-stamps`, JSON epoch-ms array, 24h window, `freeDailyLimit=10`, `usedToday()`/`pushStamp()`.
  - **`condition_prompts.dart`:** added `getFollowUps(conditions, lastUserMessage)` (topical keyword hints + starters, dedup, cap 3) mirroring web.
  - **`ask_purple_screen.dart`:** rewired transcript to carry per-turn proposals/statuses; renders action cards, follow-up chips under last idle proposal-less assistant turn, Save-to-journal button per idle assistant turn; markdown/citation bubbles; daily-limit block (snackbar over limit) + `_LimitGate` composer replacement + "N left" hint at ≤3; preserved offline guard, SafeArea, streaming.
  - **`chat_copy.dart`:** added action/journal/limit copy strings.
  - **Tests:** added 5 unit tests in `test/chat_routes_test.dart` (follow-up topical/fallback/dedup; proposal kind mapping; displayParams filter).
- **Issues / SERVER-GAPS flagged:**
  - **No native Pro entitlement flag exists in Flutter** (account screen defers subscription to web). Web gates the limit on `useIsPro()`; there is no equivalent client flag, so the **10/day free limit applies to ALL native users** and the over-limit `_LimitGate` is an upsell pointing to purplelife.org rather than a real ProGate. If Pro users must get unlimited on native, a Pro/entitlement flag (or `/api` check) needs to be exposed to the client — flagged, not faked.
  - **Action executor writes go directly to Supabase under RLS** (per spec, matching the pattern) — no worker route. Assumes the same user INSERT/UPDATE RLS policies the web user-scoped client relies on are in place for `medications`, `seizure_events`, `journal_entries`, `medication_doses`. If any table lacks a user policy, that kind's Confirm surfaces the Supabase error on the card (fail state), not a silent no-op.
  - `mark_dose_taken` update-by-`scheduled_at` cannot report 0-row matches as an error; mirrors web (web also returns ok on 0 rows).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **clean (No issues found!)**; `flutter test` **96/96** (91 prior + 5 new). Committed on `wave2-askpurple` (NOT pushed). **Next:** parent lands slice + runs gate; web/product decides on native Pro flag for unlimited.
- **Who / where:** Claude Code (Wave-2 Ask-Purple writer) · darwin · wave2-askpurple
### 2026-07-05T00:00:00Z — Wave-2 Care-chat parity (realtime, thread mgmt, rendering polish)

- **Requested:** Bring Flutter Care chat to web parity. P0 realtime inbound + 15s thread-list poll; P0 thread management (New-chat picker, group list/create, mute/leave menu); P1 rendering polish (day separators, "Message deleted" tombstone, group sender names). Defer attachment *sending* to Wave 3. Branch `wave2-carechat`, worktree off wave2 base. Strict scope: `flutter/lib/features/chat/care_chat_*` only.
- **Done:**
  - **Realtime (P0):** `CareChatRepository.subscribeThread(threadId, onInsert)` opens Supabase channel `care-thread-<id>` with `onPostgresChanges(insert, public.care_messages, filter thread_id=eq.<id>)`; `removeChannel` teardown helper. `_ConversationPanel` subscribes in `initState`, tears down + re-subscribes in `didUpdateWidget` on thread change, and disposes in `dispose`. Inbound inserts merge into a local `_liveById` map (dedup by id), auto-mark-read + refresh threads when from another sender, and scroll to bottom. Own sent message is merged locally to avoid an echo race.
  - **Thread-list poll (P0):** `ChatCareScreen` is now `ConsumerStatefulWidget` with a 15s `Timer.periodic` that invalidates `careThreadsProvider`.
  - **Thread management (P0):** new repo methods `listContacts` (both relationship directions for New-chat), `listMyCaregivers` (group picker), `listGroupThreads`, `createGroupThread`, `setThreadMute`, `leaveThread` — payloads/tables/validation exactly per web `care-chat.functions.ts` (mute clears `muted_until:null`; owner-cannot-leave error string matched). New providers `careContactsProvider`/`careMyCaregiversProvider`/`careGroupThreadsProvider`. New file `care_chat_pickers.dart`: dark-glass bottom-sheet **New-chat** picker (wires existing `getOrCreateDirectThread`) and **Group** picker (list existing / create with title + caregiver checkboxes). Header buttons "New" + "Group" replace the old single "Sharing" button (empty-state "Go to Sharing" retained). Per-thread `PopupMenuButton`: Mute/Unmute (all), Leave (non-owner only, confirm dialog); muted threads show a bell-off indicator.
  - **Rendering polish (P1):** `CareMessage` extended with `attachments` (List<CareAttachment>) + `deletedAt`; `getMessages` now selects `attachments`, keeps tombstones (no longer silently filters deleted), and supports `before` pagination (limit capped ≤200). Bubbles now render per-day separators (Today/Yesterday/Mon D, YYYY), "Message deleted" italic tombstone, sender-name label above others' bubbles in group threads, and received attachments.
  - **Attachments (view-only):** new file `care_attachment_view.dart` renders stored attachments via `createSignedUrl(path, 300)` (image thumbnail / file row with MB label, opens via url_launcher). `sendMessage` now accepts `List<CareAttachment>` and inserts real attachment JSON. **Sending/adding** attachments is deferred: explicit `// TODO(wave3): attachments` at the composer paperclip spot; no image_picker/file_picker added.
- **Issues / server-gaps flagged:**
  - **Native push on send is NOT implemented (backend/Wave-3).** Web `sendCareMessage` sends web-push to non-muted recipients; native equivalent is server/edge-triggered (FCM/APNs). Left a `TODO(wave3)` in `sendMessage`; do not send push from client. Muted-recipient filtering must live wherever native push is generated.
  - **Attachment *sending* deferred** (needs native picker) — receive/render path is complete and live.
  - Realtime depends on Supabase Realtime being enabled for `public.care_messages` on the project; if the channel never receives, inbound still arrives via the 15s poll + on-send refetch (graceful degrade). Malformed realtime payloads are swallowed.
- **Risks:** Subscription lifecycle is the main risk — handled: single channel per active thread, torn down on thread switch and dispose (no leak, no double-subscribe). `_liveById` is cleared on thread change so live messages don't bleed across threads.
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **91/91**. Committed on `wave2-carechat` (NOT pushed). **Next:** Wave-3 native attachment picker + server/edge push trigger; then device QA of live inbound.
- **Who / where:** Claude Code (Wave-2 care-chat writer) · darwin · wave2-carechat
### 2026-07-05T00:00:00Z — Wave-2 care dashboard depth + honest gap states + report route

- **Requested:** Wave-2 Care dashboard slice (Flutter-only, branch `wave2-caredash`, worktree off Wave-1+foundation). Deepen client-reachable tabs, replace vague "coming soon" with honest gap states for backend-blocked caregiver reads, add `/care/:ownerId/reports/:reportId` route + a CareReport screen. Strict scope: only `care_dashboard_screen.dart`, a NEW care report screen, `shell/router.dart`, `shell/routes.dart`. Accuracy over coverage; no fabricated data, no RLS bypass.
- **Done:**
  - **Biometrics tab (genuinely client-reachable):** rewrote `_BiometricsPlaceholder` → `_BiometricsTab` + `_BiometricMetricCard`. Renders one labeled card per wearable metric actually selected by `CareRepository.loadOwnerBiometrics` (readiness, sleep_score, activity, hrv_rmssd_ms, resting_hr_bpm, steps) with latest value + date + 30-day range, replacing eight identical readiness tiles. Preserves scope-gating (`scopeGranted`), cached-state banner, empty/error states. No repo changes (`care_repository.dart` untouched, per scope).
  - **Backend-blocked tabs (honest gap):** replaced generic `_ComingSoonPanel` with `_CaregiverAccessGate` (polished glass EmptyState) for Today, Meds, Journal, Seizures, Reports, Hydration, Chat. No-scope variant reused for biometrics-without-scope.
  - **New route + screen:** `care_report_screen.dart` (`CareReportScreen`) renders the honest gap state (dark-glass, EmptyState, 44pt back button). Registered `/care/:ownerId/reports/:reportId` as a child of `care-dashboard` GoRoute (name `care-report`); added `careOwnerReport` const + `careReport(ownerId, reportId)` helper to `routes.dart`. `/care` already a protected prefix so auth-gating is covered.
  - Made the caregiver "add biometric" toolbar button honest (was a dev-stub snackbar).
- **Issues / SERVER GAPS (routes needed, all currently server fns in `src/lib/care.functions.ts`, `supabaseAdmin` + `assertScope`, not Flutter-callable):** `caregiverReadToday` (1356) → Today; `caregiverReadMeds` (1233) + `caregiverMarkDose` (1414) → Meds; `caregiverReadJournal` (1274) + `proposeChange` (978) → Journal; `caregiverReadSeizures` (1289) + `caregiverLogSeizure` (1469) → Seizures; `caregiverReadReports` (1303) → Reports tab; `caregiverReadReport` (1323, must preserve `phi_access_log action:caregiver_view`) → CareReport screen; `listHydrationForDay`/`listAurasForDay` (scoped by ownerId) → Hydration; `getOrCreateDirectThread` (care-chat.functions.ts) → Chat; caregiver `addBiometric` write → toolbar. Recommend exposing each as a Worker route (Bearer session) mirroring `POST /api/care/accept`, preserving `assertScope`/`has_care_scope` + audit writes. Also NOT ported this slice: owner feature-gate on `scopedTabs` (`TAB_OWNER_FEATURE`), `CaregiverAlertsCard`, activity counts/unread badges (`getOwnerActivityCounts`/`markOwnerSeen`).
- **Stand / next:** `flutter analyze lib/` clean, `flutter test` 91/91. Committed `wave2-caredash` @ `1d7c5a1`, NOT pushed. Next: parent lands slice + runs gate; backend exposes caregiver server fns as Worker routes to wire the gap-stated tabs.
- **Who / where:** Claude (Opus 4.8), Flutter feature writer. Worktree `wt-caredash`, branch `wave2-caredash`.
- **Timestamp:** 2026-07-05T00:00:00Z
### 2026-07-05T23:00:00Z — Orchestrated fix fleet: Wave 1 landed + Wave 2 foundation + Wave 2 in flight

- **Requested:** Run an orchestrated multi-agent fix fleet on the Flutter app (branch `lovable/redesign`, base `4f69041`): close audit-found P0/P1 gaps (meds data-loss, care accept loop, My Health depth, nav parity, token cleanup), then build out Wave-2 depth (insights, care dashboard, charts/markdown foundation). Local only; no push; TF19 after landing.
- **Done:**
  - **Wave 1 (landed locally; gates `flutter analyze lib/` clean + `flutter test` 91/91 after each land):**
    - Meds **edit data-loss fixed**: form now hydrates the full medication row and partial update preserves unedited columns.
    - Meds history status colors **tokenized** + copy aligned with web.
    - VO2max unit suffix gated on non-null value; elevated risk band chip restored to the **warning** token.
    - My Health: **"Your conditions" grid** + **DNA insights card** added (non-navigating; target routes still missing).
    - Bottom nav 3rd tab switched **Meds → Insights** (web parity); Meds added to the menu sheet.
    - Timeline dose actions: **I took it / Skip / Undo** pills.
    - Care invite **Accept wired client-side**: POST `/api/care/accept`, in-app `/care/accept?token=` route + `CareAcceptScreen`; top-bar **pending-inbox badge**.
    - Token cleanup in reports/care: `0xFFFF8A80`→`danger`, `0xFFF3D58B`→`warning`, `0xFF1A1224`→`backgroundTertiary`.
  - **Wave 2 foundation (landed):** `fl_chart 0.69.2` + `flutter_markdown 0.7.7+1` (pure Dart, no native pods); new `flutter/lib/features/seizures/seizure_repository.dart` (`SeizureEvent`, `loadRecent`, `recentSeizuresProvider`).
  - **Wave 2 in flight (feature branches, gates green so far, NOT merged):**
    - `wave2-insights` @ `da858ae` — vitals tiles, records category counts, 90-day seizure heatmap + list, fl_chart trends; AI noticing/pattern cards honestly gap-stated as server-only.
    - `wave2-caredash` @ `1d7c5a1` — biometrics tab with real per-metric cards; other tabs honest gap-states; new `/care/:ownerId/reports/:reportId` route + `CareReport` gap-state screen.
    - askpurple / carechat / biometrics / reports writers **still running** at time of writing.
  - **Docs (this entry):** OPEN-ISSUES `care-accept-server-route` extended with the full Worker-route backlog; stale rows corrected in `FLUTTER-CUTOVER-GAP-MATRIX.md` (`/insights`, `/timeline` are registered, not Missing) and resolved items marked in `FLUTTER-DESIGN-PARITY-CHECKLIST.md` (§0 serif, §3 meds).
- **Issues:**
  - **All caregiver mutations and dashboard reads blocked server-side**: accept/decline plus every caregiver read (today, meds, journal, seizures, reports, hydration, chat thread) needs Worker routes fronting `src/lib/care.functions.ts` server fns; insights/reports AI cards also server-only. Full grouped backlog in OPEN-ISSUES `care-accept-server-route`. Flutter UI is wired and fails with clear errors, not silent no-ops.
  - Wave-2 writer branches not yet merged; each must land serially with gates before push. Nothing pushed; **TF19 pending**.
  - My Health conditions grid + DNA card are non-navigating (`/condition/$slug`, `/my-health-dna` routes still missing).
  - Residual `fontFamily: 'Georgia'` in `apple_health_panel.dart` and `wearable_oauth_callback_screen.dart` (out of Wave-1 scope; core screens all on `PurpleType.serif`).
- **Stand / next:** Wave 1 + Wave 2 foundation merged locally on the integration line; Wave 2 partially landed on branches. **Next:** finish remaining writers, land serially with gate-per-land, push `lovable/redesign`, web team adds Worker routes, then TF19.
- **Who / where:** Claude Code orchestrated fleet · darwin · lovable/redesign (local worktrees off base `4f69041`; wave branches `wave1-*`, `wave2-*`)
- **Timestamp:** 2026-07-05T23:00:00Z
### 2026-07-05T00:00:00Z — Wave-2 settings parity (6 audited fixes)

- **Requested:** 6 web→Flutter parity fixes on branch `wave2-settings`, scoped to `features/settings|account|tools`, `auth/welcome_screen.dart`, `shell/routes.dart`+`router.dart` (terms route only), and one Info.plist key.
- **Done:**
  1. **[P0] Wearable OAuth callback delivery.** Added `FlutterDeepLinkingEnabled=false` to `flutter/ios/Runner/Info.plist` (syntax verified against app_links 7.2.0 example plist in pub cache) so Flutter's engine deep-linking no longer steals the `org.purplelife.app://oauth-*-callback` from app_links' `uriLinkStream`. The `nativeConnectSetupHint` was ALREADY surfaced pre-connect in the Tools `_ConnectionCard` (shown when disconnected+loaded, before failure) — no change needed there; verified in `tools_screen.dart`.
  2. **[P1] Welcome screen.** Rewrote `welcome_screen.dart`: removed the dev copy ("keeps Flutter preview routing aligned with production"); ported web step-0 (first + last name, conditions picker writing `profiles.conditions`) using the read-only `condition_catalog.dart` catalog (grouped chips, max 12, prefill from existing profile). Invite-code redemption + generateCareProfile left as explicit TODO (Worker-blocked), no dead UI.
  3. **[P1] 2FA.** Replaced the "set up in the web app" stub in `account_screen.dart` with a real `_TwoFactorSection` using `supabase.auth.mfa` (enroll TOTP → challenge → verify → unenroll/disable), mirroring web `two-factor-section.tsx`. On-device it shows the TOTP secret + an "Open authenticator app" `otpauth://` deep link instead of a QR image (no second camera to scan on the phone itself); secret never logged. Removed the old `_loadTwoFactor`/`_twoFactorSection` and their state fields.
  4. **[P1] Data export enrichment.** `data_export_service.dart` per-entry journal markdown now includes `ai_tags`, kind/status line, `voice_transcript`, `ai_summary`, and `media_urls` links, matching web `data-export.ts`.
  5. **[P1] Terms + privacy cards.** New `features/settings/terms_screen.dart` (ports web `settings.terms.tsx`), `settingsTerms='/settings/terms'` const + protectedPaths entry in `routes.dart`, GoRoute in `router.dart`. Tools "Wear and care" terms row now points at `/settings/terms` (was substituting an About web-only snackbar; removed the now-unused `_showWebOnly`). Added the 3 missing privacy cards to `privacy_screen.dart`: "Where it's stored", "What we'll never do", "Children" (+ signed-links line on "Who can see" and backups line on "Export and delete").
  6. **[P1] Sharing screen partial.** `sharing_screen.dart` now wires DB-direct reads: pending-approval count via existing `carePendingCountProvider` (owner RLS SELECT, shown as a tappable strip → `/care/inbox`) and a new `archivedCaregiversProvider` (direct `care_relationships` SELECT where `archived_at IS NOT NULL`, owner RLS, collapsible "Show archived (N)"). Invite / scope editing / archive-unarchive-delete mutations kept web-only with explicit "blocked on Worker routes (care.functions.ts)" copy. No caregiver mutations invented.
- **Exact Info.plist key added:** `<key>FlutterDeepLinkingEnabled</key><false/>` (with a comment explaining app_links owns the OAuth deep link).
- **Gaps flagged / blocked (not faked):**
  - Welcome invite-code redemption + care-profile generation: no Worker `/api` route for `invite-codes.functions.ts` / `care-profile.functions.ts`; left as TODO, no placeholder UI.
  - Sharing caregiver mutations (invite/edit scope/archive/unarchive/delete): all web-side `care.functions.ts` server fns, no Worker route; kept web-only with explicit copy. Reads only in-app.
  - 2FA on-device uses secret + `otpauth://` deep link rather than a scannable QR (deliberate: enrolling on the same phone can't self-scan).
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **No issues found!**; `flutter test` **91/91**. Committed on `wave2-settings` (NOT pushed). Next: web team adds the Worker routes above to unblock welcome invite/care-profile and sharing mutations.
- **Who / where:** Claude Code (Wave-2 settings writer) · darwin · wave2-settings
- **Timestamp:** 2026-07-05T00:00:00Z

### 2026-07-05T00:00:00Z — Wave-1 care/reports fixes (accept loop, inbox badge, tokens)

- **Requested:** (P0) fix broken caregiver-invite accept loop; (P0) add missing top-bar inbox badge; (P1) token color cleanup in reports+care. Flutter-only, branch `wave1-care-reports`, worktree off `lovable/redesign`.
- **Done:**
  - **Accept loop:** added `inviteToken` to `IncomingCareInvite` + populated it in `care_repository.dart` `_loadIncomingCareInvites` (now selects `invite_token`). Implemented `CareRepository.acceptInvite(token)` mirroring web `acceptInvite` contract shape (authenticated `POST {invite_token}` to `${workerApiBaseUrl}/care/accept`, Bearer session token, WorkerClient conventions). Replaced dead-snackbar Accept button in `incoming_care_invites_card.dart` with a real accept (loading spinner, error snackbar, navigates to owner dashboard on success). Added new `CareAcceptScreen` (`features/care/care_accept_screen.dart`) and in-app GoRoute `/care/accept?token=` in `shell/router.dart` (+ `careAccept` const in `routes.dart`); signed-out users are redirected to sign-in with token preserved via existing `authRedirect` `from` mechanism (`/care` is already a protected prefix).
  - **Inbox badge:** added `CareRepository.pendingChangesCount()` + `carePendingCountProvider` (mirrors web `getPendingChangesCount`: `pending_changes` where `owner_id=me AND status='pending'`, readable under `pending_owner_all` RLS — no service role). Added `_PendingInboxBadge` widget in `shell/top_bar.dart` after the sync button, before profile menu, 44pt tap target, purple count pill, navigates to `/care/inbox`; hidden when count 0.
  - **Tokens:** `0xFFFF8A80`→ token `danger`, `0xFFF3D58B`→ token `warning` (via `parseTokenColor(PurpleTokens.loaded.colorsFor('dark').*)`) in reports_detail/trend/upload; modal surface `0xFF1A1224`→`PurpleColors.backgroundTertiary` (care_dashboard, ×2). Routed all inline `GoogleFonts.sourceSerif4()` in-scope through `PurpleType.serif` (reports_detail/trend/medical-history/report_tiles/reports_layout, care_index ×2, care_inbox ×2). Skipped web-only mint `#5CE0AC` per instructions.
- **Issues / RISK:**
  - **Accept + decline require a server route that does not yet exist.** RLS gives caregivers **SELECT-only** on `care_relationships` (`care_rel_caregiver_select`; no caregiver UPDATE policy — see migration `20260527094605...`). The web accept UPDATE runs with **service role** via a TanStack `createServerFn`, which is **not** exposed as a stable `/api/...` Worker route (no `src/routes/api/care/accept.ts`). Flutter's `acceptInvite` posts to `/api/care/accept` (matching the established mirror pattern) but that route must be added on the **web/Worker** side before accept works end-to-end; until then the call returns a clear error, not a silent no-op. **The pre-existing `declineIncomingCareInvite` direct `.update({'status':'revoked'})` is ALSO RLS-blocked today** (silent 0-row no-op) — same root cause; not fixed here (out of P0 scope, needs the same server route or a decline route). See OPEN-ISSUES `care-accept-server-route`.
  - Did NOT weaken RLS or invent a Supabase mutation. Did NOT edit `core/api/worker_client.dart` (out of scope); the authenticated POST lives inside `care_repository.dart` and duplicates WorkerClient's auth/URL conventions.
  - Touched `lib/shell/routes.dart` (one-line route const) in addition to router.dart/top_bar.dart — necessary to register the new route; did not touch bottom_nav/shell_menu_sheet/pubspec/ios.
- **Stand / next:** `flutter pub get` OK; `flutter analyze lib/` **clean**; `flutter test` **91/91**. Committed on `wave1-care-reports` (not pushed). **Next:** web team adds `POST /api/care/accept` (and ideally `/api/care/decline`) Worker route fronting the `acceptInvite` server fn, with Flutter CORS; then re-verify accept/decline end-to-end on device.
- **Who / where:** Claude Code (Wave-1 writer) · darwin · wave1-care-reports
- **Timestamp:** 2026-07-05T00:00:00Z

### 2026-07-05T16:02:00Z — Luciq MCP + Doppler integration

- **Requested:** Wire Luciq OAuth token from `servers-teamkeys/dev` for agent crash triage.
- **Done:** `scripts/luciq-sync-doppler-secrets.sh`, `scripts/install-luciq-mcp-cursor.sh`,
  `luciq:sync-secrets`, `luciq:install-mcp` in `package.json`; `luciq-fetch-reports.mjs`
  accepts `LUCIQ_OAUTH_TOKEN`, returns `status: mcp` when REST 401 (MCP token expected);
  synced `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` to `purple-life/prd`; installed Luciq MCP
  in `~/.cursor/mcp.json` (restart Cursor required).
- **Verified:** MCP HTTP `initialize` 200; `list_applications` shows **Flutter - Purple**
  (`slug=flutter-purple`, beta) and **Purple** iOS (`slug=purple`, beta); `list_crashes` returns
  **0 crashes** on both (matches ASC crash submissions API empty for Jul 4 feedback).
- **Issues:** Legacy dashboard REST still 401 with MCP OAuth token; use Luciq MCP for stacks.
  Jul 4 "App is crashing" screenshot feedback has no Luciq stack yet (SDK may not have fired or
  tester on pre-Luciq build).
- **Stand / next:** Restart Cursor for in-IDE Luciq MCP; retriage after TF18+ installs with SDK;
  re-run `ios:check-tf-feedback`.
- **Who / where:** Cursor agent · darwin · main
- **Timestamp:** 2026-07-05T16:02:00Z

### 2026-07-05T14:47:54Z — TestFlight 18 ship (merge wave)

- **Requested:** Sync `lovable/redesign` with `main`; bump **1.0.0+18**; analyze + test; `ios:testflight`; ASC checks; HANDOFF.
- **Done:** `lovable/redesign` already contained `origin/main` (`ef05394`); pushed **`3afdcbb`** (pubspec +18), **`68bf214`** (const analyze fixes). `flutter test` **91/91**. `doppler run --project purple-life --config prd -- bun run ios:testflight` **EXPORT + upload OK** (~4 min). `ios:check-asc-builds` / `ios:check-tf-feedback` run (10 beta screenshots; synced-data / sync UX themes).
- **Issues:** ASC list not yet showing build **18** (processing). TF17 still **VALID** / internal **IN_BETA_TESTING**. Duplicate `* 2.dart` files on disk can break analyze until deleted.
- **Stand / next:** Poll ASC for **1.0 (18) VALID**; tester install on internal group.
- **Who / where:** Cursor command subagent · darwin · lovable/redesign@68bf214
- **Timestamp:** 2026-07-05T14:47:54Z

### 2026-07-05T14:45:00Z — Staging prep: build + workers.dev smoke checklist

- **Requested:** Git pull `lovable/redesign`; `bun run build:prod:flutter-web`; document workers.dev smoke in `docs/FLUTTER-WEB-CUTOVER.md`; test merge locally; commit docs; push. No prod deploy.
- **Done:** **`bun run build:prod:flutter-web` PASS** (~122s; `dist/client/_flutter/` merged). `merge-flutter-web-assets.sh` re-run OK. `wrangler deploy --dry-run` OK (874 ASSETS). Added **Staging smoke (`workers.dev`)** section: prerequisites, `purplelife-staging` deploy (`--routes ""`, `--var FLUTTER_WEB_CUTOVER:true`), HTTP rows 1–10, signed-in rows 11–18, OAuth/API notes, prod promotion gate; updated deploy blockers.
- **Issues:** Staging Worker deploy not executed (per no-prod-deploy). `dist/` local only.
- **Stand / next:** Deploy `purplelife-staging`; execute checklist; owner approval before prod flag.
- **Who / where:** Cursor subagent · darwin · main@ef05394
- **Timestamp:** 2026-07-05T14:45:00Z

### 2026-07-05T14:42:00Z — Merge lovable/redesign → main (gates + push)

- **Requested:** Operator-approved merge `origin/lovable/redesign` into `main` with full quality gates; push `main`; no prod deploy.
- **Done:** Fast-forward `main` `311d466` → `7fd1bc2` (includes gate commit `fix(flutter): pass merge gates for insights, vitals, and chat`). Gates: `check:em-dash`, `check:live-data`, `check:unique-images`, `check:lovable-auth`, `tsc --noEmit`, Doppler `build:prod`, `flutter analyze lib/`, `flutter test` **91/91**. `git push origin main` **OK** (`311d466..7fd1bc2`).
- **Issues:** Local `docs/OPEN-ISSUES.md` edits unstaged; duplicate `lib/shell/top_bar 2.dart` triggers analyze info on some runs; `lovable/redesign` remote may trail `main` by 1 commit until pushed.
- **Stand / next:** `git push origin lovable/redesign` to align branches; prod deploy only with explicit approval.
- **Who / where:** Cursor merge subagent · darwin · main@7fd1bc2
- **Timestamp:** 2026-07-05T14:42:00Z.

### 2026-07-05T14:40:00Z — Flutter synced data visibility depth

- **Requested:** Close `tf-synced-data-visibility`: clearer all-synced-data UX on My Body and
  Tools (source breakdown, last sync per provider, link graph); scoped `my_health/`, `vitals/`,
  `tools/`; analyze + test; commit; push; update OPEN-ISSUES.
- **Done:** `synced_data_overview.dart`, `synced_data_panel.dart`, `loadSyncedDataOverview` +
  `syncedDataOverviewProvider` in `vitals_repository.dart`; wired into `my_health_screen.dart`,
  `vitals_screen.dart` (compact strip), `tools_screen.dart`; `synced_data_overview_test.dart`
  (4 tests pass); `docs/OPEN-ISSUES.md` marked partially improved.
- **Issues:** Biometrics hub screen depth and bottom-nav My Body label still open; full
  `flutter test` **87/88** (pre-existing `insights_timeline_routes_test.dart` compile error).
- **Stand / next:** TF17+ upload for tester re-check of synced-data panel on device.
- **Who / where:** Cursor agent, `lovable/redesign`.
- **Timestamp:** 2026-07-05T14:40:00Z.

### 2026-07-05T14:36:00Z — Flutter care chat messaging wired

- **Requested:** Wire `/chat-care` composer to web care chat APIs; `flutter analyze` + test;
  commit `fix(flutter): wire care chat messaging`; push.
- **Done:** `care_chat_repository.dart` (list threads, load messages, send, mark read,
  owner `getOrCreateDirectThread`); `care_chat_screen.dart` thread list + live composer;
  `chat_copy.dart` send/offline strings; `chat_routes_test.dart` provider override. Web APIs
  are TanStack server fns (`listCareThreads`, `sendCareMessage`, etc.), not Worker `/api/*`.
- **Issues:** Caregivers cannot create a new direct thread on Flutter until owner opens chat
  (RLS); attachments/group threads deferred; full suite **87/88** (pre-existing
  `insights_timeline_routes_test.dart` compile error on branch).
- **Stand / next:** Optional Worker `/api/care-chat/*` for admin-only thread creation; realtime
  subscription like web.
- **Who / where:** Cursor subagent · darwin · lovable/redesign (uncommitted)
- **Timestamp:** 2026-07-05T14:36:00Z

### 2026-07-05T14:40:00Z — Flutter marketing features charter terms routes

- **Requested:** Wire `/features`, `/charter`, `/terms` Flutter marketing stubs from web copy;
  analyze + test; commit push.
- **Done:** `MarketingFeaturesScreen`, `MarketingCharterScreen`, `MarketingTermsScreen`;
  copy in `marketing_copy.dart`; GoRouter + `AppRoutes.marketingPaths`; footer Terms link;
  `marketing_routes_test.dart` **10/10** pass; `flutter analyze lib/features/marketing` clean.
- **Issues:** Full `flutter analyze` still flags pre-existing vitals/chat files outside scope;
  `widget_test.dart` load failure pre-existing (**81/82** full suite).
- **Stand / next:** Marketing hero calm-scene images; `/contact` public route if needed.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:40:00Z

- **Requested:** Refresh `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` route counts vs `router.dart` and
  `src/routes/_app/`; update P0/P1/P2 for my-health, care, chat, reports, marketing; commit push.
- **Done:** Full route audit; gap counts **Missing 22**, **Stub 1**, **Partial 32**, **Parity 0**
  (total gaps 23, down from 33). P0/P1/P2 tables and Flutter inventory updated; TF17 ASC row.
- **Issues:** Stage 5 still NO-GO; admin (13), insights, care.accept deep link remain Missing.
- **Stand / next:** Device QA on TF17; Luciq crash triage; Oura console redirect.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:36:00Z

### 2026-07-05T14:10:00Z — Marketing GoRouter wire + path URLs + build 17

- **Requested:** Wire `/`, `/pricing`, `/privacy`, `/about`, `/trust` in GoRouter (public);
  path URLs on Flutter web; analyze + test green; verify `:8765`; bump `1.0.0+17`; commit push.
- **Done:** Routes in `8f81b69` (GoRouter outside ShellRoute); path URL + SPA serve in `c6658d5`;
  `flutter analyze lib/` 0 issues; `flutter test` **81/81**; `--rebuild` served `:8765` with
  HTTP 200 on `/` and `/pricing`; pubspec **1.0.0+17** committed and pushed. TestFlight skipped
  (policy: gates only, no upload this session).
- **Issues:** Browser MCP unavailable in subagent; verified via curl + serve logs. PID artifacts
  untracked.
- **Stand / next:** Prod Worker path routing when operator approves cutover.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:10:00Z

- **Requested:** Port core marketing routes to Flutter; path routes on web; verify analyze/test/
  browser; commit and push.
- **Done:** `usePathUrlStrategy()` in `main.dart`; `flutter_web_plugins` dep; `/` cold-start fix
  in `routes.dart`; `scripts/flutter-web-spa-serve.py` for `:8765` deep links. Browser MCP:
  `/` shows "Your health, remembered." + "Begin today"; client nav `/pricing` shows "Simple
  plans. Honest pricing." `flutter analyze lib/` 0 issues; `flutter test` **81/81**. Pushed
  `c6658d5` to `origin/lovable/redesign`.
- **Issues:** Marketing hero uses gradient stub (no calm-scene images yet). `/features`,
  `/charter`, `/terms`, footer GitHub links stub/disabled. `/contact` from header requires sign-in.
- **Stand / next:** Image assets + remaining marketing routes; Worker SPA routing at cutover.
- **Who / where:** Cursor marketing subagent · darwin · lovable/redesign@c6658d5
- **Timestamp:** 2026-07-05T14:06:00Z

### 2026-07-05T14:05:00Z — Marketing routes + P0-4 Today (stalled fleet closeout)

- **Requested:** Complete stalled marketing (Task A) and Today P0-4 (Task B) agents; analyze +
  test; commit and push both; rebuild `:8765`.
- **Done:** Task B already at `9b4e114` (date strip, score strip, signals grid, day-filtered
  snapshots, `signals_grid_skeleton.dart`, `today_vital_items_test.dart`). Task A screens in
  `ec8b21b`; GoRouter wiring in `8f81b69` (`router.dart`, `routes.dart` deep-link recognition).
  `flutter analyze` clean; `flutter test` **80/80** pass. Rebuilt `:8765`; curl **200** on `/`
  and `/pricing`. Pushed to `origin/lovable/redesign`.
- **Issues:** Browser MCP unavailable in subagent; signed-in `/today` walk not browser-verified
  (widget tests pass). Marketing `/contact` nav still hits protected route (sign-in gate).
- **Stand / next:** Operator device QA on `/today` and marketing nav; Worker cutover per
  `docs/FLUTTER-WEB-CUTOVER.md` when approved.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@8f81b69
- **Timestamp:** 2026-07-05T14:05:00Z


- **Requested:** `flutter test` fix all failures (chat, marketing, reports, today); analyze clean;
  commit and push.
- **Done:** Today/chat/reports fixes already on branch (`9b4e114`, `04a98d9`, `d1da862`). Committed
  marketing screens + `marketing_routes_test.dart`; `prefer_const_constructors` fixes in marketing
  and `reports_detail_screen.dart`. `flutter test` **79/79**; `flutter analyze lib/` **0 issues**.
  Pushed `ec8b21b` to `origin/lovable/redesign`.
- **Issues:** Marketing screens not yet wired in GoRouter (widget tests only). PID/lock artifacts
  untracked.
- **Stand / next:** GoRouter marketing routes; web rebuild when lock free.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@ec8b21b
- **Timestamp:** 2026-07-05T14:30:00Z

### 2026-07-05T14:05:00Z — P0-4 Flutter Today web parity

- **Requested:** Today parity — date strip, signals grid, score strip vs web `today.tsx`;
  scope `flutter/lib/features/today/`; analyze + test; browser `:8765/#/today`; commit push.
- **Done:** Confirmed/landed date strip, glass three-up score strip (Readiness/Sleep/Activity),
  "YOUR SIGNALS" grid with connect/empty states, quick actions, More-for-today disclosure (prior
  work). This commit: day-filtered `hasData` from real metrics in `today_repository.dart`;
  `signals_grid_skeleton.dart` for past-day loading; connect routes use `AppRoutes.settings`;
  `test/today_vital_items_test.dart`. `flutter analyze lib/features/today/` clean;
  `flutter test` **79/79** pass. Browser verified `:8765/#/today` (date strip, scores, signals).
- **Issues:** Full `flutter analyze lib/` still red on untracked marketing WIP (out of scope).
  Web rebuild blocked by concurrent `flutter-web-serve` lock; existing server served stale-enough
  build with real signed-in data for verify.
- **Stand / next:** `--rebuild` when lock free; update gap matrix P0-4 to Parity.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@9b4e114
- **Timestamp:** 2026-07-05T14:05:00Z

### 2026-07-05T14:20:00Z — P0-9 Flutter reports child routes

- **Requested:** Add six missing `/reports/*` child routes vs web; honest empty/upload states;
  scope `flutter/lib/features/reports/` + router; analyze + test; commit and push.
- **Done:** Routes `/reports/metrics`, `/documents`, `/medical-history`, `/new`,
  `/:reportId`, `/trends/:metricKey` with `ReportsLayout` tabs; repository loaders for
  tracked metrics, detail, series; removed monolithic hub; `test/reports_routes_test.dart`.
  `flutter analyze` exit 0; `flutter test` 79/79 pass.
- **Issues:** Trend charts, PDF generate, bulk download, reprocess, AI explain remain web-only
  (honest copy in UI). `/settings/reports` redirects to `/reports/metrics`.
- **Stand / next:** Worker file URL for Flutter report detail view; optional chart widget.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:20:00Z

### 2026-07-05T14:15:00Z — P0-7 Flutter chat routes shell

- **Requested:** Wire `/chat` and `/chat-care` stubs vs web; real shell + empty/connect or API;
  analyze + test; commit `feat(flutter): chat routes shell`; push.
- **Done:** `flutter/lib/features/chat/` — Ask Purple shell (header, chips, composer,
  disclaimer, SSE via `WorkerClient.postChatStream`); Care chat split list/conversation shell
  with `sharingListProvider` connect/empty states; `getSuggestedQuestions` in
  `condition_prompts.dart`; `test/chat_routes_test.dart` (6 pass). Scoped analyze clean.
- **Issues:** Landed co-staged in `a9c4361` (meds commit) not isolated feat message. Care
  message send still disabled (no Worker RPC client yet).
- **Stand / next:** `feat(flutter): care chat API` slice; rebuild web preview for `/chat`.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@a9c4361
- **Timestamp:** 2026-07-05T14:15:00Z

### 2026-07-05T14:12:00Z — P0-6 Flutter meds schedule UX parity

- **Requested:** Meds toolbar, 24h timeline, FAB vs web `meds*.tsx`; scope
  `flutter/lib/features/meds/` only; no fake doses; analyze + test; commit and push.
- **Done:** `meds_screen.dart` — four-button toolbar (+/scan/voice/history), mobile FAB below
  768px width, `medsScheduleProvider` with day navigation. `dose_list.dart` — prev/next day,
  date picker, conditional now marker, adherence only on today. `meds_repository.dart` —
  `todayStr`/`viewDateStr`, regenerate pending doses only when viewing today.
  `test/meds_schedule_ux_test.dart` — 3 widget tests. Pushed `a9c4361`.
- **Issues:** Scan/voice show web-only snackbar (no native capture). Commit also picked up
  co-staged chat scaffold files from parallel disk WIP.
- **Stand / next:** Native scan/voice med sheets; device verify schedule panel.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@a9c4361
- **Timestamp:** 2026-07-05T14:12:00Z

### 2026-07-05T14:10:00Z — Flutter P0-8 care inbox route

- **Requested:** Port `/care/inbox` from web; wire `care_repository`; analyze + test; commit
  `feat(flutter): care inbox route`; push.
- **Done:** `care_inbox_screen.dart`, `incoming_care_invites_card.dart`; `CareRepository`
  pending-change load/decide/bulk + `careInboxProvider`; `AppRoutes.careInbox` + router route
  before `:ownerId`; `test/care_routes_test.dart`. Scoped analyze clean; care tests 3/3.
- **Issues:** Incoming invites list/decline may fail RLS without service role (web uses server
  fn). Accept still email-link only. Full `flutter test` has pre-existing WIP failures on disk.
- **Stand / next:** Worker care inbox RPC or RLS for invitee reads; `/care/accept` Flutter route.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:10:00Z

### 2026-07-05T14:05:00Z — P0-3 Flutter wearable OAuth error UX

- **Requested:** Improve Tools Oura/Whoop OAuth inline errors; register redirect hint for
  `org.purplelife.app://oauth-oura-callback`; compare web tools integration UI; analyze + test;
  commit and push.
- **Done:** `wearable_oauth.dart` — `whoopFunctionErrorMessage`, `oauthCallbackQueryErrorMessage`,
  `nativeConnectSetupHint`, `emitWearableOAuthFailure`; Whoop exchange + callback error mapping.
  `tools_screen.dart` — inline errors on both cards, native pre-connect hints (Oura + Whoop).
  `wearable_oauth_callback_screen.dart` — emits failures to Tools stream. Tests extended.
  `flutter analyze lib/features/tools/` + `flutter test test/wearable_oauth_test.dart` pass.
- **Issues:** Oura developer console still needs native redirect URI registered (UX only).
- **Stand / next:** Owner adds `org.purplelife.app://oauth-oura-callback` in Oura console; TF device
  verify connect path.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T14:05:00Z

### 2026-07-05T18:30:00Z — Flutter web Worker cutover scaffold

- **Requested:** Implement merge script, `server.ts` path dispatch stub, `build:prod:flutter-web`
  chain; commit + push; no prod deploy.
- **Done:** `scripts/merge-flutter-web-assets.sh`; `src/lib/flutter-web-routing.ts` +
  `src/server.ts` dispatch (`/api/*`, `/oauth/*` → TanStack; Flutter static + SPA fallback when
  `FLUTTER_WEB_CUTOVER=true`; marketing TanStack fallback). `package.json`
  `build:prod:flutter-web`. `bunx tsc --noEmit` pass.
- **Issues:** Flag defaults off; no staging smoke; `flutter-phase5-nogo` and E2E TanStack paths
  remain.
- **Stand / next:** `build:prod:flutter-web` on workers.dev; owner sign-off before wrangler deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:30:00Z

### 2026-07-05T18:10:00Z — Flutter signed-in route parity wave 1

- **Requested:** Complete P0 wave 1: `/my-health` + nav, Tools OAuth UX, vitals depth,
  reports hub, journal honest capture; analyze + test; commit and push.
- **Done:** Added `MyHealthScreen` + repository (narrative, 90-day coverage, metric rows);
  bottom nav **My Body** → `/my-health`; `/biometrics` hub + trend drilldowns; vitals synced
  strip + My Body link; Tools Oura redirect hint + coverage summary; reports upload route
  (`/settings/reports/new`); journal platform-honest capture dock. `flutter test` **50/50**
  (excludes WIP `marketing_routes_test.dart` on disk). Commit `fix(flutter): signed-in route
  parity wave 1`.
- **Issues:** Oura console redirect still manual (`tf-oauth-not-working`). Marketing Flutter
  WIP remains untracked on disk.
- **Stand / next:** TF device sign-off on synced-data visibility; ship TF17 when ready.
- **Who / where:** Cursor subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T18:10:00Z


- **Requested:** Document Worker path for Flutter web at www.purplelife.org; scaffold prod build
  script; list Worker route changes (plan only); commit TF16 Luciq dedupe; push.
- **Done:** Added `docs/FLUTTER-WEB-CUTOVER.md` (build pipeline, asset paths, path-based Worker
  dispatch vs TanStack SSR, rollback, `:8080` vs `:8765` roles). Added
  `scripts/flutter-web-build-prod.sh` (Doppler dart-defines → `flutter/build/web`). Linked from
  `docs/FLUTTER-TESTFLIGHT-CUTOVER.md`. Committed **d62472b** `chore(ios): TF16 build bump and
  Luciq dedupe` (`1.0.0+16`, removed duplicate SPM Luciq, Podfile.lock). `flutter test` **47/47**
  on committed tree (parallel fleet WIP in untracked `lib/features/marketing/` breaks local
  analyze until merged).
- **Issues:** Worker `src/server.ts` dispatch + `merge-flutter-web-assets.sh` not implemented.
  `flutter-phase5-nogo` still blocks prod Flutter web. Parallel agents left untracked marketing/
  reports WIP on disk.
- **Stand / next:** Staging cutover on workers.dev; owner approval before prod deploy.
- **Who / where:** Cursor subagent · darwin · lovable/redesign@d62472b
- **Timestamp:** 2026-07-05T14:00:00Z


- **Requested:** Pull ASC/Luciq feedback, confirm TF16, map feedback to Flutter gaps, compare web vs
  Flutter routes, refresh gap matrix and open issues; audit only, commit + push.
- **Done:** `bun run ios:check-tf-feedback` (10 ASC submissions); `bun run ios:check-asc-builds`
  (**1.0 (16) VALID**); refreshed `docs/FLUTTER-CUTOVER-GAP-MATRIX.md` with P0/P1/P2 table,
  feedback map, route counts (33 gaps); `docs/OPEN-ISSUES.md` (`tf-synced-data-visibility`,
  `tf-oauth-not-working`, resolved `tf16-asc-processing`).
- **Issues:** Luciq dashboard API creds still absent (manual crash triage). No screen work this pass.
- **Stand / next:** `tf16-device-verify` on iPhone; ship P0-2 `/my-health` + P0-3 Oura console.
- **Who / where:** Cursor cutover audit subagent · darwin · lovable/redesign
- **Timestamp:** 2026-07-05T17:55:00Z

### 2026-07-05T13:36:00Z — Settings scroll re-verification (subagent)

- **Requested:** Confirm Flutter `/settings` full scroll web parity; browser verify `:8765`; analyze +
  test; resolve `tf-settings-design`.
- **Done:** Compared web `settings.tsx` vs Flutter hub + inline sections (order matches). Rebuilt
  `:8765`; browser MCP accessibility tree **108 nodes** (Preferences through Admin); scrollIntoView
  screenshots for AI provider, Data, Help, About; `flutter analyze lib/features/settings/` clean;
  `flutter test` **47/47** incl. `settings_screen_scroll_test.dart`.
- **Issues:** None. Commit `fb3b018` already on `origin/lovable/redesign`; TF16 needed for tester
  re-check.
- **Stand / next:** Poll ASC for TF16 VALID; device sign-off on settings scroll.
- **Who / where:** Cursor settings subagent · darwin · lovable/redesign@2b3fbb1
- **Timestamp:** 2026-07-05T13:36:00Z


- **Requested:** Ship TF16 bundling `home_city` (9b3de42), Luciq (e1cd69d), settings scroll
  (fb3b018), TF sync/timezone feedback (2aeabd4).
- **Done:** Polled `git pull` until fb3b018 + 2aeabd4 on branch; `flutter analyze lib/` + `flutter
  test` 47/47; bumped `pubspec.yaml` to **1.0.0+16**; ASC pre-check TF15 VALID; fixed duplicate
  LuciqSDK (removed SPM `luciq-ios-sdk` from Flutter `project.pbxproj`, keep CocoaPods via
  `luciq_flutter`); `bun run ios:testflight` via Xcode-beta **EXPORT SUCCEEDED**, upload **100%**
  (~09:33 ET); `bun run ios:check-tf-feedback` (7 ASC submissions, Luciq SDK token present).
- **Issues:** ASC API still lists **1.0 (15)** as newest VALID (16 processing). Local **+16** and
  pbxproj fix **not committed**. `xcode-select` points at CLT; script used `/Applications/Xcode-beta.app`.
- **Stand / next:** Poll ASC for 16 VALID; commit chore bump + Luciq SPM dedupe; close TF feedback
  items on device after install.
- **Who / where:** Cursor TF upload subagent · darwin · lovable/redesign@2b3fbb1 (upload tree) +
  local pbx/pubspec edits
- **Timestamp:** 2026-07-05T13:35:00Z

### 2026-07-05T13:34:00Z — Luciq vs Sentry observability audit

- **Requested:** Can agents access Luciq without manual checks? Sentry project exists? Need both?
- **Done:** Audit confirms SDK capture works; dashboard automation blocked until
  `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL` in Doppler. No Sentry in repo or Doppler; policy
  keeps Luciq-only for TestFlight beta (no dual SDK).
- **Issues:** User must add Luciq API creds in Luciq dashboard, then Doppler, for agent crash pulls.
- **Stand / next:** TF16 upload; optional Luciq MCP install; do not create Sentry.
- **Who / where:** agent d29d33cc · darwin · lovable/redesign@fb3b018
- **Timestamp:** 2026-07-05T13:34:00Z

### 2026-07-05T13:22:00Z — Post-fleet integration verification

- **Requested:** Pull `lovable/redesign`, run Flutter gates, rebuild `:8765`, curl + browser
  verify `#/settings` scroll and `#/account` city field; update `CURSOR_HANDOFF.md`.
- **Done:** `git pull` up to date at `e1cd69d`; `flutter analyze lib/` 0 issues; `flutter test`
  46/46; `./scripts/flutter-web-serve.sh --rebuild` OK; curl **200**; browser MCP verified
  settings sections scroll and account city field (`e.g. Brooklyn`); re-fetch showed no new
  settings/TF commits; `CURSOR_HANDOFF.md` integration section updated.
- **Issues:** None blocking. Signed-in browser session required for account form (existing session
  used).
- **Stand / next:** TF16 upload with accumulated fixes; Luciq verify on device after TF16.
- **Who / where:** Cursor agent · darwin · lovable/redesign@e1cd69d
- **Timestamp:** 2026-07-05T13:22:00Z

### 2026-07-05T13:25:00Z — Flutter settings full scroll web parity

- **Requested:** Complete Flutter `/settings` full scroll parity with prod web; verify, resolve
  `tf-settings-design`, commit and push.
- **Done:** Confirmed inline sections already wired in `settings_screen.dart` +
  `settings_sections.dart` (Preferences through Admin); added
  `flutter/test/settings_screen_scroll_test.dart`; `flutter analyze lib/` clean; `flutter test`
  47/47; browser verified `http://127.0.0.1:8765/#/settings` (108 interactive a11y nodes incl.
  Export, Contact, About, Admin); resolved `tf-settings-design` in OPEN-ISSUES.
- **Issues:** TF16 upload needed for tester re-check; Travel sub-route still placeholder.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:25:00Z

### 2026-07-05T13:20:00Z — TestFlight sync bar and timezone label fixes (commit)

- **Requested:** Commit uncommitted TestFlight feedback fixes (sync bar, timezone labels) and
  handoff kit files; push `lovable/redesign`.
- **Done:** Committed `sync_status_bar.dart` (provider names in sync button, relative + clock
  last sync, local time), removed `SyncStatusBar` from Meds/Vitals, `timezoneLabel()` in
  `locale_data.dart`; handoff kit (`00-handoff.mdc`, `CLAUDE.md`, `install-handoff-kit.sh`,
  post-task doc rule updates); `flutter analyze` 0 errors (5 pre-existing info), `flutter test`
  46/46; pushed to `origin/lovable/redesign`.
- **Issues:** Settings design still wrong per tester (see OPEN-ISSUES); fixes need TF16 upload to
  reach testers.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:30:00Z — Luciq Flutter crash reporting

- **Requested:** Luciq vs free alternatives; integrate `luciq_flutter`; agent periodic checks.
- **Done:** Added `luciq_flutter` ^19.8, `luciq_bootstrap.dart`, dart-define injection in
  `flutter-ios-testflight.sh`; removed duplicate native Luciq init from Flutter AppDelegate;
  `scripts/luciq-fetch-reports.mjs`, `check-testflight-feedback.mjs`, `ios:check-luciq`,
  `ios:check-tf-feedback`; `mem/observability/crash-reporting.md`, testflight-setup section,
  `.cursor/rules/flutter-testflight-observability.mdc`; analyze 0 issues, 46/46 tests.
- **Issues:** Dashboard API automation needs optional `LUCIQ_API_TOKEN` + `LUCIQ_ACCOUNT_EMAIL`
  in Doppler; SDK token alone sufficient for device crash capture. `tf-crash-report` open until
  TF16+ verified in Luciq UI.
- **Stand / next:** Upload TF16; run `bun run ios:check-tf-feedback` after VALID.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:30:00Z

### 2026-07-05T13:20:00Z — profiles.home_city field (DB + Flutter + web Account)

- **Requested:** Separate city field in DB (not just timezone label); migration, Flutter Account,
  optional web Account parity; commit and push.
- **Done:** Verified no `city`/`home_city` on live NEW DB; migration
  `supabase/migrations/20260705131400_profiles_home_city.sql` applied via Management API;
  regenerated `src/integrations/supabase/types.ts`; Flutter `account_screen.dart` city text
  field (autosave); web `LocaleFields` + `account.tsx` + i18n en/es; `flutter test` 46/46,
  `check:supabase-types` ok.
- **Issues:** None blocking. Settings scroll parity and Luciq out of scope.
- **Stand / next:** TF16 upload can include city field; welcome/onboarding does not yet collect
  `home_city`.
- **Who / where:** Cursor agent · darwin · lovable/redesign (this commit)
- **Timestamp:** 2026-07-05T13:20:00Z

### 2026-07-05T13:10:00Z — TestFlight feedback API + triage fixes

- **Requested:** Access TestFlight user feedback/screenshots; resolve issues.
- **Done:** Confirmed ASC API access (`/v1/apps/6787298041/betaFeedbackScreenshotSubmissions`);
  added `scripts/asc-list-testflight-feedback.mjs`, `bun run ios:check-asc-feedback`; triaged 7
  submissions; removed sync bar from Meds/Vitals; sync labels name providers + clock time;
  Account timezone shows city labels (New York not America/New_York).
- **Issues:** Settings design still wrong per tester; crash screenshot with no ASC crash log;
  fixes need TF16 upload.
- **Stand / next:** Upload TF16; Settings parity agent; optional ASC webhook for real-time feedback.
- **Who / where:** Cursor agent · darwin · lovable/redesign (superseded by commit above)
- **Timestamp:** 2026-07-05T13:10:00Z

### 2026-07-05T12:05:00Z — Install handoff/documentation discipline kit

- **Requested:** Apply permanent handoff rules from attached kit to Cursor repo
  (`docs/HANDOFF.md`, `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `.cursor/rules/00-handoff.mdc`,
  `CLAUDE.md`, install script); integrate with existing Purple docs.
- **Done:** Created `.cursor/rules/00-handoff.mdc`, `CLAUDE.md`, `docs/HANDOFF.md`,
  `docs/DECISIONS.md`, `docs/OPEN-ISSUES.md`, `scripts/install-handoff-kit.sh`; updated
  `.cursor/rules/post-task-documentation.mdc` and `AGENTS.md` to reference the trio;
  seeded snapshot and log from overnight Flutter fleet state (`327c161`, TF15 VALID).
- **Issues:** Phase 5 cutover still NO-GO; Oura native redirect URI may need manual
  Oura console registration; `CURSOR_HANDOFF.md` remains large legacy ops doc (maintain
  in parallel, not replaced).
- **Stand / next:** All future tasks append here first; operator verifies TF15 on device.
- **Who / where:** Cursor agent · darwin · lovable/redesign@327c161 (pre-commit for this task)
- **Timestamp:** 2026-07-05T12:05:00Z

### 2026-07-05T09:01:00Z — TestFlight 15 shipped (Settings, Account, Oura, Apple Health)

- **Requested:** Ship TF15 with Settings/`#/account`/Oura fixes missing from TF14 upload.
- **Done:** `pubspec` **1.0.0+15**; upload VALID ASC id `e85ac1a5-f547-4cb1-b51b-aa091191ba15`;
  commits `99e836c` (router refresh, Account deep links), `98d1ec8` (Oura OAuth),
  `92e0c0b` (compile + Apple Health Keychain connect); handoff `327c161` pushed.
- **Issues:** Device-side HealthKit and Oura connect not agent-verified on physical iPhone.
- **Stand / next:** Install **1.0 (15)** from TestFlight; verify connect flows on device.
- **Who / where:** overnight fleet agents · CI Mac · lovable/redesign@327c161
- **Timestamp:** 2026-07-05T09:01:00Z

### 2026-07-05T08:49:00Z — Apple Health TF14 (Keychain connect fix)

- **Requested:** Fix Apple Health connect on device (TF13 bool gate bug).
- **Done:** iOS trusts `requestAuthorization` + Keychain flag (matches Capacitor
  `health-ios.ts`); user-visible errors in Tools panel; TF14 uploaded VALID
  (`9aaf275d-c070-4a26-934c-6d21373b5edd`); superseded by TF15.
- **Issues:** TF14 predated Settings/Oura commits.
- **Stand / next:** Superseded by TF15 upload.
- **Who / where:** agent 60b9bcad · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:49:00Z

### 2026-07-05T08:00:00Z — Compile gates restored after parallel WIP break

- **Requested:** Fix 186 analyze errors from broken `tools_screen.dart` syntax.
- **Done:** `92e0c0b` — analyze 0 issues, **44/44** then **46/46** tests, `:8765` rebuild;
  preserved Oura OAuth and Apple Health WIP.
- **Issues:** None blocking after fix.
- **Stand / next:** Continue Settings/Health/Oura agents; upload TF14/15.
- **Who / where:** agent a83f8337 · darwin · lovable/redesign@92e0c0b
- **Timestamp:** 2026-07-05T08:00:00Z

<!--
Copy this template for each new entry. Newest at the top.

### YYYY-MM-DDTHH:MM:SSZ — <short title>
- **Requested:**
- **Done:**
- **Issues:**
- **Stand / next:**
- **Who / where:** <name or agent> · <machine> · <branch@commit>
- **Timestamp:** YYYY-MM-DDTHH:MM:SSZ
-->
