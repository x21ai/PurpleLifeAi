## Goal
On `/settings/sharing`, after a caregiver is revoked, give the owner a way to remove them from the list (archive / delete) so the People I share with list stays clean.

## Current behavior
- Revoking flips `care_relationships.status` to `revoked` but the row keeps showing in "People I share with" with only the Manage / Trash buttons (Trash is the revoke action, disabled once already revoked is hidden but the row stays forever).
- There is no way to archive or delete a revoked caregiver from the UI.

## Proposed change

### Backend (`src/lib/care.functions.ts`)
Add two server functions, both owner-only, both audited:

1. `archiveRelationship({ relationship_id })`
   - Requires `status = 'revoked'`.
   - Sets a new `archived_at` timestamp on `care_relationships`.
   - Writes a `care_audit_log` entry with `action = 'archived'`.

2. `deleteRelationship({ relationship_id })`
   - Requires `status = 'revoked'`.
   - Hard-deletes the row from `care_relationships` (cascades to `care_scopes` via existing FK; `care_audit_log` rows are kept for history by nulling `relationship_id` or relying on existing ON DELETE behavior — confirm cascade rule in migration step).
   - Writes a final `care_audit_log` entry with `action = 'deleted'` BEFORE the delete, capturing the email in metadata.

Update `listMyCaregivers` to exclude rows where `archived_at IS NOT NULL` by default, and accept an optional `include_archived` flag for a future "Show archived" toggle.

### Migration
- Add `archived_at timestamptz NULL` to `care_relationships`.
- Ensure `care_scopes.relationship_id` FK is `ON DELETE CASCADE` (verify; add if missing).
- For `care_audit_log.relationship_id`, set FK to `ON DELETE SET NULL` so history survives a delete.

### Frontend (`src/routes/_app/settings.sharing.tsx`)
Inside the caregiver row actions:
- When `status === 'revoked'`, replace the (currently hidden) Trash slot with two buttons:
  - **Archive** (folder/archive icon) — calls `archiveRelationshipMut`; row disappears from list.
  - **Delete** (Trash2 icon, destructive) — opens an `AlertDialog` confirming "Permanently delete <email>? Their past activity stays in your audit log." Calls `deleteRelationshipMut`.
- Keep the existing Revoke button only for `active` / `pending` rows (already the case).
- Invalidate `["care","mine"]` on success and show a toast (`"Removed from your list"` / `"Caregiver deleted"`).

Ensure layout works on mobile, tablet, and desktop — buttons stay in the existing right-side `flex items-center gap-2 shrink-0` cluster, icon-only with `aria-label`s so the row doesn't wrap.

### Out of scope
- No change to the "People sharing with me" section.
- No bulk actions / archived-list viewer in this pass (server already supports `include_archived` for a follow-up).
