# Plan

## 1. Today — calm empty-state for brand-new users

The existing `/today` dashboard stays exactly as it is for returning users. For users with **zero journal entries**, render a calm full-bleed welcome card above the dashboard.

- In `src/routes/_app/today.tsx`, add a `journal_entries` count query alongside the existing fetches.
- When count === 0, render a new `TodayEmptyState` component at the top of the page:
  - Eyebrow: "Welcome to Purple"
  - Serif headline: "Start where you are."
  - One short body line: "Write a sentence, speak a thought, or snap a photo. Purple does the rest."
  - Primary CTA "Start journaling" → routes to `/journal/new` (existing capture route)
  - Secondary quiet link "Skip for now" that dismisses the card for the session (localStorage flag)
- Component lives at `src/components/today/empty-state.tsx`, dark-theme aware, matches the ScoreHero spacing rhythm.

## 2. `/charter` — warmer tone + tighter mobile/desktop rhythm

Refine copy and layout in `src/routes/_app/charter.tsx`:
- Soften the headline split ("Why Purple exists." as the H1, drop the abstract "Founding charter.").
- Reorder sections: **Why Purple exists → Our standard → Promises we keep → Things we won't do**. Ends on warmth, not prohibition.
- Rewrite each section with the Purple voice (calm, human, never clinical — e.g. "We will never sell your data" → "Your story is yours. We won't sell it, rent it, or hand it to brokers.").
- Layout: wider serif headline on desktop, narrower measure on mobile, more breathing room between sections (`space-y-14 sm:space-y-16`), larger top padding on mobile so the back-link doesn't crowd the eyebrow.
- Same content visible on every viewport — no responsive hiding.

## 3. Country, time zone, and language — sign-up + welcome + settings

### Schema (one migration)
Add to `profiles`:
- `country` text (ISO 3166-1 alpha-2, nullable)
- `locale` text (`'en'` | `'es'`, default `'en'`)
- `timezone` already exists — no change

### Shared picker components (`src/components/locale/`)
- `country-select.tsx` — searchable combobox, ~50 common countries (full list kept in `src/lib/countries.ts`).
- `timezone-select.tsx` — uses `Intl.supportedValuesOf('timeZone')` grouped by region, with a "Detect from browser" button (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- `language-select.tsx` — English / Español.

All three auto-detect sensible defaults from the browser on first render when the field is empty.

### Where they appear
- **Sign-up** (`src/routes/sign-up.tsx`): add a compact "Where are you?" block (country + time zone + language) below the password field. Values are written to the profile on first successful sign-in via the existing profile-bootstrap path.
- **Welcome** (`src/routes/_app/welcome.tsx`): add a "Locale" step / section so users who signed up via Google can set them. Pre-fills from browser detection.
- **Settings** (`src/components/settings/preferences-section.tsx`): new "Region & language" subsection with the same three pickers, save-on-change with toast confirmation.

### i18n (English + Spanish)
- Install `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- `src/i18n/index.ts` initializes i18next with `en` and `es` resource bundles.
- `src/i18n/locales/en.json` and `es.json` — start with the visible strings on: nav, sign-in, sign-up, welcome, today empty-state, settings preferences, charter. Other routes keep raw English strings for now and get translated incrementally; the contract is "no schema or component churn needed to add a language later."
- Provider wired in `src/routes/__root.tsx`.
- Language source of truth: `profile.locale` once signed in, browser detection before. Updating the setting calls `i18n.changeLanguage()` immediately.

## Files touched

- `supabase/migrations/<new>.sql` — add `country`, `locale` to `profiles`
- `src/routes/_app/today.tsx` — empty-state branch
- `src/components/today/empty-state.tsx` *(new)*
- `src/routes/_app/charter.tsx` — copy + layout
- `src/lib/countries.ts` *(new)*
- `src/components/locale/{country,timezone,language}-select.tsx` *(new)*
- `src/routes/sign-up.tsx` — locale block
- `src/routes/_app/welcome.tsx` — locale step
- `src/components/settings/preferences-section.tsx` — Region & language subsection
- `src/i18n/index.ts` + `src/i18n/locales/{en,es}.json` *(new)*
- `src/routes/__root.tsx` — i18n provider
- `package.json` — add `i18next`, `react-i18next`, `i18next-browser-languagedetector`

## Out of scope
- Translating every route into Spanish in this pass — only the routes listed above. The infra makes incremental translation a copy-paste job.
- No new edge functions; everything reads/writes through existing profile updates.
