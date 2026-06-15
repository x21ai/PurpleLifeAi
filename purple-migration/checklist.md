# Cutover checklist

Treat each gate as a stop sign — don't proceed if it fails.

## Setup

```bash
export NEW_DB_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
export NEW_SUPABASE_URL="https://xxxx.supabase.co"
export NEW_SUPABASE_SERVICE_ROLE_KEY="..."
cd purple-migration
```

## 1. Download exports (super-admin only)

On the current live site, sign in as super-admin, open `/admin/migration-export`, and click:

1. **Download auth-users.json** → save into `03-auth/`
2. **Download storage-manifest.json** → save into `04-storage/`
3. **Download all-tables.zip** → unzip into the package root. It contains:
   - `02-data/*.csv` (one per public table) + `02-data/_manifest.json`
   - `05-cutover/row-counts-source.txt`
   - `05-cutover/rls-source.txt`

## 2. Apply schema

```bash
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -f 01-schema.sql
```

If lines fail, comment only the offending lines (duplicate extension/role lines are usually harmless) and re-run.

## 3. Import auth users

```bash
cd 03-auth
node import-auth.mjs                  # creates users, no emails sent
SEND_RECOVERY=1 node import-auth.mjs  # also writes recovery-links.json
cd ..
```

UUIDs are preserved. Errors land in `03-auth/import-auth.errors.json`.

## 4. Load CSV data

```bash
cd 02-data
for f in *.csv; do
  t="${f%.csv}"
  echo "Loading $t..."
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -c "\copy public.\"$t\" FROM '$f' WITH (FORMAT csv, HEADER true)"
done
cd ..
```

Then reset sequences (safe to run even when there are none):

```bash
psql "$NEW_DB_URL" -At -c "
  select format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 1));',
    pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname),
    a.attname, n.nspname, c.relname)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
    and pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) is not null;
" | psql "$NEW_DB_URL"
```

## 5. Copy storage

```bash
node 04-storage/migrate-storage.mjs
node 04-storage/verify-storage.mjs
```

## 6. Verify cutover (Gate 1)

```bash
bash 05-cutover/verify-cutover.sh
```

Should print "OK". If any table count mismatches, stop and investigate before pointing the app at NEW.

## 7. Flip the app

Tell the Lovable agent: "verify passed, flip env to NEW". The agent updates `.env`, `supabase/config.toml`, regenerates `types.ts`, and redeploys. Then reconfigure the Google OAuth provider on NEW with the same client id/secret used on OLD.