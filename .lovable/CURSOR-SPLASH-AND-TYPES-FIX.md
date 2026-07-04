# Cursor task: restore types.ts + fix splash hydration

## Critical finding (why Lovable grep shows 0 matches)

Cursor pushed `4c0139f` with complete `types.ts` (`health_narratives`, `sync_mode`, `community_*_public`).

**Lovable then pushed 6 commits on top that stripped those fields from `types.ts`:**

```
51c735f Saved splash hydration plan
bf623f2 Changes
b69e607 Checked types.ts sync status
...
```

On `origin/main` today:

```bash
git show origin/main:src/integrations/supabase/types.ts | rg "health_narratives|sync_mode"
# → 0 matches

git show 4c0139f:src/integrations/supabase/types.ts | rg "health_narratives|sync_mode"
# → matches present
```

Lovable is not failing to pull Cursor's fix. **Lovable overwrote it** while investigating. Tell Lovable to stop editing `types.ts`.

## Two problems, one symptom

| Layer | Problem | Symptom |
|-------|---------|---------|
| 1. Build | `types.ts` missing `health_narratives` / `sync_mode` on `main` | Red build, stale bundle, images show alt text |
| 2. Runtime | Root `<body>` hydration mismatch around splash `<div>` + inline `<script>` | Homepage flashes, then PURPLE overlay sticks |

Lovable's splash analysis (layer 2) is **correct**. The types regression (layer 1) is **still the primary blocker** and explains why Lovable sees 0 grep matches.

## Splash: what happens (deep)

1. TanStack Start SSR sends full homepage HTML (mountain hero paints).
2. Browser loads client JS and React hydrates `RootShell` in `src/routes/__root.tsx`.
3. `<body>` contains, in order: `#purple-splash` div → inline removal script → app children → `<Scripts />`.
4. React expects hydratable children in a fixed order. The inline `<script>` between the splash div and React-owned content can differ between server HTML and client render.
5. Console error (captured by Lovable):

```text
Hydration failed because the server rendered HTML didn't match the client
<body>
+ <div id="purple-splash" aria-hidden="true">
- <script>
```

6. Hydration fails or partially recovers. The splash has `position:fixed; z-index:9999` and covers the working page underneath.
7. User sees: homepage flash → black PURPLE logo forever.

The inline script has a 1600ms fallback, but if hydration errors trigger re-renders, HMR, or preview reloads, the splash can reappear or never be removed cleanly.

## Cursor fix (execute in Agent mode)

### Step 1: Restore `types.ts`

```bash
git pull origin main
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  bunx supabase gen types typescript --project-id xxnzmfzsjplrutrgbzxy \
  > src/integrations/supabase/types.ts

grep health_narratives src/integrations/supabase/types.ts
grep sync_mode src/integrations/supabase/types.ts
grep community_posts_public src/integrations/supabase/types.ts
```

All three must match before commit.

### Step 2: Fix splash in `src/routes/__root.tsx`

**Remove** the inline `<script>` splash-removal block from `<body>` (lines 226-231). It causes the hydration mismatch.

**Add** a client-side dismiss helper and call it from `RootComponent` on mount:

```ts
function dismissPurpleSplash() {
  const splash = document.getElementById("purple-splash");
  if (!splash) return;
  splash.style.opacity = "0";
  window.setTimeout(() => splash.remove(), 420);
}

// In RootComponent, first useEffect:
useEffect(() => {
  dismissPurpleSplash();
}, []);
```

**Add** CSS failsafe to the `#purple-splash` style block so splash never survives forever if JS fails:

```css
@keyframes purpleSplashHide {
  0%, 70% { opacity: 1; visibility: visible; }
  100% { opacity: 0; visibility: hidden; pointer-events: none; }
}
#purple-splash {
  animation: purpleSplashHide 1.8s ease forwards;
  /* keep existing fixed/inset/z-index/typography rules */
}
```

### Step 3: Verify and push

```bash
bunx tsc --noEmit
bun run build
git add src/integrations/supabase/types.ts src/routes/__root.tsx
git commit -m "fix: restore Supabase types and dismiss splash without hydration mismatch"
git push origin main
```

### Step 4: Tell Lovable

```text
Cursor pushed [commit]. types.ts restored; splash fix removes inline body script that caused hydration mismatch.

Do not edit types.ts. Pull main, verify grep health_narratives, rebuild, hard refresh.
```

## What NOT to do

- Do not let Lovable edit `types.ts` or click "Try to fix"
- Do not patch `types.ts` by hand
- Do not remove splash entirely (keep branded launch, fix dismissal path)
