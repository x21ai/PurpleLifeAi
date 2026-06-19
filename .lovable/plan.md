## Plan: Sync Cursor's backend fix from main

Cursor pushed commit `3bc7585` to main with the regenerated `types.ts` (now includes `sync_mode` columns and both `community_*_public` views). No code or SQL changes on my side — just sync and rebuild.

### Steps

1. Fetch `origin/main` and check out `src/integrations/supabase/types.ts` from commit `3bc7585` (overwrite the local copy from the previous sync attempt).
2. Let the dev server rebuild; confirm the previous TS errors (missing `sync_mode`, missing `community_posts_public` / `community_comments_public`) are gone.
3. Open the preview and verify it loads against the NEW Supabase project (`xxnzmfzsjplrutrgbzxy` via `https://auth.purplelife.org`).

### Guardrails

- Do NOT edit `src/integrations/supabase/types.ts` by hand.
- Do NOT run any SQL / migrations.
- Do NOT touch `.env` (already points at NEW).
- Do NOT click "Try to fix" on any transient TS error during rebuild.

### Expected outcome

Build is green, preview loads, sign-in works against NEW project auth (`auth.purplelife.org`).
