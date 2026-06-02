## Goal
Make the caregiver side of Purple feel like a first-class product (the way Apple would ship it): one obvious place to land, a real dashboard per person, private and respectful access, two-way chat, and a clear separation between *who someone is to you* (Parent, Doctor, Spouse…) and *what they can see* (permission scopes). Also: make Oura sync actually work and run daily.

The work is large, so it's split into 4 phases that can each be shipped and tested on their own.

---

## Phase A — Caregiver dashboard as a first-class destination

The current caregiver experience is buried inside Settings → Sharing → "Open dashboard". That's wrong. Caregivers should have their own front door.

**Sidebar**
- Add a new top-level sidebar item **"Caregiver"** (icon: HeartHandshake), visible only when the user has at least one *incoming* active care relationship (i.e. someone is sharing with them). It links to `/care` (the existing list page, renamed).
- Sidebar order: Today · Journal · Timeline · Patterns · Tools · **Caregiver** (conditional) · Account.
- The same item appears in `mobile-top-bar.tsx` and `mobile-bottom-nav.tsx` when present.

**`/care` ("People sharing with you")**
- Rename header to **"People you care for"**.
- Each card shows: first name + last initial, relationship label (new — see Phase C), last activity, unacknowledged alert count badge.
- Tapping a card → `/care/$ownerId` (the person dashboard).

**`/care/$ownerId` — rename and re-land on Biometrics**
- Page title changes from "Caregiver view / Devyn Walker" to **"Devyn's Dashboard"** (using `profiles.first_name` with `'s` — fall back to full name if no first name).
- The "CAREGIVER VIEW" eyebrow stays, but smaller and more subtle.
- **Default tab is Biometrics** (currently defaults to Today). Today tab still exists but Biometrics is now first in the tab order: `Biometrics · Today · Meds · Journal · Seizures · Reports · Chat` (Chat added in Phase D).
- Patient-related alerts (missed doses, seizures, low biometric flags) surface as a compact strip above the tabs — same component as today's alerts card but always visible on every tab, not only on the Today tab. Clicking jumps to the relevant tab.

**Hide who-else-has-access from caregivers**
- Currently `settings.sharing.tsx` is owner-only, which is correct, but the caregiver's `/care/$ownerId` page also shouldn't surface other caregivers. Audit the data we load there (`getOwnerSnapshot`) and confirm we don't return the other caregivers' identities. If we do, strip those fields out of the caregiver-scoped server fn.
- Add a new server fn `getCaregiverPeers` that returns the list of other caregivers and their scopes **only when the requesting caregiver has the new `access:manage` scope** (see Phase B). Used by the new "Manage access" sub-view.

---

## Phase B — Permission model: separate relationship from role, add manage-access scope

Today we have `CareRole` (Emergency / Caregiver / Provider / Viewer) which is doing double duty as both "who they are to me" and "what they can see". We're separating those.

**Database**
- Add `care_relationships.relationship_label` text nullable. Free-form, but the UI offers presets: Parent, Child, Sibling, Spouse, Partner, Friend, Doctor, Nurse, Therapist, Caregiver, Other. Custom text allowed.
- Add new scope `"access:manage"` to `CARE_RESOURCES`/`CARE_VERBS` (resource `access`, verb `manage`). Only owners can grant it. Caregivers with this scope can invite, edit scopes, revoke, and archive other caregivers on the owner's behalf — but only the **owner** can grant `access:manage` itself.
- No new tables.

**Owner UI (`/settings/sharing`)**
- Invite dialog: add a "Relationship" field with the preset chips + free-text fallback. Persists to `relationship_label`.
- Per-caregiver detail: add a "Full access — can manage other caregivers" toggle (maps to `access:manage`).
- Caregiver card now shows: name · relationship label · role · last-active.

**Caregiver UI (`/care/$ownerId`)**
- If the caregiver has `access:manage`, a new "Manage access" item appears in an overflow menu on the dashboard. It opens a read/edit subset of `/settings/sharing` scoped to that one owner: invite new caregiver, edit scopes, revoke, archive. All actions write through the owner's existing server fns, but with an audit row tagged `actor_id = caregiver` so the owner sees who did what.
- Without `access:manage`, no information about other caregivers is shown anywhere.

---

## Phase C — Caregiver profile fields the owner can see

So that an owner can actually contact their caregiver, the caregiver needs profile fields and a "caregiver profile" surface.

**Reuse `profiles`** — no new table. Fields used:
- `first_name`, `last_name` (already exist)
- `emergency_contact_phone` is patient-side; we'll add `phone` text nullable to `profiles` for the caregiver's own phone.
- Add `pronouns` text nullable for inclusivity.

**New section in `/account`**
- "Your profile as a caregiver" — name, phone, pronouns, short bio (reuses `community_bio`), avatar (existing pattern in community).
- Disclaimer: "People you care for will see this."

**Owner-side display**
- On `/settings/sharing`, each caregiver card shows their name, relationship label, and a "Contact" inline mini-card (phone + tap-to-call/SMS link) when the caregiver has filled it in.
- On the caregiver list / each person card, the caregiver's name + avatar are visible.

---

## Phase D — Owner ↔ caregiver chat (1:1 default, optional group)

Apple Messages model: a thread per pair by default, plus the ability for the owner to create a single group thread that includes all of their active caregivers.

**Schema** (one migration)
- `care_threads` — id, owner_id, kind (`'direct' | 'group'`), relationship_id nullable (only for direct), created_at, last_message_at.
  - Unique: one direct thread per (owner_id, relationship_id). One group thread per owner_id.
- `care_thread_participants` — thread_id, user_id, role (`'owner' | 'caregiver'`), joined_at, last_read_at.
- `care_messages` — id, thread_id, sender_id, body text, attachments jsonb (future), created_at, deleted_at.
- RLS:
  - Threads/messages readable if `auth.uid()` is in `care_thread_participants` for that thread.
  - Insert message: must be a participant.
  - Delete message: sender only, soft delete only.
  - Owner can add/remove participants for group threads; can't remove themselves.
- Realtime: enable on `care_messages` only.

**Server fns** (`src/lib/care-chat.functions.ts`)
- `getThreads()` — for the current user, returns all threads they participate in with last message preview + unread count.
- `getOrCreateDirectThread({ relationshipId })` — owner OR caregiver can call; creates the thread idempotently.
- `getOrCreateGroupThread()` — owner-only.
- `getMessages({ threadId, before? })` — paginated.
- `sendMessage({ threadId, body })`.
- `markRead({ threadId })`.

**UI**
- New route `/chat-care` (separate from Purple AI `/chat`) with a left thread list and right message panel — WhatsApp/iMessage layout. Mobile collapses to one column.
- Owner entry points:
  - In `/settings/sharing`, each caregiver card gets a "Message" button.
  - On Today, if there's an unread caregiver message, a small bubble surfaces it.
- Caregiver entry points:
  - "Chat" tab on `/care/$ownerId`.
  - Sidebar "Caregiver" item gets an unread badge that sums across all owners.

**Notifications**
- Reuse `push_subscriptions` + existing care-notify path. New event type `care_message`.
- Daily digest email already exists; add unread chat count to it.

---

## Phase E — Multi-role identity ("I'm a patient AND a caregiver")

The data model already supports this — an account can be the owner of `care_relationships` and the caregiver on others. What's missing is **a clean way to be in the right mental context** when both apply.

**Top-bar role switcher**
- Only renders when the current user has **both** at least one journal/medication/etc of their own *and* at least one incoming active care relationship.
- A small pill in the top bar shows the current context: "Viewing: My Health" or "Viewing: Caregiver". Switching just changes which sidebar items are emphasized and where the default landing is:
  - **My Health** mode → Today is home, full self-care sidebar.
  - **Caregiver** mode → `/care` is home, sidebar emphasizes the Caregiver section.
- Persists in localStorage; no DB change.

**Account section**
- New "How I use Purple" panel: checkboxes "I track my own health", "I support someone else" — purely informational, drives whether the switcher shows by default.

(No clinician-verification flag. The relationship label already lets the owner tag someone as Doctor.)

---

## Phase F — Oura sync reliability + daily auto-sync

Investigate and fix the existing Oura sync, then make it run automatically.

**Diagnose first** (will be done at start of this phase, not now)
- Check `oura-sync` edge function logs for recent failures.
- Verify `OURA_CLIENT_ID` / `OURA_CLIENT_SECRET` are still valid against Oura's current OAuth endpoints.
- Verify the token refresh path actually persists refreshed tokens to `oura_tokens`.
- Confirm the "Sync now" button surfaces real errors instead of swallowing them.

Common fixes I expect to apply:
- Refresh-token rotation: Oura returns a new refresh token on each refresh; if the function doesn't persist it, the next sync 401s.
- Date window: the function may be passing wrong start/end to `ouraGet`; should sync the last 14 days on each run.
- Storage of derived metrics: ensure `oura_readiness_score`, `oura_stress_score`, `oura_activity_score`, `sleep_score` actually land in the `biometrics` row and aren't dropped silently.

**Auto-sync — both layers (per your answer)**

1. **Client-side kick on app open** — a new hook `useOuraDailyAutoSync` mounted in `__root.tsx` (only when authenticated). On mount:
   - Read `oura_tokens.updated_at`.
   - If older than 20 hours, fire the existing `oura-sync` invoke in the background (no toast unless it fails).
   - Idempotent: a `sessionStorage` flag prevents re-firing on every route change.

2. **Server cron** — new TanStack server route at `/api/public/cron/oura-sync`:
   - Iterates all rows in `oura_tokens` where `updated_at < now() - interval '20 hours'`.
   - For each user, calls the existing `oura-sync` function logic (extracted into a shared helper so we don't duplicate token-refresh code).
   - Scheduled via `pg_cron` to run every 6 hours.
   - Auth: `apikey` header with the project's anon key (per the public-cron pattern).

**Surface sync state**
- `sync-status.tsx` already exists. Extend it to show: "Last synced: 2 hours ago" and a quiet failure state ("Reconnect Oura") when the most recent attempt failed.

---

## Out of scope (deliberately)
- Native push for chat (web push only; same delivery as existing care notifications).
- Photo/file attachments in chat — schema has `attachments jsonb` but UI is text-only in v1.
- Doctor verification badge — relationship label is enough.
- Migrating existing CareRole presets — they keep working unchanged.

---

## Phase order & gates
Each phase ships with its own verification:

- **A** → Caregiver sees a sidebar entry; landing on a person opens Biometrics first; title reads "Devyn's Dashboard".
- **B** → Owner can set "Parent" as relationship and grant a caregiver `access:manage`; that caregiver sees a Manage-access menu and can invite a new caregiver; other caregivers without that scope still see no one.
- **C** → Caregiver edits phone in Account; owner sees it on the caregiver card.
- **D** → Owner and caregiver exchange messages on `/chat-care`; unread badge appears in sidebar; group thread works.
- **E** → Account with both roles sees the top-bar switcher; switching changes the default landing.
- **F** → Diagnose result + fix + cron registered; "Sync now" returns success; opening the app after 24h auto-syncs.

I'd suggest we start with **Phase A** (highest visible impact, no schema risk) and **Phase F** in parallel since they don't touch the same files. Phases B/C/D/E should be sequential because they build on each other.

Want me to start with A + F together?