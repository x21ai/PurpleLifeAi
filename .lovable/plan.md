# Pass 3 — QA Report Fixes

QA filed 26 issues across the marketing site, auth, Today, Tools, Care, Community, Reports, Journal, and Travel. Below is the full list grouped by area, with the fix for each. I'll work them in batches (1 → 6) so you can review after each.

---

## Batch 1 — Marketing site & auth polish (QA #1–9)

1. **Internal pages (Features / About / Pricing / Community / Contact) missing header nav** — add the same header nav links to those routes (currently only on `/`).
2. **Footer GitHub link 404** — points to `github.com/lovable-dev/purple`. Either remove it or point to the real repo. I'll ask you which.
3. **Footer "Charter / Privacy / Terms" redirect to sign-in** — those routes don't exist. Create stub pages with real content placeholders, or hide the links until ready.
4. **Header "Sign in" + "Get started" both go to `/signin`** — "Get started" should go to `/signup`.
5. **No email verification on signup** — enable email confirmation in Cloud auth settings (changes the flow: user must click verify link before login).
6. **Google sign-in shows "Lovable" branding** — this is the Lovable OAuth broker. To remove it you need your *own* Google OAuth app + custom Supabase Google provider (you have client ID/secret already — we wired them, but the broker still shows because the integration uses Lovable's redirect). Need to switch the client to call Supabase directly instead of the broker for Google. Same fix path for Apple (#7).
7. **Apple sign-in shows "Lovable" branding** — same as #6, applies once Apple is set up.
8. **Signup form: "Create account" button is in the middle of the form** — move it to after the last field (Invite code).
9. **After sign-in, marketing homepage still shows "Sign in / Get started"** — make the marketing header session-aware: if logged in, show "Open app" instead.

## Batch 2 — Oura + Tools tab (QA #10–13)

10. **Oura Connect → `400 invalid_request`** — root cause is the OAuth start step. Investigate `oura-sync` `action:"config"` handler: most likely `redirect_uri` mismatch with what's registered in the Oura developer console, or `OURA_CLIENT_ID` is stale. I'll pull logs for the failing call and confirm before changing anything.
11. **"Set up a new device" button does nothing** — wire it. Proposed flow: opens a sheet with (a) QR code containing a magic deep-link to `/auth/device-link?token=…`, (b) "Email me the link" option, (c) instructions. Confirm this UX before I build.
12. **Light mode: Tools + Account tabs still render dark** — those two screens have hard-coded dark colors instead of semantic tokens. Audit and replace `bg-slate-900` / `text-white` style classes with `bg-background` / `text-foreground` etc.
13. **Settings only reachable via Add Trip → back** — add a top-level "Settings" link to the sidebar (and remove the trip-detour as the only path).

## Batch 3 — Care + Caregiver (QA #14, #17)

14. **Caregiver invite sends no email + no in-app notification** — wire the caregiver invite through the transactional email pipeline (Resend, one-by-one as we agreed). Also create an in-app notification when the recipient is already a Purple user.
17. **Caregiver tab only shows "accounts you're a caregiver for", not "your caregivers"** — add the inverse list (people you've shared access with) to the same page.

## Batch 4 — Reports + Medications (QA #18, #19, #20, #22)

18. **Medication time format mismatch** — add field is 24h, list view is 12h. Pick one (recommend 12h with AM/PM everywhere) and unify.
19. **Generate PDF fails with `WinAnsi cannot encode (0x2192)`** — pdf-lib's WinAnsi font can't encode the `→` arrow we use somewhere in the report. Switch the report font to a TTF (or sanitize the text to ASCII) so non-WinAnsi glyphs render.
20. **Report calendar icon: should be white in dark mode + clicking the field should open the calendar** — restyle icon to `text-foreground` and make the input wrapper trigger the popover.
22. **Med pill count not decrementing daily** — the consumption decrement isn't running when a dose is marked taken. Wire `medication_doses` "taken" → `medications.pills_remaining -= 1` (server function).

## Batch 5 — Today + Journal + Sidebar (QA #16, #21, #23, #24, #25, #26)

16. **Hide scrollbar** on the indicated panel (cosmetic CSS).
21. **Feed and Resources go to the same page** — they're wired to the same route. Split into two routes with their own content, or rename one.
23. **"Today's Feeling" selection lost on refresh** — currently held in component state only. Persist to DB (`daily_logs` row, keyed by user + date) and hydrate on mount.
24. **"Patterns" appears twice in the sidebar** — dedupe.
25. **Trip-generated reminders not showing in daily journal** — Today/Journal queries filter out doses with `trip_id`. Include them.
26. **Journal entries (hydration, biometrics, etc.) not flowing into Tools** — Tools cards query their own tables (`hydration_logs`, `biometrics`) but journal write only inserts into `journal_entries`. Add an extractor that, when a journal entry mentions hydration/biometrics, writes to the corresponding table too (or change Tools to read from extracted facts).

## Batch 6 — Community (QA #15)

15. **Likes and Comments on community posts do nothing** — wire the buttons to the existing endpoints, or build the endpoints if missing.

---

## Order of execution
1. Batch 2 first (Oura is the loudest blocker, plus quick Tools wins).
2. Batch 4 (PDF crash + meds correctness are user-trust issues).
3. Batch 3 (caregiver email — needs Resend key from you).
4. Batch 5 (data flow correctness).
5. Batch 1 (marketing/auth polish).
6. Batch 6 (community).

## Questions before I start
- **#2 GitHub footer link**: real repo URL, or remove?
- **#3 Charter/Privacy/Terms**: create stub pages now, or hide the links until you have copy?
- **#5 email verification**: turn on now? (existing users unaffected; new signups will need to click a link.)
- **#11 "Set up a new device"**: OK with the QR + email-link flow, or different idea?
- **#18 med time format**: 12h everywhere (recommended) or 24h everywhere?

I'll wait for answers on those, then start Batch 2.
