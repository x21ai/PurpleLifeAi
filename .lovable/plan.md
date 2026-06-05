
# QA report fixes — 26 issues, grouped into 5 passes

I'll work through the QA report in 5 themed passes so each pass is independently testable. Numbers below match the report.

## Pass 1 — Public site, header, footer, legal (issues #1, #2, #3, #4, #9, #16)

**Marketing header is missing on Features / About / Pricing / Community / Contact (#1)** — actually those pages already render `MarketingHeader`; the real bug is that the header doesn't show nav links and the auth state. Fix `MarketingHeader` so:
- It works as both the marketing and post-login top bar.
- The Features/About/Pricing/Community/Contact links are visible on every public page (already wired, but spacing/hidden-sm breakpoint needs widening to `md:flex` so they appear on more screens).
- When a session exists, swap **Sign in / Get started** for an **Open app** button + the same top-right account menu used in the app (avatar dropdown → Today, Account, Sign out). This also resolves **#9** (home shows Sign in even when signed in).

**Footer GitHub link → 404 (#2)** — `site-footer.tsx` points at `https://github.com/lovable-dev/purple`. Replace with `https://github.com/purplelife/purple` (the actual repo). If you'd prefer a different URL just tell me; I'll wire whatever you give me.

**Footer Charter / Privacy / Terms redirect to sign-in (#3)** — those pages currently live under `/_app/charter`, `/_app/privacy`, `/_app/terms`, so the auth guard sends signed-out users to `/sign-in`. Move them to top-level public routes (`/charter`, `/privacy`, `/terms`) with their own marketing chrome (MarketingHeader + SiteFooter) and update every `Link to="/charter|/privacy|/terms"` to the new path.

**Sign-in and Get started both go to sign-in (#4)** — `Get started` currently links to `/sign-up`, which is correct. The real bug is that `/sign-up` redirects to `/sign-in` when the route is hit. I'll audit `src/routes/sign-up.tsx` so it renders the signup form first and only links to `/sign-in` for existing users.

**Unwanted scrollbar (#16)** — the screenshot shows a horizontal scrollbar on the public Today / Community page. I'll find the offending overflowing element (likely a wide hero image or section using `min-w-` that exceeds viewport), and add `overflow-x: hidden` to the page wrapper plus shrink the offending element.

## Pass 2 — Auth & OAuth (issues #5, #6, #7, #8)

**Email verification (#5)** — turn on `auto_confirm_email: false` + `password_hibp_enabled: true` via `configure_auth`. On the signup form, after successful submit show a "Check your inbox" screen and block sign-in until confirmed. Auth email templates already exist via the queue, so verification email is automatic.

**Google OAuth shows "Lovable" branding (#6)** — switch from the Lovable broker to direct Google OAuth. I'll:
1. Ask you to add your Google OAuth client in Google Cloud Console (Authorized domains: purplelife.org, purplelife.lovable.app, *.lovable.app; redirect URI: the one shown in Cloud → Authentication → Google).
2. Once you've created the credentials, store `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Cloud → Authentication Settings → Google (not in app secrets — that's where the Cloud-managed Google provider reads them).
3. Update `signInWithOAuth("google", …)` callers to use the project's own configured provider; consent screen will then show "Purple".

**Apple OAuth same branding (#7)** — same approach as Google but Apple requires a Services ID, signing key, and Team ID. I'll wait on this until Google is verified working; happy to scope it as a follow-up since Apple needs Apple Developer Program enrollment ($99/yr) and DNS verification of your domain. **Confirm**: handle Apple in this pass too, or push to a follow-up?

**Create-account field order (#8)** — in `src/routes/sign-up.tsx`, move the **Create account** button to the very bottom of the form so it appears after Region/Language and Invite Code, not in the middle.

## Pass 3 — Tools, Connections, Sidebar, Settings access (issues #10, #11, #12, #13, #24)

**Oura "400 invalid_request" (#10)** — you said this used to work. I'll:
1. Verify the redirect URI passed by the client (`{origin}/oauth/oura/callback`) is registered in Oura's developer app.
2. Check the `oura-sync` edge function's auth code exchange uses the same `redirect_uri` it received (must match exactly, byte-for-byte, what Oura has registered).
3. Likely cause: published URL changed from `purplelife.lovable.app` to `purplelife.org` (custom domain), so the registered URI in Oura's dashboard no longer matches. I'll surface the exact URI we send so you can register it; if there's a code bug I'll fix it in `src/lib/oura*.ts` / `oauth.oura.callback.tsx`.

**"Set up a new device" button doesn't work (#11)** — it's a plain non-interactive row in `tools.tsx`. I'll wire it to open a "Choose device" sheet listing the three supported sources (Oura, Whoop, Apple Health) with their respective connect actions.

**Tools and Account stuck on dark in light mode (#12)** — both routes call `useRouteTheme("dark")` to force dark chrome. Remove the forced theme so they follow the user's preference, then audit the page styles (text/bg) to ensure they read correctly in both modes.

**Settings not accessible from sidebar (#13)** — already in the sidebar under Account → Settings. The actual issue (per screenshot) is that the **Travel settings** page can only be reached via "Add Trip → Back". I'll add a top-level Tools → Travel entry (already exists in `nav-items.ts:103`) but it appears the sidebar doesn't surface the children correctly; fix the sidebar nav so the "Travel" leaf is reachable without going through Add Trip.

**"Patterns" shown twice in the sidebar (#24)** — `nav-items.ts` lists `/insights` (Patterns) under both **Journal** and **Insights** groups. Remove it from the Journal group; Insights remains the canonical home.

## Pass 4 — Caregiver invite + email, Community, Calendar, Medication, Medical PDF (issues #14, #15, #18, #19, #20, #21, #22)

**Caregiver invite email + in-app notification (#14)** — use the **Resend** connector you mentioned (no Lovable Emails dependency needed since you explicitly asked for Resend). I'll:
1. Connect the Resend connector and store `RESEND_API_KEY` (via the connector).
2. Add a server fn `sendCaregiverInvite(relationshipId)` that POSTs to `https://connector-gateway.lovable.dev/resend/emails` with a Purple-branded HTML invite linking to `/care/accept/{token}`.
3. Trigger it whenever `care_relationships` is created (call the fn from the create path inside `care.functions.ts`).
4. If `invite_email` matches an existing Purple user, also insert a row into `alerts` so they see an in-app banner next visit (linking to `/care/accept/{token}`).

**Community Likes & Comments don't work on the feed (#15)** — `src/routes/community.tsx` shows Heart/Discuss icons inside the post `<Link>`, so clicking just navigates. Convert each card to: title is a link to the post; Likes is a separate button calling `toggleReaction(post.id)`; Discuss focuses the comment input on the post page. Optimistic update + react-query invalidate.

**Medication time format inconsistency (#18)** — form input is `type="time"` (24h), displays use `format("h:mm a")` (12h). Honor the user's locale preference: store as HH:mm (already do), add a Settings toggle "Time format" (12h/24h), default to device locale, and apply it to **both** the form helper text and all display sites: `meds.tsx:420`, `meds.$medId.tsx:313`, `today-doses.tsx:309`, `reminder-alarm-sheet.tsx:127`.

**Medical PDF "WinAnsi cannot encode (0x2192)" (#19)** — `medical-report.server.ts` uses pdf-lib's `StandardFonts.Helvetica`, which is WinAnsi-only and can't render `→` (U+2192). Two changes: (a) replace literal `→` with `->` in the PDF text only (keep arrows in the email templates) at lines 307 and 380; (b) sanitize all user-supplied strings before `drawText` by transliterating non-WinAnsi chars (em-dash, smart quotes, arrows, ellipsis) — small helper `toWinAnsi(str)`. Keeps the PDF route fast (no embedded Unicode font shipped to the Worker).

**Calendar icon dark-mode color + click target (#20)** — in `reports.medical-history.tsx`, the calendar icon next to the date inputs is `text-muted-foreground` and stays dark on dark. Switch to `text-foreground` and wrap the icon in a button that focuses the date input (`inputRef.current?.showPicker?.()` with fallback).

**Feed and Resources go to the same page (#21)** — sidebar entries `/community` and `/community/resources` both render under the same parent, but `community.resources.tsx` may be missing distinct content. I'll verify the Resources route exists with its own component (it does: `src/routes/community.resources.tsx`) and that the sidebar `to` strings match. If duplicate, the cause is most likely a missing route export — I'll fix accordingly.

**Pills count doesn't decrement on dose taken (#22)** — `markDoseTaken` in `src/lib/care.functions.ts` (and the self path) flips `medication_doses.status` to `taken` but doesn't decrement `medications.pills_remaining`. Add a `UPDATE medications SET pills_remaining = GREATEST(pills_remaining - 1, 0) WHERE id = …` in the same server fn, only when the medication has a `pills_remaining` value. Also wire the reverse: marking a previously-taken dose as `skip`/`pending` adds 1 back.

## Pass 5 — Today persistence, Trip→Journal, Journal→Tools sync (issues #23, #25, #26)

**Today's Feeling resets on refresh (#23)** — the screenshot points at the **Readiness / Sleep / Activity** focus tile, whose `focus` state is in-memory only. Persist the last selection to `localStorage` (`purple-today-focus`) and read it on mount.

**Trip reminders don't show in daily journal (#25)** — trip-generated `medication_doses` carry `trip_id` but the daily Journal/Timeline view filters on `created_by_kind` and ignores trip doses. I'll:
- Update `Timeline` and `Today → upcoming doses` queries to include trip doses.
- Add a small "Trip" badge next to dose rows that have `trip_id` so it's clear why a dose appears.
- Verify reminders cron (`/api/public/cron/dose-reminders`) actually fires for trip doses (it should — same table — but I'll log and confirm).

**Journal entries not reflected in Tools (Hydration, Biometrics) (#26)** — `journal_entries.ai_extracted` already holds structured behaviors (`daily_behaviors` table), but hydration/biometric mentions aren't being written into `hydration_intake` / `biometrics`. I'll extend the journal post-processing server fn to:
- When `ai_extracted.hydration_ml` is set, insert a `hydration_intake` row tagged with `created_by_kind: 'self'` and reference back to the journal entry.
- When `ai_extracted.biometrics` (HR, sleep, etc.) is present, insert a corresponding `biometrics` row with `source: 'journal'`.
- Both are idempotent on `journal_entry_id` (add a unique partial index) so re-processing doesn't duplicate.

---

## Out of scope (will not change)
- Native mobile apps (Purple is a PWA).
- New marketing copy / new pages beyond moving Charter/Privacy/Terms public.
- Multi-trip overlap support.
- Wearable SDK changes beyond the Oura redirect-URI fix.

## Execution order
Pass 1 → 2 → 3 → 4 → 5, one at a time. I'll stop after each pass so you can smoke-test in preview, then continue.

Two things I need from you before I can ship 100%:
1. **Apple OAuth scope** — do this pass or follow-up?
2. **Oura redirect URI** — once I print the exact URI we send, please add it to your Oura developer app (or confirm it's already there).

