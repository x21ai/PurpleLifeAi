# Plan: PROJECT_KNOWLEDGE.md — full handoff document

Create one self-contained markdown file at the project root (`PROJECT_KNOWLEDGE.md`) that another AI (Lovable, Cursor, ChatGPT, Claude) can be handed in a single paste to fully understand Purple and continue building. It consolidates what is currently spread across `CURSOR_HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/LOVABLE-MIGRATION.md`, `mem/`, and the project-knowledge brand rules — without replacing any of them.

## What goes in the document

1. **What Purple is** — one paragraph: private, AI-powered health journal for chronic/complex conditions (epilepsy is depth, app is condition-aware not condition-locked), caregivers included, free + open source + ad-free, user owns their data. Brand rules (always capitalized, calm Apple-like tone, purplelife.org).

2. **Current status (as of 2026-06-11)** — production live on Lovable infra, Cloudflare Worker `purplelife` ready, dual-edit from Cursor + Lovable, recent fix: `/sign-in` hero image. Pending: migration `20260611010000_remove_lovable_ai_provider.sql`, redeploy `ai-orchestrator` + `risk-forecaster`, external cutover steps in Phase 7.

3. **Tech stack** — TanStack Start 1.168, React 19, Vite 7 (via `@lovable.dev/vite-tanstack-config` wrapper), Tailwind 4, shadcn/ui + ui-oura, Lovable Cloud (Supabase ~100 migrations, 6 edge functions, pgvector, PGMQ), Stripe, Vercel AI SDK with Anthropic default, Resend email, Cloudflare Workers, i18next (en/es), Playwright e2e, bun.

4. **Architecture** — request flow (`wrangler.jsonc` → `src/server.ts` → `src/start.ts` middleware → `src/router.tsx` → `__root.tsx`), file-based routing layout (`_app/` authenticated, marketing top-level, `api/public/*` cron + webhooks, `api/email/*`), two-file server pattern (`*.functions.ts` + `*.server.ts`), auth model, role gating via `user_roles` + `has_role`.

5. **Complete feature inventory by area** — Marketing, Auth/Onboarding, Today, Journal, Seizures, Hydration/Intake, Vitals, Medications (incl. reminders + voice/scan), Biometrics (Oura/Whoop/Apple Health), Reports (labs, metrics, trends, sharing), DNA (Pro), Ask Purple chat, Care/caregivers, Conditions, Travel, Community + Friends, Pro/billing, Admin suite, Settings/Account, Email pipeline, PWA, i18n. Each item lists the routes and key file paths so an AI knows where to look.

6. **Domain rules** — conditions on `profiles.conditions`, travel itinerary model + `trip_id` regeneration, dose reminder flow, care write-confirmation, RLS-everywhere, 404-not-403 on cross-user, no em dashes, footer visibility, metric naming canon.

7. **Data model summary** — domain → key tables table (already in ARCHITECTURE).

8. **Edge functions inventory** — the 6 functions and their purpose.

9. **Email pipeline** — producers → templates → PGMQ → Resend → feedback loop.

10. **Quality gates** — `check:em-dash`, `check:live-data`, `check:unique-images`, lint debt note, Playwright matrix, CI/CD workflows status.

11. **Environment variables** — present locally vs. referenced-only, what each unlocks (full table from CURSOR_HANDOFF).

12. **Files that are auto-generated / never edit** — full list.

13. **Known gaps and sharp edges** — Supabase CLI 403s, lint debt, vite wrapper rules, route tree regeneration, DNS cutover, webhook re-pointing list.

14. **Recent decisions log** — Resend, Anthropic default, repo `AstroAii/purpledrw`, worker name `purplelife`, dual dev.

15. **How to verify a change** — cheapest-first ladder (em-dash → build → e2e smoke → `wrangler dev`).

16. **Out of scope** — native apps, condition-specific SDKs, real flight APIs, multi-trip overlap.

17. **Suggested next-steps backlog** — short list distilled from CURSOR_HANDOFF "remaining cutover" + Lovable migration Phase 7, so the next prompt has obvious starting points.

## Source material to read before writing

`CURSOR_HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/LOVABLE-MIGRATION.md`, `docs/wave-1-final.md`, `mem/index.md` and the three mem rule files, `package.json` scripts, `wrangler.jsonc`, `src/start.ts`, `src/router.tsx`, `src/routes/__root.tsx`. Most are already in context; I will read the few that are not before writing.

## Output

- New file: `PROJECT_KNOWLEDGE.md` at repo root.
- No code changes, no edits to existing docs.
- Target ~600–900 lines so it is paste-friendly into another AI's context window.
- Plain markdown, no em dashes (CI gate), no emojis.

## Out of scope for this task

- Editing or restructuring existing docs in `docs/`.
- Writing per-feature deep-dives (this document points at routes + files; deep-dives stay where they are).
- Any code or migration changes.
