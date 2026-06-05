## What's actually happening with sign-in

Production is healthy. Worker logs show `/sign-in`, `/today`, `/`, and every other real route returning 200 right now. The screenshot is not a live server error — it's our branded `renderErrorPage` HTML being served **from the user's device cache** by the PWA service worker.

The bug is in `public/sw.js`:

1. On every navigation, the worker runs:
   ```js
   fetch(req).then((res) => {
     const copy = res.clone();
     caches.open(CACHE).then((c) => c.put("/", copy)).catch(() => {});
     return res;
   })
   ```
   That `c.put("/", copy)` runs **for every response, including 500s**, and always stores it under the key `/` (overwriting the real home page).
2. If the SSR worker ever throws (transient deploy hiccup, cold-start error, etc.), the catastrophic-500 HTML from `renderErrorPage()` gets cached as `/`.
3. On the next navigation, when fetch fails or returns slowly, the catch falls back to `caches.match("/")` and serves the cached error page.
4. Because `skipWaiting()` + `clients.claim()` are used but the cache name (`purple-shell-v2`) hasn't changed, the activate handler doesn't purge the old cache.

Result: a small fraction of users have a poisoned `/` entry in their `purple-shell-v2` cache and see the error page even though the site is fine.

## Plan

### 1. Fix `public/sw.js`

- Bump cache name to `purple-shell-v3`. Existing `activate` handler already deletes any cache name that doesn't match, so v2 (poisoned) is wiped on next visit.
- In the navigation handler, only cache responses that are HTML and have `res.ok === true`. Skip 4xx/5xx entirely.
- Cache the response under the actual request URL when it's the root, not unconditionally under `/`. So a `/today` response can't impersonate `/`.
- Keep the offline fallback to `caches.match("/")`.

### 2. Confirm the cache is being invalidated for users

The SW upgrade is automatic once the new file ships:
- Browser fetches the new `sw.js`, sees it differs, installs as "waiting".
- `skipWaiting()` + `clients.claim()` make it activate immediately on next nav.
- New activate handler purges `purple-shell-v2`.

No user action required, but the user can hard-refresh once on www.purplelife.org to speed it up.

### 3. Confirm "next" before more phase work

Earlier we worked through Phase 7a (insights v2), 7b (clinician-grade reports), 7c (travel polish). I don't want to guess what "next" means — there's no canonical Phase 7d defined yet.

I'll ask the user which of these to take next (see clarifying question).

## Out of scope

- `/auth` returning 404: no code in the app links to `/auth`, the actual sign-in route is `/sign-in`. Not the cause of the screenshot. Optional follow-up: add an `/auth` route that redirects to `/sign-in` for typed URLs.
- Repeated `401`s on `/api/public/cron/dose-reminders`: separate issue, unrelated to this bug. Worth a follow-up but not part of this fix.
