# Cloudflare-only migration (D1 + R2 + KV + Workers JWT)

Migrate Purple off Supabase onto Cloudflare-native storage and auth while keeping
the legacy Supabase project live until cutover is verified.

## Provisioned resources (POS Ai account)

| Resource | Name / ID | Wrangler binding |
|----------|-----------|------------------|
| D1 | `purplelifeai` `bfb642b9-b71b-4d7f-a823-669efc2f2168` | `DB` |
| R2 | `purplelifeai` | `STORAGE` |
| KV | `73356a0e339447059bdddc33b93f26a9` | `CACHE` |
| Account | `c7f99ecba0ace852de43684ec8a44612` | `account_id` in wrangler |

Bindings are declared in `wrangler.jsonc` (dev/build) and `wrangler.deploy.jsonc` (prod deploy).

## Feature flag (production safety)

| Variable | Values | Default |
|----------|--------|---------|
| `DATA_BACKEND` | `supabase` \| `cloudflare` | `supabase` |
| `AUTH_JWT_SECRET` | random 32+ bytes | required when cloudflare |
| `IMPORT_ADMIN_SECRET` | random | required for `/api/admin/d1-import` |

**Do not set `DATA_BACKEND=cloudflare` in production until:**

1. D1 schema applied
2. Auth users + public tables imported
3. R2 objects imported
4. Row-count verification passes
5. Smoke tests on staging Worker with cloudflare backend

## Auth choice: Workers JWT (not Supabase Auth)

Cloudflare has no drop-in Supabase Auth replacement. This PR implements:

- **D1 `auth_users` + `auth_identities`** (replaces `auth.users`)
- **PBKDF2 password hashing** via Web Crypto (`src/lib/cloudflare/auth/passwords.ts`)
- **HS256 JWT access tokens** (`src/lib/cloudflare/auth/jwt.ts`)
- **API routes:** `POST /api/auth/sign-in`, `POST /api/auth/sign-up` (cloudflare backend only)
- **Unified middleware:** `src/lib/auth/unified-auth-middleware.ts` (Supabase JWT or Workers JWT)

OAuth (Google/Apple) continues through existing OAuth callback routes; identity rows land in `auth_identities` during import.

RLS from Postgres is **not** ported to SQL. User scoping is enforced in Worker/server code (same pattern as caregiver 404-not-403).

## Supabase usage audit (current)

| Area | Location | Cloudflare path |
|------|----------|-----------------|
| Client DB | `@/integrations/supabase/client` | D1 queries via `src/lib/cloudflare/d1/` (incremental) |
| Server admin | `@/integrations/supabase/client.server` | D1 service role in Worker |
| Auth middleware | `auth-middleware.ts` | `unified-auth-middleware.ts` when migrated |
| Storage | `supabase.storage` | R2 `STORAGE` binding |
| Edge: oura-sync | `supabase/functions/oura-sync` | `src/lib/cloudflare/edge/oura-sync.ts` |
| Edge: journal-processor | `supabase/functions/journal-processor` | stub in `edge/journal-processor.ts` |
| Edge: journal-extract | `supabase/functions/journal-extract` | not ported (501) |
| Edge: ai-orchestrator | `supabase/functions/ai-orchestrator` | not ported (501) |
| Edge: risk-forecaster | `supabase/functions/risk-forecaster` | not ported (501) |
| Edge: med-dose-action | `supabase/functions/med-dose-action` | not ported (501) |
| Cron oura | `/api/public/cron/oura-sync-all` | branches on `DATA_BACKEND` |
| Cron journal | `/api/public/cron/journal-reprocess` | branches on `DATA_BACKEND` |

Client invoke helper: `src/lib/cloudflare/invoke-edge.ts` (Supabase `functions.invoke` or `POST /api/cloudflare/edge/invoke`).

## Schema

```
cloudflare/migrations/
  0001_auth.sql          auth_users, auth_identities, refresh tokens
  0002_core_schema.sql   67 public tables (generated from import.sh order)
```

Regenerate core schema after table list changes:

```bash
node scripts/cloudflare/generate-d1-schema.mjs
```

Apply migrations:

```bash
chmod +x scripts/cloudflare/apply-d1-migrations.sh
./scripts/cloudflare/apply-d1-migrations.sh --remote
```

## Data import (no live Supabase creds in repo)

### 1. Export from legacy (while still on Supabase)

Use existing `/admin/migration-export` or `purple-migration/` bundle:

- `auth-users.json` from export
- `02-data/*.csv` per table
- `storage-manifest.json` with signed GET URLs

### 2. Import auth users

```bash
# From auth-users.json (preserve UUIDs)
node purple-migration/03-auth/import-auth.mjs   # adapt for D1 or use API:

curl -X POST https://staging.purplelife.org/api/admin/d1-import \
  -H "x-import-secret: $IMPORT_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"kind":"auth_users","records":[...]}'
```

Or batch via `scripts/cloudflare/import-d1-from-csv.mjs` after converting auth export.

### 3. Import public tables

```bash
node scripts/cloudflare/import-d1-from-csv.mjs \
  --data-dir purple-migration/02-data \
  --remote
```

### 4. Import storage to R2

```bash
node scripts/cloudflare/import-r2-from-manifest.mjs \
  purple-migration/04-storage/storage-manifest.json \
  --remote
```

Object keys: `{bucket}/{userId}/{path}` (see `src/lib/cloudflare/r2/storage.ts`).

### 5. Verify

Compare row counts with `purple-migration/05-cutover/verify-counts.sql` logic adapted for D1:

```bash
bunx wrangler d1 execute purplelifeai --remote \
  --command "SELECT COUNT(*) FROM profiles;"
```

## Deploy with bindings

```bash
bun run build:prod
bunx wrangler deploy -c wrangler.deploy.jsonc
```

Set secrets (Doppler `cursor-cloudflare` / staging config):

- `DATA_BACKEND=cloudflare` (only after verify)
- `AUTH_JWT_SECRET`
- `IMPORT_ADMIN_SECRET` (remove after cutover import)

## Cutover checklist

1. [ ] Apply D1 migrations on remote `purplelifeai`
2. [ ] Import auth + public CSVs
3. [ ] Import R2 objects
4. [ ] Staging: `DATA_BACKEND=cloudflare`, run e2e smoke
5. [ ] Production: flip `DATA_BACKEND` during maintenance window
6. [ ] Monitor crons (oura, journal, email queue)
7. [ ] Keep Supabase project `xxnzmfzsjplrutrgbzxy` read-only backup 30d (do not delete from this PR)

## Local dev

```bash
# Local D1 (no --remote)
./scripts/cloudflare/apply-d1-migrations.sh

# Dev with bindings (requires wrangler login)
DATA_BACKEND=cloudflare AUTH_JWT_SECRET=dev-secret-only bun run dev
```

Wrangler dev injects `DB`, `STORAGE`, `CACHE` from `wrangler.jsonc`.
