# Wave 1 — final automation report

**Date:** 2026-05-25  
**Repo:** [AstroAii/purpledrw](https://github.com/AstroAii/purpledrw)  
**Branch:** `main` @ `d66fa88` (includes `docs/manual-deploy-bundle.md`)

## Main branch — PR status

| PR                                                 | Title                                         | Status                             |
| -------------------------------------------------- | --------------------------------------------- | ---------------------------------- |
| [#1](https://github.com/AstroAii/purpledrw/pull/1) | Auth: fix flicker, add Apple + Google sign-in | **Merged**                         |
| [#2](https://github.com/AstroAii/purpledrw/pull/2) | Meds: supplements, refills, SW-based alarms   | **Merged**                         |
| [#3](https://github.com/AstroAii/purpledrw/pull/3) | AI: curated epilepsy research library (HNSW)  | **Merged** (squash; HNSW accepted) |

## Production Supabase state

| Item                                               | Status                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Migrations on live DB                              | **Not applied via CLI** — `supabase link` failed (logged-in CLI user lacks privileges on `lzuodgpqseijhhyzgfky`) |
| Manual SQL bundle                                  | **Ready** — `docs/manual-deploy-bundle.md` (13 migrations, Section 1)                                            |
| Edge functions deploy                              | **Not run** — same access block                                                                                  |
| Research seed                                      | **Not run** — missing local `.env` keys (see stop points)                                                        |
| `ai-orchestrator` smoke (levetiracetam + citation) | **Not run**                                                                                                      |

## CLI auth status

- `supabase projects list`: **OK** (logged in; many org projects listed).
- **purpledrw** project `lzuodgpqseijhhyzgfky`: **not in list**; `supabase link --project-ref lzuodgpqseijhhyzgfky` → **403 / insufficient privileges**.
- **Browser login stop (a):** not triggered — session already valid; wrong account or missing project invite is the blocker.

## Automation stop points

1. **(b) Phase 4 — missing `.env` keys:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_DB_PASSWORD` if using password link). Only `SUPABASE_URL` / Vite anon vars present locally.

## Artifacts pushed this run

- `docs/manual-deploy-bundle.md`
- `docs/oauth-provider-setup.md`
- `docs/wave-1-final.md` (this file)

## Top 3 actions only you can do (in order)

1. **Grant Supabase access** on project `lzuodgpqseijhhyzgfky` to the account used for CLI (or log in as the project owner), then run SQL from https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/sql/new using `docs/manual-deploy-bundle.md` Section 1 — **or** `supabase link` + `supabase db push` once link works.

2. **Set Edge Function secrets** at https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/settings/functions — at minimum `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; deploy functions per Section 2 of the manual bundle (or CLI deploy after link).

3. **Add the three keys to local `.env`**, run `bun run seed:research`, then smoke-test Ask with a levetiracetam question and confirm a research citation chip appears.

## OAuth (PR #1)

Follow `docs/oauth-provider-setup.md`. Providers UI: https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/auth/providers

---

Prior partial run: `docs/wave-1-merge-report.md`.
