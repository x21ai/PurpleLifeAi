# Phase 3 — Caregiver dashboard polish

Today, a caregiver lands on `/care/$ownerId` only via the invite-accept redirect or a bookmarked URL. There's no home, no way to switch between people they care for, no signal of what's new since they last checked, and the per-owner view assumes they already know which tab matters. Phase 3 fixes those gaps.

## Scope

1. **`/care` index — owners switcher**
2. **Per-owner unread / activity counts** surfaced on the switcher and tab nav
3. **Caregiver alerts digest** on each owner's Today tab (what changed since last visit)
4. **Responsive nav refinements** across mobile / tablet / desktop

Step 5 / Phase 2 work (audit log, pending-changes loop, sticky tabs) is already shipped — Phase 3 does not redo any of it.

## 1. `/care` index — owners switcher

New route `src/routes/_app/care.index.tsx` (path `/care`).

- Server fn `listCaregiverOwners` in `src/lib/care.functions.ts`:
  - Auth-gated. For the current user as caregiver, returns active `care_relationships` joined with the owner's `profiles` (display_name, avatar_url, conditions[]) plus per-owner activity counters since `last_seen_at` (see step 2).
- UI: list of owner cards (avatar, name, condition chips, "new since last visit" badge, last-activity timestamp). Tapping a card → `/care/$ownerId`.
- Empty state: "No one is sharing with you yet" + link to docs.
- Pending invites surfaced inline ("Devyn invited you — Accept").

After accepting an invite, redirect goes to `/care` (not directly to `/care/$ownerId`) when the caregiver has 2+ relationships; single-owner caregivers keep current direct redirect.

## 2. Per-owner unread / activity counts

New tiny table `care_caregiver_visits` (`relationship_id` PK, `caregiver_id`, `last_seen_at timestamptz`, `last_seen_by_tab jsonb`). RLS: caregiver can read/write only their own row.

Server fns:
- `markOwnerSeen({ owner_id, tab? })` — upserts `last_seen_at` (and per-tab timestamp if `tab` passed). Called from `/care/$ownerId` on mount and on tab change.
- `getOwnerActivityCounts({ owner_id })` — returns `{ today, meds, biometrics, journal, seizures, reports }` counts of rows created/updated since the caregiver's last visit (or last per-tab visit for the matching tab).

Wire counts:
- `/care` switcher: single "12 new" badge per owner card.
- `/care/$ownerId` tab nav: small numeric badge on each tab with unread > 0; cleared on tab visit.

## 3. Caregiver alerts digest

New `CaregiverAlertsCard` on the Today tab of `/care/$ownerId`.

Content (computed in a new `caregiverReadAlerts` serverFn, owner-scoped, scope-guarded):
- **Missed doses** in the last 24h (`status='missed'`).
- **Seizures** in the last 24h.
- **Biometrics out of range** (reuse existing alert detection from `src/lib/...` if available; otherwise simple threshold check on HR / SpO2 / temp).
- **New journal entries** since last visit (count + link).

Each row links to the relevant tab and is dismissible (writes a row to `care_caregiver_visits.dismissed_alert_ids jsonb`).

## 4. Responsive nav refinements

Verified on 390 (mobile), 820 (tablet), 1280+ (desktop):

- **Mobile**: `/care/$ownerId` tab nav becomes a horizontally-scrollable pill row pinned under the header; current sticky behavior preserved. Owner switcher is a top-of-screen dropdown ("Devyn ▾") that opens a sheet with the full owners list — saves a round-trip to `/care` for multi-owner caregivers.
- **Tablet**: switcher dropdown collapses to icon+name; tab nav fits without scroll.
- **Desktop**: 2-column layout on `/care` (owner cards as grid). `/care/$ownerId` keeps current single-column shell; switcher dropdown sits next to the back button in the header.

## Files

- New
  - `src/routes/_app/care.index.tsx`
  - `src/components/care/owner-switcher.tsx` (dropdown used in header)
  - `src/components/care/owner-card.tsx`
  - `src/components/care/caregiver-alerts-card.tsx`
  - `supabase/migrations/<ts>_care_caregiver_visits.sql`
- Edited
  - `src/lib/care.functions.ts` — add `listCaregiverOwners`, `markOwnerSeen`, `getOwnerActivityCounts`, `caregiverReadAlerts`
  - `src/routes/_app/care.$ownerId.tsx` — mount switcher in header, alerts card on Today, unread badges on tab triggers, call `markOwnerSeen` on mount + tab change
  - `src/routes/care.accept.tsx` — redirect target logic (single-owner → ownerId, multi-owner → `/care`)
  - `.lovable/plan.md` — append Phase 3 record

## Migration (single block)

```sql
CREATE TABLE public.care_caregiver_visits (
  relationship_id uuid PRIMARY KEY REFERENCES public.care_relationships(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_by_tab jsonb NOT NULL DEFAULT '{}'::jsonb,
  dismissed_alert_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_caregiver_visits TO authenticated;
GRANT ALL ON public.care_caregiver_visits TO service_role;
ALTER TABLE public.care_caregiver_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "caregiver reads own visits" ON public.care_caregiver_visits
  FOR SELECT TO authenticated USING (caregiver_id = auth.uid());
CREATE POLICY "caregiver writes own visits" ON public.care_caregiver_visits
  FOR ALL TO authenticated USING (caregiver_id = auth.uid()) WITH CHECK (caregiver_id = auth.uid());
```

## Non-negotiables

- No new Edge Functions.
- Devyn's own routes (`/today`, `/meds`, etc.) untouched.
- All counter / alert work happens server-side; client only renders.
- Mobile (390), tablet (820), desktop (1280) all verified before claiming done.

## Gate

Sign in as `pmt@eigital.com` → land on `/care` → see Devyn's card with an unread badge → tap → Today tab shows alerts (recent missed dose / seizure if any) → switch tabs and watch badges clear → from `/care/$ownerId` header dropdown, jump back to the switcher without losing state.
