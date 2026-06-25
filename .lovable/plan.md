## Goal
On `/journal`, add date-range filtering and page-based pagination (15 per page) for both the Active and Archive tabs. Presentation-only change in `src/routes/_app/journal.index.tsx`.

## Changes

### 1. Date range filter (above the tabs)
- Add a small filter bar with two controls and a clear button:
  - "From" date input
  - "To" date input
  - "Clear" link (only when a filter is set)
- Use native `<input type="date">` styled with our shadcn `Input` for consistency across mobile/tablet/desktop (avoids popover complexity and matches the page's quiet aesthetic).
- Add quick presets: `All`, `7 days`, `30 days`, `This month` as small pill buttons that set From/To.
- Filtering compares `captured_at` (date-only, local) against the inclusive range.
- Reset to page 1 whenever the range or tab changes.

### 2. Pagination (15 per page)
- Add `PAGE_SIZE = 15` and `page` state (1-based).
- Compute `filtered` (tab + date range), `totalPages`, `startIdx`, `endIdx`, and render `filtered.slice(startIdx, endIdx)`.
- Show the pagination control only when `filtered.length > PAGE_SIZE`:
  - `Prev` button, numbered buttons with ellipses (compact), `Next` button.
  - Active page styled with `bg-primary text-primary-foreground`; others `bg-secondary/40`.
  - Small caption: `Showing X–Y of Z`.
- Reset `page` to 1 on tab change, date-range change, or when realtime adds/removes entries change the filtered total.

### 3. No empty-state regression
- When the date range yields zero matches in a tab, show a small "No entries in this date range" message with a "Clear filter" button, instead of the generic empty state.
- The existing generic empty state still shows when the user truly has no entries (no filter applied and `entries` is empty).

## Out of scope
- No backend/query changes; we keep the existing `.limit(200)` fetch and filter client-side (consistent with current behavior). If the user later wants server-side pagination, that's a follow-up.
- No changes to realtime, pull-to-refresh, the new-entry FAB, or `EntryCard`.

## Verification
- Mobile (375), tablet (768), desktop (1280):
  - Filter bar wraps cleanly; date inputs are tappable; presets fit on one row at desktop and wrap on mobile.
  - With >15 entries, pagination shows and works; with ≤15 it is hidden.
  - Switching tabs or changing range resets to page 1.
  - Empty range shows the filtered-empty message with Clear.
