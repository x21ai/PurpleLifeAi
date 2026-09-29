# PurpleLife Ploy (Astro)

Source for the signed-in and marketing UI on **www.purplelife.org** and
**staging.purplelife.org**. Both hosts use live copy
(`VITE_PUBLIC_SITE_ENV=production`) and the hybrid Worker entry
`worker/www-entry.ts`. Staging binds the same production D1/R2/KV and does not
register cron triggers.

Runbook: [`docs/DEPLOY-STAGING-PLOY.md`](../docs/DEPLOY-STAGING-PLOY.md).

```bash
# From repo root. Operator deploy only; do not wrangler deploy from a cloud agent.
bun run build:staging:ploy
bun run deploy:staging:ploy
```

Local dev (design-preview copy, no live API):

```bash
cd ploy-staging && bun install && bun run dev
```
