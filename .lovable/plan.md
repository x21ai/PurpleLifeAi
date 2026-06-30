# Fix caregiver invitations (email + in-app notification)

## What's broken today

1. **Email not delivered.** `inviteCaregiver` enqueues a "care-invite" email via `sendTransactionalEmail` → PGMQ queue → `pg_cron` POST to the queue-processor route. The cron job is configured to POST to `https://project--<preview-id>.lovable.app/lovable/email/queue/process`, but the actual route is `/api/email/queue/process`. So invites sit in the queue forever (verified: 1 message stuck since 2026-06-26, 4 days old; only "pending" rows since then, no "sent"/"failed").
2. **No in-app pickup if the invitee already has an account.** `inviteCaregiver` already inserts an `alerts` row with `kind='care_invite'` for the matched user, but no screen in the app reads that alert — `listCaregiverOwners` only returns relationships where `caregiver_id` is set, and `caregiver_id` is null until the invitee opens the email link. So a Purple user invited by another Purple user sees nothing inside the app.
3. **Push best-effort.** Already wired in `inviteCaregiver`; will be left as-is.

## Plan

### 1. Send the care-invite email directly (skip the broken queue)

In `src/lib/care.functions.ts` `inviteCaregiver`, replace the `sendTransactionalEmail({ templateName: "care-invite", … })` call with a direct Resend send using the same React Email template:

- Render `care-invite` template (already in `src/lib/email-templates/registry.ts`) with `@react-email/components` `render()`.
- POST to `https://api.resend.com/emails` with `process.env.RESEND_API_KEY`, `from = "Purple <noreply@notify.purplelife.org>"`, idempotency key `care-invite-<rel.id>`.
- Write a row to `email_send_log` with `status='sent'` (or `'failed'` + error message) so existing observability still works.
- Keep the call inside the existing try/catch so a Resend failure never blocks the invitation; surface `emailSent` in the response as today.

This bypasses the queue and works on both preview and production (Resend key is already in the project secrets).

Out of scope: fixing the global pg_cron URL — that's a migration-era pump used by many templates and the user explicitly said not to lean on Lovable Cloud infra. Care invites just go direct.

### 2. Surface pending invites in-app for existing Purple users

Add a new server function `listIncomingCareInvites` in `src/lib/care.functions.ts`:

- Look up the current user's email via `context.claims.email` (or `supabase.auth.getUser`).
- Return `care_relationships` rows where `status = 'pending'`, `expires_at` is null or in the future, and `lower(invite_email) = <user email>`. Include `id`, `owner_id`, `role`, `invite_token`, `created_at`, `expires_at`, and the owner's display name (`profiles.first_name/last_name/community_display_name`).

Render the invites in two places, both using a new `<IncomingCareInvitesCard />` component:

- **Today page** (`src/routes/_app/today.tsx`) — show above the existing content when there are pending invites, so they can't be missed.
- **Care inbox** (`src/routes/_app/care.inbox.tsx`) — a dedicated section at the top.

Each invite row shows: "{Owner name} invited you as their {role}" + Accept and Decline buttons. Accept navigates to `/care/accept?token=<invite_token>` (existing flow handles the rest). Decline calls a new lightweight `declineIncomingCareInvite` server fn that flips `status` to `'declined'` after verifying the invite_email matches the caller's email.

### 3. Mark the matching `alerts` row read on accept/decline

In the existing `acceptCareInvite` handler and the new decline handler, update any `alerts` rows for the caller with `kind='care_invite'` and a body referencing this relationship to `read_at = now()`, so the bell badge clears.

## Files to touch

- `src/lib/care.functions.ts` — rewrite the email send in `inviteCaregiver`; add `listIncomingCareInvites` and `declineIncomingCareInvite`; clear alert rows on accept/decline.
- `src/components/care/incoming-care-invites-card.tsx` — new component (Accept / Decline UI, polls via TanStack Query every 60s).
- `src/routes/_app/today.tsx` — render the card above existing content.
- `src/routes/_app/care.inbox.tsx` — render the card at top.

## Out of scope

- Fixing the global pg_cron pump URL or restructuring the email queue.
- Changing the care-invite email design.
- New push-notification logic (existing path stays).
- Any change to the owner-side caregiver list UI.

## Verification

- Send an invite from one test account to the email of another existing test account. Confirm:
  - Resend dashboard shows the message; recipient inbox receives it.
  - The recipient sees the invite card on `/today` and `/care/inbox` without opening the email.
  - Accept → relationship becomes active, alert row is marked read, card disappears.
  - Decline → relationship becomes `declined`, card disappears.
- Build passes; no new typecheck errors.
