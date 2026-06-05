
# Pass 3 — one item at a time

I'll work through these in order and check in between each so you're never blocked.

## 1. Fix Oura (first)

You said Oura was working and stopped. I'll investigate before touching code:

- Pull recent `oura-sync` edge function logs to see if connect/sync is erroring (401 = token expired, 4xx = config, 5xx = code).
- Check `oura_tokens` rows: do you still have a row? Is `updated_at` recent? Is the refresh token still there?
- Walk the three paths:
  - **Connect** — `oura-sync` `action: "config"` → authorize popup → `/oauth/oura/callback` → `action: "exchange"`.
  - **Manual sync** — "Sync now" button → `action: "incremental"`.
  - **Auto-sync** — `use-oura-daily-autosync` hook + `/api/public/cron/oura-sync-all` cron.
- Most likely culprits: Oura refresh token expired (they expire after inactivity), `OURA_CLIENT_ID/SECRET` rotated, or the cron stopped firing.

Then fix the specific cause — could be reconnect prompt, token refresh logic, or cron re-registration. No speculative changes until I see the logs.

## 2. Caregiver invite via Resend (after Oura is green)

- Connect Resend via the standard connector (you provide the key in the connector flow — secure form, no pasting in chat).
- Wire `care-invite` template (already exists at `src/lib/email-templates/care-invite.tsx`) into the existing transactional send pipeline so invite creation triggers a real send to the recipient's email with the `/care/accept/{token}` link.
- In-app notification: when the invite is accepted *or* when the recipient already has a Purple account, drop a notification row so they see an alert on their next visit. Uses the existing `care.functions.ts` pipeline + a small notifications surface in the top bar.
- Test end-to-end with a real invite.

## 3. Theme persistence (after #2)

QA flagged light/dark not persisting. Audit `theme-provider.tsx` + `use-route-theme.ts`, ensure the choice writes to `localStorage` and reads on mount before first paint (no flash).

## 4. Sidebar cleanup (after #3)

Apply the specific items from your QA doc — I'll re-read it and list them back to you before editing.

## 5. "Set up a new device" flow (last)

Designed flow for adding Purple to a second device (PWA install + sign-in handoff). I'll propose the UX in a follow-up plan before building, since it touches onboarding.

---

**Right now I'll do step 1 only.** Approve and I'll pull Oura logs + DB state and report back with the actual cause before changing any code.
