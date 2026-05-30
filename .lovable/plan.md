
## Plan: address 7 reported issues

### 1. Dose times showing 7:30 instead of 10:30 (timezone)
**Diagnosis:** `medication_doses.scheduled_at` is created via `todayIso(time)` on the *client* in the user's local TZ, but `times_of_day` is also stored as a bare `"HH:MM"` string. When daily doses are re-created server-side (cron / re-seed / dose generator), they're interpreted in UTC or in another TZ — producing the consistent 3-hour shift the user sees (10:30 → 7:30 ≈ PST↔EST).

**Fix:**
- Add a `timezone` field to the user's profile (default to browser `Intl.DateTimeFormat().resolvedOptions().timeZone`, captured on first med save).
- Update the daily-dose generator (server) to interpret `times_of_day` in the user's stored timezone instead of UTC.
- Backfill: regenerate today's & future *pending* doses for the current user from `times_of_day` using the stored TZ when they next open the app.

### 2. Can't edit a missed dose
In `src/components/meds/today-doses.tsx`, action buttons render only when `status === "pending"`. 
**Fix:** For non-pending rows, show a small "Edit" menu (Mark taken / Mark skipped / Reset to pending) that calls the existing `runAction`. Same UI on Today and on `/meds`.

### 3. Missing "mg" on second Keppra row + odd `Keppra)er` name
The row shows blank dose because the med was saved with no `dosage_amount`/`dosage_unit`. The "er" suffix is user-typed extended-release.

**Fix in `medication-form-sheet.tsx`:**
- Require `dosage_amount` for non-rescue meds before save (block with inline error).
- After typing past a `)`, append remaining chars to a separate "Form / notes" field with a small toast hint ("Looks like 'ER' — adding as extended-release tag") so the name stays clean.
- In `today-doses.tsx`, when no dose amount and no `medication.dosage`, render "Set dose" as a link to `/meds/$medId` instead of nothing.

### 4. Can't share profile
`inviteCaregiver` calls `sendTransactionalEmail("care-invite")`, which is gated on the `notify.purplelife.org` domain being verified. If DNS isn't `active`, the send silently warns and the recipient never gets a link.

**Fix:**
- Surface the failure in the UI (toast "Invite created but email not sent — copy the link") and always return the accept URL from `inviteCaregiver` so the inviter can share manually.
- Verify domain status via the email-domain tool; if not active, show a banner in `/settings/sharing` explaining the link can be shared by copy.

### 5. "Synced 2 days ago" stale
`sync-status.tsx` displays the *data freshness* timestamp (`recorded_at`) labelled as "Synced". Pressing Sync hits Oura but Oura returns no newer readings → label unchanged.

**Fix:** Split the label into two lines:
- "Last sync · just now" (uses `lastPulled`)
- "Latest data · 2 days ago" (uses `recorded_at`)
Apply on the Today card narrative ("Synced 2 days ago") as well.

### 6. "Reading…" stuck on a journal entry for 2 days
Entries get `status = 'processing'` from `journal-extract`; if the orchestrator fails the row never transitions.

**Fix:**
- Add a server function `retryJournalExtract(entryId)` and surface a "Retry" button next to "reading…" once the entry is older than 5 minutes.
- Add a Supabase scheduled job (or on-load sweep on the journal page) that flips entries stuck in `processing` for >15 min to `failed`.

### 7. "Why is an event 'sleep'?"
The auto-tagger emits `event:sleep` from phrases like "during sleep". Sleep is a context, not a discrete event.

**Fix in `supabase/seeds/behavior_taxonomy.ts`:** move `sleep`, `nap`, `awake`, `bedtime`, `morning` from the `event` namespace to a new `context` namespace. Re-run the seed. Update the entry-card tag renderer to display `context:` tags with a calmer (muted) color so they're visually distinct from `event:`/`symptom:`/`trigger:`.

### Out of scope
- Building a full TZ-picker UI (we'll auto-detect; user can override later from Settings if needed).
- Reworking the auto-tagger model.

### Technical notes
- Files to touch: `src/components/meds/today-doses.tsx`, `src/components/meds/medication-form-sheet.tsx`, `src/lib/care.functions.ts`, `src/routes/_app/settings.sharing.tsx`, `src/components/biometrics/sync-status.tsx`, `src/routes/_app/today.tsx`, `src/components/journal/entry-card.tsx`, `src/lib/journal.functions.ts` (new helper), `supabase/seeds/behavior_taxonomy.ts`, plus 1 migration (add `profiles.timezone`, journal stuck-cleanup function).
- One Supabase migration for: `profiles.timezone TEXT`, helper `regenerate_pending_doses(user_id, tz)`, and a `cleanup_stuck_journal_entries()` function called by `pg_cron` every 5 min.
