# Plan

Two phases. Phase A is cleanup + verification of what already exists. Phase B is four targeted fixes the screenshots and notes flag.

## Phase A — Cleanup and QA (no new features)

### A1. Delete synthetic seed data
- Drop the 2 seeded `report_documents` ("Lipid + HbA1c panel Mar/May 2026") and their cascaded `report_metrics`. Confirmed via DB: only those 2 rows exist; user has no other reports.
- Verify `/reports` returns to empty-state, suggestions card disappears (no metrics → no rules fire), and dismissed-suggestion entries in `profiles.suggestions_dismissed` are left in place (harmless; user added "diabetes" to conditions during QA — leave that decision alone unless you want it reverted).

### A2. Medication reminders + adherence — E2E in the live browser
1. Create a test med with a near-future dose time on `/meds`.
2. Confirm row appears in `medication_doses` with `scheduled_for` in the next few minutes.
3. Trigger `/api/public/cron/dose-reminders` manually and confirm: notification queued, reminder banner renders on `/today`.
4. Mark dose taken → confirm `adherence` updates and the Today doses card reflects it.
5. Skip a dose → confirm "missed" status flows into caregiver alerts.

### A3. One-tap seizure log
1. `/today` → tap the seizure FAB / `/seizures/new` quick-log button.
2. Confirm a row is written to `seizure_events` with `started_at = now()` and minimal payload.
3. Re-open the event, fill in duration / type / notes / triggers, save, confirm the same row is updated (not duplicated).
4. Confirm it appears in `/timeline` immediately.

### A4. Wearable sample data → risk forecast
- Seed ~14 days of synthetic `biometrics` rows for the test user (sleep_total_min, hrv, oura_readiness_score, oura_activity_score) with `source='oura'`.
- Trigger `/api/public/hooks/risk-forecaster` (or the in-app refresh on `/today/risk`).
- Confirm `today.risk` summary renders with a non-empty score, top contributing factors, and the medical disclaimer.
- Clean up the synthetic biometrics after verification.

## Phase B — Four follow-up fixes

### B1. Oura "Last synced Nd ago" never refreshes (screenshot 1)
**Root cause:** `OuraConnection` derives "last synced" from `oura_tokens.updated_at`. The cron and the `Sync` button only call `.update({ updated_at })` when the **token** actually gets refreshed (new access_token). On a normal incremental sync that reuses a valid token, `updated_at` is never bumped, so the UI shows the install date forever even though sleep/readiness/activity counts grow.

**Fix:**
- Add `last_sync_at timestamptz` to `oura_tokens` (migration).
- In `supabase/functions/oura-sync/index.ts`, set `last_sync_at = now()` at the end of every successful `incremental` / `backfill` run for that user (both the per-user "Sync" path and the cron-all path).
- In `oura-connection.tsx`, read and display `last_sync_at` (fall back to `updated_at` if null).
- Verify in the browser after a manual Sync that the label flips to "just now".

### B2. Super-admin console expansion (screenshot 2)
The current `/admin/users` table only shows name / id / joined / community / suspend. Build out the missing super-admin actions in a single panel per user (drawer or expanded row), all gated by `has_role(auth.uid(), 'super_admin')` via existing `user_roles` table:

Per-user actions (server fns with `requireSupabaseAuth` + super-admin check):
- Pause / resume (already wired via `suspended_at`)
- Archive / restore (existing soft-delete flow on `profiles`)
- Schedule delete / cancel delete (existing purge cron path)
- Reset password (send Supabase reset email via `supabaseAdmin.auth.admin.generateLink`)
- Reset 2FA (delete the user's MFA factors via `auth.admin.mfa`)
- View caregivers (read `care_relationships` where `owner_id = user.id`) and pending invites (`care_invites`) — readonly list
- Categorize: tabs for "Active", "Paused", "Archived", "Scheduled for deletion"

Promo codes (new):
- New table `promo_codes` (code, label, kind enum 'invite'|'discount'|'share', max_uses, used_count, created_by, expires_at, active) + `promo_code_redemptions`.
- Admin UI tab "Promo codes": create / disable / view redemptions.
- Surface a "Get an invite code" button on `/account` for end users to share — generates a personal share code.

Scope it as one migration + one admin tab + one users-detail drawer; ship promo codes as a follow-up sub-task in the same plan so it doesn't bloat the first PR.

### B3. Autosave everywhere unless the change is destructive/expensive
Audit and convert these to debounced autosave (300-500ms after last edit), drop the Save button, replace with a discreet "Saved · just now" indicator:
- `src/components/account/profile-fields.tsx` — name, phone, pronouns
- `src/components/settings/preferences-section.tsx` — toggles & selects (most already autosave; verify)
- `src/components/settings/what-i-track-section.tsx` — feature toggles
- `src/components/locale/locale-fields.tsx` — language/timezone/units
- `src/components/account/two-factor-section.tsx` — leave Save (security-sensitive)
- `src/components/account/password-section.tsx` — leave Save (security-sensitive)
- Medication form sheet — leave Save (multi-field commit)
- Trip itinerary editor — leave Save (recomputes dose schedule)

Pattern: shared `useAutosave(value, saver, { delay: 400 })` hook so the indicator state is consistent.

### B4. Seizures from journal aren't surfacing in Timeline
**Root cause to verify in build:**
- `journal-processor` already extracts `event:seizure` tags. But Timeline only reads from `seizure_events`, not from `journal_entries.tags`.
- Either (a) when the extractor sees `event:seizure`, insert a stub row into `seizure_events` linked back to the journal entry (`source_journal_id`), or (b) extend Timeline's loader to merge journal entries tagged `event:seizure` as virtual seizure rows.

Recommended: option (a). It keeps a single source of truth, makes Patterns / Care alerts / Caregiver mirror "just work", and gives the user a single tap to add duration/severity later.

Implementation:
- Add `source = 'journal' | 'manual' | 'caregiver'` and `source_journal_id uuid` to `seizure_events` (migration).
- In `journal-processor`, when an `event:seizure` tag is produced, upsert a minimal `seizure_events` row with `started_at = entry timestamp`, `source = 'journal'`, `source_journal_id = entry.id`.
- Skip insert if a manual seizure_event already exists within ±10 min for the same user (dedupe).
- Add a small "From journal" badge on the seizure card in `/timeline` and `/seizures/$id` so the user knows where it came from and can enrich it.

## Order of work

1. A1 (1 SQL delete) → A2/A3/A4 QA in one browser session.
2. B1 (smallest, highest user-visible value).
3. B4 (data plumbing, no UI redesign).
4. B3 (autosave sweep — touches several files, no schema).
5. B2 (largest; split into "users console" → "promo codes" if it gets long).

Each step ends with: targeted browser QA + a one-line summary of what was verified.

## Open question

For B3, do you want the security-sensitive sections (password, 2FA, payment) to keep their explicit Save button? Default: **yes, keep them.** Reply "autosave everything" if you want them converted too.
