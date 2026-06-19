## Status

Repo is already on Cursor's fix. Local `src/integrations/supabase/types.ts` contains:
- `health_narratives` (1 match)
- `sync_mode` (6 matches)
- `community_posts_public` (5 matches)

No file edits, no `Try to fix`, no SQL needed from me.

## Steps

1. Confirm preview is rebuilt on the synced commit (Lovable rebuilds automatically on sync).
2. Open the preview and verify:
   - Marketing images render (no alt-text fallback)
   - Splash dismisses and homepage hydrates
3. If anything is still red, capture the console/network error and report back rather than patching `types.ts`.

No code changes in this plan — approve to run the preview verification.