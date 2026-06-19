## Plan: Wait for Cursor’s corrected `types.ts`, then resync

### Guardrails
- Do not click **Try to fix**.
- Do not edit `src/integrations/supabase/types.ts` by hand.
- Do not run SQL or migrations.
- Do not regenerate backend types locally.
- Do not touch `.env`.

### Steps after Cursor confirms the new commit is on `main`
1. Pull/sync latest `main` from GitHub.
2. Confirm the generated file contains `health_narratives`:
   ```text
   grep health_narratives src/integrations/supabase/types.ts
   ```
3. Rebuild/restart the preview so stale cache errors clear.
4. Hard refresh the preview.
5. Sign in again against the NEW auth project.

### Expected outcome
- `health-scores.functions.ts` type errors clear because `health_narratives` exists in `types.ts`.
- Any stale `sync_mode` errors disappear after rebuild.
- The black PURPLE splash clears once the client bundle boots successfully.