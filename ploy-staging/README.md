# PurpleLife Ploy staging (Astro)

Source for **staging.purplelife.org** — Ploy redesign UI with **live production D1/R2**
(same as www.purplelife.org). Deployed as Cloudflare Worker `purplelife-staging`.

See repo runbook: [`docs/DEPLOY-STAGING-PLOY.md`](../docs/DEPLOY-STAGING-PLOY.md).

```bash
# From repo root
bun run build:staging:ploy
bun run deploy:staging:ploy
```

Local dev (mock UI only):

```bash
cd ploy-staging && bun install && bun run dev
```

Live-data local build:

```bash
cd ploy-staging && VITE_STAGING_LIVE_DATA=1 bun run build
```
