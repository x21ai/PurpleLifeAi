# Design preview staging (Ploy / external crawlers)

Temporary **public** Worker for design tools that cannot sign in (no password field).
Production at https://www.purplelife.org is unchanged: normal auth still required there.

## URL pattern

| Host | Purpose |
|------|---------|
| `https://www.purplelife.org` | Production (auth required for `/today`, etc.) |
| `https://purplelife-design.<account>.workers.dev` | Design staging (auto session as pmt) |
| `https://design.purplelife.org` | Optional custom hostname (DNS + route; not required for first deploy) |

After deploy, Wrangler prints the workers.dev URL. Set Worker var `PUBLIC_SITE_URL` to that
URL (cron triggers are omitted on the design Worker).

## Auto-authenticated account

Every visitor on the design Worker is signed in server-side as the **real founding-team
account** (full D1/R2 fidelity for Ploy):

| Field | Value |
|-------|-------|
| Email | `pmt@eigital.com` |
| User id | `bb160030-2ed6-45d7-8a5a-7f6f7879e9bb` |

The design Worker uses the **same D1/R2/KV bindings** as production (`wrangler.design.jsonc`).
No password is stored in the repo: `/api/public/design-preview/session` mints a Workers JWT
via `AUTH_JWT_SECRET` when `DESIGN_PREVIEW=1`.

Override with Worker vars `DESIGN_PREVIEW_USER_ID` / `DESIGN_PREVIEW_USER_EMAIL` only if
the account changes.

## Flags

| Flag | Where | Effect |
|------|-------|--------|
| `DESIGN_PREVIEW=1` | Worker env (`wrangler.design.jsonc` vars) | Enables session mint + server guards |
| `VITE_DESIGN_PREVIEW=1` | Build-time only (`bun run build:design`) | Client auto-bootstraps session; staging banner |
| `DESIGN_PREVIEW_USER_ID` | Worker var (optional) | Defaults to pmt uuid above |
| `DESIGN_PREVIEW_USER_EMAIL` | Worker var (optional) | Fallback lookup; defaults to pmt@eigital.com |

Both `DESIGN_PREVIEW` and `VITE_DESIGN_PREVIEW` must be set on the design deployment.
Production builds must **not** set `VITE_DESIGN_PREVIEW`.

## Deploy design staging

```bash
# 1. Build with design client flag (Cloudflare backend, auto-session client)
bun run build:design

# 2. Deploy separate Worker (does not touch wrangler.deploy.jsonc / prod routes)
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  wrangler deploy -c wrangler.design.jsonc

# 3. Copy required secrets from production Worker (same AUTH_JWT_SECRET so tokens validate):
#    AUTH_JWT_SECRET, ANTHROPIC_API_KEY (AI pages), etc.
#    Omit wearable/social OAuth on design Worker: GOOGLE_*, APPLE_*, OURA_*, WHOOP_*

# 4. Set PUBLIC_SITE_URL to the printed workers.dev URL
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  wrangler secret put PUBLIC_SITE_URL -c wrangler.design.jsonc
# paste: https://purplelife-design.<account>.workers.dev
```

One-liner after secrets are configured:

```bash
bun run deploy:design
```

## Verify

```bash
BASE=https://purplelife-design.<account>.workers.dev

# Session bootstrap (200 + access_token; sub must be pmt user id)
curl -sS "$BASE/api/public/design-preview/session" | jq '.user.id, .access_token[:20]'

# App routes without /sign-in redirect (needs JS for TanStack client auth)
curl -sS -o /dev/null -w "%{http_code}" "$BASE/today"
# Expect 200 HTML shell; browser/crawler with JS loads signed-in Today
```

Pages to spot-check for Ploy: `/today`, `/data`, `/plan`, `/journal`, `/tools`, `/account`,
`/reports`, `/care`, `/meds`.

## Tear down

```bash
wrangler delete purplelife-design -c wrangler.design.jsonc
```

Remove any `design.purplelife.org` DNS record if added. **Do this when Ploy work finishes**
to stop public PHI exposure.

## Security and PHI warning

- The staging URL is **fully public**. Anyone who knows the workers.dev link can browse
  **all of pmt@eigital.com's live data** (reports, journal, biometrics, meds, caregiver
  views, etc.) without a password until the Worker is deleted.
- This is intentional for full-fidelity design crawls but is **not HIPAA-safe**. Treat the
  URL like a temporary credential leak; share only with Ploy; tear down promptly.
- OAuth provider connects are blocked on the design host (omit provider secrets on that Worker).
- Writes are not fully blocked server-side; the pmt account can be mutated by anyone who
  loads the staging URL.
- Do not commit passwords or OAuth secrets. Session mint is server-side only.

## Production deploy (unchanged)

```bash
bun run build:prod
doppler run --project cursor-cloudflare --config prd_cloudlfare -- \
  wrangler deploy -c wrangler.deploy.jsonc
```

`wrangler.deploy.jsonc` has no `DESIGN_PREVIEW` var. Production builds use `build:prod`
(without `VITE_DESIGN_PREVIEW`).
