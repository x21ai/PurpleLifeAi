# Cursor Handoff

Operational state of the Purple project for the next agent or engineer. Last updated: 2026-06-11.

## Orientation

- Product and architecture: `docs/ARCHITECTURE.md`
- Feature inventory and route map: `docs/FEATURES.md`
- Lovable exit + Cloudflare cutover plan: `docs/LOVABLE-MIGRATION.md`
- Supabase manual deploy procedure: `docs/manual-deploy-bundle.md`
- OAuth provider setup: `docs/oauth-provider-setup.md`
- Durable decisions: `mem/index.md` (no em dashes, footer visibility, metric naming)
- Editor rules: `.cursor/rules/` (conventions, server functions, Cloudflare constraints)

## Quick facts

| Item | Value |
|------|-------|
| Brand / domain | Purple, `https://www.purplelife.org` |
| Framework | TanStack Start 1.168, React 19, Vite 7, Tailwind 4 |
| Runtime | Cloudflare Worker (`wrangler.jsonc`, entry `src/server.ts`, `nodejs_compat`) |
| Package manager | bun (commands below) |
| Database | Supabase project `lzuodgpqseijhhyzgfky`, ~100 migrations, 6 edge functions |
| Dev server | `bun run dev` on port 8080 |
| E2E | `bun run test:e2e` (Playwright, boots dev server unless `E2E_BASE_URL` set) |
| Lint/format | `bun run lint`, `bun run format` |
| Quality gates | `bun run check:em-dash` (also prebuild), `check:live-data`, `check:unique-images` |
| Seeds | `bun run seed:research` (needs `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`) |

## Current hosting state

Production currently runs on Lovable-managed infrastructure. The codebase is already Cloudflare-shaped (Worker entry, `@cloudflare/vite-plugin` via the Lovable vite wrapper), so the cutover is account/config/DNS work plus removing four service couplings (vite wrapper, OAuth, email, AI gateway). Full plan with phases and verification steps: `docs/LOVABLE-MIGRATION.md`.

## Environment variables

In the local `.env` (values not committed beyond this machine):

- `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

Referenced in code but NOT present locally (production needs them; several block local testing of those paths):

| Variable | Used by |
|----------|---------|
| `LOVABLE_API_KEY` | AI chat, email pipeline, previews (until migration phases 3/4) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cron, email enqueue, admin functions, seeds |
| `CRON_SECRET` | All `/api/public/cron/*` endpoints |
| `PUBLIC_SITE_URL` | Email links, share links |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `OURA_CLIENT_ID/SECRET`, `WHOOP_CLIENT_ID/SECRET` | Wearable OAuth |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY` | Direct AI providers (user-key paths today, platform default after migration) |
| `LOVABLE_SEND_URL` | Optional email send URL override |

## Known gaps and sharp edges

1. **Supabase CLI 403s** on this project; migrations and edge functions are deployed manually via the dashboard (`docs/manual-deploy-bundle.md`). Wave 1 reports (`docs/wave-1-final.md`, `docs/wave-1-merge-report.md`) carry the history.
2. **No CI committed.** Playwright config has CI settings (2 retries, GitHub reporter) but there is no `.github/workflows/`. Planned in migration Phase 7.
3. **`/api/chat` hard-requires `LOVABLE_API_KEY`**, so chat cannot be exercised locally without it (or until migration Phase 4 makes a direct provider the default).
4. **Naming drift**: `package.json` name is `tanstack_start_ts`; the About page links `github.com/lovable-dev/purple`; older docs mention `AstroAii/purpledrw`. Canonical repo decision pending (migration Phase 5).
5. **`src/routeTree.gen.ts` is generated.** Never hand-edit; it regenerates from `src/routes/` during dev/build.
6. **`vite.config.ts` is a wrapper.** Do not add tanstackStart/react/tailwind/tsconfig-paths/cloudflare plugins manually while `@lovable.dev/vite-tanstack-config` is in place; duplicates break the build.
7. **Email DNS**: `notify.purplelife.org` is delegated to Lovable nameservers. Re-pointing it is part of migration Phase 3 and must be coordinated with the Supabase auth-hook URL change.
8. **External webhook pointers** that must move at cutover: Stripe webhook, Supabase auth email hook, Mailgun-format suppression webhook, Google/Apple OAuth redirect URLs, Oura/Whoop redirect URIs.

## Decisions pending (blocking migration execution)

1. Email provider: Resend (recommended) or Mailgun direct.
2. Platform-default AI provider replacing the Lovable gateway: Gemini Flash (cost) or Anthropic (quality).
3. Canonical public GitHub repository for the About link.
4. Worker name and apex/www routing preference.

## How to verify a change (cheapest first)

1. `bun run lint && bun run check:em-dash`
2. `bun run build` (catches Worker/SSR bundling issues)
3. `bun run test:e2e` for routed/UI changes (smoke spec `tests/e2e/routes-smoke.spec.ts` is the fastest meaningful signal)
4. For Worker behavior: `wrangler dev` against the built output

## Conventions snapshot

- Server code: `*.functions.ts` (RPC, auth middleware, zod) + `*.server.ts` (secrets, dynamic import only). Details in `.cursor/rules/server-functions.mdc`.
- 404 (not 403) on cross-user access; audit log after sensitive writes; RLS on every table.
- No em dashes anywhere, ever (CI gate).
- i18n strings through i18next; SSR renders `en` then hydrates locale.
- Footer only on marketing/auth pages, never inside `AppShell`.
