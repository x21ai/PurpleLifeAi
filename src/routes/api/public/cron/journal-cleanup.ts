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

        const { error } = await supabaseAdmin.rpc("cleanup_stuck_journal_entries");
        if (error) {
          console.error("[cron] journal-cleanup error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
