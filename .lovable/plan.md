# Friends (Circle) — zero-data social connections

A new relationship type, fully separate from caregivers. Two users link with **no data access**, ever, unless the inviter later explicitly grants a scope. Purple already has "Care" for data sharing; "Circle" is for human presence only.

## Mental model

- **Caregivers** — see your data per granted scopes. Lives in `care_relationships` + `care_scopes`. Untouched.
- **Friends (Circle)** — appear in your contacts list. See nothing by default. The inviter sees who's in their circle; the invitee sees who invited them. Either side can leave.

These two never mix. A caregiver is not a friend; a friend is not a caregiver. If a user wants both, they exist as two separate links.

## Data model (one new table + scope enum entries)

```sql
-- public.friendships
id uuid pk
user_a uuid not null references auth.users   -- always the smaller uuid (canonical order)
user_b uuid not null references auth.users   -- always the larger uuid
requested_by uuid not null                   -- who sent the invite
status text not null check (status in ('pending','active','blocked'))
invite_email text                            -- when invitee not yet on Purple
invite_token text                            -- one-time, cleared on accept
note text                                    -- inviter-only nickname ("College friends")
created_at, updated_at, accepted_at
unique (user_a, user_b)
```

Canonical-ordering the pair (a<b) prevents duplicate rows for the same friendship.

```sql
-- public.friend_scopes  (future-proofing: starts empty; nothing shared by default)
friendship_id uuid pk references friendships on delete cascade
scope text not null check (scope in (
  'profile:basic',     -- name + avatar only
  'community:tag',     -- can @mention in community posts
  'social:fun',        -- non-medical fun stuff (future)
  'full'               -- explicit promotion: friend becomes a caregiver-equivalent
))
granted boolean default false
granted_at timestamptz
```

`full` is intentionally a separate code path that creates a real `care_relationship` row with the user's explicit scope choices — a friend never silently becomes a caregiver.

### RLS (key rules)
- A user can SELECT a `friendships` row only when `auth.uid() in (user_a, user_b)`.
- Inserts: only `requested_by = auth.uid()`.
- Updates (accept/decline/leave): only the participants.
- No `has_care_scope` checks — friendships grant no data access by themselves.
- `journal_entries`, `seizure_events`, `aura_events`, `medical_reports`, `medication_doses`, `biometrics`, etc. get **no new policies**. The friend cannot read any of them.

## Surface area

1. **Settings → Sharing** gets a second card: **"Your circle"** under the existing "Caregivers" card. Clear copy: *"Friends in your circle don't see any of your health data. They're just people you're connected to on Purple."*
2. **Invite flow** — same email-link pattern as care invites (reuse `care.accept` route shape but for friendships). Tokenized link → if invitee has an account, one-tap accept; if not, sign-up first.
3. **Two-way visibility** — the inviter sees "Friends you've added"; the invitee sees "People who added you". Either can remove at any time; remove is symmetric (deletes the row).
4. **Promotion path** — on a friend row, a "Share something with this friend" button opens a sheet listing scopes. Choosing `full` walks the user through creating a care relationship with that friend (with explicit scope toggles). No silent escalation.
5. **Community** — friends can @mention each other in community posts (`community:tag` scope). Default off. Opt-in per-friendship.
6. **Privacy guarantees** — friend list is private to each user; never exposed in any public profile, OG image, search, or directory.

## What this is NOT

- Not a feed. Not a "what's my friend doing today" view.
- Not a follow graph (no asymmetric follows; both sides see the link).
- Not a directory ("find friends on Purple") — invites are by email only.
- No DMs in v1 (could come later; care messaging is separate and stays caregiver-only).

## Files I'll touch

- New migration: `friendships` + `friend_scopes` tables, RLS, GRANT, canonical-order trigger.
- `src/lib/friendships.functions.ts` — `inviteFriend`, `acceptFriend`, `listMyCircle`, `removeFriend`, `grantFriendScope`, `promoteToCare`.
- `src/lib/email-templates/friend-invite.tsx` — gentle, non-medical copy.
- `src/routes/_app/settings.sharing.tsx` — add **Your circle** card under Caregivers.
- `src/components/sharing/circle-list.tsx`, `circle-invite-sheet.tsx`, `friend-row.tsx`.
- `src/routes/friend.accept.tsx` — public accept page (mirrors `care.accept`).
- `src/lib/email-templates/registry.ts` — register the new template.

No changes to caregiver code, RLS on health tables, or AI prompts.

## Open questions before I build

1. **Friend nickname** — inviter-only `note` field on the row, yes?
2. **Block/mute** — needed in v1, or "remove" only?
3. **Community @-mentions** — ship in v1, or behind a feature flag for later?
4. **Existing-user lookup** — when inviting by email, if the email matches a Purple user, do you want the invite to skip the email and appear as an in-app notification instead? (Faster, but reveals "this email is on Purple" to the inviter.)

Reply with answers (or just **go** with defaults: nickname yes, remove-only, community off, email-only invites) and I'll build it.