import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily cron, triggers an incremental Oura sync for every connected user.
 * Delegates to the `oura-sync` edge function with `action:"incremental"` +
 * `all:true`, which is service-role gated. The function itself respects each
 * user's `sync_interval_hours` so users on a 24h cadence don't re-sync if
 * something else (e.g. the client auto-sync on app open) just ran.
 *
 * Auth: this route lives under `/api/public/*` (auth bypassed at the edge);
 * pg_cron calls it with the project's anon key in an `apikey` header. The
 * service-role key never leaves the server, we use it only when invoking
 * the edge function.
 */
export const Route = createFileRoute("/api/public/cron/oura-sync-all")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const url = process.env.SUPABASE_URL!;
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (!url || !serviceRole) {
          return new Response(JSON.stringify({ error: "Missing Supabase server config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const res = await fetch(`${url}/functions/v1/oura-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRole}`,
              apikey: serviceRole,
            },
            body: JSON.stringify({ action: "incremental", all: true }),
          });
          const text = await res.text();
          return new Response(text, {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("oura cron failed:", e);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
