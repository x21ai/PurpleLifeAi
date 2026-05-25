## Problem

Preview returns 500 on every request. Server logs show:

```
TypeError: Cannot read properties of undefined (reading 'get')
  at Object.dehydrate (node_modules/@tanstack/start-server-core/node_modules/@tanstack/router-core/.../ssr-server.js:209)
```

The nested `node_modules/@tanstack/start-server-core/node_modules/@tanstack/router-core` path means `react-start` installed its own copy of `router-core` because the top-level `@tanstack/react-router` (pinned to `1.168.11` earlier) no longer matches the version `react-start` expects. The two copies disagree on internal shape and SSR `dehydrate()` blows up on every render.

This is not a Cursor/Lovable conflict — it's a dependency-pin mismatch in `package.json`.

## Fix

1. In `package.json`, change `@tanstack/react-router` from the pinned `1.168.11` back to the same version range used by `@tanstack/react-start` (match whatever `react-start` resolves to — likely `^1.140.0` style, same as the original template). Remove the pin.
2. Run `bun install` so only ONE copy of `@tanstack/router-core` exists under `node_modules/` (no nested copy under `start-server-core`).
3. Re-address the original TS2353 `server` property error that motivated the pin. The correct fix in current TanStack is to use the supported route options shape, not to downgrade the router. Options:
   - Keep the `@ts-expect-error` on the `server:` field in `src/routes/api/public/hooks/risk-forecaster.ts` (it works at runtime), OR
   - Move the cron endpoint to the file-based server-route convention that the installed `react-start` version supports.
4. Restart dev server, verify preview loads (no more 500 from `dehydrate`), then verify `/api/public/hooks/risk-forecaster` still responds.

## Out of scope

- No app/business-logic changes.
- No auth, RLS, or Supabase changes.
- No edits to other routes or components.
