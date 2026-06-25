
## Problem

`/care` only lists people the user is a caregiver *for* (via `listCaregiverOwners`). Caregivers the user has invited *for themselves* are only visible under Settings → Sharing. The user wants both in one place.

## Change

Restructure `src/routes/_app/care.index.tsx` into two stacked sections on the same page:

1. **People you care for** (existing) — owners + pending invites for me as caregiver. Unchanged data source.
2. **My caregivers** (new) — caregivers I've invited for myself, with their status and quick management.

### Section 2 details

- Data: call existing `listMyCaregivers` (returns `relationships` + `scopes`). No new server function needed.
- Header row: section title + "Invite caregiver" button → navigates to `/settings/sharing` (where the existing invite form lives).
- Active caregivers: card per row showing name/email, role label (from `ROLE_LABELS`), relationship label if set, granted scope count, and a "Manage" link → `/settings/sharing` (anchored to that relationship).
- Pending caregivers: same card style with a "Pending" badge, copy-invite-link button (uses `invite_token`), and revoke action via `revokeRelationship`.
- Empty state: short copy + "Invite caregiver" button.

### Page header

Change H1 from "People you care for" to **"Care"** with a one-line subtitle "Manage who you care for and who cares for you." Eyebrow stays.

### Sidebar

No change needed — `/care` already exists as the Care entry. The page now covers both directions.

## Responsive

- Mobile: single column, sections stacked, full-width cards.
- Tablet/desktop: keep current `max-w-4xl` container; active caregivers grid mirrors owners grid (`grid-cols-1 lg:grid-cols-2 gap-3`).

## Files

- `src/routes/_app/care.index.tsx` — add second section, new query for `listMyCaregivers`, small caregiver card component inline, updated header copy.

No DB changes, no new server functions, no nav-items changes.
