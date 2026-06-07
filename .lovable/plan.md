## Phase 2 — Sidebar group click behaviour

Right now `My Body`, `Insights`, `Care`, `Community`, `Tools` in the sidebar are caret-only. Clicking the label toggles the children but doesn't navigate, which is confusing when each group has a natural landing page.

### What changes

1. **`src/components/layout/nav-items.ts`** — add a `to` (landing route) to each parent group that has one:
   - My Body → `/my-health`
   - Insights → `/insights`
   - Care → `/care`
   - Community → `/community`
   - Tools → `/tools` (already a hub grid; keep landing, no children change)
   Keep `children` arrays as-is for groups that have them.

2. **`src/components/layout/sidebar-nav.tsx`** — split the parent row into two hit-areas:
   - Label area becomes a `<Link to={parent.to}>` that navigates to the landing page and also marks the group active.
   - Chevron becomes a separate `<button>` that toggles expand/collapse only (stopPropagation). Distinct hover state and `aria-expanded` / `aria-label="Expand <group>"`.
   - If a parent has no `to`, keep current behaviour (whole row toggles).
   - Auto-expand the group when the current route matches the parent or any child.

3. **`src/components/layout/bottom-nav.tsx`** — quick audit so the same parents on mobile still tap through to their landing page (most already do; verify).

4. **Active state** — parent shows active styling when the route equals its `to` OR matches a child route, so the user always sees where they are.

### Out of scope
- No new routes are created. Every `to` above already exists.
- No journal/biometrics restructure (that's Phases 3 and 4).

### Files touched
```
src/components/layout/nav-items.ts
src/components/layout/sidebar-nav.tsx
src/components/layout/bottom-nav.tsx  (only if audit finds a gap)
```

After approval I'll ship Phase 2 in one turn, then move to Phase 3 (`/journal/new` full-page layout).