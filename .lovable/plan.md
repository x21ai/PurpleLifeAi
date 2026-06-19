## What is happening

The app is not really “loading” forever. It is failing during the handoff from server-rendered HTML to the browser React app, and the branded pre-hydration splash stays visible on top.

Sequence visible in the screenshots:

1. The server sends valid HTML for the homepage, so the mountain hero briefly appears.
2. The browser starts React hydration.
3. Hydration hits a mismatch/error around the root shell.
4. React abandons or regenerates the tree.
5. The full-screen `#purple-splash` overlay remains above the app, so the site looks stuck on the PURPLE logo.

That is why you see the real homepage first, then the PURPLE logo. The homepage HTML exists, but the client bundle is not successfully taking over and removing the splash.

## Evidence from the current code

In `src/routes/__root.tsx`, the root shell renders this before the app content:

```tsx
<body suppressHydrationWarning>
  <div id="purple-splash" aria-hidden="true">
    <span className="w">PURPLE</span>
  </div>
  <script dangerouslySetInnerHTML={{ __html: "...remove splash..." }} />
  {children}
  <Scripts />
</body>
```

The splash is meant to be temporary. It is removed by an inline script after `window.load` or after a timeout:

```js
setTimeout(h,1600)
```

So if it is still visible indefinitely, one of these is true:

- React hydration fails before the page stabilizes.
- The root HTML order differs between server and client.
- A cached/stale client bundle is running against newer server HTML.
- The build is partially broken, so scripts do not execute in the expected order.

The runtime error already captured points directly at this:

```text
Hydration failed because the server rendered HTML didn't match the client

<body>
+ <div id="purple-splash" aria-hidden="true">
- <script>
```

That means React expected the first hydratable child of `<body>` to be the splash `<div>`, but the DOM it found had a `<script>` there instead. This is a root-shell hydration mismatch, not an image problem and not a normal slow loader.

## Why it flashes the homepage first

TanStack Start server-renders the route. The browser receives enough HTML/CSS to paint the homepage before React has fully booted.

Then React compares the server DOM to what the client render says should be there. If the order or existence of root-level nodes is different, React logs a hydration mismatch and may throw away/rebuild that subtree.

Because the splash has `position: fixed` and `z-index: 9999`, any failure to remove it covers the working page underneath:

```css
#purple-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
}
```

So the page is probably underneath the black overlay. The visible symptom is the logo, but the underlying cause is the client boot/hydration mismatch.

## Related but separate type issue

The earlier generated backend types issue can also break the client bundle if TypeScript/build fails:

- `health_narratives` references exist in `src/lib/health-scores.functions.ts`
- `sync_mode` references exist in wearable sync code
- current read-only check showed `community_posts_public` exists in `types.ts`
- current read-only check still did not show `health_narratives` or `sync_mode` in `types.ts`

So Cursor should separately verify the exact synced commit really contains the regenerated `src/integrations/supabase/types.ts` with:

```bash
grep -n "health_narratives" src/integrations/supabase/types.ts
grep -n "sync_mode" src/integrations/supabase/types.ts
grep -n "community_posts_public" src/integrations/supabase/types.ts
```

If `health_narratives` or `sync_mode` are missing, the app can still fail to build or serve a stale/broken bundle. But the screenshot-specific PURPLE overlay is explained by the root hydration/splash mismatch.

## What Cursor should check first

1. Confirm the generated backend types are truly present on the branch being built.

```bash
grep -n "health_narratives" src/integrations/supabase/types.ts
grep -n "sync_mode" src/integrations/supabase/types.ts
grep -n "community_posts_public" src/integrations/supabase/types.ts
```

2. Run a clean local build/typecheck in Cursor.

```bash
bun install
bun run build
```

3. In the browser, clear stale preview assets/service workers/cache, because a stale app shell can produce exactly this server/client mismatch.

Useful checks:

```js
await navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))
await caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
location.reload()
```

4. Inspect `src/routes/__root.tsx` root shell ordering. The current mismatch says the `<body>` child order differs between server and client around the splash `<div>` and inline `<script>`.

## Recommended Cursor fix direction

Do not patch generated files manually. Do not edit `types.ts` by hand.

Cursor should make the splash safe against hydration failure by moving splash removal out of a fragile hydratable body child sequence.

Safer patterns:

### Option A: Put only the app in React-owned body, inject/remove splash outside hydration

- Avoid rendering a React-managed `<div id="purple-splash">` as a direct `<body>` child that React must hydrate.
- If a pre-hydration splash is required, inject it in a deterministic static way and remove it from a client `useEffect` after mount.
- Add a CSS fallback so the splash never survives forever.

Example concept:

```tsx
useEffect(() => {
  const splash = document.getElementById("purple-splash");
  if (!splash) return;
  splash.style.opacity = "0";
  window.setTimeout(() => splash.remove(), 420);
}, []);
```

And keep a non-JS fallback/maximum lifetime:

```css
#purple-splash {
  animation: purpleSplashFailsafe 2s forwards;
}

@keyframes purpleSplashFailsafe {
  0%, 75% { opacity: 1; visibility: visible; }
  100% { opacity: 0; visibility: hidden; pointer-events: none; }
}
```

### Option B: Remove the root-level splash entirely during preview/debug

For debugging, Cursor can temporarily remove the `#purple-splash` block and its inline removal script from `RootShell`. If the homepage then stays visible, that proves the app was covered by the splash overlay.

This is a diagnostic step, not necessarily the final design.

### Option C: Keep splash, but make server/client body order identical

If keeping the current architecture, ensure the exact same direct children under `<body>` are rendered in the exact same order on server and client:

```text
body
  div#purple-splash
  script splash-removal
  app children
  Scripts
```

No conditional `typeof window`, no route-specific head/body script injection that changes ordering, no cache serving an older shell.

## Likely root causes ranked

1. Stale preview/client assets after sync: server HTML and client JS are from different builds.
2. Broken build from missing generated backend types, causing the preview to serve an older or partial bundle.
3. Root shell hydration mismatch caused by the direct body-level splash `<div>` plus inline scripts.
4. Service worker/app-shell cache keeping an old shell alive.

## Why this is not primarily an image issue

The second screenshot proves the marketing hero image can render. The failure happens after initial paint, when React hydrates. Broken images would show alt text or empty image regions, but they would not normally replace the whole site with the centered PURPLE splash.

## Cursor-ready task

Ask Cursor to:

1. Verify generated types on the exact commit/branch being built.
2. Produce a clean green build.
3. Clear service worker/cache or bump the shell cache version if needed.
4. Fix `src/routes/__root.tsx` so the pre-hydration splash cannot cause or survive a hydration mismatch.
5. Confirm in browser console there is no hydration mismatch and the splash is removed after first paint.

Do not click “Try to fix”. Do not edit generated files. Do not run SQL for this symptom.