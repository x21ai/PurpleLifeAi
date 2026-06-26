## Goal
Right now archived caregivers disappear from `/settings/sharing` with no way to see them. Add a lightweight "Archived" view so the owner can review past caregivers and restore or permanently delete them.

## Backend (`src/lib/care.functions.ts`)
- Extend `listMyCaregivers` to accept an optional `{ archived?: boolean }` input (default `false` = current behavior).
  - When `archived` is true, return only rows where `archived_at IS NOT NULL` for the current owner.
- Add `unarchiveRelationship({ relationship_id })`: owner-only, sets `archived_at = null`, writes a `care_audit_log` entry with `action = 'unarchived'`. Row reappears in the active list (still with `status = 'revoked'`, so the owner can re-invite if they want).
- `deleteRelationship` already exists and is reused for permanent delete from the archive.

## Frontend (`src/routes/_app/settings.sharing.tsx`)
- Under the "People I share with" section, add a small footer row:
  - `Show archived (N)` toggle link, only rendered when N > 0.
  - When expanded, render an inline `Archived` panel (same card style, dimmer) listing each archived caregiver with: email, role, "Archived <relative date>" caption, and two icon buttons:
    - **Restore** (`Undo2` icon) → calls `unarchiveRelationship`, toast "Restored to your list".
    - **Delete** (existing `DeleteRelationshipButton`) → permanent delete with confirm dialog.
- Data: a second `useQuery({ queryKey: ["care", "mine", "archived"], queryFn: () => fetchMyCaregivers({ data: { archived: true } }) })`, enabled only when the panel is expanded (lazy) — but always fetch the count for the toggle label via a lightweight head-count query, OR just always fetch archived once on mount (cheap) and hide the toggle when count is 0. Use the simpler "always fetch once" approach.
- Invalidate both `["care","mine"]` and `["care","mine","archived"]` on restore / delete / archive so the lists stay in sync.
- Verify the panel renders cleanly on mobile, tablet, and desktop (same `max-w-3xl` column, icon-only actions in a `shrink-0` cluster, no row wrapping).

## Out of scope
- No separate Archived route page.
- No bulk restore / bulk delete.
- "People sharing with me" stays unchanged.
