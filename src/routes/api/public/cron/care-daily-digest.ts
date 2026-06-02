import { createFileRoute } from "@tanstack/react-router";
import { runDailyDigest } from "@/lib/care-digest.server";

/**
 * Daily caregiver-activity digest. Called by pg_cron once per day.
 * No body required. Same lightweight gate as dose-reminders — accepts the
 * Supabase anon key in `apikey` and pg_cron runs as anon.
 */
export const Route = createFileRoute("/api/public/cron/care-daily-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin =
          process.env.PUBLIC_SITE_URL || new URL(request.url).origin;
        try {
          const summary = await runDailyDigest(origin, 24);
          return Response.json({ ok: true, ...summary });
        } catch (err) {
          console.error("[cron] care-daily-digest failed", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
      GET: async ({ request }) => {
        // Allow GET for manual testing
        const origin =
          process.env.PUBLIC_SITE_URL || new URL(request.url).origin;
        try {
          const summary = await runDailyDigest(origin, 24);
          return Response.json({ ok: true, ...summary });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});