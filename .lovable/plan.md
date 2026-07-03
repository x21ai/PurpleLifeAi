## Goal

Add an Olivia-style horizontal date strip near the top of `/today` so users can swipe/scroll through recent dates and view that day's stats (vitals, doses, journal entries). The reference layout shows: month label + "Today" jump button on top, then a horizontally scrolling row of day cards (Wed 17 / Thu 18 / Today 19 / Sat 20 / Sun 21…), with the selected day highlighted.

## Scope

Frontend/presentation only. No schema or server-function changes. Existing data readers (`getScoreSnapshot`, `getDosesForDate`, journal lists, etc.) already accept a date parameter or will be filtered client-side by the selected date.

## New component

`src/components/today/date-strip.tsx`
- Props: `value: Date`, `onChange: (d: Date) => void`, `daysBack?: number = 30`.
- Header row: left = current month + year with a small chevron (opens a date picker popover reusing `@/components/ui/date-picker`); right = "Today" pill button with calendar icon that jumps to today.
- Scrollable row: `overflow-x-auto snap-x snap-mandatory` with 14–30 rounded day tiles (`w-14 sm:w-16 h-16`), each showing weekday abbreviation and day-of-month. Selected tile: `bg-card ring-1 ring-primary` with primary text; today's tile shows the "Today" label instead of weekday.
- Auto-scrolls the selected tile into view on mount and when `value` changes.
- Keyboard: left/right arrows move by one day.
- Mobile-first, works desktop/tablet (uses `min-w-0`, `shrink-0` per responsive rules).

## Today page wiring (`src/routes/_app/today.tsx`)

- Add `const [selectedDate, setSelectedDate] = useState(new Date())`.
- Render `<DateStrip value={selectedDate} onChange={setSelectedDate} />` directly under the greeting header, above `TodayVitals`.
- Pass `selectedDate` down to date-aware sections:
  - `TodayVitals` — accept optional `date` prop; when set, query snapshot for that date (add a `date?: string` arg to the `getScoreSnapshot` call — server fn already supports a date, otherwise fall back to today for the initial pass and mark follow-up).
  - `TodayDoses` / `MedsMiniTimeline` — pass `date={selectedDate}` (both already accept a date via `meds-today.ts`).
  - Journal-of-the-day and hydration cards — filter by selected day.
- When `selectedDate` is not today, hide today-only nudges (install banner, onboarding checklist, first-entry nudge, re-engagement) and show a subtle "Viewing {formatted date}" caption with a "Back to today" link.

## Styling

- Use existing tokens: `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `ring-primary`. No hardcoded colors.
- Serif day number (`font-serif text-xl`) to match Purple's typography; uppercase eyebrow weekday (`label-eyebrow`).
- Hide scrollbar with `[&::-webkit-scrollbar]:hidden scrollbar-none`.

## Verification

- Playwright screenshots at 390×844, 834×1112, 1280×800: strip scrolls horizontally, selected day highlighted, tapping a day updates the vitals/doses below, "Today" button returns to today.
- Console: no errors when switching dates.

## Out of scope

- No new server functions or DB migrations.
- No historical backfill of vitals — dates with no data show the existing empty states.
- No calendar month grid view (chevron popover reuses existing `DatePicker`).
