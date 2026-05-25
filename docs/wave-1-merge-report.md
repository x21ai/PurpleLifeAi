# Wave 1 merge report

**Repo:** AstroAii/purpledrw  
**Run date:** 2026-05-25  
**PR order processed:** #1 → #3 → #2  

## Setup

| Step | Result |
|------|--------|
| `gh auth status` | OK (github.com, account eigital) |
| `supabase --version` | 2.84.2 |
| `project_id` in `supabase/config.toml` | `lzuodgpqseijhhyzgfky` |
| `supabase link` | **Failed** — CLI account lacks privileges on project (403) |
| `.env` secrets | **Missing:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (only Vite/anon Supabase vars present) |

## PR #1 — Auth: fix flicker, add Apple + Google sign-in

- **URL:** https://github.com/AstroAii/purpledrw/pull/1  
- **Status:** **Merged** (squash)  
- **Review**
  - No `[auth]` `console.log` in `auth-context.tsx` (only `console.warn` on `SIGNED_OUT`) — pass  
  - `sign-in.tsx`: Apple + Google above email with “or continue with email” divider — pass  
  - No `package.json` / icon library dependency changes — pass  
- **Database / edge functions:** none  
- **Verification**
  - No production deploy URL in `wrangler.jsonc`, GitHub Pages, or repo docs  
  - Local: `bun run dev` → `curl -I http://127.0.0.1:5173/sign-in` → **HTTP 200**  
- **Failed commands:** none for this PR  

## PR #3 — AI: curated epilepsy research library

- **URL:** https://github.com/AstroAii/purpledrw/pull/3  
- **Status:** **Blocked** (not merged)  
- **Review**
  - `vector(1536)` on `research_sources.embedding` — pass  
  - Index: migration uses **HNSW**, not **ivfflat** as required by wave-1 checklist — **fail**  
  - Seed URLs (branch): 16× `www.epilepsy.com`, 12× `pmc.ncbi.nlm.nih.gov`, 2× `www.cdc.gov`, 1× `www.nice.org.uk` — pass domain/count check  
  - `search_research_library` in `ai-orchestrator` — pass  
  - Citation chips in `chat.tsx` (`SOURCE_CITATION_RE`) — pass  
- **Comment posted:** https://github.com/AstroAii/purpledrw/pull/3#issuecomment-4531114188  
- **Database / seed / deploy:** skipped (not merged)  
- **Verification:** skipped  

## PR #2 — Meds: supplements, refills, SW-based alarms

- **URL:** https://github.com/AstroAii/purpledrw/pull/2  
- **Status:** **Merged** (squash)  
- **Review**
  - Migration adds `kind`, `dosage_form`, `dosage_amount`, `dosage_unit`, `with_food`, `refill_threshold` with safe defaults/backfill — pass  
  - `medication_side_effects` RLS `side_effects_owner` — pass  
  - `public/sw.js`: IndexedDB scheduling, no `setTimeout` — pass  
  - `supabase/functions/med-dose-action`: OPTIONS CORS + bearer `getUser` — pass  
- **Database:** `supabase db push` — **not run** (project not linked; 403 on link)  
- **Edge deploy:** `supabase functions deploy med-dose-action` — **403** (insufficient Supabase org access)  
- **Verification**
  - `supabase functions invoke med-dose-action --no-verify-jwt` — **CLI has no `invoke` subcommand** in v2.84.2  
  - Remote: `OPTIONS`/`POST` `https://lzuodgpqseijhhyzgfky.supabase.co/functions/v1/med-dose-action` → **404 NOT_FOUND** (function not deployed on project)  

## Credentials and access still needed

1. **Supabase Dashboard access** for project `lzuodgpqseijhhyzgfky` (or invite CLI account) — required for `supabase link`, `db push`, and `functions deploy`.  
2. **`.env` (local) or CI secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — required for research seed and orchestrator verification after PR #3 merges.  
3. **Optional:** `SUPABASE_DB_PASSWORD` if linking via database password flow.  
4. **Apple Developer + Google Cloud OAuth** — configure providers and redirect URLs per PR #1 body (manual).  
5. **Production app URL** — not documented in repo; configure Cloudflare Workers deploy and use that URL for post-deploy smoke tests.  

## Recommended next action

**Unblock PR #3:** either add an `ivfflat` index (per checklist) or agree HNSW is acceptable and re-run merge; then grant Supabase CLI access, add the three API keys to `.env`, run `supabase db push`, deploy `ai-orchestrator`, and `bun run seed:research` (script name on PR branch — add to `package.json` on main when merged).

**Immediately after access:** `supabase link --project-ref lzuodgpqseijhhyzgfky` → `supabase db push` → `supabase functions deploy med-dose-action` → verify function returns 401/400 (not 404/500).
