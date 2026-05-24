# Fix onboarding memory, layout chrome, sign-in, and Oura state

Five fixes, mostly UI/shell. No new features.

## 1. Stop re-asking for onboarding data

**Problem:** `_app.tsx` checks `localStorage("purple-onboarded")` — wiped on every new browser/device/incognito, so Welcome reappears even after you filled it in.

**Fix:**
- In `_app.tsx` `beforeLoad`, read `profiles` for the signed-in user. Treat as onboarded if `first_name` is set OR `onboarded_at` is not null.
- Add `onboarded_at timestamptz` to `profiles` (migration). Welcome's `finish()` and `skip()` set it.
- Keep the localStorage flag as a fast hint to avoid a query on every nav, but DB is source of truth.
- Welcome pre-fills `firstName/lastName/emergency*` from the existing `profiles` row so even if the user lands there, nothing is lost.

## 2. Sign-in page alignment

**Problem:** On desktop the right form column is taller than the left hero (which is `lg:h-screen` absolute-positioned), so the page scrolls and the hero ends mid-screen while the form continues — the "Free forever / PURPLE" text sits awkwardly.

**Fix:**
- Make hero column `lg:sticky lg:top-0 lg:h-screen` so it stays pinned while the form scrolls, OR
- Match heights: change grid to `lg:min-h-screen` with hero `lg:h-full` (not `h-screen`) and reduce form vertical padding on smaller laptops.
- Going with the sticky approach — it's the same fix Linear/Stripe use and avoids re-flow.

## 3. Site-wide footer + collapsible sidebar

**Footer (new `src/components/layout/site-footer.tsx`):** rendered inside `AppShell` below `<Outlet />`. Contains:
- Founding charter → `/charter`
- Privacy & safety → `/privacy`
- Terms → `/privacy#terms` (anchor — we can split later)
- Contact → `mailto:` or `/privacy#contact`
- Open source on GitHub → external link
- Small "© Purple · Free forever" line

Same footer on `sign-in` (lighter variant, no Terms-from-app links needed but include legal).

**Collapsible sidebar on mobile:**
- Today bottom-nav stays for primary nav on mobile.
- Add a hamburger button in a slim top bar (mobile only) that opens a `Sheet` containing the full sidebar items + Settings + About links. Desktop sidebar unchanged but add a collapse toggle (icon-only ↔ full-width) persisted in localStorage.

## 4. Welcome step 3 shows "Connect" even when Oura is connected

**Problem:** `WelcomePage.connectOura` doesn't check `oura_tokens`; it always shows the Connect button.

**Fix:** On mount in step 3, query `oura_tokens` for the user; if a row exists, render "Connected · synced Xh ago" with a Disconnect/Continue affordance instead of Connect. Reuse the existing `OuraConnection` component (already shows correct state) instead of the custom inline button.

## 5. About/legal moves to footer

- Keep the About section in Settings (deep link target) but the same items also live in the global footer so they're reachable from every page on web and mobile.
- Add a `/terms` route (simple page, can mirror privacy content for now) so the footer link resolves.

## Files

- `supabase/migrations/<new>.sql` — `alter table profiles add column onboarded_at timestamptz`
- `src/routes/_app.tsx` — DB-backed onboarded check
- `src/routes/_app/welcome.tsx` — prefill from profile, set `onboarded_at`, swap inline Oura UI for `<OuraConnection />`
- `src/routes/sign-in.tsx` — sticky hero column, add footer
- `src/components/layout/site-footer.tsx` — new
- `src/components/layout/app-shell.tsx` — render footer; mount mobile sheet
- `src/components/layout/sidebar-nav.tsx` — collapse toggle + mobile sheet trigger
- `src/routes/_app/terms.tsx` — new minimal page

## Out of scope

- Cookie consent banner, real Terms of Service drafting (placeholder content), redesigning the bottom nav, dark mode for the footer beyond existing tokens.
