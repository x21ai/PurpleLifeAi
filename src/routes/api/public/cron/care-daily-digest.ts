import { createFileRoute } from "@tanstack/react-router";
import { runDailyDigest } from "@/lib/care-digest.server";

/**
 * Daily caregiver-activity digest. Called by pg_cron once per day.
 * No body required. Same lightweight gate as dose-reminders, accepts the
 * Supabase anon key in `apikey` and pg_cron runs as anon.
 */
export const Route = createFileRoute("/api/public/cron/care-daily-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const origin = process.env.PUBLIC_SITE_URL || new URL(request.url).origin;
        try {
          const summary = await runDailyDigest(origin, 24);
          return Response.json({ ok: true, ...summary });
        } catch (err) {
          console.error("[cron] care-daily-digest failed", err);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
