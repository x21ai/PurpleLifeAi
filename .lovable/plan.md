## Problem

On `/today` the "you may have missed your X dose yesterday" card returns every visit — even right after tapping **I took it** — and it keeps proposing a different old dose each time.

### Root cause (verified against the live DB)

The user has many `medication_doses` rows in `status='pending'` from days ago (e.g. 2026‑06‑28, 2026‑06‑27). `MissedDoseCatchup` queries the last 24h of `pending` doses and shows the first one. When you mark that single dose `taken`, it disappears, but the **next** old pending dose immediately surfaces, so the card looks like it "comes back."

There is no duplicate-row bug — the doses are real, just never resolved. The fix is to:

1. Retire stale pending doses so the catchup stops cycling through them.
2. Make a single user action on the catchup dismiss the *card*, not just one row.
3. Keep the per-dose write so "I took it" / "I missed it" is recorded correctly.

## Plan

### 1. Auto-retire stale pending doses (`src/components/today/missed-dose-catchup.tsx`)

When the Today page mounts, before reading the catchup list, run one update:

```
update medication_doses
set status = 'missed'
where user_id = <me>
  and status = 'pending'
  and scheduled_at < now() - interval '24 hours'
```

This is the same semantic the card already implies ("you may have missed…") — doses more than 24h old are no longer actionable as a reminder. After this sweep, the catchup window (24h → 1h ago) only contains genuinely recent misses.

### 2. One action dismisses the whole catchup, not just one dose

Today's flow surfaces doses one at a time from a pool of up to 10. Change it so:

- Tapping **I took it** updates that specific dose to `taken` (with `taken_at = now()`) — unchanged, this is the authoritative record.
- Tapping **I missed it** updates that specific dose to `skipped` — unchanged.
- After either action (or **Not now**), the entire card is hidden for 24h via the existing `ALL_SENTINEL` localStorage key. No second dose pops up in the same session.
- The next day, if there's a genuinely recent missed dose (1–24h old), the card returns once, for that dose only.

Users who want to reconcile older doses use the existing `/meds/history` page (the **Review in Meds** link already points there).

### 3. Keep the delivery-log + reminder-cancel side effects

`cancelDoseReminder(doseId)` still fires after a successful action so the local notification is cleared. The `notification_delivery_log` write stays unchanged.

### 4. No schema change

Status values `pending | taken | skipped | missed` already exist and are used elsewhere (the DB shows rows with each). No migration needed.

## Files touched

- `src/components/today/missed-dose-catchup.tsx` — add the stale-sweep on mount, dismiss the whole card after any action.

## Out of scope

- Dose generation / duplicate prevention (DB check shows no duplicates per medication+time).
- Redesigning the meds history reconciliation UI.
- Push/notification delivery changes.
