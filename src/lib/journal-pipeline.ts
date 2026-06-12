import { supabase } from "@/integrations/supabase/client";

/**
 * Kicks both legs of the journal AI pipeline for an entry:
 * journal-processor (summary/tags, resolves status to processed/failed) and
 * journal-extract (structured daily_behaviors).
 *
 * Every create/edit/retry path should go through this helper. The historical
 * failure modes it closes: callers invoking only one leg, the retry button
 * sending `entryId` (the function expects `entry_id`, so it 400'd and the
 * entry stayed "processing" forever), and HTTP-level invoke failures being
 * swallowed because supabase.functions.invoke reports them via `{ error }`
 * rather than throwing.
 *
 * Returns true when the processor invoke reached the function.
 */
export async function processJournalEntry(entryId: string): Promise<boolean> {
  let processorOk = false;
  try {
    const [proc, extract] = await Promise.all([
      supabase.functions.invoke("journal-processor", { body: { entry_id: entryId } }),
      supabase.functions.invoke("journal-extract", { body: { journal_entry_id: entryId } }),
    ]);
    processorOk = !proc.error;
    if (proc.error) console.warn("[journal-pipeline] processor invoke failed", proc.error);
    if (extract.error) console.warn("[journal-pipeline] extract invoke failed", extract.error);
  } catch (e) {
    console.warn("[journal-pipeline] invoke threw", e);
  }
  return processorOk;
}
