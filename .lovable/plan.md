# End-to-end QA + Journal/Timeline upgrade

Two tracks in one pass: (1) sweep every route at three viewport sizes and fix what breaks, (2) deepen the Journal + Timeline experience around backdating, date/time display, and export.

## 1. Journal & Timeline upgrades

**Journal — show real date + time, not "ago"**
- `src/components/journal/entry-card.tsx`: replace `formatDistanceToNow(...)` with `format(date, "EEE, MMM d, yyyy · h:mm a")`. Add a small relative line beneath for context (e.g. "2 days ago") so quick scanning still works.
- Apply the same shift wherever entries are rendered (timeline cards, AI summaries, biometrics "synced …" stays relative since that's a sync indicator, not user data).

**Journal — backdate any entry (new + existing)**
- `journal.new.tsx`: add a "When did this happen?" control above the composer — defaults to "Now", expands to a date + time picker (shadcn Calendar + native time input, with `pointer-events-auto`). Save into `captured_at` on insert.
- `entry-card.tsx` (or detail sheet): allow editing `captured_at` after the fact via the same picker; update Supabase row.
- Voice / photo / video flows: same picker is shared.

**Timeline — backdate + edit anything**
- Seizures: `seizures.new.tsx` already accepts a date — verify and surface "Log past event" link prominently on Timeline.
- Doses: add "Log a past dose" entry point on `meds.$medId` that writes a `medication_doses` row with `taken_at` in the past.
- Inline edit: clicking any timeline row opens a sheet to adjust the date/time (and notes where applicable).

**Timeline — easy export & capture**
- Add an "Export" menu (top right of Timeline) with: **CSV**, **PDF report** (date range, grouped by day), **Copy to clipboard**, **Share** (Web Share API on mobile, fallback download).
- Add an "Add to timeline" composer at the top of `/timeline` with a segmented control: **Type**, **Speak**, **Photo**, **Ask Purple** (free-text → AI extracts type/time/notes via existing AI gateway). Each routes into the right table (`journal_entries`, `seizure_events`, or `medication_doses` based on AI classification).
- Show date range picker (custom range) alongside Day/Week/Month/Year.

## 2. E2E QA sweep — every route at mobile (375), tablet (820), desktop (1366)

Walk each route below in the browser at all three viewports, capture findings, fix per-route. No blank pages allowed — every route gets real content + working interactions.

**Marketing & auth**
- `/`, `/about`, `/features`, `/pricing`, `/contact`, `/sign-in`, `/sign-up`, `/reset-password`

**App (authenticated)**
- `/today`, `/today/risk`, `/my-health`, `/vitals`, `/biometrics`, `/biometrics/$metric`, `/insights`, `/chat`, `/journal`, `/journal/new`, `/timeline`, `/meds`, `/meds/$medId`, `/seizures/new`, `/charter`, `/welcome`, `/settings`, `/settings/how-purple-thinks`, `/community-new`, `/privacy`, `/terms`

**Community (public)**
- `/community`, `/community/$postId`, `/community/resources`

**Admin (super admin only)**
- `/admin`, `/admin/users`, `/admin/messages`, `/admin/contact`, `/admin/feedback`, `/admin/community`, `/admin/resources`

**For every route, verify:**
- Renders content (no empty/blank state without explanation)
- Header, sidebar, bottom nav, FABs don't overlap at any viewport
- Tap targets ≥ 44px on mobile; tables scroll horizontally on mobile
- Forms submit, validation messages show
- Loading + empty + error states present
- SEO meta unique per route

**Common fixes expected:**
- Admin pages: convert tables to cards on mobile, add empty/loading/error states
- Community pages: ensure post composer reachable on mobile, comment input doesn't get covered by bottom nav
- Safe-area-inset padding on every fixed-position element
- Sidebar collapse on tablet (820px) — currently likely shows desktop sidebar

## 3. Approach

Per-route loop:
1. Browser navigate at 1366 → 820 → 375
2. Screenshot + observe
3. Patch the route file (and shared components if cross-cutting)
4. Verify
5. Move to next route

Findings + fixes are committed as we go rather than batched. Cross-cutting fixes (sidebar breakpoints, FAB safe-area) land once and benefit everything.

## Technical notes

- Date/time picker: existing shadcn `Calendar` + native `<input type="time">`, packaged into `src/components/ui/date-time-picker.tsx` for reuse across journal, seizures, doses.
- PDF export: `jspdf` (already lightweight, Worker-safe — runs client-side, no server function needed).
- CSV export: build client-side via Blob + `URL.createObjectURL`.
- AI classification for Timeline composer: reuse existing Lovable AI gateway (`google/gemini-2.5-flash`) with a small JSON-mode prompt.
- Tablet sidebar: add `md:hidden` / `lg:flex` breakpoints to `sidebar-nav.tsx` so 820px shows the mobile bottom-bar instead of a cramped sidebar.

## Out of scope

- New backend tables (everything fits existing schema)
- Pricing / plan logic
- Email or push notifications
