# Staging Ploy hybrid

staging.purplelife.org uses the same Worker entry as www (`ploy-staging/worker/www-entry.ts`).

- UI: Ploy Astro built with `VITE_STAGING_LIVE_DATA=1` and `VITE_PUBLIC_SITE_ENV=production`.
- Canonical host stays `https://staging.purplelife.org` (`scripts/build-ploy-staging.sh` does not read `PUBLIC_SITE_URL`).
- `/api/*` and `/oauth/*`: TanStack in-process on Worker `purplelife-staging`.
- Data: same production D1 `8d0be2b3-84ec-4581-86f4-6b372ec1d5d7`, R2 `purplelifeai`, eigital KV `9226585702aa4be694ac74981d9859c4`.
- No cron triggers. Worker `purplelife` owns schedules.
- `AUTH_JWT_SECRET` on `purplelife-staging` must match `purplelife`.
- A staging write is a production-data write. Do not pause Supabase or wipe D1.

Runbook: `docs/DEPLOY-STAGING-PLOY.md`.
