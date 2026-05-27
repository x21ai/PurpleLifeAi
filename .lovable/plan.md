# Finish email setup + go-live smoke test

Domain `notify.purplelife.org` is **verified**. Dependencies + queue schema are already in place. The only remaining backend step is activating the queue cron and wiring transactional sends.

## 1. Activate the email queue
- Re-run email infra setup. This is idempotent — it re-creates the Vault `service_role` secret and registers the pg_cron job for `process-email-queue` (every 5s).
- Verify by querying `cron.job` for `process-email-queue` and confirming `email_send_state` has a row.

## 2. Scaffold transactional emails
- Run the transactional scaffold tool. It creates:
  - `src/routes/lovable/email/transactional/send.ts`
  - `src/routes/lovable/email/transactional/preview.ts`
  - `src/routes/email/unsubscribe.ts` + a branded `/unsubscribe` page
  - `src/routes/lovable/email/suppression.ts`
  - `src/lib/email-templates/registry.ts` + a sample template
- Add `src/lib/email/send.ts` helper (`sendTransactionalEmail({ templateName, recipientEmail, idempotencyKey, templateData })`).

## 3. Care-invite template + wiring
- Create `src/lib/email-templates/care-invite.tsx` (brand colors from `src/styles.css`, white body, no unsubscribe — system appends). Props: `inviterName`, `roleLabel`, `acceptUrl`, optional `expiresAt`.
- Register it in `registry.ts` as `care-invite`.
- Extend `inviteCaregiver` server fn in `src/lib/care.functions.ts`: after the relationship row is inserted, call `sendTransactionalEmail` with `idempotencyKey: care-invite-${relationshipId}`. Keep the inline copy-link as fallback (offline / unverified emails).
- Settings → Sharing UI: show "Invite emailed to {email}" toast plus the copy-link button (already present).

## 4. Unsubscribe page
- Implement `/unsubscribe` route that calls the GET/POST handlers and matches app styling (uses existing card + button tokens).

## 5. Go-live smoke test
Run in this order and report results:
1. `cloud_status` → expect `ACTIVE_HEALTHY`.
2. `supabase--linter` → no new errors.
3. `read_query` cron + queue state checks.
4. `stack_modern--invoke-server-function` against published URL:
   - `/lovable/email/queue/process` (should 200, drain 0 messages).
   - End-to-end: trigger an invite from a test session → confirm row in `email_send_log` flips `pending → sent`, recipient receives branded email, accept link resolves.
5. Playwright suite locally (without `TEST_USER_EMAIL` the auth-gated specs auto-skip; public + routes-smoke specs run):
   - `bunx playwright install --with-deps chromium`
   - `bunx playwright test`
6. Manual viewport pass on the new `/unsubscribe` page at 390 / 768 / 1280.

## Files touched
- **New**: `src/lib/email-templates/care-invite.tsx`, `src/lib/email/send.ts`, `src/routes/unsubscribe.tsx` (branded page), plus whatever the transactional scaffold generates.
- **Edited**: `src/lib/email-templates/registry.ts`, `src/lib/care.functions.ts`, `src/routes/_app/settings.sharing.tsx` (toast copy only).
- **No new migration** — queue infra reuses what's already applied.

## Out of scope
- Marketing/digest emails (blocked by policy).
- Per-event delivery dashboards (not yet exposed by the platform; suppression list still auto-updates from bounces/complaints).