# Migration setup (start here)

You are migrating from **OLD** Lovable Supabase (`lzuodgpqseijhhyzgfky`) to **NEW** (your project). Cursor cannot see either database; it only runs scripts against connection strings you provide in `.env`.

## Step 1: Old database password

1. Open https://supabase.com/dashboard/project/lzuodgpqseijhhyzgfky/settings/database
2. Under **Connection string**, choose **Session pooler** and port **5432**
3. Copy the password (or **Reset database password** if you do not have it)
4. Note the region in the hostname (e.g. `aws-0-us-east-1`)

## Step 2: Fill in `.env`

Edit [`purple-migration/.env`](.env). Replace every `CHANGE_ME_*` value:

| Variable | Where to get it |
|----------|-----------------|
| `CHANGE_ME_OLD_PASSWORD` | Old project Database settings (step 1) |
| `CHANGE_ME_OLD_REGION` | Old pooler hostname |
| `CHANGE_ME_NEW_REF` | New project URL: `https://<ref>.supabase.co` |
| `CHANGE_ME_NEW_PASSWORD` | New project Database settings |
| `CHANGE_ME_NEW_REGION` | New pooler hostname |
| `CHANGE_ME_SERVICE_ROLE_KEY` | New project Settings → API → `service_role` |

## Step 3: JSON exports from Lovable

While logged in as **super-admin** on the Lovable preview:

1. Visit `/admin/migration-export`
2. Download **auth-users.json** → replace `03-auth/auth-users.json`
3. Download **storage-manifest.json** → replace `04-storage/storage-manifest.json`

(Needed for Prompts 2 and 4; schema step can run without them.)

## Step 4: Run Prompt 1

```bash
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
cd purple-migration
./check-env.sh          # validates .env
./run-prompt-1.sh       # dump schema, apply to NEW, export CSVs from OLD
```

## What each script does

| Script | Purpose |
|--------|---------|
| `check-env.sh` | Ensures `.env` has real values (no placeholders) |
| `dump-and-apply-schema.sh` | OLD → `01-schema.sql` → NEW |
| `export-csvs.sh` | OLD table data → `02-data/*.csv` + `05-cutover/row-counts-source.txt` |
| `run-prompt-1.sh` | Runs all three above |

## After Prompt 1

Follow [`.lovable/plan.md`](../.lovable/plan.md) Prompts 2–7 (auth import, `import.sh`, storage copy, Workers deploy, webhooks, DNS).

Until Prompt 7, production still uses the **old** database.
