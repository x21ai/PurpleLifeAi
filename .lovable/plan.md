## Goal
Let users trigger a wearable sync (Oura + Whoop) from anywhere in the app instead of navigating to Settings/Tools. Apple Health is push-only and stays excluded from the action.

## Approach
Add a compact sync icon-button to the shared `TopBar` (desktop/tablet) and the `MobileTopBar` (mobile) so it shows on every authenticated screen, including Today. Reuses the existing sync logic from `src/components/biometrics/sync-status.tsx` so behavior matches the Settings card exactly.

## Changes

1. **New component `src/components/biometrics/header-sync-button.tsx`**
   - Icon-only button (`RefreshCw`, spins while syncing) sized to fit the 14h header (`h-8 w-8 rounded-full`), with `aria-label="Sync wearable data"` and a tooltip "Sync wearable data".
   - On mount, checks `oura_tokens` + `whoop_tokens` for the current user. Renders nothing if neither is connected (keeps header clean for users without wearables, matches Apple-restraint preference).
   - On click: runs the same `Promise.allSettled` over connected providers as `WearableSyncStatus.sync()` (oura-sync edge function + `whoopIncrementalSync` server fn), with the same toast feedback (success / partial / fail, plus the "Apple Health pushes automatically" note when Apple is also connected).
   - After a successful sync, dispatches a `window` custom event `purple:wearable-synced` so the Today page can refresh its biometrics.

2. **`src/components/layout/top-bar.tsx`** (desktop/tablet, ≥ md)
   - Insert `<HeaderSyncButton />` before `<PendingInboxBadge />` so the action sits left of the inbox/profile cluster.

3. **`src/components/layout/mobile-top-bar.tsx`** (mobile)
   - Add the same `<HeaderSyncButton />` in the right-side action cluster, sized identically so the header stays balanced on 375px, 768px, and 1024px viewports.

4. **`src/routes/_app/today.tsx`** (light touch)
   - Listen for `purple:wearable-synced` and call the existing `load()` + bump `syncTick` so the Today scores and sync-status badge refresh immediately when the header button is used. No layout changes.

## Out of scope
- No changes to the Settings / Tools sync cards (header button is additive).
- Apple Health push-only behavior unchanged.
- Pull-to-refresh on Today unchanged.

## Verification
- Desktop 1440 / tablet 1024 / 768 / mobile 375 (workspace rule: cover all viewports): header shows the sync icon when a wearable is connected, hidden otherwise; clicking spins the icon, fires toast, and Today scores refresh without reload.
- Confirm header alignment stays right-aligned and doesn't overflow on 375px.
- Confirm icon disappears on routes still inside `_app` for a user with no wearable tokens.
