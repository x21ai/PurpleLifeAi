# Lovable redesign workflow

Whole-app redesign happens in Lovable. GitHub `main` on `AstroAii/purpledrw` is
the sync bus between Lovable and Cursor. Production (`www.purplelife.org`) does
**not** auto-deploy on every push during redesign; Cursor reviews and tests every
Lovable landing on `main`, then asks the owner before going live.

## Redesign baseline

| Item | Value |
|------|-------|
| Baseline commit | `7086ffa` (`perf+responsive: speed, mobile/tablet fixes, and native shell foundation`) |
| Branch | `main` on `AstroAii/purpledrw` (production gatekeeper); Lovable design on `lovable/redesign` |
| Production Worker | `purplelife` on Cloudflare (`www.purplelife.org`) |
| Supabase (live data) | ref `xxnzmfzsjplrutrgbzxy`, auth `https://auth.purplelife.org` |
| Service worker (baseline) | `purple-shell-v16` |

Designers work on branch **`lovable/redesign`**. Cursor reviews and merges to `main`.
See [`LOVABLE-DESIGNER-RULES.md`](LOVABLE-DESIGNER-RULES.md) for what Lovable must never edit.

## Flow

```
Lovable redesign  -->  push to lovable/redesign  -->  Cursor review + test gates
                                                      |
                                              merge to main when clean
                                                      |
                                              Go: ask owner to deploy
                                              No-Go: fix in Cursor
```

CI (`.github/workflows/ci.yml`) still runs on every push/PR so broken commits are
caught without going live. Deploy (`.github/workflows/deploy.yml`) is
`workflow_dispatch` only until redesign ends.

## For Lovable / designers

### Before you start

1. Confirm Lovable is connected to `AstroAii/purpledrw`, branch **`lovable/redesign`** (not `main`),
   and has pulled at least through baseline `7086ffa` plus Cursor's types fix.
2. Read [`LOVABLE-DESIGNER-RULES.md`](LOVABLE-DESIGNER-RULES.md). Never edit `types.ts` or migrations.
2. Set preview env vars per [`LOVABLE-ENV-PARITY.md`](LOVABLE-ENV-PARITY.md):
   - `VITE_SUPABASE_URL` (use `https://auth.purplelife.org`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (from Doppler or Supabase dashboard, never in repo)
   - `VITE_SUPABASE_PROJECT_ID` = `xxnzmfzsjplrutrgbzxy`
3. Push UI chunks to **`lovable/redesign`** when ready for Cursor review. Do not push design work to `main`.

### Design constraints (CI-enforced)

- **Layout:** App pages center in `mx-auto max-w-3xl px-5 sm:px-10 lg:px-16`
  (biometrics may use `max-w-5xl`). Bottom sheets wrap content in `SheetColumn`
  (`mx-auto w-full max-w-xl` from `src/components/ui/sheet.tsx`). No full-bleed
  content drift on desktop.
- **No em dashes** anywhere in `src/` or `public/` (use comma, hyphen, and, or).
- **No fake/placeholder data** on marketing pages or seeds; use demo badge when
  showing sample data.
- **Unique hero images:** each marketing route must use its own image module under
  `src/lib/calm-images/` (see `scripts/check-unique-route-images.mjs`).
- **Theming:** use semantic tokens (`text-foreground`, `bg-card`, etc.), not
  hardcoded `text-white` / `bg-[#...]` on sheet and report surfaces.
- **i18n:** user-facing strings in app routes go through `react-i18next`
  (`src/i18n/locales/en.json`, `es.json`).

### What will not work in Lovable preview (expected)

Server-only features need the Cloudflare Worker or edge secrets:

- AI chat, narratives, report trends (`ANTHROPIC_API_KEY` on Worker)
- Transactional/auth email (Resend + send-email hook)
- Drug-database autofill (`drug-db.server.ts` on Worker)
- Wearable sync crons, email queue pump, webhooks

UI must degrade gracefully (empty state, "unavailable in preview", demo badge),
not crash or show fake success.

### Common Lovable pitfalls

| Pitfall | Fix |
|---------|-----|
| UI queries a table/column that does not exist | Match live schema in `supabase/migrations/`; ask Cursor to verify |
| New table without RLS | Add RLS policies in the same migration |
| Parent route file without `<Outlet/>` | Child routes silently show parent (see `meds.tsx` pattern) |
| Hardcoded Supabase old ref `lzuodgpqseijhhyzgfky` | Use env vars only; new ref is `xxnzmfzsjplrutrgbzxy` |
| Inline imports in function bodies | Imports at top of module (except `*.functions.ts` -> `*.server.ts` split) |
| Wide empty sheets on desktop | Wrap in `SheetColumn` |

## For Cursor (production gatekeeper)

Run this checklist whenever Lovable may have pushed to `main`, or when the user
says "check Lovable" / "review latest Lovable changes".

### 1. Discover what changed

```bash
git fetch origin
git log HEAD..origin/main --oneline
git diff HEAD..origin/main --stat
```

Read the diff by risk cluster:

- `supabase/migrations/` (schema, RLS)
- `src/routes/` (routing, `<Outlet/>`, loaders)
- `*.server.ts`, `*.functions.ts` (API contracts, auth)
- `src/components/` (UI, layout, tokens)

### 2. Quality gates (all must pass)

```bash
bun run check:em-dash
bun run check:live-data
bun run check:unique-images
bunx tsc --noEmit
bun run build
bun run check:entry-budget
```

### 3. Tests

```bash
# Local responsive (public routes)
bunx playwright test tests/e2e/responsive-sweep.spec.ts -g "public routes" --project=mobile-375 --project=tablet-768

# Smoke + visual (when dev server or E2E_BASE_URL available)
bunx playwright test tests/e2e/routes-smoke.spec.ts
bunx playwright test tests/e2e/visual-layout.spec.ts

# Production (when Doppler E2E creds available)
bun run test:e2e:prod
```

### 4. Migrations (if any)

Before trusting UI that depends on new schema:

- Compare migration SQL to live DB (`docs/manual-deploy-bundle.md`, Management API
  `POST /v1/projects/xxnzmfzsjplrutrgbzxy/database/query`)
- Do not ship code that queries columns/tables not yet applied in production

### 5. Report and deploy decision

Summarize for the owner:

- What Lovable changed (files, routes, UI areas)
- Gate results (pass/fail per step)
- Visual notes if layout changed
- **Go** or **No-Go**

- **Go:** ask "Ready to deploy to live?" Deploy only after explicit yes:
  `bun run build:prod` then `wrangler deploy -c wrangler.deploy.jsonc` (or trigger
  GitHub Actions Deploy workflow).
- **No-Go:** fix in Cursor, or provide a paste-ready Lovable prompt for
  designer-owned fixes.

### Never during redesign

- Do not deploy to production without full gate pass + explicit user approval.
- Do not assume Lovable changes are correct without reading the diff and running gates.
- Do not re-enable push-to-main auto-deploy without owner request.

## Ending the redesign phase

When the owner declares redesign complete:

1. Re-enable `push: branches: [main]` in `.github/workflows/deploy.yml` if desired.
2. Update `.cursor/rules/lovable-redesign-workflow.mdc` or set `alwaysApply: false`.
3. Run full `bun run test:e2e:prod` and visual sweep before final production cutover.

## Related docs

- [`LOVABLE-ENV-PARITY.md`](LOVABLE-ENV-PARITY.md) - preview env vars
- [`LOVABLE-MIGRATION.md`](LOVABLE-MIGRATION.md) - historical Lovable exit plan
- [`CURSOR_HANDOFF.md`](../CURSOR_HANDOFF.md) - operational handoff for agents
- [`.cursor/rules/lovable-redesign-workflow.mdc`](../.cursor/rules/lovable-redesign-workflow.mdc) - always-on agent rule
