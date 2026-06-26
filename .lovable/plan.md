## Problem

In `src/routes/_app/tools.tsx` (Wear and care section), three rows link out to `https://purplelife.org/...`:

- How Purple thinks → `https://purplelife.org/how-purple-thinks`
- Privacy & data → `https://purplelife.org/privacy`
- About Purple → `https://purplelife.org/about`

Opening an external URL drops the in-app Supabase session (different host / new tab cold load), so the marketing site's gated page bounces the user to sign in even though they're already authenticated in the app.

The app already ships the same content as internal routes (`/how-purple-thinks`, `/privacy`, `/about`, plus an auth-aware `/settings/how-purple-thinks`), so there's no reason to leave the app.

## Fix

Replace the three `ExternalRow` entries with internal `ToolRow` (TanStack `Link`) navigation:

- "How Purple thinks" → `/how-purple-thinks` (public route, works signed-in or not)
- "Privacy & data" → `/privacy`
- "About Purple" → `/about`

Keep the row styling identical; only swap the component and drop the external-link icon so it visually reads as in-app navigation.

No backend, auth, or i18n changes. No edits to `routeTree.gen.ts` (auto-generated).

## Files

- `src/routes/_app/tools.tsx` — swap the three `ExternalRow` calls in the "Wear and care" `SheetCard` for `ToolRow` with `to=` props.

## Verification

- Click each of the three rows on `/tools` while signed in — they should navigate in-app without a sign-in prompt.
- Check the same on mobile and tablet viewports (rows are full-width, layout unchanged).
