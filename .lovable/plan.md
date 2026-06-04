# Plan

Tackling all four items one by one. Honest note up front on Apple, then the build order.

## 0. Reality check on "direct Apple integration"

Apple HealthKit is **iOS-only and native-app-only**. There is no Apple-hosted REST API and no web SDK. A PWA cannot read/write HealthKit directly, and there is no two-way sync Apple offers to third parties. Every web product that "syncs with Apple Health" (Strava, Whoop, Oura web) is doing one of these:

1. **Health Auto Export** (paid iOS app) → posts JSON to a webhook (what we have).
2. **iOS Shortcuts** → user-built automation that posts to a webhook (free, fiddly).
3. **A native iOS companion app** using HealthKit (out of scope for Purple PWA).

So "auto-sync" means: make path #1 dead simple, and add path #2 as a free option. I'll document both clearly on the Connections card and on the Apple Health import page.

## 1. Apple Health auto-sync UX (path #1 + #2)

- On `/settings/sharing` Connections card and on `/apple-health-import`, after a successful ZIP import, show a **"Keep it synced"** panel with two tabs:
  - **Health Auto Export** (recommended) — shows the personal webhook URL, copy button, and the exact automation settings (JSON, every 1h, aggregate daily).
  - **Shortcuts** — downloadable `.shortcut` template + 4-step guide that POSTs the same payload shape.
- Add a "Last received" timestamp on the card so users can see auto-sync is alive.
- Add a tiny **/api/public/hooks/apple-health/ping** GET that confirms the token is valid (so the Shortcut can verify setup once).

## 2. Multi-source biometric cards (Apple + Oura + Whoop on one tile)

Today `biometrics` rows are tagged with `source` ('oura' | 'whoop' | 'apple_health' | 'manual'). The Biometrics page only queries `source = 'oura'`. Fix:

- Drop the `source` filter; group rows by day, then per metric keep **one line per source**.
- New `MetricCard` chart: small multi-series sparkline, one colored line per source, with source icons (Apple / Oura / Whoop) in the card header. Tooltip shows each source's value side by side so the user can see "Oura 10,000 / Apple 11,000 / Whoop 10,900".
- If only one source has data for a metric, fall back to single-line look (no visual noise).
- Add a small **source legend** below the grid.
- Add a **"What does each source provide?"** disclosure on the page listing every field Apple / Oura / Whoop populates, marked ✓/—.

## 3. Comparisons (Today vs Yesterday, WoW, MoM, YoY)

- Add a **range picker** above the metric grid: `Today · Yesterday · 7d · 30d · 90d · 1y`.
- Add a **compare-to** picker: `Previous period · Same period last year · None`.
- Each MetricCard shows: current value, delta vs comparison, and the sparkline reflects the chosen window. Skip comparison gracefully when there's no historical data.
- Metric detail route (`/biometrics/$metric`) gets a larger chart with both periods overlaid (current solid, comparison dashed), per-source lines preserved.

## 4. Expandable left nav with sub-headings

Restructure `nav-items.ts` into groups with children. Sidebar shows top-level entries always; clicking expands children inline (caret rotates). Persist expanded state in localStorage. Mobile bottom nav stays unchanged.

```text
Today
Journal           ▸ New entry · All entries · Patterns
My Body           ▸ Biometrics · Hydration · Medications · Seizures · Auras
Insights          ▸ Trends · Reports · Timeline
Care              ▸ Caregivers · Inbox · Messages
Community         ▸ Feed · Resources
Tools             ▸ Apple Health import · Travel · Data export
Account           ▸ Profile · Settings · Sharing · Privacy
```

Branding rule preserved: PURPLE wordmark stays alone at the top, account menu top-right.

## 5. Chat: notifications, multi-thread, leave/return

Tables already in place: `care_threads`, `care_thread_participants` (with `last_read_at`), `care_messages`.

- **Inbox** at `/messages` listing every thread the user participates in (owner or caregiver), sorted by `last_message_at`, with unread badge derived from `last_message_at > last_read_at`.
- **New chat** action picks a participant from your care relationships (caregiver→owner or owner→caregiver). Creates `care_threads` row + participants in one server fn.
- **Thread view** at `/messages/$threadId`: realtime via existing Supabase Realtime on `care_messages`. Back button returns to inbox (no "leave" destructively — just navigate away). Explicit **"Mute"** toggle on the thread updates a new `muted_at` column on `care_thread_participants`.
- **Notifications**: reuse existing web-push (`push-client.ts` / `push.server.ts`). On new `care_messages` insert via a serverFn, push to every other participant whose `muted_at IS NULL` and who has a push subscription. In-app: a red dot on the new sidebar "Care → Messages" item driven by an unread-count realtime subscription.
- Update `last_read_at` on thread open and on each new message received while viewing.

## Technical notes

- **DB**: one migration adds `care_thread_participants.muted_at timestamptz null`. No other schema changes — multi-source already supported by `biometrics.source`.
- **Server fns** (new, in `src/lib/`): `messages.functions.ts` (list threads, get thread, send message, mark read, mute, create thread), `apple-health.functions.ts` gets a `pingAppleHealthToken` route handler.
- **Components**:
  - `src/components/biometrics/multi-source-metric-card.tsx` (replaces single-line card)
  - `src/components/biometrics/range-compare-picker.tsx`
  - `src/components/biometrics/source-legend.tsx`
  - `src/components/layout/sidebar-nav.tsx` rewritten to support expandable groups; `nav-items.ts` becomes a tree
  - `src/components/messages/inbox-list.tsx`, `thread-view.tsx`, `new-thread-button.tsx`
  - `src/components/connections/apple-health-connection.tsx` gains the tabbed "Keep it synced" panel
- **Routes**: `src/routes/_app/messages.index.tsx`, `messages.$threadId.tsx`.
- **Push**: extend the existing dose-reminder push path; no new infra.

## Order of work (each shipped/verified before the next)

1. Multi-source biometric cards + source legend + "what each source provides" disclosure.
2. Range + comparison pickers (Today/Yesterday/WoW/MoM/YoY).
3. Left nav restructure with expandable sub-headings.
4. Apple Health auto-sync UX (tabbed Health Auto Export + Shortcuts panel, ping endpoint, last-received).
5. Messages inbox + thread view + realtime + push notifications + mute.

## Out of scope (asked but not possible / not now)

- True bidirectional HealthKit sync from web (Apple does not allow it).
- Pushing Purple data back into Apple Health (would require a native iOS companion app).
