## Migrate OLD project → NEW project using Supabase CLI in Cursor

You run 4 commands on your laptop. I handle everything inside Lovable afterward.

### Step 1 — Setup (one time, in Cursor terminal)

```bash
# Install Supabase CLI if you don't have it
brew install supabase/tap/supabase   # macOS
# or: scoop install supabase          # Windows

mkdir purple-migration && cd purple-migration

# Save both connection strings (replace [YOUR-PASSWORD] with each project's DB password)
export OLD_DB_URL="postgresql://postgres.f43135c6...:[OLD-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
export NEW_DB_URL="postgresql://postgres.xxnzmfzsjplrutrgbzxy:[NEW-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

(I'll give you the exact OLD URL — I just need you to confirm you have the OLD project's DB password. The NEW password is already saved in Lovable as `NEW_DB_PASSWORD`.)

### Step 2 — Dump from OLD (3 commands)

```bash
supabase db dump --db-url "$OLD_DB_URL" -f 01-schema.sql
supabase db dump --db-url "$OLD_DB_URL" --data-only -f 02-data.sql
supabase db dump --db-url "$OLD_DB_URL" --data-only --schema auth -f 03-auth.sql
```

You now have 3 SQL files.

### Step 3 — Restore to NEW (3 commands)

```bash
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 01-schema.sql
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 03-auth.sql
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 02-data.sql
```

If any errors, paste them in the chat — I'll tell you which lines to comment out (usually duplicate extension/role lines, harmless).

### Step 4 — Tell me "done"

Then I do, inside Lovable:
1. Flip `.env` + `supabase/config.toml` to point at `xxnzmfzsjplrutrgbzxy`
2. Regenerate `src/integrations/supabase/types.ts`
3. Re-copy the 5 storage buckets' contents (if any exist — I'll check first)
4. Smoke test: login, journal entry, medication dose, care thread

### What I need from you to start
- Confirm: do you have the OLD project's database password? (Settings → Database → Connection string in the OLD project's backend)
- If yes, I'll give you the exact `OLD_DB_URL` to paste, and you run Step 1.
