# Phase 4 — Owner controls & audit, then Phase 5 — Pending-changes inbox

Settings → Sharing already ships scope toggles, revoke, audit log (in the scope sheet), and a pending approvals strip. Phase 4 fills the gaps the owner actually needs day-to-day; Phase 5 elevates pending approvals into a first-class inbox.

---

## Phase 4 — Owner controls & audit

### 4.1 Sharing page polish (`/settings/sharing`)
- Replace `confirm(...)` revoke with a real `AlertDialog` showing caregiver email, role, count of writes to-date, and a hard "Revoke access" red button.
- Move the audit log out of the per-relationship sheet into a top-level **"Activity"** section on the page so the owner can see *all* caregiver activity in one place, filterable by caregiver and by resource (journal/meds/biometrics/seizures).
- Add **"Export CSV"** button on the Activity section → calls new server fn `exportCareAuditCsv` which returns a CSV string of `{ at, caregiver_email, action, resource_type, resource_id, metadata }` rows for the owner. Browser triggers download.
- Add a per-scope **"Pause all writes"** master switch on each relationship row — flips every `*:write` and `*:propose` scope off in one call (uses existing `setScopes`); shows current state ("Read-only" / "Can write").

### 4.2 Daily caregiver-activity digest email
- New server-only helper `src/lib/care-digest.server.ts` builds a per-owner summary of the previous 24h from `care_audit_log` joined with caregiver profiles: who did what, on which resource, with counts and one-line previews (journal text truncated to 120 chars).
- New email template `src/lib/email-templates/care-daily-digest.tsx` registered in `registry.ts`.
- New public cron route `src/routes/api/public/cron/care-daily-digest.ts` — runs once/day; queries owners with active relationships and at least one audit row in the last 24h, sends digest via the existing queue. Skip owners with `consent_share_with_caregivers = false` or who have opted out (new column, see migration).
- New owner preference toggle on `/settings/sharing` ("Email me a daily summary of caregiver activity"). Default **on** for owners with ≥1 active caregiver.

### 4.3 Migration
```sql
ALTER TABLE public.profiles
  ADD COLUMN care_daily_digest_enabled boolean NOT NULL DEFAULT true;
```

### 4.4 pg_cron schedule
Add a daily job (08:00 UTC) hitting `/api/public/cron/care-daily-digest` with the shared cron secret (same pattern as `dose-reminders`).

---

## Phase 5 — Pending-changes inbox UI

Today, pending caregiver proposals appear as a small strip at the top of `/settings/sharing` with text-only approve/reject. Phase 5 turns that into a real review experience.

### 5.1 New route `/care/inbox` (owner-facing)
- File `src/routes/_app/care.inbox.tsx`, linked from Settings → Sharing and from a new badge on the top bar when `pending.count > 0`.
- Server fn `listPendingChangesDetailed` (extends existing `listPendingChanges`) returns each pending change with: caregiver profile, target row snapshot (current value from the live table), proposed payload, and a computed **diff** (server-side, field-by-field) for known `type` values (`add_journal_comment`, `add_meds_note`, `propose_med_change`, `propose_journal_edit`, etc.).
- UI per row: caregiver avatar + name, change type, side-by-side **Current → Proposed** diff with added/removed fields highlighted (semantic tokens `--success` / `--destructive`), free-form decision note input, **Approve** / **Reject** buttons. Approve writes through to the target table inside `decidePendingChange` (extends existing fn to actually apply known change types, not just mark approved).
- Empty state: "All caught up — no pending changes from caregivers."

### 5.2 Notifications
- When a caregiver creates a `pending_change`, fire an in-app alert via existing `alerts` table (`kind='caregiver_proposal'`) and an email using the existing `caregiver-write-notice` template (already wired) — link points to `/care/inbox`.
- After owner decides, the existing `caregiver-proposal-decision` email already notifies the caregiver — keep as-is.

### 5.3 Strip on `/settings/sharing`
Collapses to a single line: **"3 changes waiting for you → Open inbox"** linking to `/care/inbox`. Removes the inline approve/reject buttons (kept in the inbox).

### 5.4 Files

**New**
- `src/routes/_app/care.inbox.tsx`
- `src/components/care/pending-change-row.tsx`
- `src/components/care/pending-change-diff.tsx`
- `src/components/care/revoke-relationship-dialog.tsx`
- `src/components/care/audit-activity-section.tsx`
- `src/lib/care-digest.server.ts`
- `src/lib/email-templates/care-daily-digest.tsx`
- `src/routes/api/public/cron/care-daily-digest.ts`
- One migration: `care_daily_digest_enabled` column + pg_cron job

**Edited**
- `src/lib/care.functions.ts` — `exportCareAuditCsv`, `listPendingChangesDetailed`, extend `decidePendingChange` to apply approved writes, extend `setScopes` use via new `pauseAllWrites` helper (or just call setScopes from the UI), preference update for digest
- `src/lib/email-templates/registry.ts` — register digest template
- `src/routes/_app/settings.sharing.tsx` — alert-dialog revoke, top-level Activity section, digest toggle, collapsed pending strip
- `src/components/layout/mobile-top-bar.tsx` + sidebar nav — pending-inbox badge when `pending.count > 0`
- `.lovable/plan.md` — append Phase 4 + 5 records

---

## Non-negotiables
- No new Edge Functions (cron uses TanStack server route at `/api/public/cron/*`, same pattern as `dose-reminders`).
- Caregiver UX (`/care/*`) unaffected aside from the proposal-creation success toast updating to mention "the inbox".
- All three viewports verified: mobile (390), tablet (820), desktop (1280+).
- All writes inside `decidePendingChange` for approved changes go through `supabaseAdmin` server-side and log to `care_audit_log` (caregiver as actor, owner as patient).

## Gate
1. Sign in as Devyn (owner), `/settings/sharing` → see Activity section listing recent caregiver writes, click **Export CSV**, file downloads with correct rows.
2. Toggle "Pause all writes" on `pmt@eigital.com` row → caregiver dashboard immediately drops to read-only.
3. Switch to `pmt@eigital.com`, propose a journal edit from `/care/$ownerId`.
4. Back as Devyn: top-bar badge shows "1", `/care/inbox` shows the diff, approve → change applied + caregiver gets decision email.
5. Trigger cron locally (curl `/api/public/cron/care-daily-digest` with secret) → digest email lands in Devyn's inbox with yesterday's activity.

Both phases ship in the same loop, Phase 4 first then Phase 5.
