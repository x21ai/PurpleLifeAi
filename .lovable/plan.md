
## Goal
Prevent duplicate `daily_behaviors` rows when journal-extract runs more than once on the same entry.

## Changes

### 1. DB migration
Add a unique constraint to `daily_behaviors`:

```sql
-- De-dupe any existing duplicates first (keep most recent per key)
DELETE FROM public.daily_behaviors a
USING public.daily_behaviors b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.journal_entry_id = b.journal_entry_id
  AND a.behavior_key = b.behavior_key
  AND a.journal_entry_id IS NOT NULL;

ALTER TABLE public.daily_behaviors
  ADD CONSTRAINT daily_behaviors_user_entry_key_uniq
  UNIQUE (user_id, journal_entry_id, behavior_key);
```

Note: constraint only applies when `journal_entry_id` is non-null (rows without an entry id won't collide).

### 2. `supabase/functions/journal-extract/index.ts`
Replace the `.insert(rows)` call with:

```ts
.upsert(rows, {
  onConflict: 'user_id,journal_entry_id,behavior_key',
  count: 'exact',
})
```

And ensure each row sets `user_corrected: false` so a re-extraction resets it (existing code already does this; upsert will overwrite). Also overwrite `value` and `extraction_confidence` — handled automatically since upsert replaces the conflicting row's columns with the new payload.

Redeploy the function.

### 3. Idempotency smoke test
- Find (or create) a test `journal_entries` row with content: *"Slept poorly and woke up twice. Took my morning Keppra with breakfast. Had two coffees by 10am. Felt foggy until lunch."*
- Call `journal-extract` with that entry id → expect 7 rows written.
- Call `journal-extract` again with same entry id → expect 0 new rows, 7 updated.
- Run:
  ```sql
  SELECT COUNT(*) FROM public.daily_behaviors WHERE journal_entry_id = '<id>';
  ```
  Confirm result = 7. Show response payloads from both calls and the count.

## Out of scope
No UI changes, no Phase 2 work, no taxonomy changes.
