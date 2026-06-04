# Phase 1 — Caregiver experience polish

We'll ship three concrete improvements to the caregiver flow, then move to Phase 2 (Insights) and Phase 3 (Onboarding) in follow-up turns.

## 1. Owner-side inbox upgrades
- **Bulk actions** on `/care/inbox`: "Approve all from {caregiver}" and "Reject all" with confirm.
- **Filter chips**: All / Meds / Journal / Conditions / Other based on `pending_changes.type`.
- **Empty-state CTA** linking to `/settings/sharing` when there are zero active caregivers.
- **Pending-inbox badge** in nav already exists — add a small "new since last visit" pill driven by `last_seen_at` stored in `localStorage`.

## 2. Caregiver-side dashboard upgrades
- **Owner card** (`/care`): show "Last update X ago" + a colored dot (green / amber / red) computed from latest seizure, missed-dose count (24h), and journal silence (>72h). Pulls from existing `listCaregiverOwners` (extend server fn to return `health_signal`).
- **Owner detail** (`/care/$ownerId`): add a sticky "Quick log" bar with three buttons (Log seizure, Log dose, Add journal) that open the existing sheets — reduces taps for caregivers in the moment.
- **Alerts card**: add "Dismiss all" and group alerts by day.

## 3. Daily digest content
- Add a **"Needs your attention"** section to `care-daily-digest` email when missed doses ≥ 2, no journal entry in 72h, or a seizure in last 24h. Currently the digest is a flat list — this gives caregivers a clear top-of-email summary.
- Add **per-caregiver mute toggle** on `/settings/sharing` (writes to `care_relationships.digest_muted`) — migration adds the column.

## Technical details
- `src/lib/care.functions.ts`: extend `listCaregiverOwners` to compute `health_signal`; add `decidePendingChangesBulk({ ids, decision, note })`.
- `src/lib/care-digest.server.ts`: compute `needsAttention` block; render in the digest template.
- `src/components/care/owner-card.tsx`: render dot + "last update".
- `src/components/care/caregiver-alerts-card.tsx`: group + dismiss-all.
- `src/routes/_app/care.inbox.tsx`: filter chips, bulk action bar, last-seen pill.
- `src/routes/_app/care.$ownerId.tsx`: sticky Quick-log bar.
- `src/routes/_app/settings.sharing.tsx`: digest mute toggle per caregiver.
- Migration: `ALTER TABLE care_relationships ADD COLUMN digest_muted boolean NOT NULL DEFAULT false`.

## Out of scope (this phase)
- Realtime push when a new change is proposed (deferred to Phase 2 alongside risk-forecaster v2).
- Reordering / reassigning caregivers.
- Caregiver-to-caregiver chat (already exists at `/chat-care`).

After approval I'll implement, verify the build, then move to Phase 2 (Insights & predictions).
