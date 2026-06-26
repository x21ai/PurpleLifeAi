## Fix: Center the Quick Log bar under the caregiver page content

### Problem
The `QuickLogBar` at the bottom of the caregiver dashboard uses `fixed inset-x-0 bottom-0`, which positions it relative to the full viewport. Because the sidebar pushes the main content area to the right, the bar is visually offset from the page content above it. The bar also uses `max-w-3xl` and `px-4`, while the page content uses `max-w-4xl` and `px-5 sm:px-10 lg:px-16`, so it is both narrower and misaligned.

### Fix
In `src/routes/_app/care.$ownerId.tsx`, update the `QuickLogBar` component:

1. **Import `useSidebarCollapsedPref`** from `@/components/layout/sidebar-nav`.
2. **Read the collapse state** inside `QuickLogBar` so the offset matches the sidebar.
3. **Adjust the fixed positioning**:
   - Replace `fixed inset-x-0 bottom-0` with `fixed bottom-0 right-0 left-0 md:left-16 lg:left-64` when expanded, and `lg:left-16` when collapsed.
   - This makes the bar span only the main content area, not the sidebar.
4. **Match the content width and padding**:
   - Change the inner container from `mx-auto max-w-3xl px-4` to `mx-auto max-w-4xl px-5 sm:px-10 lg:px-16`.

### Verification
Open a caregiver dashboard on desktop (sidebar expanded). The Quick Log bar should sit perfectly centered under the page content, aligned with the "No biometrics yet" card and the tab row above it.
