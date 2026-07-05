# Flutter page-by-page comparison vs production web

**Last updated:** 2026-07-04  
**Reference:** TanStack `src/routes/_app/**` as served on `www.purplelife.org` (Capacitor TestFlight today)  
**Flutter preview:** `http://127.0.0.1:8765`  
**Test account:** `pmt@eigital.com` (2 meds, 33 doses, 2 journal entries, ~3920 biometrics)

**Method:** Six parallel read-only audits, then Wave 1 fix fleet (2026-07-04 evening). Runtime browser QA complete (2026-07-04 ~21:00 ET).

### Wave 1 shipped (2026-07-04)

| P0 item | Status |
|---------|--------|
| `regenerate_today_pending_doses` + profile TZ | **Done** ([meds agent](f013efd5-4adb-4914-8b6d-fb9658d5a490)) |
| Journal `pendingUpload` queue-only | **Done** ([journal agent](c89d27db-de9e-48dc-b953-9a3fd1efa03a)) |
| Today narrative `risk_forecasts` + Whoop sync on refresh | **Done** ([today agent](bc65c3d1-88ca-44b9-a570-54ae03fc4e20)) |
| Add med form + `/meds/history` + `/meds/:id` | **Done** ([meds agent](f013efd5-4adb-4914-8b6d-fb9658d5a490)) |
| Sign-out `clearUserCache` | **Done** ([auth agent](8f98e02f-f851-47a3-953e-465a569ca2c9)) |
| `/today/risk` + `/hydration` stub + nav fixes | **Done** ([routes agent](8c797735-d7b5-4558-a9bb-f95157f73f3f)) |
| Gates | **20/20** `flutter test` ([compile fix](f9a8afa5-b6b6-4367-98c5-196f17776a73)) |

**Still Wave 2+:** OAuth connect in Tools, reports/care trees, theme persistence (Light/System), care inbox badge, global Georgia→Source Serif 4 (Settings screen done).

### Wave 3 phase sweep (2026-07-05 overnight)

| Item | Status |
|------|--------|
| Hydration `/hydration` (quick-add, goal, day timeline) | **Done** |
| Today risk `/today/risk` (`risk_forecasts` drilldown) | **Done** |
| Seizures `/seizures/new` (quick log + detailed form) | **Done** |
| Vitals metric drilldown 7-day trend chart | **Done** |
| Vitals edit affordance → Tools | **Done** |
| Gates | **34/34** `flutter test`; analyze 0 errors (warnings only) |

**Still Wave 4+:** Chat streaming, push notifications, full reports upload, theme persistence (settings agent), Account polish.

### Wave 2 partial (2026-07-04 overnight)

| Item | Status |
|------|--------|
| Journal multimodal capture dock (honest native-only stubs) | **Done** |
| Vitals metric drilldown route + tappable cards | **Done** (stub charts) |
| Today condition prompts + seizure quick action + hydration in More | **Done** |
| Fail-open data-path fixes (Today metadata, Journal empty online) | **Done** |

### Wave 2 partial (2026-07-04)

| Item | Status |
|------|--------|
| Profile avatar top bar + drawer | **Done** ([settings+avatar agent](70f175be-9606-4530-a231-d7c39275cdf8)) |
| Settings hub sections (Preferences, AI, What I track, History, Data, About, Admin) | **Done** (read-only where Worker fns required) |
| Account sheet close X + avatar photo | **Done** |

---

## Executive summary

| Metric | Web | Flutter |
|--------|-----|---------|
| Signed-in routes | 55 files | 18 GoRouter paths |
| Full parity routes | 55 | **0** |
| Partial (usable shell) | — | 10 |
| Stub / placeholder | — | 7 |
| Missing | — | 38 |

**Verdict: NO-GO for Phase 5 cutover.** The two days of work were not wasted: core tabs load data again and several P0 layout items closed. The gap is **functional depth** (settings suite, meds add/history, biometrics drilldown, reports, care, OAuth connect) plus **data-path bugs** that make Flutter look empty or wrong while web works.

**Do not revert.** Capacitor TestFlight still loads prod web and is the safe daily driver. Flutter is a parallel track; this doc is the fix plan.

---

## Why it feels "everything broken" (root causes)

Cross-cutting from [data layer audit](6ab8b25c-11a4-4237-9b91-885af42acc00):

1. **Missing `regenerate_today_pending_doses`** — web generates today's dose rows; Flutter may show empty Today/Meds panel.
2. **Profile timezone ignored** — web uses profile TZ day window; Flutter uses device local midnight.
3. **Narrative table mismatch** — web Today uses `risk_forecasts.ai_narrative`; Flutter reads `health_narratives`.
4. **Pull-to-refresh skips wearable sync** — web syncs Oura + Whoop then reloads; Flutter invalidates providers only; Whoop not wired in sync bar.
5. **Web fail-open to empty cache** — Drift disabled on web (`kIsWeb`); Supabase errors become dashes, not error UI (Today/Meds vs Vitals inconsistency).
6. **No `clearUserCache` on sign-out** — stale Drift rows after account switch.
7. **Journal `pendingUpload` bug** — treats AI `processing` as upload-pending (wrong badges/banner).

Infrastructure (already fixed in session): missing `sqlite3.wasm` + `drift_worker.js` caused total blank screens before any API call.

---

## Screen status (Working / Partial / Broken / Missing)

### Core tabs

| Screen | Status | Top functional gaps vs web |
|--------|--------|---------------------------|
| **Today** | Partial | Wrong narrative source; refresh no wearable sync; past-day doses hidden; score detail → `/vitals` not `/today/risk`; signals → `/vitals` not `/biometrics/$metric`; missing banners, seizure quick action, hydration in More |
| **Vitals** | Partial | Layout largely matches; hydration card not tappable; no metric drilldown; sync bar Oura-only |
| **Meds** | Partial | Taken/undo/reclassify work; **add med = SnackBar no-op**; no `/meds/history`; detail is modal stub; no dose regeneration RPC; wrong TZ |
| **Journal list** | Partial | Light canvas, filters, pagination, kebab strong; pending badge bug; no realtime |
| **Journal capture** | Partial | Text + offline queue only; no voice/photo/video |

### Settings / Account / Tools / Shell

| Screen | Status | Top functional gaps vs web |
|--------|--------|---------------------------|
| **Settings hub** | Partial | Nav links exist; **Preferences, AI provider, What I track, Condition history, Data export, About, Admin entirely missing** |
| **Account** | Partial | Name/phone/gender/password wired; avatar upload, 2FA manage, locale, appearance, invite, subscription = stubs |
| **Tools** | Partial | Apple Health native panel wired; Oura/Whoop connect → web SnackBar; no sync mode; notifications placeholder |
| **Shell** | Partial | endDrawer + sync button OK; **no profile avatar** in top bar; bottom nav maps Vitals/Meds for web My Body/Insights; care inbox badge missing |

### Missing route groups (38 routes)

| Phase | Routes | Block cutover? |
|-------|--------|----------------|
| Health home | `/today/risk`, `/my-health`, `/insights`, `/biometrics/*`, `/hydration`, `/seizures/new`, `/timeline` | Yes (tabs + drilldowns) |
| Meds depth | `/meds/history`, routed `/meds/$medId` | Yes |
| Reports | `/reports/*` (7 routes) | Yes |
| Care / chat | `/care`, `/care/inbox`, `/chat`, `/chat-care`, sharing report view | Yes |
| Settings legal | `/settings/privacy`, `/terms`, `/how-purple-thinks` | Partial |
| Admin / social / DNA | 13 admin + community + friends + DNA | Defer |

Full 55-row matrix: see audit in [route matrix agent](bbb023f5-fd6d-4adc-bcfe-e1bbf1e54d8f).

---

## P0 fix list (approved before coding)

Ordered by blast radius on `pmt@eigital.com` daily use:

| # | Fix | Screens affected |
|---|-----|------------------|
| 1 | Call `regenerate_today_pending_doses` + profile TZ windows (port `meds-today.ts`) | Today, Meds |
| 2 | Fix journal `pendingUpload` (queue flag only, not `processing`) | Journal |
| 3 | Align Today narrative with web (`risk_forecasts` or documented fallback chain) | Today |
| 4 | Wire pull-to-refresh + sync bar to Oura **and** Whoop Worker | Today, Vitals |
| 5 | Real add-medication form (replace SnackBar stub) | Meds |
| 6 | GoRouter `/meds/history` + `/meds/:medId` with dose history/backfill | Meds |
| 7 | Settings inline sections: Preferences → AI → What I track → Condition history → Data | Settings |
| 8 | Profile avatar in top bar + Account upload | Shell, Account |
| 9 | Oura/Whoop in-app OAuth + deep links | Tools |
| 10 | `clearUserCache` + provider invalidation on sign-out | All data screens |

Design gate still open globally: **Source Serif 4** (web) vs `Georgia` in Flutter.

---

## Fix waves (no code until operator approves wave)

| Wave | Goal | Scope |
|------|------|-------|
| **1** | Core tabs trustworthy | Items 1–6 above; `/today/risk`; hydration tap; Georgia → Source Serif 4 |
| **2** | Settings suite + Account + Tools | Items 7–9; sharing/travel/contact real UI; theme/locale/invite |
| **3** | Reports + Care | Full `/reports/*`, `/care`, inbox, chat streaming |
| **4** | Native | Local notifications, FCM, OAuth callbacks hardened |
| **5** | Insights / hydration / timeline / multimodal journal | Secondary surfaces |
| **6** | Flutter TestFlight | IPA script, Luciq, owner Capacitor retirement decision |

---

## Automated gates (current)

```bash
cd flutter && flutter analyze lib/ && flutter test   # 16/16 pass at last run
./scripts/flutter-web-serve.sh --rebuild             # after any flutter/lib change
```

Browser side-by-side: `:8765` vs `https://www.purplelife.org` same account, 390px + 768px.

---

## Audit sources

| Agent | Scope |
|-------|--------|
| [Meds + Journal](507d1bb3-6bf4-4a08-a1db-902c1a7bff3c) | Dose actions, capture, routing |
| [Today + Vitals](571c9251-6961-401f-8ccd-92103a2e0c74) | Scores, signals, biometrics gaps |
| [Settings + Shell](0563c710-5af7-455d-9cf7-c195f9b390bd) | Every settings link, avatar, drawer |
| [Route matrix](bbb023f5-fd6d-4adc-bcfe-e1bbf1e54d8f) | 55 vs 18 routes, waves, NO-GO |
| [Data layer](6ab8b25c-11a4-4237-9b91-885af42acc00) | Why empty/wrong vs web |
| Browser compare | **Done** — runtime table below (2026-07-04 ~21:00 ET) |

Related docs: `docs/FLUTTER-CUTOVER-GAP-MATRIX.md`, `docs/FLUTTER-DESIGN-PARITY-CHECKLIST.md`, `docs/features/PHASE5_CUTOVER_ORCHESTRATOR.md`.

---

## Runtime browser comparison (Wave 1 + Settings slice)

**When:** 2026-07-04 ~21:00 ET  
**Flutter:** `http://127.0.0.1:8765` (hash routes `#/…`; `./scripts/flutter-web-serve.sh --rebuild` after missing `build/web`)  
**Web:** `https://www.purplelife.org` (path routes)  
**Account:** `pmt@eigital.com` (restored session on both; prod Account confirms email)  
**Viewport:** ~390px mobile (Cursor browser MCP)

| Route / flow | Flutter `:8765` | Web prod | Parity | Notes |
|--------------|-----------------|----------|--------|-------|
| **Sign-in / session** | PASS (cached session) | PASS (cached session) | OK | Flutter uses `#/` hash routing; direct `/sign-in` 404s on static server (use `#/sign-in` or root). |
| **Today** `/today` | PASS | PASS | **Partial** | Same narrative ("Good evening, a", stress/readiness copy). Flutter hero scores **87 / 82 / 58**. Web hero buttons show **–** but signals list HRV 26.56 ms, RHR 67, SpO₂ 95.5%. Both show Crestor + asprin taken. |
| **Meds** `/meds` | PASS | PASS | **Partial** | Same headline, 63% on schedule, 5/8 logged, Crestor 10:00 + asprin 16:00 Taken/Undo. Web adds add-med (+/scan/voice), dose-history link, all-meds list, on-time streak, export. Flutter timeline + sync bar match intent. |
| **Journal** `/journal` | PASS | PASS | **Good** | Light canvas, Active/Archive, date filters, one entry (Tue May 26 2026). New entry FAB on both. |
| **Vitals** `/vitals` | PASS | PASS (as `/my-health`) | **Partial** | Flutter Vitals tab: Readiness Score + Symptom Radar cards, sync bar, Jul 4 date. Web **My Body** is richer (90-day narrative, Sleep/Stress/Heart/Activity/Readiness tiles, Advisor CTA). Bottom nav differs (Flutter Vitals/Meds vs web My Body/Patterns). |
| **Settings hub** `/settings` | PASS | PASS | **Partial** | Hub cards (Account / Settings / Tools) + "All in your control." copy match. Web scroll reveals full inline **Preferences, AI provider, What I track, Health history, Data, About, Admin** (113 interactive controls). Flutter ships same sections in code; automation could not scroll Flutter canvas to screenshot inline blocks (hub + Your health/Medications row verified). |
| **Account** `/account` | **Partial** | PASS | **Gap** | Prod: profile form, `pmt@eigital.com`, upload photo, 2FA, region/language, Dark/Light/System, invite, sign out. Flutter: `#/account` hash nav bounced to Today; hub Account card tap not confirmed in canvas click automation (route exists in GoRouter). |
| **Tools** `/tools` | PASS (web stub) | PASS | **Gap** | Flutter web shows **Native only — Connect on your phone** (expected on web). Prod: Oura + Whoop connected with sync/disconnect, Apple Health HAE URL, phone alarms. |
| **Burger / endDrawer** | **Partial** | **Partial** | **Unverified** | Both show hamburger in top bar. Flutter coordinate clicks did not open endDrawer; prod "Open menu" not exercised (navigation interrupted). Prior fleet reported endDrawer wired in `shell_menu_sheet.dart`. |
| **Avatar (top bar)** | PASS | PASS | **Good** | Gold **A** avatar visible on both; prod opens "Open account menu" dropdown (not expanded in this pass). |
| **Today risk** `/today/risk` | PASS | **Partial** | **Improved** | Flutter: `risk_forecasts` arc, band, narrative, factor list. Prod URL still renders Today shell (web quirk). |
| **Hydration** `/hydration` | PASS | PASS | **Partial** | Flutter: goal ring, 250/500 ml quick-add, water/electrolyte dialogs, day timeline. No snap/voice/aura yet. |

### Wave 1 + Settings slice verdict (runtime)

| Area | Runtime result |
|------|----------------|
| Core tabs load real `pmt@eigital.com` data | **PASS** (Today scores, Meds doses, Journal entry, Vitals shell) |
| Settings Wave 2 hub + section scaffolding | **PASS** (hub matches web; inline sections present in Flutter code, hub-only verified in browser) |
| Account / Tools functional parity | **FAIL** (Account nav flaky in Flutter web automation; Tools native stub on Flutter web) |
| Secondary routes (risk, hydration) | **FAIL vs prod** (Flutter stubs; prod hydration full, prod risk route unclear) |
| Shell (avatar, burger) | **Conditional** (avatar visible; drawer not confirmed this pass) |

**Preview ops:** Initial `curl` returned **404** (empty `flutter/build/web` while listener still bound). Fixed with manual `flutter build web` + `./scripts/flutter-web-serve.sh`; final `curl` **200**.

**Still NO-GO for Phase 5 cutover** per executive summary; runtime QA confirms Wave 1 data trust improvements landed, Settings hub parity improved, but Account navigation, Tools integrations, hydration timeline, and My Body depth remain gaps vs prod.

---

## Overnight verify fleet (2026-07-05)

Automated re-check after parallel agents may have landed. Method: 15 min initial wait, then cycles every 30 min (up to 3). Account: `pmt@eigital.com` cached session on `:8765`; prod uses same restored session (slow hydrate ~12s in MCP browser).

### Cycle 1 — 2026-07-05 ~02:02 ET

| Check | Result |
|-------|--------|
| `flutter analyze lib/` | **PASS** (0 issues) |
| `flutter test` | **PASS** (**27/27**, up from 20/20) |
| `curl http://127.0.0.1:8765/` | **200** |
| `./scripts/flutter-web-serve.sh --rebuild` | **In progress** at cycle start (transient **Loading Purple** hang mid-rebuild; hard reload to `/` recovers) |
| `bun run ios:check-asc-builds` | **PASS** — **1.0 (11)** `processing=VALID`; **1.0 (12)** also VALID (newer upload) |

| Route / flow | Flutter `:8765` | Web prod | Parity | Notes |
|--------------|-----------------|----------|--------|-------|
| **Today** | PASS | PASS | **Partial** | Same narrative + doses. Flutter hero **87/82/58**; prod hero **–/–/–** but signals HRV 26.56 ms, RHR 67, SpO₂ 95.5%. |
| **Meds** | PASS | (not re-opened) | **Partial** | 63% on schedule, Crestor 10:00 + asprin 16:00 Taken/Undo. |
| **Journal** | PASS | (not re-opened) | **Good** | Light canvas, Active tab, Tue May 26 2026 entry, + New entry FAB. |
| **Vitals** | PASS | (not re-opened) | **Partial** | Readiness Score **LATEST**; Symptom Radar **NO DATA**; sync bar "Last pulled 1h ago". |
| **Settings hub** | PASS | PASS | **Partial** | Hub cards + Your health/Medications match prod. Inline **Preferences, AI provider, What I track, Health history, Data, About, Admin** in code (`settings_screen.dart`); MCP canvas scroll/wheel did not reveal below-fold sections (same blocker as prior pass). |
| **Tools** | PASS | (not re-opened) | **Improved** | **Oura** connected (last sync 15d ago), **Whoop** connected (1h ago), Sync/Disconnect + auto-sync dropdowns. **Apple Health** panel: web guidance ("Install Purple iOS app… Health Auto Export at purplelife.org/tools"). Wave 2 OAuth wiring landed on Flutter web. |
| **Account / burger** | Not re-tested | Not re-tested | **Open** | Prior gaps unchanged. |

**Cycle 1 verdict:** Gates green; core tabs load real data; Tools OAuth cards now match prod intent on Flutter web. **NO-GO** unchanged (Account nav, hydration, My Body depth, Settings inline scroll QA).

### P0 for other agents (not trivial one-liners)

1. **Prod Today hero scores dashed** while Flutter shows 87/82/58 — investigate score snapshot path on web vs `getScoreSnapshot` / forecast table (data or UI regression on prod, not Flutter-only).
2. **Vitals Symptom Radar NO DATA** on Flutter for `pmt@eigital.com` — confirm whether web My Body shows radar data; wire or empty-state parity.
3. **Settings inline sections** — MCP cannot scroll Flutter canvas; consider `Semantics`/`Scrollable` debug flag or deep-link anchors for QA (`#/settings` should expose Preferences without manual scroll).
4. **Mid-rebuild preview hang** — `Loading Purple` persists until hard reload when `flutter-web-serve.sh --rebuild` swaps `build/web`; document single rebuild owner or serve-from-temp-dir during build.
5. **Account route** — `#/account` still flaky in prior passes; verify GoRouter + hub card navigation.

### Cycle 2 — 2026-07-05 ~02:50 ET

| Check | Result |
|-------|--------|
| `flutter analyze lib/` | **PASS** |
| `flutter test` | **PASS** (**27/27**) |
| `curl http://127.0.0.1:8765/` | **200** |
| `bun run ios:check-asc-builds` | **PASS** — **1.0 (11)** and **1.0 (12)** both VALID |

| Spot check | Result |
|------------|--------|
| Flutter Today (after 6s boot) | **PASS** — scores 87/82/58, same narrative |
| Flutter `#/tools` | **Flaky** — brief Loading Purple, then landed on `#/today` (not Tools UI) |
| Prod `/today` | **Not confirmed** — splash persisted; prior cycle PASS after 12s hydrate |

**Cycle 2 verdict:** Gates unchanged green; no new agent regressions in analyze/test. Tools route navigation flaky on second pass (P0 carry-over). **NO-GO** unchanged.

### Cycle 3 — 2026-07-05 ~23:22 ET (verify-fleet final, parent agent)

| Check | Result |
|-------|--------|
| `./scripts/flutter-web-serve.sh --rebuild` | **PASS** — server was **DOWN** between cycles; rebuild restored `:8765` **200** |
| `flutter analyze lib/` | **PASS** (0 issues; prior ~23:05 pass had 3 health-slice lints, now clean) |
| `flutter test` | **PASS** (**34/34**, up from 27/27) |
| `curl http://127.0.0.1:8765/` | **200** |
| `bun run ios:check-asc-builds` | **PASS** — **1.0 (11)**, **1.0 (12)**, **1.0 (13)** all `processing=VALID` |

**Account:** `pmt@eigital.com` cached session on Flutter `:8765`. **Viewport:** ~390px (Cursor browser MCP).

| Route / flow | Flutter `:8765` | Web prod | Parity | Notes |
|--------------|-----------------|----------|--------|-------|
| **Sign-in / session** | PASS | PASS | OK | Cached session both sides; no re-auth needed. |
| **Today** `#/today` | PASS | PASS | **Partial** | Same narrative + Crestor/asprin doses. Flutter hero **87 / 82 / 58**; prod hero **– / – / –** but signals HRV 26.56 ms, RHR 67, SpO₂ 95.5%. |
| **Vitals** `#/vitals` | PASS | PASS (`/my-health`) | **Partial** | Flutter: Readiness **LATEST**, Symptom Radar **NO DATA**, sync bar. Prod My Body: 90-day narrative, Sleep/Stress/Heart tiles, Advisor CTA. Bottom nav differs (Flutter Vitals/Meds vs prod My Body/Patterns). |
| **Meds** `#/meds` | PASS | PASS | **Partial** | Same headline, 63%, 5/8 logged, Crestor 10:00 + asprin 16:00 Taken/Undo. Prod adds add-med/scan/voice row, on-time streak, all-meds list, export. |
| **Journal** `#/journal` | PASS | PASS | **Good** | Light canvas, Active tab, Tue May 26 2026 entry, + New entry FAB on both. |
| **Settings** `#/settings` | PASS | PASS | **Partial** | Hub cards + "All in your control." match. Prod scroll shows Lab reports, Sharing, Travel, Add past history below hub; Flutter hub-only verified (MCP scroll still blocked on canvas). |
| **Tools** `#/tools` | PASS | PASS | **Partial** | Oura connected (16d), Whoop connected (3 min), Sync/Disconnect + auto-sync on both. Prod adds 90-day summary lines + Apple Health HAE Test/Disconnect panel; Flutter web shows iOS-app + HAE URL guidance card. |
| **Account** `#/account` | **Broken** | PASS | **Gap** | Hash nav to `#/account` **redirects to `#/today`** (screenshot confirms Today, not profile form). Prod Account: email, photo upload, 2FA, locale, appearance. |
| **Care** `#/care` | PASS | (not opened) | **Partial** | Flutter empty state "No caregivers yet" + Invite caregiver. Prod sharing tree not re-opened this cycle. |
| **Burger / endDrawer** | **Partial** | (not opened) | **Unverified** | Hamburger visible; coordinate clicks hit Sync tooltip, drawer never opened in MCP. Hash routes for Settings/Tools/Care work; Account broken. |
| **Sign out** | Not tested | Not tested | **Open** | Skipped to preserve cached session for prod side-by-side. |
| **Bottom nav** | PASS | PASS | **Partial** | Today, Vitals, Meds, Settings tabs render; Journal via center FAB not exercised. Prod labels Today / My Body / Patterns / Settings. |

**Cycle 3 verdict:** Core tabs + Tools OAuth **PASS** with real `pmt@eigital.com` data. **Account hash redirect** remains **Broken**. Gates **PASS** (analyze 0, test 34/34, ASC 11–13 VALID). **NO-GO** for Phase 5 cutover unchanged.

### Overnight fleet summary (3 cycles complete)

| Cycle | Time (ET) | Gates | Browser | ASC |
|-------|-----------|-------|---------|-----|
| 1 | ~02:02 | analyze/test PASS (27/27) | Full route sweep; Tools OAuth landed | 11+12 VALID |
| 2 | ~02:50 | analyze/test PASS (27/27) | Today PASS; Tools nav flaky | 11+12 VALID |
| 3 | ~23:22 | analyze/test PASS (34/34) | Full matrix; Account broken | 11+12+13 VALID |

**No trivial one-line fixes applied.** P0 list above stands for follow-up agents.
