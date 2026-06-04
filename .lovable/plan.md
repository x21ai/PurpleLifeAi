## Strategy

Three connector families, very different shapes — build the easiest, highest-value one first, verify in production, then layer the rest.

| Source | Access | Status this batch |
|---|---|---|
| Whoop | Official OAuth API | **Build now** |
| Dexcom (Stelo) | Official OAuth API, requires dev-app approval | Wait for approval |
| Lingo (Abbott) | No public API — Apple Health only | Covered by Apple Health bridge |
| Apple Watch / iPhone / Apple Health | HealthKit is native-iOS-only | Webhook + XML, next batch |

This plan covers **Whoop only**. Dexcom and Apple Health get their own plans after this one ships.

---

## Whoop connector — what to build

Mirror the existing Oura architecture so it's familiar and the maintenance surface stays small.

### 1. Secrets (you'll add via the secrets tool)
- `WHOOP_CLIENT_ID`
- `WHOOP_CLIENT_SECRET`

You'll register the app at developer.whoop.com with redirect URI `https://purplelife.org/oauth/whoop/callback` (+ preview URL). Scopes: `read:recovery read:cycles read:sleep read:workout read:profile offline`.

### 2. Database migration
- New table `public.whoop_tokens` — same shape as `oura_tokens`: `user_id` (FK auth.users), `access_token`, `refresh_token`, `expires_at`, `scope`, `last_sync_at`, `sync_interval_hours` (default 12), `created_at`, `updated_at`. RLS scoped to `auth.uid()`. Standard GRANTs (authenticated + service_role; no anon).
- Extend `biometrics` with Whoop-specific columns (nullable):
  - `whoop_recovery_score` (int 0–100)
  - `whoop_strain` (numeric, day strain 0–21)
  - `whoop_sleep_performance` (int 0–100)
  - `whoop_resting_hr` (int)
  - Existing columns reused: `hrv_ms`, `sleep_total_min`, `temp_skin_c` (Whoop skin temp delta → derived), `source` set to `'whoop'`.

### 3. Server function: `src/lib/whoop.functions.ts`
One server fn with three actions, mirroring `oura-sync`:
- `config` → returns `{ client_id }` for the OAuth popup
- `exchange` → `{ code, redirect_uri }` → POSTs to Whoop `/oauth/oauth2/token`, upserts tokens, triggers 30-day backfill
- `incremental` → refreshes token if `expires_at` near, pulls recovery/cycle/sleep/workout since `last_sync_at`, normalizes into `biometrics`, updates `last_sync_at`
- `all: true` variant gated to service role (for cron)

Uses `requireSupabaseAuth` for user-facing actions; service-role-gated for the cron path. Lives in `.functions.ts` (client-safe import surface), helpers in `whoop.server.ts`.

### 4. OAuth callback route: `src/routes/oauth.whoop.callback.tsx`
Mirrors `oauth.oura.callback.tsx`: reads `?code=` + `?state=` from URL, calls `whoop-sync` `exchange`, posts `{ type: "whoop-connected" }` to opener, closes.

### 5. UI
- **`src/components/connections/whoop-connection.tsx`** — exact pattern of `OuraConnection`: Connect button → popup → backfill progress → connected state with last-sync, counts, sync-interval Select, Disconnect. Use `Heart` or `Activity` icon to differentiate from Oura.
- Add to `src/routes/_app/account.tsx` (or wherever Oura currently renders) right below Oura.
- **`src/components/biometrics/whoop-sync-status.tsx`** — companion to `OuraSyncStatus`, surfaces on Today + biometrics index. Or extend the existing component to accept a `source` prop and render one per connected provider. I'll extend rather than duplicate.

### 6. Cron
- New route `src/routes/api/public/cron/whoop-sync-all.ts` — copy of `oura-sync-all.ts`, calls the `incremental + all` action. Same `x-cron-secret` gate.
- Schedule via pg_cron daily (separate migration after the function is verified manually).

### 7. Verification (after build)
- Connect a real Whoop account via preview URL.
- Confirm `whoop_tokens` row created, 30-day backfill populates `biometrics` rows with `source='whoop'`.
- Trigger `incremental` manually, confirm fresh row written.
- Hit cron route with and without `x-cron-secret` → 401 vs 200.
- Confirm Today + biometrics index render Whoop data alongside Oura.

---

## Out of scope for this plan (queued)

- **Apple Health webhook + XML import** — separate plan after Whoop ships. Will include: `/api/public/hooks/apple-health` route with shared-secret auth, mapping table from Health Auto Export field names → `biometrics` columns, an XML upload page under Account → Connections that parses `export.xml` and bulk-inserts historical data, setup guide doc covering Health Auto Export configuration.
- **Dexcom/Stelo** — separate plan once you've registered the Dexcom developer app and received production credentials. Sandbox build can happen in parallel if you want; otherwise we wait.

---

## Files touched (technical)

**Created**
- `supabase/migrations/<ts>_whoop_connector.sql`
- `src/lib/whoop.functions.ts`
- `src/lib/whoop.server.ts`
- `src/routes/oauth.whoop.callback.tsx`
- `src/routes/api/public/cron/whoop-sync-all.ts`
- `src/components/connections/whoop-connection.tsx`

**Edited**
- `src/components/biometrics/sync-status.tsx` — accept `source` prop, render one row per connected provider
- `src/routes/_app/account.tsx` (or current Connections host) — mount `<WhoopConnection />`
- `src/routes/_app/biometrics.index.tsx` — pass `source="whoop"` for the Whoop sync row (additive)
- `src/lib/biometric-metrics.ts` — add 4 new Whoop metric definitions so they appear on the biometrics grid

No edits to auto-generated files. No new Supabase Edge Functions (per project rule — all logic in `createServerFn`).
