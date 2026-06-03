## 1. Move the role/account menu to the top-right (Apple-style)

The current `RoleSwitcher` pill sits **inside the sidebar header next to the PURPLE wordmark**. The rule going forward: nothing touches the wordmark — branding stays clean. The account menu lives on the right edge of every page, mobile and desktop.

Changes:

- New `src/components/layout/top-bar.tsx` — a sticky desktop top bar (`md:flex hidden`, `h-14`, transparent/blurred, right-aligned). It renders:
  - `<PendingInboxBadge />` (if any pending caregiver work)
  - `<ProfileMenu />` (new — see below)
- New `src/components/layout/profile-menu.tsx` — circular avatar button + dropdown. Behavior:
  - Trigger: 32px circle showing the user's **avatar image** if `profiles.avatar_url` is set, otherwise the user's **initials** on a `var(--purple-primary)` background.
  - Menu contents (in this order, separators between groups):
    1. Header row: avatar (larger) + display name + email
    2. Role switcher items — `My account`, then `Caring for {name}` per active caregiver relationship (only shown if `listCaregiverOwners` returns rows). Replaces what `RoleSwitcher` does today.
    3. `Account` → `/account`
    4. `Settings` → `/settings`
    5. `Sign out`
- `SidebarNav`: remove the `RoleSwitcher` render from the header. Keep the wordmark as the sole element.
- `MobileTopBar`: remove the `RoleSwitcher` from the right cluster. Replace with the same `<ProfileMenu />` (the avatar circle works in mobile too — same component).
- `AppShell`: render `<TopBar />` above `<Outlet />` on desktop, inside the main column so it doesn't overlap the sidebar.

The standalone `RoleSwitcher` component stays in place but becomes unused; we'll delete it once the new menu ships and nothing imports it.

## 2. Avatar upload + storage

Profile picture is part of the new menu, so we need a place to store it.

Database (migration):
- Add `profiles.avatar_path text` (nullable). Storing the storage object path, not a URL — we'll resolve to a signed URL on read so private RLS still applies.

Storage:
- Reuse the existing private `journal-media` bucket under a `avatars/{userId}/...` prefix. RLS already restricts that bucket to the owner's folder, so no new bucket or new policies are needed.

Server fn (new — `src/lib/avatar.functions.ts`):
- `setAvatarPath({ path })` — writes `profiles.avatar_path` for the current user (via `requireSupabaseAuth`).
- `getAvatarSignedUrl()` — resolves the current user's `avatar_path` to a signed URL (24h) and returns it. Used by `ProfileMenu` and `/account`.

UI:
- In `/account`, add an "Avatar" card under the existing Profile section: shows current avatar (or initials), `Upload photo` (file input, image-only, <2MB), `Remove`. On upload: client uploads to `journal-media` at `avatars/{userId}/{ts}.{ext}`, then calls `setAvatarPath`. Autosaves (no Save button — per the autosave rule).
- `ProfileMenu` resolves the signed URL via a TanStack Query (5-min `staleTime`) and falls back to initials while loading or if no avatar is set.

## 3. End-to-end verification (manual + scripted)

These are the verifications the user explicitly asked for. Each ends with a clear pass/fail check.

### 3a. Dose reminder scheduling + adherence
- Inspect `seed_daily_medication_doses()` and the `/api/public/cron/dose-reminders` route (already exist).
- Simulate by: (a) creating a med with a time slot 2 minutes in the future for the logged-in test user, (b) calling `seed_daily_medication_doses()` via `supabase--insert` to materialize today's doses, (c) hitting the dose-reminders endpoint with `stack_modern--invoke-server-function` (apikey header), (d) confirming a row in `medication_doses` flipped `notified_at`, (e) opening `/meds` in the browser and confirming the dose row + "Mark all taken" button updates `status` to `taken` and the 14-day adherence % bumps.
- Pass criteria: notified_at set after cron call; status flips to `taken` after UI click; `medication_adherence(med_id, 14)` returns updated `taken_count` and `adherence_pct`.

### 3b. Oura/Whoop OAuth and Risk/Today rings
- Whoop is **not in the codebase today** (only `oura_tokens` + `oura-sync` edge function exist). Two options:
  - (i) Verify Oura only — confirm OAuth round-trip, the periodic sync function writes to `biometrics`, and `/today` + `/risk` rings + summary reflect the latest `biometrics` row.
  - (ii) Add Whoop OAuth + sync as a new feature (much bigger — new connector page, OAuth flow, `whoop_tokens` table, sync server fn, mappings). I'd recommend deferring this and shipping (i) now.
- Plan to do (i): open `/account` → reconnect Oura with the logged-in user; trigger `oura-sync`; confirm a new `biometrics` row; navigate to `/today` and `/risk` and screenshot the rings + summary copy to confirm they're driven by the new readings (not cached/empty).

### 3c. Onboarding invite-code hint
- **Already implemented** in `src/routes/_app/welcome.tsx` (step 1 has an "Invite code" field prefilled from `localStorage`, and a `useEffect` auto-redeems any stored code as soon as the session exists).
- Verification only: load `/?invite=TESTCODE` in the browser (creates an active test promo code first via `supabase--insert`), sign up a fresh user, confirm `promo_code_redemptions` gets a row and the welcome screen shows the prefilled code. If the prefill or auto-redeem is silently failing, fix in place — no schema or UX changes planned.

### 3d. Privacy guarantees
- Grep the codebase + `index.html` for analytics/trackers (gtag, posthog, plausible, mixpanel, amplitude, fathom, sentry). Current grep returns **zero hits** — confirming clean. Codify this as a CI-friendly check by adding a short note to `mem://index.md` under Core: "No third-party analytics or trackers. Ever."
- Verify uploaded media access:
  - Confirm `journal-media` bucket is `public: false` (already is, per `supabase/migrations/.../20260523031938_*.sql`).
  - Confirm storage.objects RLS policies scope reads to `auth.uid()::text = (storage.foldername(name))[1]` (the owner-folder pattern). Spot-check with `supabase--read_query`.
  - Confirm every read path in the app uses `createSignedUrl` / `createSignedUrls` (already does — `reports.functions.ts`, `seizures.new.tsx`, `journal.new.tsx`, `capture-sheet.tsx`).
  - Smoke test: as user A, upload to journal-media; as user B (different session via `Authorization` override), attempt `from('journal-media').download(path)` → expect 403. Document the result.

### 3e. Existing security warnings (surface, don't silently fix)
Two warnings are currently open and worth addressing in the same pass since they touch privacy:
- `community_reactions_public_user_linkage` — `community_reactions_read` policy is `USING (true)` and exposes `user_id`. Recommendation: restrict `SELECT` to `authenticated` and drop `user_id` from the publicly-readable column set (create a `community_reactions_public` view that exposes only `post_id, kind, count` aggregates if anon UX needs counts).
- `user_roles_privilege_escalation` — replace the RESTRICTIVE deny-INSERT policy with an explicit permissive allowlist scoped to `is_super_admin(auth.uid())` only.

If you want these fixed in this pass, I'll include the migration; otherwise I'll just record them in the security memory and tackle separately.

## 4. Order of work

1. Migration: add `profiles.avatar_path`.
2. New `avatar.functions.ts` + `ProfileMenu` + `TopBar`.
3. Wire `AppShell` + `MobileTopBar` to use `ProfileMenu`; remove `RoleSwitcher` from sidebar/mobile bar.
4. Add Avatar card to `/account`.
5. Run verifications 3a → 3d, screenshot results, report pass/fail inline.
6. (Optional) Apply the two security-warning migrations from 3e.

## Open questions

1. **Whoop**: verify Oura-only now (Q3b option i), or add Whoop as a new connector this pass (option ii)?
2. **Security warnings 3e**: fix in this pass, or leave for a dedicated security cleanup?
3. **Avatar storage location**: reuse `journal-media/avatars/{userId}/...` (no new bucket needed), or create a separate `avatars` public bucket so the menu can show photos without a signed-URL round-trip? Private reuse is safer; public is slightly faster to render.
