# Fix site-wide crash, theme system, and missing routes

The "site not loading" is one root cause, not many: a hydration mismatch in `AppShell` is crashing the React tree, which makes every `/_app/*` page render the "This page didn't load" error boundary. On top of that, several URLs you listed don't exist as top-level routes (they live under `/admin/*` or `/today/*`), and the theme is being toggled per-route instead of from a single user preference.

## 1. Fix the hydration crash (root cause of "nothing loads")

**Problem**: `src/components/layout/app-shell.tsx` returns two different trees depending on `session`:
- SSR: no session → renders `<div class="min-h-dvh bg-background" aria-hidden />`
- Client (post-hydration): has session → renders full shell with sidebar/nav/main

React detects the mismatch, throws, and the route's error boundary shows "This page didn't load" on every protected page. This is exactly what the runtime errors log shows.

**Fix**: Make SSR and the first client render produce the **same** markup. Render the full shell unconditionally; gate only the *interior content* on a `mounted` flag so the auth-dependent decision happens after hydration. Replace the early-return blank div with a `Suspense`-friendly placeholder inside the same shell layout.

Also: in `_app.tsx` `beforeLoad`, the `if (typeof window === "undefined") return;` is correct — keep it. The bug is purely in `AppShell`'s render branching.

## 2. Replace per-route theme hacks with a real theme system

**Problem**: `src/lib/use-route-theme.ts` mutates `document.documentElement.classList` from `useEffect` on individual pages. That's why "some pages still have dark theme and light" — each route is forcing its own. There is no user preference, no persistence, no system option.

**Fix**:
- Create `src/lib/theme-provider.tsx` with a `ThemeProvider` (modes: `light` | `dark` | `system`), persisted in `localStorage` under `purple-theme`, listens to `prefers-color-scheme` when `system`.
- Add an inline `<script>` in `__root.tsx`'s `RootShell` that runs **before** React hydrates and sets/removes `.dark` on `<html>` from `localStorage` — this prevents both a flash and a hydration mismatch.
- Wrap the app in `ThemeProvider` inside `RootComponent`.
- Delete `useRouteTheme` usages across all pages (settings, journal, timeline, etc.). The whole app respects the global preference.
- Add a "Appearance" card to `src/routes/_app/settings.tsx` with a segmented control: System / Light / Dark.

## 3. Add the missing top-level URL redirects

Most URLs you listed exist but at different paths. Add tiny redirect route files so the bare URLs work too:

| URL you tried | Real route | Action |
|---|---|---|
| `/biometrics` | `/_app/biometrics` | Already exists — will work once §1 fixes hydration |
| `/charter`, `/community-new`, `/journal`, `/meds`, `/settings`, `/privacy`, `/terms` | `/_app/*` | Same — fixed by §1 |
| `/community`, `/contact`, `/features`, `/pricing`, `/reset-password` | top-level | Already exist — fixed by §1 |
| `/users` | `/admin/users` | Add `src/routes/users.tsx` → redirect |
| `/messages` | `/admin/messages` | Add `src/routes/messages.tsx` → redirect |
| `/feedback` | `/admin/feedback` | Add `src/routes/feedback.tsx` → redirect |
| `/resources` | `/community/resources` | Add `src/routes/resources.tsx` → redirect |
| `/risk` | `/today/risk` | Add `src/routes/risk.tsx` → redirect |
| `/how-purple-thinks` | `/settings/how-purple-thinks` | Add `src/routes/how-purple-thinks.tsx` → redirect |
| `/oauth/oura/callback` | `/oauth.oura.callback` | Already exists — fixed by §1 |
| `/api/public/hooks/risk-forecaster` | server route | Not a page — it's a `POST` webhook, returns 401 to browser GETs. Working as intended; no fix needed. |

## 4. Verification pass (after build)

Open preview at desktop / tablet / mobile and confirm:
- `/today`, `/journal`, `/timeline`, `/meds`, `/settings`, `/biometrics`, `/charter`, `/community`, `/admin` all render without the "didn't load" screen.
- Theme toggle in Settings switches the whole app and persists across reloads.
- Bare URLs (`/users`, `/risk`, `/resources`, …) redirect to their canonical paths.

## Out of scope

- The big per-route visual QA pass (the one you queued earlier) is **not** included here — that's a separate follow-up once the app stops crashing.
- No backend / schema changes.
