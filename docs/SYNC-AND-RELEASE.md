# Sync and release: how Lovable, Cursor, and production stay in step

This document explains how code moves between the three environments, who owns
what, which quality gates protect each step, and how to run a release. It was
written after a live audit on 2026-07-02 (all three heads at `70f484a`,
production serving the matching build, service worker `purple-shell-v17` on
both sides). Where the audit found gaps, they are listed in the improvement
backlog at the bottom, not described as if they were implemented.

Related docs: [`LOVABLE-REDESIGN-WORKFLOW.md`](LOVABLE-REDESIGN-WORKFLOW.md)
(the gatekeeper checklist), [`LOVABLE-DESIGNER-RULES.md`](LOVABLE-DESIGNER-RULES.md)
(what Lovable must never touch), [`LOVABLE-ENV-PARITY.md`](LOVABLE-ENV-PARITY.md)
(preview environment variables).

## The three environments

| Environment | What it is | What it is for |
|---|---|---|
| Lovable preview | Lovable's hosted build of branch `lovable/redesign`, running with Lovable's own env vars | Design iteration: components, pages, styles, marketing copy |
| Local / Cursor | This repo checked out locally, `bun run dev` on port 8080 | Review, gates, backend work: types, migrations, RLS, auth wiring, server functions, deploys |
| Production | Cloudflare Worker `purplelife` at `www.purplelife.org` | The live site, real users, real health data |

All three point at the same Supabase project (`xxnzmfzsjplrutrgbzxy`, browser
client URL `https://auth.purplelife.org`). Code parity is not runtime parity:
Lovable preview has no Worker secrets, so AI, email, drug autofill, and
webhooks are intentionally inert there (see
[`LOVABLE-ENV-PARITY.md`](LOVABLE-ENV-PARITY.md)).

## Code flow

```
+------------------+        push         +---------------------+
|  Lovable         | ------------------> |  lovable/redesign   |
|  (design work)   |                     |  (GitHub branch)    |
+------------------+                     +----------+----------+
                                                    |
                                     Cursor: read diff, run gates,
                                     Playwright smoke and visual
                                                    |
                                             clean? merge
                                                    v
                                         +----------+----------+
                                         |        main         |
                                         |  (gatekept branch)  |
                                         +----------+----------+
                                                    |
                            after merge, push main back to lovable/redesign
                            so BOTH branches sit at the SAME commit
                                                    |
                                     owner approves deploy (manual only)
                                                    v
                                    bun run build:prod + wrangler deploy
                                                    |
                                                    v
                                       +------------+------------+
                                       |  Cloudflare Worker      |
                                       |  purplelife             |
                                       |  www.purplelife.org     |
                                       +-------------------------+
```

Two properties keep this honest:

1. **Both branches converge after every merge.** Whoever lands a commit on
   `main` also pushes `main:lovable/redesign`, so Lovable's next session starts
   from exactly what production will ship. Divergence is the root cause of most
   past incidents. Note this is a convention, not an enforced rule (see backlog).
2. **Nothing auto-deploys.** `.github/workflows/deploy.yml` is
   `workflow_dispatch` only during the redesign. Production changes require a
   human decision every time.

## Ownership

| Owner | Responsibility |
|---|---|
| Lovable | UI only: `src/components/`, `src/routes/` presentation, `src/styles.css`, marketing copy, assets. Never `types.ts`, never migrations, never `.env`, never "Try to fix" on build or security errors. |
| Cursor | `src/integrations/supabase/types.ts` regeneration, `supabase/migrations/`, RLS policies, auth wiring, server functions, secrets, all deploys, review and merge of every Lovable push. |
| Owner (user) | Coordination (tells Cursor when Lovable pushed), explicit approval before any production deploy. |

## Quality gates

Verified present and wired as of the audit date.

| Gate | Command | Protects against | Where it runs |
|---|---|---|---|
| Em dash check | `bun run check:em-dash` | U+2014 anywhere in `src/` or `public/` (brand convention) | prebuild, CI |
| Supabase types check | `bun run check:supabase-types` | `types.ts` truncated or regenerated against the wrong project (requires `health_narratives`, `sync_mode`, community view names, and at least 3000 lines) | prebuild, CI |
| Live data check | `bun run check:live-data` | Placeholder or test data in marketing pages and seeds | CI |
| Unique images check | `bun run check:unique-images` | Two marketing routes sharing a hero image, plus any `__l5e` or `.asset.json` Lovable CDN pointer in `src/lib/calm-images/`, plus imports of asset files that do not exist on disk | CI |
| Lovable auth guard | `bun run check:lovable-auth` | Any file in `src/` that imports `@/integrations/lovable` or calls `lovable.auth` without also branching on `isLovablePreviewHost` (the OAuth production incident, case study 3) | CI |
| Type check | `bunx tsc --noEmit` | Type errors, broken imports, contract drift | CI |
| Build | `bun run build` | Anything that compiles under tsc but fails to bundle (prebuild gates run again here) | CI, deploy |
| Entry budget | `bun run check:entry-budget` | Client bundle bloat regressions | CI |
| Route smoke | `tests/e2e/routes-smoke.spec.ts` | Routes that render blank or crash | CI |
| Responsive sweep | `tests/e2e/responsive-sweep.spec.ts` (public routes, mobile-375 and tablet-768) | Horizontal overflow on small viewports | CI |
| Visual layout | `tests/e2e/visual-layout.spec.ts` | Full-bleed drift, uncapped sheet widths on desktop | manual, before deploy |
| Prod smoke | `bun run test:e2e:prod` (Doppler creds) | The deployed site actually working, signed-in flows included | manual, after deploy |

CI (`.github/workflows/ci.yml`) triggers on pull requests and on pushes to
both `main` and `lovable/redesign`, so Lovable's raw pushes get the full gate
suite automatically before Cursor even starts the review. The gates run again
when the merge lands on `main`.

## Environment parity

Lovable preview must point at the NEW Supabase project or previews show wrong
data and auth fails even though the code is identical:

- `VITE_SUPABASE_URL` = `https://auth.purplelife.org`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = publishable key for `xxnzmfzsjplrutrgbzxy` (from Doppler or the Supabase dashboard, never committed)
- `VITE_SUPABASE_PROJECT_ID` = `xxnzmfzsjplrutrgbzxy`

Full details and the list of intentionally-inert preview features:
[`LOVABLE-ENV-PARITY.md`](LOVABLE-ENV-PARITY.md).

## Case studies: what Lovable broke and what now prevents it

These three incidents shaped the current setup. The common thread: Lovable's
preview environment masks the breakage, so it only surfaces in production or
local builds.

### 1. Truncated `types.ts`

**What happened:** Lovable repeatedly edited or regenerated
`src/integrations/supabase/types.ts` (a generated file), truncating it or
generating it against the old Lovable Cloud project. The build then failed on
tables the app depends on, or worse, compiled against a stale schema.

**Why preview hid it:** Lovable's "Try to fix" flow patches types until its own
preview compiles, without regard to the live schema.

**Guard now:** `scripts/check-supabase-types.mjs` runs as a prebuild step and
in CI. It fails if required schema markers are missing or the file drops below
3000 lines. Additionally, design work moved off `main` to `lovable/redesign`
so a bad push can never reach the deployable branch unreviewed. Only Cursor
regenerates the file, always from project `xxnzmfzsjplrutrgbzxy`.

### 2. Hero images replaced with Lovable CDN pointers

**What happened:** Lovable swapped local hero JPGs under `src/assets/` for
`.asset.json` descriptors resolved through its `/__l5e/` CDN path.

**Why preview hid it:** the `/__l5e/` path only exists on Lovable preview
hosts. Everywhere else (local dev, production) the images 404 and marketing
pages render broken.

**Guard now:** `scripts/check-unique-route-images.mjs` rejects any `__l5e` or
`.asset.json` reference in `src/lib/calm-images/` and verifies every imported
asset file actually exists under `src/assets/`. Marketing images are local
files served through vite imagetools.

### 3. OAuth switched to Lovable-only auth client

**What happened:** Lovable rewired social sign-in to
`@lovable.dev/cloud-auth-js` (`lovable.auth.signInWithOAuth`).

**Why preview hid it:** that client only works on Lovable preview hosts. On
`www.purplelife.org`, Apple and Google sign-in silently failed.

**Guard now:** two layers. At runtime, `src/lib/lovable-preview.ts` exports
`isLovablePreviewHost()`, and
`src/components/auth/social-sign-in-buttons.tsx` branches: Lovable preview
hosts use `lovable.auth`, everything else uses
`supabase.auth.signInWithOAuth`. In CI,
`scripts/check-lovable-auth-guard.mjs` (`bun run check:lovable-auth`) fails
if any file in `src/` imports `@/integrations/lovable` or calls
`lovable.auth` without also referencing `isLovablePreviewHost` in the same
file, so a reintroduced unguarded call site cannot merge.

## Runbook: Lovable pushed changes

1. `git fetch origin`, then read the diff:
   `git log main..origin/lovable/redesign --oneline` and
   `git diff main..origin/lovable/redesign --stat`. Review by risk cluster:
   migrations, routes (including `<Outlet/>` on parent routes), `*.server.ts`
   and `*.functions.ts`, then components.
2. Check out or merge the branch locally and run the gates:
   `bun run check:em-dash && bun run check:supabase-types && bun run check:live-data && bun run check:unique-images && bunx tsc --noEmit && bun run build && bun run check:entry-budget`.
3. Run Playwright: route smoke, responsive sweep, visual layout. If migrations
   changed, verify the SQL against the live database before trusting UI that
   depends on it.
4. Report Go or No-Go to the owner. On No-Go, fix backend issues in Cursor or
   provide a paste-ready Lovable prompt for UI-only fixes.
5. On Go: merge to `main`, push `main`, then push `main:lovable/redesign` so
   both branches point at the same commit.
6. Only after explicit owner approval:
   `bun run build:prod` then
   `doppler run --project cursor-cloudflare --config prd_cloudlfare -- bunx wrangler deploy -c wrangler.deploy.jsonc`
   (override `CLOUDFLARE_ACCOUNT_ID=08e766e92db74bc7ef14c6b5c86bddf0` if
   Doppler still carries the wrong account).
7. Post-deploy: `bun run test:e2e:prod` and a quick manual pass of the changed
   surfaces.

## Runbook: Cursor made a fix

1. Commit on `main` (feature branch plus merge when the change is large).
2. Run the same gate battery locally before pushing.
3. `git push origin main main:lovable/redesign` in one command, so Lovable's
   next pull starts from the fixed code and never re-diverges.
4. Deploy only if the change needs to go live now, with owner approval, using
   the same build and deploy commands as above. Docs-only changes need no
   deploy: production serves built assets, not repo markdown.
5. Post-deploy smoke as above.

## Is this best practice? An honest assessment

### What matches industry norms

- **Trunk plus a design integration branch** is a standard pattern for
  integrating a high-churn external contributor (here, an AI design tool):
  isolate the churn, gate the trunk.
- **CI gates encode every past incident.** Each production breakage became a
  cheap automated check (em dash, types truncation, CDN pointers, bundle
  budget). That is textbook "regression tests for process failures".
- **Manual promotion during a high-churn phase** is the right call. Auto-deploy
  is a virtue when contributors are trusted and gates are exhaustive; during a
  whole-app redesign by a tool with a track record of preview-only assumptions,
  a human approval step is cheap insurance.
- **Generated files owned by exactly one side** (only Cursor touches
  `types.ts`, migrations, RLS) is the correct way to stop edit wars over
  machine-generated artifacts.
- **Environment parity is documented and pinned** (one Supabase project for
  all three environments, documented env vars) rather than left to memory.

### Known trade-offs and improvement backlog

- **No PR-based review flow.** The `gh` CLI is unavailable locally and no
  GitHub token is configured, so review happens in the working tree and merges
  are direct pushes. CI now runs on `lovable/redesign` pushes, which covers
  the automated gates, but a PR per Lovable drop would still add reviewable
  diffs, required-check enforcement before merge, and an audit trail.
- **The Lovable CDN pointer check only scans `src/lib/calm-images/`.** A
  `__l5e` or `.asset.json` reference elsewhere in `src/` would slip through.
  Widening the scan to all of `src/` is low cost.
- **Branch sync is convention, not enforcement.** Nothing verifies
  `main == lovable/redesign` after a merge; a forgotten
  `push main:lovable/redesign` recreates divergence silently. A scheduled or
  CI job that compares the two heads and alerts would make the invariant
  self-checking.
- **No staging environment.** Code jumps from Lovable preview (wrong runtime,
  no Worker secrets) straight to production. A `workers.dev` staging deploy of
  the Worker would let signed-in, secret-dependent features (AI, email, OAuth)
  be smoke-tested pre-production instead of post-deploy.
- **Auto-deploy can return post-redesign.** Once Lovable churn ends, restoring
  `push: branches: [main]` on the deploy workflow (with the full gate battery
  as a required check) restores continuous delivery.
- **Prod smoke tests run after deploy, not before.** With a staging Worker,
  the same suite could gate the production deploy instead of verifying it
  after the fact.
