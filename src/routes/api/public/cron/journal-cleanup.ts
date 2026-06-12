import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hourly. Auto-fails journal entries stuck in "processing" for >15 minutes
// (client crashed before invoking the pipeline, edge function died mid-run,
// invoke 400'd, etc.) so users see "Retry reading" instead of an eternal
// spinner. The cleanup_stuck_journal_entries() function existed in the
// database since migration 20260530003008 but nothing ever scheduled it.
export const Route = createFileRoute("/api/public/cron/journal-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Automatic retry before giving up: entries stuck "processing" for
        // 5-15 minutes get the processor re-invoked (it is idempotent and
        // resolves status to processed/failed). Entries stuck past 15 minutes
        // are marked failed by the cleanup function, which surfaces the calm
        // "Retry reading" affordance instead of an eternal spinner.
        const nowMs = Date.now();
        const fifteenAgo = new Date(nowMs - 15 * 60 * 1000).toISOString();
        const fiveAgo = new Date(nowMs - 5 * 60 * 1000).toISOString();
        const { data: stuck } = await supabaseAdmin
          .from("journal_entries")
          .select("id")
          .eq("status", "processing")
          .gte("created_at", fifteenAgo)
          .lte("created_at", fiveAgo)
          .limit(10);

        let retried = 0;
        for (const row of stuck ?? []) {
          const { error: invokeError } = await supabaseAdmin.functions.invoke("journal-processor", {
            body: { entry_id: row.id },
          });
          if (!invokeError) retried++;
        }

        const { error } = await supabaseAdmin.rpc("cleanup_stuck_journal_entries");
        if (error) {
          console.error("[cron] journal-cleanup error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
        return Response.json({ ok: true, retried });
      },
    },
  },
});
