# Flutter design parity checklist (acceptance bar)

Last updated: 2026-07-04 (read-only audit; no code changed)

The Flutter app on :8765 must match the original production app: the TanStack
web routes under `src/routes/_app/**` as served from `www.purplelife.org`
(what the Capacitor shell shows). This doc lists, per route, the required
structure and the specific deltas found by reading both sources side by side.

**Priority legend**

- **P0**: obviously different at a glance (missing section, wrong copy, wrong
  canvas, wrong control set, wrong order). Blocks sign-off.
- **P1**: detail polish (token instead of hardcode, spacing, icon, badge,
  secondary control). Fix after P0s in the same slice.

**Agent assignment (5 parallel fix agents, disjoint scopes)**

| Agent | Scope (write paths) | Sections below |
|---|---|---|
| 1 | `flutter/lib/features/today/` | Today |
| 2 | `flutter/lib/features/vitals/` | Vitals |
| 3 | `flutter/lib/features/meds/` | Meds |
| 4 | `flutter/lib/features/journal/` | Journal |
| 5 | `flutter/lib/features/settings/`, `features/account/`, `features/tools/`, `flutter/lib/shell/` | Settings, Account, Tools, Shell |

Shared widgets (`flutter/lib/features/shared/`, `flutter/lib/design/`) are
touched only by the agent whose acceptance criteria require it; coordinate via
the parent if two slices need the same shared file.

**How to verify**: rebuild with `./scripts/flutter-web-serve.sh --rebuild`,
open http://127.0.0.1:8765 next to https://www.purplelife.org on the same
route, signed in with the same account, at 390px and 768px widths.

---

## 0. Global deltas (apply to every screen)

Web token sources: `src/styles.css` (`:root` light, `.dark` dark) and
`design/tokens.json`. Flutter loads `design/tokens.json` via
`flutter/lib/design/tokens.dart` but screens frequently bypass it.

- **[P0] Serif font is Georgia everywhere in Flutter.** Web serif is
  `Source Serif 4` (`tokens.json > typography.fontSerif`; `--font-serif` in
  `styles.css`). Every `fontFamily: 'Georgia'` (today, vitals, meds, journal
  headers, dose cards, account, tools) must render the bundled Source Serif 4
  (add font asset if missing) or, at minimum, one shared `PurpleType.serif`
  constant so a later font swap is one line.
- **[P0] Hardcoded `Colors.white.withValues(...)`, `Colors.amber`,
  `Colors.greenAccent`, `Colors.orangeAccent` instead of tokens.** Required
  mapping (dark set from `tokens.json > colors.dark`):
  - text primary `#fafafc`, secondary `#d8d8dd`, tertiary `#8b8b92`
  - success/data-good `#6fb394`, warn `#e8c39e`, alert/destructive `#e8745c`,
    info `#82a4d4`, purplePrimary `#b084d1`
  - No `Colors.amber` / `greenAccent` / `orangeAccent` may remain in
    `flutter/lib/features/`.
- **[P1] Status/eyebrow color semantics**: web eyebrow labels are
  `--text-tertiary`; band/status strings use `--data-good|info|warn|alert`.
- **[P1] i18n**: web user copy comes from `src/i18n/locales/en.json`. Flutter
  has no ARB wiring yet; acceptance is that the literal strings match en.json
  values exactly (keys cited per screen below), so a later ARB pass is
  mechanical.
- **Canvas**: web dark canvas is `#0a0710` with a top radial purple glow
  (`rgba(176,132,209,0.14)` ellipse). Flutter `CanvasBackground` must match
  this on dark screens; Journal is the one light-canvas route (see below).

---

## 1. /today (`src/routes/_app/today.tsx` vs `flutter/lib/features/today/today_screen.dart`)

### Required structure, top to bottom (web order)

1. Pull-to-refresh indicator (Flutter `RefreshIndicator` is acceptable).
2. Today-only banners when applicable: restore banner, incoming care invites,
   install banner, missed-dose catch-up, first-run empty state
   (`journalCount == 0`, dismissible, copy `today.empty*`).
3. Date eyebrow: `EEEE, MMMM d` (class `today-eyebrow`).
4. Greeting h1, serif 32px (40px on wide): `"{greeting}, {firstName}."`
   Greeting strings from i18n: `todayPage.morning/afternoon/evening`, plus
   "Still up" before 5am and "Hi" fallback.
5. Sub-line: first-words note (`todayPage.firstWordsNote`) or condition
   greeting suffix, only when there is no AI narrative.
6. Lede paragraph (max width 600): AI narrative if present, else the
   deterministic per-day condition prompt ("How's today feeling?" fallback).
7. **Date strip** (`src/components/today/date-strip.tsx`): horizontal
   scroller, 7 past + today + 7 future tiles (future disabled at 30%
   opacity), today centered, tile = 56x72 rounded 18, weekday eyebrow +
   serif day number, selected tile ring `primary/40`; header row has
   `MMM d` label, a "Today" pill when off-today, and a calendar picker.
   Off-today also shows the "Viewing {date} / Back to today" glass pill row.
8. **Score strip**: one `glass-surface` rounded-20 container with a 3-column
   grid of ScoreTiles labeled **Readiness, Sleep, Activity** (web
   `score-tile.tsx`). Active tile is scaled (numeric 56 to 72px vs 36 to
   44px), inactive at 70% opacity. Tapping the active tile opens the
   full-screen score detail (ScoreHero + band phrase + narrative + "See the
   full reading" link to the risk detail). No always-visible hero on the page.
9. **"Your signals" vitals grid** (`today-vitals.tsx`): eyebrow "Your
   signals" + "View all >" link; 2-col (3-col wide) tiles of only-non-null
   metrics (Readiness, Sleep, Activity, HRV ms, Resting HR bpm, SpO2 %,
   Stress, Steps, VO2 max); empty state is a card "Connect a device to see
   your signals" + "Oura, Whoop, or Apple Health: your readings appear here
   once synced."
10. Narrative block (glass card) when AI narrative exists.
11. **Quick actions** grid: Journal + Meds (plus Seizure accent tile when the
    profile shows seizure conditions), icon over 14px semibold label, 80px
    tall glass cards.
12. Meds mini timeline + Today doses panel.
13. **"More for today" disclosure**: full-width glass button with chevron;
    expanded content includes connect-wearables card, nudges, team
    announcement (`todayPage.fromTeam`), body measurements row (Temp delta,
    Resp /min, SpO2), travel cards, onboarding checklist, tips, weekly recap,
    7-day trend strip, top insight, and the compact sync status + biometrics
    link at the bottom.

### Deltas found

- **[P0] No date strip at all.** Item 7 missing; historical day view missing.
- **[P0] Score section is wrong shape.** Flutter always renders a Readiness
  `ScoreHero` above a strip of **Sleep / Activity / Stress**. Web has no
  inline hero; the strip is **Readiness / Sleep / Activity**, and the hero
  appears only in the tap-through detail overlay. Fix tile set, drop the
  always-on hero, add the detail overlay (or route) with band phrase copy
  ("A steady day." / "Doing alright." / "Worth slowing down." / "Time to be
  careful.").
- **[P0] "Your signals" grid missing** (item 9), including its empty state.
- **[P0] Quick actions row missing** (item 11).
- **[P0] "More for today" disclosure and all secondary cards missing**
  (item 13).
- **[P0] Lede copy invented.** Flutter shows "Today at a glance from your
  latest synced signals." etc. Web shows the narrative itself or the
  condition prompt. Remove invented strings.
- **[P0] `SyncStatusBar` sits directly under the greeting.** Web /today has
  no sync bar there; compact sync status lives at the bottom of "More for
  today". Move or remove.
- **[P1] Doses card header**: web mini timeline (dots on a 24h axis) above
  the dose list is missing; Flutter's simplified "Today / Medications >" card
  is acceptable only until Meds agent lands the shared timeline, then reuse.
- **[P1] Greeting strings hardcoded; use en.json `todayPage.*` values.**
- **[P1] Offline pill: keep (Flutter-specific, offline-first requirement).**

---

## 2. /vitals (`src/routes/_app/vitals.tsx` vs `flutter/lib/features/vitals/vitals_screen.dart`)

### Required structure

1. Back link: arrow + `vitals.back` = **"Today"** (not "Back to Today").
2. Header row: eyebrow `vitals.eyebrow` = "Vitals" left, **pencil edit icon
   button** right (44px round hover target).
3. Serif h1 44px+: `vitals.title1` + `vitals.title2` =
   **"How your body is / reading today."**
4. When no data: link line "Connect a device to see your readings >" to
   /settings.
5. Latest-reading marker: glass-surface rounded-20 bar; the date label
   ("Jul 4" style, or "No data yet") is semibold with a 2px bottom border in
   `--purple-primary` (tab-like underline).
6. Metric sections, in this exact order, each = glass pill header (icon +
   18px semibold title) + 2-col grid of square-ish metric cards:
   1. **Readiness** (Readiness Score, Symptom Radar)
   2. **Sleep** (Sleep Score, Body Clock)
   3. **Activity** (Activity Score, Steps)
   4. **Stress** (Daytime Stress, SpO2 %)
   5. **Metabolic Health** (Glucose "No data", Meals "Log a meal")
   6. **Hydration & auras** section: header pill with droplets icon, then a
      single wide tappable card to /hydration ("Open hydration day view",
      band-colored "Track water, electrolytes, déjà vu", serif
      "Hourly + minute-precision timeline")
   7. **Heart Health** (Cardio Capacity VO2max, Resting Heart Rate bpm)
   8. **Core Metrics** (HRV ms, 30-day steps)
7. Metric card anatomy: 13px muted title; status line UPPERCASE 12px tracked
   in the **band color** (`--data-good|info|warn|alert`); chevron pinned top
   right; serif numeric 44 to 56px bottom-aligned with muted unit suffix.

### Deltas found

- **[P0] Title copy wrong**: Flutter shows "Your / body". Must be "How your
  body is / reading today." (`vitals.title1/2`).
- **[P0] Missing sections**: Metabolic Health and the Hydration & auras card
  are absent; Heart Health and Core Metrics must come after Hydration.
- **[P0] Status color is always amber.** Web maps band to
  `--data-good` (#6fb394), `--data-info` (#82a4d4), `--data-warn` (#e8c39e),
  `--data-alert` (#e8745c). Bands per card as coded on web: Activity Score =
  good/excellent color set, Stress + SpO2 + RHR + HRV + 30-day steps = info
  (`good` band), others warn (`fair`). Replicate `BAND_COLOR` mapping.
- **[P1] Back link copy** "Back to Today" vs web "Today".
- **[P1] Pencil edit button missing** from the eyebrow row.
- **[P1] Latest-reading marker missing the purple bottom-border underline**
  and semibold treatment.
- **[P1] Metric card chevron missing** (top-right muted chevron).
- **[P1] `SyncStatusBar` does not exist on web /vitals.** Either remove or
  keep as an intentional Flutter addition; if kept, place it below the
  header, visually as a compact pill, and note it in the slice report.
- **[P1] Cached-data footnote ("Showing cached vitals (offline)") is a
  Flutter-only addition: keep (offline-first) but style as 11px tertiary.**

---

## 3. /meds (`src/routes/_app/meds.tsx` + `src/components/meds/today-panel.tsx` vs `flutter/lib/features/meds/meds_screen.dart` + `dose_list.dart`)

### Required structure

1. Eyebrow `meds.eyebrow` = "Medications"; serif h1 `meds.title1/2` =
   **"Your schedule, / your record."** (smaller once library exists).
2. When library empty: narrative intro block (`meds.intro`).
3. **Actions toolbar**, right-aligned: round icon buttons for Add (+, filled
   primary), Scan label (camera, outline), Voice (mic, outline), Dose history
   (history icon, links to /meds/history).
4. **Today's doses panel** (`today-panel.tsx`), glass card:
   - Header: pill icon + serif "Today's doses" (`meds.todayDoses`), and when
     any pending: "Mark all taken" outline pill button.
   - **Day navigation**: prev/next chevron pills + date label with timezone +
     native date input (max = today) so past days are editable.
   - **14-day adherence stat**: "{pct}% on schedule, last 14 days" +
     "{taken} of {total} doses logged" (`meds.onScheduleLabel`,
     `meds.dosesLogged`).
   - "{taken}/{total} taken · {missed} missed" counter line.
   - **24h timeline**: horizontal axis with ticks at 0/6/12/18/24, "now"
     cursor line, one status-colored dot per dose (taken = success, missed =
     destructive, skipped = muted, pending = primary), labels 12a 6a 12p 6p 12a.
   - Dose rows: time in a status-colored glass pill, med name, then per
     status: pending = Taken (filled) / Snooze / Skip; taken = "Taken" chip +
     **Undo**; missed or skipped = status chip + **"I took it"** reclassify;
     out-of-stock pending = "Refill to update" link to the med detail.
   - Empty: `meds.noDosesToday` + Add a medication button.
5. Refill forecast card + adherence extras card (`med-intelligence-cards`).
6. Library: eyebrow `meds.libraryTitle` = "All medications"; **underline tabs**
   Active / Archive (archive shows count), plus right-aligned "Export to
   calendar" text button (30-day .ics).
7. Filter chips (Active tab only): All, Medications, Supplements, Vitamins,
   Rescue (`meds.filter*`; note web chip label is "Medications", not "Meds").
8. Hint line `meds.manageHint`.
9. Med list: grouped by kind with 11px uppercase group headers when filter is
   All; rows in one bordered card with dividers. Row anatomy: serif 17px
   name, badges (Out of stock / Refill soon / Archived), right-aligned
   strength + "Next today {time}" or "As needed" or times list or
   "Starts {date}", chevron, kebab menu (Edit / Archive or Restore / Delete
   with confirm dialog), and an inline "Taken" pill button when the next dose
   is pending.
10. Empty state (no meds at all): dashed-border card, pill icon,
    `meds.emptyTitle` = "Add the medications you take." + `meds.emptyBody` +
    Add button.
11. Reminder nudge card; mobile FAB (+) bottom-right above the tab bar.
12. Sheets: medication form (add/edit), scan-label, voice-add. If the full
    form is out of slice scope, the FAB and toolbar must still exist and open
    the form route/sheet stub; the "coming in a later phase" SnackBar is not
    acceptable at P0 for the Add button visibility itself.

### Deltas found

- **[P0] Header copy wrong**: "MEDS / Your medications" instead of
  "Medications / Your schedule, your record."
- **[P0] No add flow affordances**: no toolbar (add/scan/voice/history), no
  FAB. Add button currently only appears inside the empty state and shows a
  SnackBar.
- **[P0] Today's doses panel missing**: adherence stat, day navigation, 24h
  dot timeline, taken/missed counts, Undo and "I took it" reclassify, and
  out-of-stock refill link. Flutter's panel is title + rows with
  Taken/Snooze/Skip only, and hides entirely when there are no doses (web
  shows the empty panel with `meds.noDosesToday`).
- **[P0] Library not grouped by kind**, no "All medications" eyebrow, no
  archive count, no export-to-calendar, no kebab actions, no refill/stock
  badges, no next-dose text, no inline Taken.
- **[P0] Refill forecast and adherence extras cards missing.**
- **[P0] Tabs are pill-style; web uses underline tabs on a bottom border.**
- **[P1] Empty-state copy**: "No medications yet..." vs web
  `meds.emptyTitle/emptyBody`.
- **[P1] Filter chip label**: Flutter "Meds" vs web "Medications"; selected
  chip on web is solid `--primary` with light text, not white/14%.
- **[P1] Dose status colors**: use token success/destructive, not
  greenAccent/orangeAccent.
- **[P1] Reminder nudge and manage-hint line missing.**
- **[P1] Web /meds renders on the standard theme canvas (no custom radial
  glow); keep Flutter canvas consistent with the app default dark canvas.**

---

## 4. /journal (`src/routes/_app/journal.index.tsx` + `entry-card.tsx` vs `flutter/lib/features/journal/journal_screen.dart`)

### Required structure

1. **Light canvas.** Web journal hardcodes `#faf8fb` with a lavender radial
   glow (`rgba(237,228,244,0.85)`), light-mode text tokens. This is the only
   audited route that is light regardless of theme.
2. Header row: eyebrow `journal.eyebrow` = "Journal"; serif h1
   `journal.title1/2` = **"Everything you've / shared, in order."**; refresh
   icon button right (desktop).
3. Offline queue banner when entries are pending upload.
4. Tab pill: Active / Archive (`journal.tabActive/tabArchive`).
5. Date filter card: preset pills All / 7 days / 30 days / This month
   **plus From and To date inputs** and a Clear button when filtered.
6. Entry list, newest first, paginated **15 per page** with Prev / numbered /
   Next pills and "Showing X to Y of Z" caption.
7. Entry card anatomy (`entry-card.tsx`, glass card rounded 20):
   - Header: kind icon in a small round pill (pencil/mic/camera/video/
     sparkles), "EEE, MMM d, yyyy · h:mm a" plus relative "x ago" line,
     processing spinner ("reading…") or "Retry reading" pill when stale or
     failed, kebab menu (Edit / Archive, or Restore / Delete permanently with
     confirm dialog).
   - Body: entry text (serif 15px), italic quoted voice transcript, media
     grid (images/videos, 2 to 3 columns), AI summary in an inset glass
     surface, AI tag pills (primary tint), "Logged to your tools: ..." line.
   - Inline edit mode with date-time picker and text areas.
8. Empty states: Active = centered round icon (book) + `journal.emptyTitle`
   serif paragraph; Archive = `journal.emptyArchive`; filtered-empty = "No
   entries in this date range." + Clear filter.
9. **FAB**: fixed bottom-right primary pill with plus icon AND label
   `journal.newEntry` = "New entry" (not icon-only), above the tab bar.

### Deltas found

- **[P0] Canvas is dark; web journal is light** (item 1). At-a-glance fail.
- **[P0] Title copy wrong**: "JOURNAL / Your story" vs "Journal /
  Everything you've shared, in order."
- **[P0] No New-entry FAB.** Only a small + icon in the header. Add the
  labeled FAB; keep or drop the header + icon (web has none).
- **[P0] Entry card too thin**: missing kind icon, relative time, kebab
  actions (edit/archive/restore/delete), media thumbnails (currently a text
  count), AI summary inset styling, AI tag pills, processing/retry states.
- **[P0] Empty-state copy invented** ("Your story starts here...") vs web
  `journal.emptyTitle` / `journal.emptyArchive`.
- **[P1] From/To date inputs missing** (presets only).
- **[P1] No pagination** (web caps 15/page with pager pills).
- **[P1] Pending-upload banner: keep, but style like web's offline queue
  banner (glass surface, upload icon), copy "N entries waiting to upload"
  is fine.**

---

## 5. /settings (`src/routes/_app/settings.tsx` vs `flutter/lib/features/settings/settings_screen.dart`)

### Required structure

1. Eyebrow "Settings"; serif h1 `settings.title1/2` = "All in your /
   control."; intro `settings.intro`.
2. Hub cards (3-up on wide, stacked narrow): Account / Settings (active,
   primary border + tint) / Tools, with subtitles from `settings.hub.*`.
   Web hub card = icon above title above subtitle (column), active card has
   `border-primary bg-primary/5`.
3. Group **"Your health"**: rows Medications (`settings.rows.meds*`), Lab
   reports (`labs*`), and Past episodes (`pastEpisodes*`, destructive icon
   tone) only when profile has seizure conditions.
4. Group **"People"**: Sharing & access; Community row behind platform flag.
5. Group **"App"**: Travel mode only.
6. **"Add past history" card**: history icon + serif title, body copy, two
   inner link tiles (Old medications "Set start & end dates in the past";
   Past episodes when seizure).
7. **Preferences section** (lazy web component), **AI provider section**,
   **What I track**, **Condition history**.
8. Group **"Data"**: data section (export/delete).
9. Group **"Help"**: Contact the team row; About section below.
10. Footnote `settings.moved` ("Looking for connections, alarms, or your
    device? They moved to Tools. ...").
11. Admin group + row when user is admin.
12. Row anatomy: tinted round icon chip, serif ~18px title, 12px muted
    subtitle, chevron; rows share one bordered card with dividers.

### Deltas found

- **[P0] Missing sections**: Add past history card, Preferences, AI provider,
  What I track, Condition history, Data group, Help group + About, moved
  footnote, Admin. Flutter jumps from App group straight to a "Signed in"
  card.
- **[P0] "Signed in" + Sign out card does not exist on web /settings**
  (sign-out lives in Account; the burger drawer also has it). Remove from
  Settings, keep in Account.
- **[P0] Raw user UUID is displayed.** Never show the UUID; web shows email
  in Account only.
- **[P0] Contact row is under "App"; web has it under "Help".**
- **[P1] Hub card layout**: web is a column (icon / title / subtitle); Flutter
  is icon-row. Active state needs primary border + soft tint.
- **[P1] Row icon chip missing** (web wraps icon in a tinted circle).
- **[P1] Group label style**: 11px uppercase tracked 0.12em muted.
- **[P1] Eyebrow "SETTINGS" above h1: web shows eyebrow "Settings" (12px
  tracked), and the h1 is 44px+ serif; Flutter's displaySmall is close but
  verify scale at 390px.**

---

## 6. /account (`src/routes/_app/account.tsx` + `sheet-page.tsx` vs `flutter/lib/features/account/account_screen.dart`)

### Required structure

1. **Sheet layout**: centered page title "Account" (20 to 24px, not serif
   display), close X at left edge (navigates back / to /settings), content
   column max ~576px (`tokens.json > layout.sheetMaxWidth`), section labels
   11px uppercase tracking 0.18em.
2. Sections in order, each in `sheet-card` glass cards:
   - **Profile**: avatar card (photo, change/remove) then profile fields
     (first name etc.), saving to `profiles`.
   - **Security**: password change card; two-factor card.
   - **Region & language** (`account.language`): `locale.title/subtitle`
     copy + Country / Time zone ("Use my device") / Language fields, saving
     to `profiles.country/timezone/locale`, "Saved" toast.
   - **Appearance**: 3-option grid Dark (Default) / Light (Always light) /
     System (Match device), active option gets primary border + ring, and it
     must actually switch the theme.
   - **Subscription**: plan management card.
   - **Invite**: "Get an invite code" copy, Create button, then code +
     "Unlimited uses" + Copy link / Share buttons.
   - **Session**: "Signed in as" + email + Sign out outline button.

### Deltas found

- **[P0] Almost every card is a static placeholder** ("integration point",
  dead Password/2FA/Region rows, static Subscription and Invite). Each card
  must either be functional (profile fields, locale save, sign out already
  are partially) or clearly out of scope per the parent; placeholder copy
  like "Avatar and profile fields integration point" may not ship.
- **[P0] Appearance picker is cosmetic**: selecting Light/System changes
  nothing. Wire to the Flutter theme mode (and persist).
- **[P0] Header layout**: left-aligned serif "Account" instead of the
  sheet-style centered title with close X.
- **[P1] Section label letter-spacing (0.18em vs 1.1) and card radius
  (`radius.sheetCard` = 28) per tokens.**
- **[P1] Email loads from session; ensure it displays (currently only after
  profile load path succeeds).**

---

## 7. /tools (`src/routes/_app/tools.tsx` vs `flutter/lib/features/tools/tools_screen.dart`)

### Required structure

1. Sheet layout identical to Account (centered "Tools" title, close X,
   sheet column width).
2. **Device connection cards** for Oura, Whoop, Apple Health: these are live
   components on web (connection status, last sync, connect/disconnect,
   sync-mode select), not static rows.
3. "Set up a new device" full-width row (plus icon) opening a picker:
   title + "Choose a device or app to connect. Purple supports these today.",
   rows Oura Ring / Whoop / Apple Health that scroll to and highlight the
   matching card, footer "More devices are on the way. Email
   hello@purplelife.org to request one."
4. Section **Notifications**: phone alarms / native notifications panel.
5. Section **Tools & utilities**: rows Medications (to /meds), Lab reports
   (to /reports), Travel mode (to /settings/travel), each icon chip + title +
   subtitle + chevron.
6. Section **Wear and care**: rows How Purple thinks, Privacy & data, Terms
   (native) or About Purple (web); title-only rows with chevron.

### Deltas found

- **[P0] Device cards are static "Not connected" with a dead Connect
  button.** Must reflect real connection state (tokens tables via repository)
  and either launch the OAuth/native connect flow or route to it. A dead
  button may not ship.
- **[P0] Every row in Tools & utilities except Medications, and all Wear and
  care rows, have empty `onTap: () {}`.** Lab reports must go to
  `/settings/reports`, Travel to `/settings/travel` (both routes exist in
  `AppRoutes`); How Purple thinks / Privacy / Terms need at least in-app
  content routes or web links, not silent no-ops.
- **[P0] Notifications section is a placeholder row**; needs the med-reminder
  notifications panel (local notifications exist natively per handoff).
- **[P0] Header layout**: left serif "Tools" vs centered sheet title +
  close X.
- **[P1] Picker rows just `Navigator.pop`; web scrolls to + flash-highlights
  the device card.**
- **[P1] Wear-and-care rows on web are title-only (no icon, no subtitle);
  Flutter added icons/subtitles. Match web.**

---

## 8. Shell: top bar, bottom nav, burger drawer

Web sources: `src/components/layout/mobile-top-bar.tsx`, `bottom-nav.tsx`,
`app-shell.tsx`. Flutter: `flutter/lib/shell/top_bar.dart`,
`bottom_nav.dart`, `shell_menu_sheet.dart`.

### Top bar

- Web (native variant): sticky frosted `nav-glass-top` with safe-area top
  padding; wordmark "Purple" (12px) left; right cluster =
  **header sync button** (syncs wearables, spins, fires
  `purple:wearable-synced`), **pending care-inbox badge**, **profile menu**,
  burger.
- **[P0] Flutter sync button is dead** (`onPressed: () {}`). It must trigger
  the same incremental wearable sync + provider refresh as pull-to-refresh,
  with a spinning state.
- **[P1] Pending-inbox badge and profile menu are absent.** Profile menu may
  be considered covered by the burger drawer (Account entry); note the
  decision in the slice report. Inbox badge needs care-invite count.
- **[P1] Wordmark weight/tracking: web uses `.wordmark` (semibold, 0.45
  letter-spacing per tokens).**

### Bottom nav

- Web native tab bar: floating rounded-28 glass bar, max-w-3xl, 5 columns:
  **Today, My Body (/my-health), center capture FAB (+ to /journal/new),
  Insights (/insights), Settings**. Active tab = purple primary, stroke 2;
  inactive = `--text-tertiary`. FAB: 56px primary circle, -24px raise, ring
  in `--glass-nav-border`, purple glow shadow.
- Flutter tabs are **Today, Vitals, FAB, Meds, Settings**. `/my-health` and
  `/insights` do not exist in the Flutter router yet, so this is an accepted
  interim mapping, **not** a silent decision: [P1] keep current mapping,
  document it in the slice report, and match web icon metaphors (sun, heart
  pulse, trending-up, settings sliders) where applicable. Everything else
  (radius 28, FAB size/raise/glow, active color, 11px labels) already tracks
  web; verify against tokens after any change.

### Burger endDrawer

- Per operator spec (AGENTS.md): right-edge `Scaffold.endDrawer`, RTL slide,
  flush under the top bar, glass panel ~280 to 336px, routes **Account,
  Settings, Tools, Care, Sign out**. The current `shell_menu_sheet.dart`
  implements exactly this: **compliant, do not regress to the web left
  sheet.**
- **[P1] Web's drawer footer has Privacy & safety and Terms links; the
  operator route list omits them. Optional: add them as small footer links
  under Sign out only if the Tools "Wear and care" rows do not land first.**

---

## Sign-off checklist (parent runs after all 5 agents merge)

1. `cd flutter && flutter analyze && flutter test` pass.
2. `./scripts/flutter-web-serve.sh --rebuild`; browser-verify each route at
   390px and 768px against production, per section above.
3. No `Colors.amber|greenAccent|orangeAccent` and no `fontFamily: 'Georgia'`
   under `flutter/lib/features/` (grep).
4. All P0 boxes closed; P1 leftovers listed in `CURSOR_HANDOFF.md`.
5. No fake health metrics introduced anywhere (empty states only).
