# HANDOFF

Current state of the world. Read this first, every session. Update before any task is
done. Newest entries at the top of the log.

Enforced by `.cursor/rules/00-handoff.mdc`. Extended ops: `CURSOR_HANDOFF.md`.

---

## Current snapshot

Purple Life on **`lovable/redesign`**. TestFlight **1.0 (15)** VALID. **`profiles.home_city`**
nullable text column live on NEW Supabase (`xxnzmfzsjplrutrgbzxy`); Flutter Account and web
Account persist a user-entered city separate from IANA timezone labels.

**Next action:** Ship TF16 with TF feedback fixes; continue Settings visual parity pass.

---

## Log

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
- **Who / where:** Cursor agent · darwin · lovable/redesign (uncommitted)
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
