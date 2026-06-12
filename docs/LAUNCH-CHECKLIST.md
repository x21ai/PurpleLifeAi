# Launch checklist

Operational runbook for cutting Purple production from Lovable-managed hosting to our Cloudflare Worker (`purplelife`). Last updated: 2026-06-12. Stack context: PRs #8–#19 plus overnight hardening PRs 1–8 (timezone integrity, dose reliability, journal pipeline, sync truthfulness, security RPCs, SEO, dark-launch flags).

Companion docs: `docs/LOVABLE-MIGRATION.md` (Phase 7), `docs/manual-deploy-bundle.md`, `docs/oauth-provider-setup.md`, `docs/RELIABILITY.md`, `docs/SECURITY-FINDINGS.md`, `docs/LAUNCH-AUDIT.md`.

---

## 1. Database migrations (apply in filename order)

Supabase CLI 403s on this project. Apply each file in the Supabase SQL editor (or CLI when it works). Do not skip; later migrations depend on earlier ones.

| Migration                                            | Purpose                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `20260611010000_remove_lovable_ai_provider.sql`      | Rewrites stored `lovable` AI prefs to `claude`; tightens CHECK                                  |
| `20260612001000_peripheral_feature_flags.sql`        | Dark-launch flags: community, DNA, friends (default OFF)                                        |
| `20260612002000_notification_delivery_log.sql`       | Med reminder delivery instrumentation                                                           |
| `20260612010000_timezone_correct_dose_seeding.sql`   | User-local dose day boundaries; hourly seed cron support                                        |
| `20260612011000_adherence_excludes_future_doses.sql` | Honest adherence windows                                                                        |
| `20260612012000_canonical_tag_namespaces.sql`        | Journal tag namespaces (event/symptom/trigger/…)                                                |
| `20260613010000_security_hardening.sql`              | Care invite SECURITY DEFINER RPCs, token expiry, community column REVOKEs, pinned `search_path` |

Verify after apply:

```sql
SELECT feature_community_enabled, feature_dna_enabled, feature_friends_enabled FROM app_settings WHERE id = true;
-- expect all false until deliberately enabled

SELECT proname FROM pg_proc WHERE proname IN ('accept_care_invite', 'accept_assigned_care_invite');
-- expect both present
```

---

## 2. Edge function redeploys

Redeploy from the Supabase dashboard (Functions → Deploy) or CLI when available. Bundle procedure: `docs/manual-deploy-bundle.md`.

| Function            | Redeploy when                | Why                                                       |
| ------------------- | ---------------------------- | --------------------------------------------------------- |
| `ai-orchestrator`   | Always at cutover            | Anthropic default; Lovable gateway removed from prefs     |
| `risk-forecaster`   | Always at cutover            | Anthropic narrative; profile timezone for day boundaries  |
| `oura-sync`         | Always at cutover            | Sleep mapping fixes, `last_sync_at` writes                |
| `journal-processor` | Recommended                  | Stuck-entry retry, photo URL self-healing, tag namespaces |
| `med-dose-action`   | If changed since last deploy | Notification ack path                                     |
| `journal-extract`   | If changed since last deploy | Lighter capture extraction                                |

Set edge function secrets (Dashboard → Project Settings → Edge Functions):

- `ANTHROPIC_API_KEY` (required)
- Optional: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (usually auto-injected)

---

## 3. Secrets matrix

### Cloudflare Worker (runtime, `wrangler secret put` or dashboard)

| Secret                                                   | Required     | Used by                                                                 |
| -------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                                      | Yes          | Chat, insights, care profiles, platform AI                              |
| `RESEND_API_KEY`                                         | Yes          | Email delivery                                                          |
| `RESEND_WEBHOOK_SECRET`                                  | Yes          | `/api/email/suppression`                                                |
| `SEND_EMAIL_HOOK_SECRET`                                 | Yes          | `/api/email/auth/webhook`                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                              | Yes          | Cron, email enqueue, admin, delivery log                                |
| `CRON_SECRET`                                            | Yes          | All `/api/public/cron/*`                                                |
| `PUBLIC_SITE_URL`                                        | Yes          | Email links, cron self-calls, share URLs (`https://www.purplelife.org`) |
| `STRIPE_SECRET_KEY`                                      | Yes          | Billing                                                                 |
| `STRIPE_WEBHOOK_SECRET`                                  | Yes          | `/api/public/stripe-webhook`                                            |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Yes (push)   | Web push + dose reminders                                               |
| `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET`                   | If wearables | Oura OAuth + sync                                                       |
| `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`                 | If wearables | Whoop OAuth + sync                                                      |
| `EMAIL_PREVIEW_SECRET`                                   | Optional     | Template preview routes                                                 |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROK_API_KEY`       | Optional     | Per-user AI provider choices                                            |
| `LOVABLE_API_KEY`                                        | Optional     | Lovable preview AI fallback only                                        |

### GitHub repository secrets (CI/CD)

| Secret                                                                           | Used by           |
| -------------------------------------------------------------------------------- | ----------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | CI build + deploy |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`                                  | Deploy workflow   |

### Build-time (public, baked into client bundle)

Same `VITE_SUPABASE_*` trio. Never commit the service role key.

### Supabase vault / pg_cron

- Email queue pump job `process-email-queue` (5s): POST bearer = service role → `/api/email/queue/process`. Re-point URL at cutover.

---

## 4. Webhooks and external pointers

Configure **before** DNS flip; test against staging URL or production once Worker is live.

| Service                       | Endpoint                                                      | Notes                                                                                 |
| ----------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Stripe                        | `https://www.purplelife.org/api/public/stripe-webhook`        | Signing secret → `STRIPE_WEBHOOK_SECRET`                                              |
| Supabase Auth send-email hook | `https://www.purplelife.org/api/email/auth/webhook`           | Standard Webhooks secret → `SEND_EMAIL_HOOK_SECRET`                                   |
| Resend                        | `https://www.purplelife.org/api/email/suppression`            | Events: `email.bounced`, `email.complained`; signing secret → `RESEND_WEBHOOK_SECRET` |
| Apple Health (per user)       | `https://www.purplelife.org/api/public/hooks/apple-health`    | User-specific secret in `apple_health_tokens`                                         |
| Risk forecaster callback      | `https://www.purplelife.org/api/public/hooks/risk-forecaster` | Edge function callback                                                                |

OAuth redirect URIs (Supabase dashboard + provider consoles):

- Google / Apple → `https://lzuodgpqseijhhyzgfky.supabase.co/auth/v1/callback`
- Oura → `https://www.purplelife.org/oauth/oura/callback`
- Whoop → `https://www.purplelife.org/oauth/whoop/callback`

Email DNS (`notify.purplelife.org`): verify domain in Resend, publish SPF/DKIM, move off Lovable nameservers.

### 4.1 Ready-to-execute cutover steps (production only; do not run during staging)

These steps stay **documented only** until staging on `*.workers.dev` passes Section 5. Production (Lovable) stays untouched until DNS flip (Section 7).

**Staging URL placeholder:** `https://purplelife.<CLOUDFLARE_SUBDOMAIN>.workers.dev` (set after first deploy; use for webhook/OAuth tests before production re-point).

#### A. DNS (Cloudflare dashboard → Workers Routes)

1. Confirm `purplelife` Worker deployed with all secrets (Section 3).
2. Add route: `www.purplelife.org/*` → `purplelife` Worker (and apex if used).
3. Do **not** remove Lovable DNS until post-flip smoke passes; keep TTL low for rollback.

#### B. Supabase Auth send-email hook

1. Dashboard → Authentication → Hooks → Send Email hook.
2. Set URL to `https://www.purplelife.org/api/email/auth/webhook` (test on staging URL first).
3. Store hook signing secret as Worker secret `SEND_EMAIL_HOOK_SECRET`.
4. Send test sign-up email; confirm delivery via Resend logs.

#### C. pg_cron email queue pump

1. Supabase SQL editor:

```sql
-- Inspect current job (adjust jobname if different)
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'process-email-queue';

-- Re-point pump to production Worker (run only at cutover)
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue' LIMIT 1),
  command := $$
    SELECT net.http_post(
      url := 'https://www.purplelife.org/api/email/queue/process',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

2. Verify: enqueue a test row in `email_send_log`; confirm Worker processes within ~10s.

#### D. Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://www.purplelife.org/api/public/stripe-webhook`
3. Events: checkout, subscription, invoice (match existing Lovable config).
4. Copy signing secret → Worker `STRIPE_WEBHOOK_SECRET`.
5. Send test event; confirm 200 in Stripe dashboard.

#### E. Resend suppression webhook

1. Resend Dashboard → Webhooks → Add endpoint (or API).
2. URL: `https://www.purplelife.org/api/email/suppression`
3. Events: `email.bounced`, `email.complained`.
4. Copy signing secret → Worker `RESEND_WEBHOOK_SECRET`.

#### F. OAuth redirect URIs

| Provider | Console | URI |
| -------- | ------- | --- |
| Google | Google Cloud Console → OAuth client | `https://lzuodgpqseijhhyzgfky.supabase.co/auth/v1/callback` (unchanged) |
| Apple | Apple Developer → Services ID | same Supabase callback |
| Oura | Oura Cloud → Application | `https://www.purplelife.org/oauth/oura/callback` (staging: swap host to workers.dev for test) |
| Whoop | Whoop Developer | `https://www.purplelife.org/oauth/whoop/callback` |

Also set Worker `PUBLIC_SITE_URL=https://www.purplelife.org` at cutover so email links and OAuth state use production host.

---

## 5. Staging verification (automated + manual)

Run on a staging Worker URL or locally with production secrets pointed at a test project.

### Automated (must pass before DNS flip)

```bash
bun run check:em-dash
bun run check:live-data
bun run check:unique-images
bun run check:i18n-es
bun run test:unit
bunx tsc --noEmit
bun run build
bun run check:entry-budget
bun run test:e2e   # or at minimum tests/e2e/routes-smoke.spec.ts
```

Optional when test users exist:

```bash
# Cross-user RLS isolation (needs TEST_USER_* env vars)
bunx playwright test tests/e2e/rls-isolation.spec.ts
```

### Manual smoke (staging URL)

- [ ] Marketing: `/`, `/about`, `/features`, `/pricing`, `/trust`, `/contact` render unique heroes
- [ ] SEO: `/sitemap.xml` and `/robots.txt` return 200
- [ ] Auth: sign-up email delivers; Google/Apple OAuth round-trip
- [ ] Onboarding: `/welcome` two steps → lands on `/today` with first-entry extraction
- [ ] Journal: text entry extracts; offline queue flushes on reconnect
- [ ] Meds: dose appears on Today; inline took/skip/snooze works
- [ ] Push: grant notification permission; dose reminder fires within ~60s (Android) or catch-up card appears (iOS)
- [ ] Wearables: Oura/Whoop connect; sync status shows `last_sync_at`, not token refresh time
- [ ] Care: invite link accepts via RPC (token not visible in network tab)
- [ ] Billing: Stripe checkout test mode
- [ ] Admin: med reminder reliability stats load
- [ ] Dark launch: community/DNA/friends routes redirect while flags OFF

Deploy command:

```bash
bun run build && bunx wrangler deploy -c wrangler.deploy.jsonc
```

### 5.1 Staging deploy run (workers.dev)

One-time manual deploy before CI owns production. Requires Cloud Agents Secrets (or local env) for `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and all Worker runtime secrets in Section 3.

**Pre-merge:** include PR #30 contrast token fix (`cursor/staging-contrast-f977`, merged).

**1. Supabase migrations + edge functions** (needs `SUPABASE_ACCESS_TOKEN`):

```bash
# List remote migration versions
curl -s "https://api.supabase.com/v1/projects/lzuodgpqseijhhyzgfky/database/migrations" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq '.[].version'

# Apply any missing from Section 1 via SQL editor or:
# supabase db push (when CLI works)

# Redeploy edge functions (dashboard or CLI):
# journal-processor, oura-sync, med-dose-action, risk-forecaster
```

Verify RPCs after `20260613010000`:

```sql
SELECT proname FROM pg_proc WHERE proname IN ('accept_care_invite', 'accept_assigned_care_invite');
```

**2. Cloudflare Worker secrets** (once per account; persists across deploys):

```bash
for name in ANTHROPIC_API_KEY RESEND_API_KEY RESEND_WEBHOOK_SECRET SEND_EMAIL_HOOK_SECRET \
  SUPABASE_SERVICE_ROLE_KEY CRON_SECRET PUBLIC_SITE_URL STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET \
  VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT OURA_CLIENT_ID OURA_CLIENT_SECRET \
  WHOOP_CLIENT_ID WHOOP_CLIENT_SECRET OPENAI_API_KEY; do
  test -n "${!name}" && printf '%s' "${!name}" | bunx wrangler secret put "$name" -c wrangler.deploy.jsonc
done
```

Set `PUBLIC_SITE_URL` to the workers.dev URL during staging (e.g. `https://purplelife.<subdomain>.workers.dev`).

**3. Deploy Worker + confirm crons:**

```bash
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
bun run build && bunx wrangler deploy -c wrangler.deploy.jsonc
bunx wrangler triggers list -c wrangler.deploy.jsonc
# Expect 4 crons: * * * * *, 0 * * * *, 0 6 * * *, 0 15 * * 0
```

**4. Live verification** (set `E2E_BASE_URL` to staging URL):

```bash
E2E_BASE_URL=https://purplelife.<subdomain>.workers.dev bun run test:e2e
# Lighthouse mobile: /, /sign-in, /trust, authenticated /today
# Resend: enqueue test auth email via queue processor
# oura-sync: invoke once via Supabase Functions dashboard or cron self-call
```

Report: `docs/STAGING-DEPLOY-REPORT.md`.

---

## 6. Devyn 3-day real-use test

Founder dogfood on production (or staging with real notifications). Goal: validate the core loop under real timezone, sleep, and med schedules before public DNS flip.

### Day 0 setup

- [ ] Fresh account or reset test account; complete `/welcome` (name + conditions + first journal entry)
- [ ] Confirm `profiles.timezone` matches home zone (Account settings)
- [ ] Add at least one scheduled med with two daily times
- [ ] Install PWA; grant notifications
- [ ] Connect Oura or Whoop (optional but exercises sync truthfulness)

### Day 1 — capture and reminders

- [ ] Morning: Today shows due doses in home timezone
- [ ] Take one dose inline from `/meds`; confirm adherence updates
- [ ] Snooze one dose; confirm second notification ~15 min later
- [ ] Journal voice or text entry; tags use canonical namespaces
- [ ] If wearable connected: sync status reflects `last_sync_at` within 24h label rules

### Day 2 — edge cases

- [ ] Change profile timezone in Account; confirm today's pending doses regenerate
- [ ] Miss a dose intentionally; open app next morning → catch-up card offers log-it-anyway
- [ ] Travel banner: change device TZ or start a trip; med schedule shifts per strategy
- [ ] Ask Purple one question; stream completes with disclaimer
- [ ] Caregiver invite: accept on second account; confirm RPC path (no raw token in API)

### Day 3 — reliability and exit

- [ ] Leave app closed during a scheduled dose; verify web push OR catch-up card (note platform in admin delivery log)
- [ ] Upload a lab PDF; metric extraction preserves "as printed" subtitle
- [ ] Review admin → Med reminder reliability (if admin access)
- [ ] Sign-off: no mock data surfaces (`/my-health` → `/biometrics`, `/vitals` → `/insights` redirects work)

Log blockers in GitHub issues before DNS flip.

---

## 7. DNS flip (production cutover)

Order matters. Prefer a maintenance window with rollback plan (revert DNS to Lovable).

1. **Worker live** at `purplelife` with all secrets set; smoke test on `*.workers.dev` or temporary hostname.
2. **Migrations applied** (Section 1); edge functions redeployed (Section 2).
3. **Webhooks updated** (Section 4); send test auth email and Stripe test event.
4. **pg_cron email pump** URL → `https://www.purplelife.org/api/email/queue/process`.
5. **GitHub secrets** set; merge to `main` triggers `.github/workflows/deploy.yml`.
6. **DNS**: point `www.purplelife.org` (and apex if used) to Cloudflare Worker route.
7. **Post-flip**: verify `/sitemap.xml`, auth emails, dose cron (check Worker logs + `notification_delivery_log`), Stripe live webhook.
8. **Feature flags**: keep `feature_community_enabled`, `feature_dna_enabled`, `feature_friends_enabled` false until deliberately launched (`docs/LAUNCH-AUDIT.md`).

Rollback: revert DNS to Lovable; Worker stays deployed for next attempt.

---

## 8. Post-launch monitoring (first 72h)

- Cloudflare Worker errors and cron trigger history
- Supabase → `email_send_log` DLQ depth
- Admin med reminder reliability dashboard
- `notification_delivery_log` fire rate vs scheduled doses
- Support inbox for auth or OAuth failures
