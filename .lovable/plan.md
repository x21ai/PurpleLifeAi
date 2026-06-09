## Goal

Stop sending invite emails from Purple's server. The invite always comes from the user's own phone — through iMessage, WhatsApp, Mail, or whatever they pick — so the recipient sees a name they recognize, not a "no-reply from Purple" email they'll ignore.

Three ways to send:
1. **Share** — one tap opens the phone's native share sheet (iOS/Android), letting them pick iMessage, WhatsApp, Mail, Signal, etc. Desktop falls back to copy.
2. **Copy link** — the existing `/friend/accept?token=...` link.
3. **Refer code** — a short, human-typeable code (e.g. `JAMIE-7K3Q`) the recipient can enter on sign-up or on a "Join a friend's circle" screen. Good for in-person ("just type my code") and voice ("text me your code").

## What changes

### Invite sheet (`circle-section.tsx`)
- Email field becomes **optional** ("Their email (optional, just so you remember who you invited)").
- After clicking **Create invite**, the sheet flips to a "share" view showing:
  - A friendly message preview (editable): _"Hey — I'm using Purple, a private health journal. Want to be in my circle? {link}"_
  - **Share** button → `navigator.share({ title, text, url })`. Falls back to Copy on desktop.
  - **Copy link** button.
  - **Refer code** displayed large, with **Copy code** button.
  - Quick-launch chips for **iMessage** (`sms:&body=...` on iOS), **WhatsApp** (`https://wa.me/?text=...`), **Mail** (`mailto:?subject=...&body=...`). All client-side deep links — no server sending.

### Backend (`friendships.functions.ts`)
- `inviteFriend`:
  - `email` becomes optional.
  - Generate a short `refer_code` alongside the long `invite_token`. Format: 8 chars from an unambiguous alphabet (no `0/O/1/I`), uppercased, with a dash for readability (`AB3C-9KPM`). Retry on unique-constraint collision.
  - **Remove** the `sendTransactionalEmail` call and the `email-templates/friend-invite.tsx` template (and its registry entry). Purple no longer sends friend invites.
  - Return `{ friendship, invite_token, refer_code, acceptUrl }`.
- New `acceptFriendByCode` server fn: looks up the pending row by `refer_code` (case-insensitive), then runs the same accept logic as `acceptFriendInvite`.
- `listMyCircle` returns `refer_code` for pending rows so the UI can show it.

### Accept route (`/friend/accept`)
- Already handles `?token=`. Add a "Have a code instead?" link that points to a new tiny route `/friend/join` with a single input for the refer code → calls `acceptFriendByCode`.

### Database
- New migration: `ALTER TABLE friendships ADD COLUMN refer_code text`; partial unique index `WHERE refer_code IS NOT NULL`; make `invite_email` nullable (it already is per the original migration — confirm and leave alone if so).

## Files touched

- `supabase/migrations/<new>.sql` — add `refer_code` + unique index.
- `src/lib/friendships.functions.ts` — generate code, drop email send, add `acceptFriendByCode`, expose `refer_code`.
- `src/components/sharing/circle-section.tsx` — two-step sheet (compose → share), share sheet integration, deep-link chips, refer-code display, optional email.
- `src/routes/friend.accept.tsx` — add "use a code instead" affordance.
- `src/routes/friend.join.tsx` (new) — code-entry page.
- **Delete:** `src/lib/email-templates/friend-invite.tsx` and its `registry.ts` entry. (Purple no longer sends this email.)

## Out of scope (confirm if you want them)

- Twilio SMS from Purple — explicitly **not** doing this, per your reasoning. All sending is from the user's own device.
- Auto-applying a refer code during email/Google sign-up. v1: recipient signs up first, then enters the code on `/friend/join`. We can add a `?code=` query param flow later if you want it built-in to the auth screen.
- Tracking which channel was used (iMessage vs WhatsApp vs Mail). Skipped — would require analytics.
