## Problem

Two issues are conflated in the report:

1. **Stuck "Stuck, retry"** — A few `journal_entries` rows sit in `status='processing'` forever. Edge logs show the processor hitting an invalid `OPENAI_API_KEY` (used only for embeddings + voice transcription), and any other transient failure leaves rows stuck because nothing sweeps them.
2. **Entries don't flow into Hydration / Biometrics / Food etc.** — `journal-processor` only writes `ai_summary`, `ai_tags`, `ai_extracted` (jsonb) and auto-creates `seizure_events`. It does **not** insert into `hydration_intake`, `biometrics`, `food_entries`, or `vitals_log`. So a journal note like "drank 500ml water, BP 120/80, ate eggs" never appears in those tools.

## Fix

### A. Unstick the processor (reliability)

- Make embedding + audio transcription strictly non-fatal: wrap `embedText` and `transcribeAudio` calls so any OpenAI 401/timeout is logged and skipped (no `throw`). Entry still finishes as `processed`.
- Add a real cleanup: extend the existing `cleanup_stuck_journal_entries()` to run from the existing cron (`/api/public/cron/journal-reprocess`) every minute — anything `processing` for >5 min gets re-invoked once, then flipped to `failed` after a second stale check so the UI's "Retry reading" button surfaces.
- One-shot reset: mark currently stuck rows (`d3fb50f9…`, `d0138b45…`) as `failed` so the UI offers Retry instead of a permanent spinner.
- Note for the user: the project's `OPENAI_API_KEY` secret is invalid. Embeddings/voice will stay disabled until it's rotated, but text extraction (Claude/Anthropic) and tool-routing will work fine without it.

### B. Route journal content into the right tools (the real ask)

Extend the Claude tool schema in `journal-processor/index.ts` with a new `extracted.measurements` block, then write to the matching tables with service-role + idempotency keyed on `journal_entry_id`:

| Journal phrase                       | Extracted field                          | Written to        |
| ------------------------------------ | ---------------------------------------- | ----------------- |
| "drank 500 ml water", "16 oz coffee" | `hydration[]` `{ volume_ml, kind }`      | `hydration_intake`|
| "BP 120/80", "HR 72", "weight 70kg", "temp 37.2" | `vitals[]` `{ kind, value, value2?, unit }` | `vitals_log` |
| "ate eggs and toast", "lunch: salad" | `food[]` `{ name, portion?, consumed_at? }` | `food_entries` |
| "took 500 mg Keppra"                 | already handled via `event:medication` (no change) | `medication_doses` (existing path) |
| "felt aura at 3pm"                   | already handled (no change)              | `aura_events`     |

Implementation:
- Add an idempotency strategy: each insert carries `source='journal'` plus `journal_entry_id` (add nullable `journal_entry_id uuid` column where missing — `hydration_intake`, `vitals_log`, `food_entries`). Before writing on a re-run/retry, delete prior rows for that `journal_entry_id` then re-insert (mirrors the seizure/daily_behaviors sweep already in the codebase).
- All inserts run through the existing service-role `admin` client inside the processor; no RLS or client changes needed.
- Each tool screen already reads from its own table, so no UI work is needed there — entries will appear automatically. The journal entry card will keep showing the summary; we add a tiny "Logged: 1 hydration · 1 vital · 1 meal" footer line so the user sees the link visually.

### C. Migration (single file)

```
alter table public.hydration_intake add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
alter table public.vitals_log       add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
alter table public.food_entries     add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete cascade;
create index if not exists hydration_intake_journal_idx on public.hydration_intake(journal_entry_id);
create index if not exists vitals_log_journal_idx       on public.vitals_log(journal_entry_id);
create index if not exists food_entries_journal_idx     on public.food_entries(journal_entry_id);
```

No new tables, no GRANT changes (columns inherit existing grants).

## Files touched

- `supabase/functions/journal-processor/index.ts` — schema additions, new writers, non-fatal embed/transcribe, idempotent re-runs.
- `supabase/migrations/<new>.sql` — three `journal_entry_id` columns + indexes.
- `src/routes/api/public/cron/journal-reprocess.ts` — sweep stuck >5min, retry once, then mark failed.
- `src/components/journal/entry-card.tsx` — small footer chip showing what got logged (counts only).

## Out of scope

- Rotating the OpenAI key (user action, surfaced as a note).
- Changing how Hydration / Biometrics / Food pages render — they already query their tables.
- Voice transcription quality (depends on OpenAI key being valid).

Reply "go" to implement, or tell me which parts to drop or expand.