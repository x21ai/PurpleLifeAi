I found the concrete bug: `/settings/sharing` and `/settings/travel` are registered as children of the `/settings` route, but `src/routes/_app/settings.tsx` renders the Settings page without an `<Outlet />`. In TanStack Router, child routes cannot render unless the parent route provides an outlet, so the app falls through to the Not Found boundary even though the child route files exist.

Plan:

1. **Fix the route architecture**
   - Convert `src/routes/_app/settings.tsx` into a proper parent/layout route.
   - Render the current Settings overview only when the exact path is `/settings`.
   - Render `<Outlet />` for child routes like `/settings/sharing`, `/settings/travel`, and `/settings/how-purple-thinks`.

2. **Keep the Settings overview behavior intact**
   - Preserve the existing Account / Health / People / App / Data / Help / Admin grouping.
   - Keep all current links unchanged where they are already correct.

3. **Deep-test the two broken pages**
   - Navigate directly to `/settings/travel` on the current mobile viewport and confirm the Travel page renders, not Not Found.
   - Navigate directly to `/settings/sharing` and confirm the Sharing & access page renders, not Not Found.
   - Check browser console and network errors for both pages.
   - Repeat at desktop/tablet-sized viewport if the page renders correctly on mobile.

4. **If page content loads but actions still fail**
   - Inspect the exact failing network/server-function responses for Travel creation/generation and Sharing invite/scope actions.
   - Patch only the failing action paths after confirming the route fix is working.