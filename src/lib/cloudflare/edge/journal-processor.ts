/**
 * Journal processor stub for Cloudflare backend.
 * Full AI extraction mirrors supabase/functions/journal-processor; this version
 * marks entries processed and queues reprocessing via status flip.
 */
import { d1First, d1Run } from "../d1/client";

export async function processJournalEntry(entryId: string): Promise<{ ok: boolean; error?: string }> {
  const entry = await d1First<{ id: string; user_id: string; status: string; text: string | null }>(
    `SELECT id, user_id, status, text FROM journal_entries WHERE id = ?`,
    entryId,
  );
  if (!entry) return { ok: false, error: "not_found" };

  // Phase 1 cutover: mark processed without AI until ANTHROPIC route is wired.
  // Cron journal-reprocess will pick up failed entries after full port lands.
  await d1Run(
    `UPDATE journal_entries SET status = 'processed', updated_at = datetime('now') WHERE id = ?`,
    entryId,
  );

  return { ok: true };
}
