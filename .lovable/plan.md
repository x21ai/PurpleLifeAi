
## Goal
On `/journal`, let users **edit**, **archive**, and (from Archive) **delete** any of their entries.

## DB migration
Add an archive flag to `journal_entries`:

```sql
ALTER TABLE public.journal_entries
  ADD COLUMN archived_at timestamptz;
CREATE INDEX journal_entries_user_archived_idx
  ON public.journal_entries (user_id, archived_at);
```

No RLS changes needed — existing `journal_entries_all_own` policy already covers UPDATE/DELETE for the owner.

## UI changes — `src/routes/_app/journal.index.tsx`
- Add a simple **Active / Archive** tab toggle under the heading. Default = Active.
- Active view: `archived_at IS NULL` (filter client-side from the loaded list, or split queries — go with client filter since limit is 200).
- Archive view: `archived_at IS NOT NULL`.
- Realtime listener already handles UPDATE/DELETE — no change.

## UI changes — `src/components/journal/entry-card.tsx`
Add a kebab menu (top-right of the card) using existing `DropdownMenu`:

- **Active entry** menu items:
  - **Edit** → navigate to `/journal/$id/edit`
  - **Archive** → `update({ archived_at: new Date().toISOString() })`
- **Archived entry** menu items:
  - **Restore** → `update({ archived_at: null })`
  - **Delete permanently** → confirm via `AlertDialog`, then `delete()`. Cascades nothing (no FK on `daily_behaviors.journal_entry_id`), so also clean up linked rows:
    ```ts
    await supabase.from("daily_behaviors").delete().eq("journal_entry_id", id);
    await supabase.from("journal_entries").delete().eq("id", id);
    ```

Pass an `onMutate` callback prop or just call `supabase` directly inside the card (already imported pattern across the app). Toast on success/failure.

## New route — `src/routes/_app/journal.$entryId.edit.tsx`
A small edit page (mirrors `journal.new.tsx` but pared down):
- Loads the entry by id (RLS-scoped).
- Editable fields: `text`, `voice_transcript` (textarea). Leave media + kind alone for now (out of scope).
- Save: `update({ text, voice_transcript, status: 'processing' })` then re-invoke `journal-extract` for that entry (idempotent upsert + stale sweep already in place, so re-running on edit is safe and keeps `daily_behaviors` in sync). Navigate back to `/journal`.
- Cancel returns to `/journal`.

## Out of scope
- Editing media attachments
- Bulk archive/delete
- Trash auto-purge schedule
