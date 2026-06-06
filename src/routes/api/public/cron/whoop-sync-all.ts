import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily cron, incremental Whoop sync for every connected user.
 * Gated by x-cron-secret header (set CRON_SECRET in backend settings).
 */
export const Route = createFileRoute("/api/public/cron/whoop-sync-all")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }
        try {
          const { syncAllConnectedUsers } = await import("@/lib/whoop.server");
          const result = await syncAllConnectedUsers();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("whoop cron failed:", e);
          return new Response(
            JSON.stringify({ error: String(e) }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});