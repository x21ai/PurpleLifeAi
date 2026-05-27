# Status of Slice 1

Yes — Playwright scaffold + footer spec shipped last turn:
- `@playwright/test` installed
- `playwright.config.ts` with viewports 375 / 768 / 1023 / 1024 / 1440
- `tests/e2e/footer.spec.ts` asserting hidden < 1024px, visible ≥ 1024px on `/`, `/welcome`, `/today`, `/biometrics`, `/community`, `/settings`
- `test:e2e` / `test:e2e:install` scripts in `package.json`
- `data-testid="site-footer"` on `<SiteFooter>`

Sandbox can't run browsers, so tests run in your CI (or locally via `bun run test:e2e:install && bun run test:e2e`).

# Plan for the rest

## 1. Full E2E suite (Slice 2) — 12 specs under `tests/e2e/`

```text
auth.spec.ts              sign up, log in, log out, password reset link visible
onboarding.spec.ts        first-run /welcome → /today redirect
today.spec.ts             dashboard renders, key cards present
journal.spec.ts           create text entry, appears in list, archive
meds.spec.ts              add med, mark dose taken, adherence updates
biometrics.spec.ts        manual entry, chart renders
community.spec.ts         post + comment + reaction (gated by opt-in)
settings.spec.ts          profile update, theme toggle, sharing tab loads
admin.spec.ts             non-admin denied, super-admin sees dashboard
sharing.spec.ts           invite → accept → scope toggle → propose → approve → revoke
routes-smoke.spec.ts      every route returns < 500
theme-footer.spec.ts      dark/light + footer breakpoint matrix (replaces standalone footer.spec)
```

Test user seeding via new `src/lib/test-seed.functions.ts` server fn gated by `TEST_SEED_TOKEN` env var. Playwright `globalSetup` calls it once to create `e2e+seed@purple.test` with deterministic password and clean data.

## 2. Transactional invite email

- Verify email infra (`setup_email_infra`) is in place; if not, run it.
- Scaffold transactional emails (`scaffold_transactional_email`).
- Create template `src/lib/email-templates/care-invite.tsx` — branded, white body, button → `https://<app>/care/accept?token=…`, fallback link, sender name, role, scopes summary.
- Register in `registry.ts`.
- Update `inviteCaregiver` server fn (`src/lib/care.functions.ts`) to call `sendTransactionalEmail({ templateName: 'care-invite', recipientEmail, idempotencyKey: 'care-invite-'+relId, templateData: { ownerName, role, acceptUrl } })`. Inline link stays as a fallback "Copy link" button in the UI.

If no email domain is configured yet, surface the email setup dialog first, then continue.

## 3. Caregiver-side read dashboards

Replace stub `src/routes/_app/care.$ownerId.tsx` with a real layout:

- **Header** — owner display name, role badge, scopes granted, "Propose change" / "Add comment" buttons.
- **Tabs** (only those whose scope is granted):
  - `today` — risk band, alerts, next med (read-only).
  - `meds` — schedule + recent doses, "propose edit" → enqueues `pending_changes`.
  - `biometrics` — last 7 days HR/HRV/sleep summary.
  - `journal` — recent entries (text only, no media unless `journal:media` scope).
  - `seizures` — log + counts.
- Data via new server fns `caregiverReadToday / Meds / Biometrics / Journal / Seizures` in `care.functions.ts`, each guarded by `has_care_scope(owner, auth.uid(), 'meds:read'…)`. All return owner data with the admin client only after the scope check passes.
- Pending-change submission: shared `<ProposeChangeDialog>` component writes to `pending_changes` (RLS already permits caregiver insert).

## 4. Time-limited access UI

Settings → Sharing tab:
- Per-relationship row: "Access expires" with options:
  - **Never** (clears `expires_at`)
  - **In 24h / 7 days / 30 days** (quick picks)
  - **Custom date** (`<Calendar>` popover)
- New server fn `setExpiry(relationshipId, expiresAt | null)` updating `care_relationships.expires_at`.
- Display countdown chip ("expires in 3 days") on each caregiver card.
- `has_care_scope` already enforces `expires_at > now()`, so backend enforcement is free.
- Add audit log entry `expiry_changed`.

## 5. Responsive coverage

All new UI (caregiver dashboard tabs, expiry controls, pending-change dialog) styled for mobile (390px), tablet (768px), and desktop (≥1024px) per workspace rule. Tabs collapse to a `<Select>` on mobile; expiry quick picks become a vertical stack.

## Order of execution

1. Email infra check → scaffold transactional → invite template → wire `inviteCaregiver` → smoke-test invite flow.
2. Caregiver server fns + dashboard tabs.
3. Time-limited access UI + `setExpiry` fn.
4. Playwright globalSetup + seed fn, then 12 specs.
5. Run `bun run test:e2e` locally (or hand off to CI) and triage failures.

## Files touched / created

- `src/lib/email-templates/care-invite.tsx` (new)
- `src/lib/email-templates/registry.ts` (edit)
- `src/lib/email/send.ts` (new helper if not present)
- `src/lib/care.functions.ts` (extend: caregiver reads, setExpiry, invite email send)
- `src/routes/_app/care.$ownerId.tsx` (rewrite)
- `src/components/care/propose-change-dialog.tsx` (new)
- `src/components/care/expiry-control.tsx` (new)
- `src/routes/_app/settings.sharing.tsx` (add expiry UI)
- `src/lib/test-seed.functions.ts` (new, token-gated)
- `tests/e2e/*.spec.ts` (12 files) + `tests/e2e/global-setup.ts`
- `playwright.config.ts` (add globalSetup + theme-footer project)
- Migration: none required (schema already supports everything).
