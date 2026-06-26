## Goal
Move the sidebar collapse/expand control to a burger (Menu) icon at the top of the sidebar. When the sidebar is expanded, the burger sits at the right of the logo area (top of sidebar). When the sidebar is collapsed, the burger appears at the left of the desktop top header so the user can expand it again.

Only applies to `lg+` (desktop) where the sidebar can be user-collapsed. On md (tablet) the sidebar is always icon-only and on mobile the existing mobile top bar / drawer remains unchanged.

## Changes

### 1. `src/components/layout/sidebar-nav.tsx`
- Import `Menu` from `lucide-react` (replace `PanelLeftClose`/`PanelLeftOpen`).
- In the logo header row (`h-14` div):
  - Keep the Purple wordmark/`P` on the left.
  - Add a burger toggle button on the right side, visible only when sidebar is expanded (`lg:` + not collapsed). Hidden when collapsed (since the rail has no room and the header burger takes over).
  - Adjust the header row to `justify-between` on lg when expanded so logo is left and burger is right.
- Remove the existing bottom "Collapse sidebar" button block at the end of the aside.

### 2. `src/components/layout/top-bar.tsx`
- Use `useSidebarCollapsedPref()` to read collapsed state and toggle.
- When collapsed (lg+), render a burger `Menu` button on the LEFT side of the header (before the existing right-aligned cluster). Change header layout to `justify-between` with a left slot and the existing right slot.
- When expanded, render nothing on the left (the sidebar header hosts the burger).
- Hidden on `<lg` since user-collapse only applies at lg+.

### 3. Untouched
- `MobileTopBar`, `BottomNav`, mobile drawer behavior — unchanged.
- Tablet (md→lg) icon-rail behavior — unchanged (it's viewport-driven, not user-toggle).
- Sidebar nav items, groups, tooltips, popovers — unchanged.

## Behavior summary
- Expanded sidebar (lg+): burger in sidebar header (right of "Purple" wordmark). Click → collapse.
- Collapsed sidebar (lg+): burger in top header (far left). Click → expand. Sidebar header shows only the "P" mark, no burger.
