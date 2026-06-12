# Staging deploy report

Generated: 2026-06-12. Branch: `cursor/staging-deploy-f977` (includes PR #30 contrast fix via `cursor/overnight-verification-f977`).

## Executive summary

| Step | Status | Notes |
| ---- | ------ | ----- |
| PR #30 contrast token fix | **Done** | Merged on GitHub; `--text-tertiary` / `--text-quaternary` light-mode tokens updated |
| Supabase migrations verify/apply | **Blocked** | `SUPABASE_ACCESS_TOKEN` not in VM env |
| Edge function redeploys | **Blocked** | Same |
| Cloudflare Worker secrets | **Blocked** | No secrets injected (`CLOUD_AGENT_INJECTED_SECRET_NAMES` empty) |
| Worker deploy to workers.dev | **Blocked** | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` absent; `wrangler whoami` unauthenticated |
| Live e2e / Lighthouse / Resend / oura-sync | **Blocked** | No staging URL (Worker not deployed) |
| Production cutover pointers | **Documented** | Section 4.1 in `docs/LAUNCH-CHECKLIST.md`; production untouched |

**Staging URL:** not available. Worker `purplelife` has not been deployed to this Cloudflare account in this session. After deploy, URL will be `https://purplelife.<account-subdomain>.workers.dev` (confirm with `wrangler deployments list`).

---

## 1. Contrast PR (#30)

Merged: https://github.com/AstroAii/purpledrw/pull/30

Token changes in `src/styles.css` (light mode):

| Token | Before | After |
| ----- | ------ | ----- |
| `--text-tertiary` | `#8b8b92` | `#65656d` |
| `--text-quaternary` | `#b8b8bd` | `#94949c` |

### Axe color-contrast (logged out, mobile-375)

| Route | Before PR #30 | After PR #30 (local) |
| ----- | ------------- | -------------------- |
| `/` | 0 | 0 |
| `/sign-in` | 0 | 0 (2 on desktop-1440 only) |
| `/today` | 7 | 2 |
| `/journal` | 5 | 0 |
| `/meds` | 7 | 0 |
| `/timeline` | 8 | 0 |
| `/insights` | 38 | 1 |
| `/biometrics` | 17 | 0 |

---

## 2. Cloud Agents Secrets injection

Diagnostic on 2026-06-12:

```text
CLOUD_AGENT_INJECTED_SECRET_NAMES=<empty>
```

No deployment credentials were present in the VM environment despite Cloud Agents Secrets being configured in the dashboard (per user). All checks below returned **MISSING**.

### Secrets matrix

| Secret | In VM | Feature left inert when missing |
| ------ | ----- | -------------------------------- |
| `CLOUDFLARE_API_TOKEN` | No | Cannot deploy Worker or set Worker secrets |
| `CLOUDFLARE_ACCOUNT_ID` | No | Same |
| `SUPABASE_ACCESS_TOKEN` | No | Cannot verify/apply migrations or redeploy edge functions via Management API |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Cron jobs, email queue, admin RPCs, RLS bypass paths, seeds |
| `ANTHROPIC_API_KEY` | No | Chat, insights, care AI, edge `ai-orchestrator` / `journal-processor` / `risk-forecaster` |
| `RESEND_API_KEY` | No | All outbound email; auth sign-up/reset delivery |
| `RESEND_WEBHOOK_SECRET` | No | Bounce/complaint suppression webhook |
| `SEND_EMAIL_HOOK_SECRET` | No | Supabase send-email hook verification |
| `CRON_SECRET` | No | All `/api/public/cron/*` (dose reminders, wearable sync, daily jobs) |
| `PUBLIC_SITE_URL` | No | Email links, OAuth redirects, cron self-calls, share URLs |
| `STRIPE_SECRET_KEY` | No | Billing checkout and portal |
| `STRIPE_WEBHOOK_SECRET` | No | Subscription lifecycle webhooks |
| `VAPID_PUBLIC_KEY` | No | Web push registration |
| `VAPID_PRIVATE_KEY` | No | Web push send |
| `VAPID_SUBJECT` | No | Web push (mailto: subject) |
| `OURA_CLIENT_ID` / `OURA_CLIENT_SECRET` | No | Oura OAuth connect + `oura-sync` |
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | No | Whoop OAuth + sync |
| `OPENAI_API_KEY` | No | Embeddings, Whisper, optional user AI lane |
| `GEMINI_API_KEY` / `GROK_API_KEY` | No | Optional user AI lanes |
| `EMAIL_PREVIEW_SECRET` | No | Email template preview routes only (optional) |
| `LOVABLE_API_KEY` | No | Lovable preview AI fallback only (optional) |

**Present locally (public only):** `VITE_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` in `.env`.

**Remediation:** Re-run this agent with secrets bound to the environment (dashboard → Cloud Agents → Secrets → ensure names match exactly). Verify with `test -n "$CLOUDFLARE_API_TOKEN"` before deploy commands.

---

## 3. Supabase migrations (pending verification)

These must be applied in filename order if not already on project `lzuodgpqseijhhyzgfky`:

1. `20260611010000_remove_lovable_ai_provider.sql`
2. `20260612001000_peripheral_feature_flags.sql`
3. `20260612002000_notification_delivery_log.sql`
4. `20260612010000_timezone_correct_dose_seeding.sql`
5. `20260612011000_adherence_excludes_future_doses.sql`
6. `20260612012000_canonical_tag_namespaces.sql`
7. `20260613010000_security_hardening.sql`

Edge functions to redeploy: `journal-processor`, `oura-sync`, `med-dose-action`, `risk-forecaster`.

Management API check (when token available):

```bash
curl -s "https://api.supabase.com/v1/projects/lzuodgpqseijhhyzgfky/database/migrations" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
```

---

## 4. Worker deploy readiness

`bunx wrangler deploy -c wrangler.deploy.jsonc --dry-run` **passed** (build OK, 13.5 MiB upload, `SELF` + `ASSETS` bindings).

Cron triggers in `wrangler.deploy.jsonc` (verify after deploy with `wrangler triggers list`):

| Cron | Purpose |
| ---- | ------- |
| `* * * * *` | Dose reminders |
| `0 * * * *` | Wearable syncs (Oura, Whoop) |
| `0 6 * * *` | Daily jobs (care digest, medical reports, account purge) |
| `0 15 * * 0` | Weekly recap (Sunday) |

---

## 5. Local verification baselines (pre-staging)

Run on `cursor/staging-deploy-f977` with contrast fix, against local dev/preview. Use as **before** column when comparing to workers.dev.

### Playwright e2e (5 viewports)

| Metric | Local result |
| ------ | ------------ |
| Passed | **180** |
| Skipped | 55 (auth-required: `TEST_USER_*`, admin, RLS, onboarding-flow) |
| Failed | 0 |
| Duration | ~2.0 min |

### Lighthouse mobile (vite preview `127.0.0.1:8787`, `--no-sandbox`)

| Route | Performance | Accessibility | Best practices | SEO |
| ----- | ----------- | ------------- | -------------- | --- |
| `/` | 74 | 98 | 96 | 100 |
| `/sign-in` | 77 | 100 | 96 | 66 |
| `/trust` | 77 | 100 | 96 | 100 |
| `/today` (authenticated) | not run | not run | not run | not run |

Authenticated `/today` Lighthouse requires staging URL + test session cookie.

### Staging live verification (not run)

| Check | Staging | Local baseline |
| ----- | ------- | -------------- |
| E2E full suite | N/A | 180 pass / 0 fail |
| Lighthouse `/` | N/A | perf 74, a11y 98 |
| Lighthouse `/sign-in` | N/A | perf 77, a11y 100, seo 66 |
| Lighthouse `/trust` | N/A | perf 77, a11y 100 |
| Resend queue test email | N/A | blocked (no `RESEND_API_KEY`) |
| oura-sync end-to-end | N/A | blocked (no deploy + tokens) |

---

## 6. Production cutover (not executed)

Documented in `docs/LAUNCH-CHECKLIST.md` Section 4.1:

- DNS routes to Worker
- Supabase auth send-email hook URL
- pg_cron email pump URL
- Stripe webhook endpoint
- Resend suppression webhook
- Oura/Whoop OAuth redirect URIs

Lovable production hosting and existing webhook/OAuth configs were **not modified**.

---

## 7. Next run checklist

When secrets inject successfully:

1. Verify migrations via Management API; apply missing SQL.
2. Redeploy four edge functions.
3. `wrangler secret put` for every key in Section 3 of launch checklist; set `PUBLIC_SITE_URL` to workers.dev URL.
4. `bun run build && bunx wrangler deploy -c wrangler.deploy.jsonc`
5. `E2E_BASE_URL=<staging> bun run test:e2e`
6. Lighthouse mobile on `/`, `/sign-in`, `/trust`, authenticated `/today`
7. Resend test via queue processor cron or direct enqueue
8. Invoke `oura-sync` once for a connected test user
9. Update this report with staging URL and live vs local deltas
