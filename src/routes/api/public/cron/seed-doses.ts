import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hourly. Seeds today's medication_doses rows per user timezone and marks
// yesterday's pending doses missed at each user's local midnight. The
// underlying function is idempotent (NOT EXISTS guards), so hourly runs are
// safe and give every timezone its local day shortly after midnight.
// Previously this function existed in the database with no scheduler at all:
// users who did not open the app got no dose rows and therefore no reminders.
export const Route = createFileRoute("/api/public/cron/seed-doses")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabaseAdmin.rpc("seed_daily_medication_doses");
        if (error) {
          console.error("[cron] seed-doses error", error);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
