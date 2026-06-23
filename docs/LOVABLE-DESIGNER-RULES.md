# Lovable designer rules (read before every session)

Purple redesign happens in Lovable. **Cursor owns production, schema, and generated files.**
Follow these rules so preview stays green and `main` stays deployable.

## GitHub branch (required)

| Branch | Who | Purpose |
|--------|-----|---------|
| **`lovable/redesign`** | Lovable preview + UI work | Safe sandbox for design changes |
| **`main`** | Cursor gatekeeper | Production-ready; merges only after Cursor review |

**In Lovable project settings:** connect to `AstroAii/purpledrw`, branch **`lovable/redesign`**, not `main`.

Do not sync design edits directly to `main`. That has repeatedly broken `types.ts` and killed the preview.

## Never edit these (Cursor only)

| Path / area | Why |
|-------------|-----|
| `src/integrations/supabase/types.ts` | Generated from live NEW DB; Lovable edits truncate it |
| `supabase/migrations/` | Schema changes are Cursor + reviewed SQL |
| `.env` in repo | Use Lovable **Environment** UI for `VITE_*` only |
| Security scanner "Try to fix all" | RLS/policy work is Cursor |

## Never click in Lovable

- **Try to fix** on TypeScript or build errors
- **Try to fix all** on Security tab
- Regenerate Supabase types locally

If build is red, message the owner: "Waiting for Cursor to fix types on main, then merge into `lovable/redesign`."

## Preview environment (already set)

- `VITE_SUPABASE_URL` = `https://auth.purplelife.org`
- `VITE_SUPABASE_PROJECT_ID` = `xxnzmfzsjplrutrgbzxy`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = from Doppler / Supabase dashboard (not in chat)

## What you CAN change

- React components, pages, styles, marketing copy
- `src/components/`, `src/routes/`, `src/styles.css`, assets
- UI-only behavior (no DB schema)

## After you push to `lovable/redesign`

1. Confirm build is **green** (no "Build unsuccessful").
2. Tell the owner: "Pushed to `lovable/redesign`, ready for Cursor review."
3. Cursor merges to `main` after tests. Live site updates only when owner approves deploy.

## Quick health check (Lovable can run read-only)

```bash
grep health_narratives src/integrations/supabase/types.ts
grep sync_mode src/integrations/supabase/types.ts
```

Both must return matches. If not, stop and wait for Cursor.

## Copy-paste for Lovable chat (session start)

```text
Rules for this project:
- Work on branch lovable/redesign only (not main).
- Never edit src/integrations/supabase/types.ts, migrations, or .env.
- Never click Try to fix on build or security errors.
- UI/components/styles only. If build is red, stop and report errors without fixing types.
```
