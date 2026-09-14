import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { runOuraIncrementalSync } from "@/lib/cloudflare/edge/oura-sync";

/**
 * Hourly cron: incremental Oura sync for every connected user.
 *
 * - DATA_BACKEND=supabase (default): delegates to Supabase `oura-sync` edge function.
 * - DATA_BACKEND=cloudflare: runs in-Worker via D1 (src/lib/cloudflare/edge/oura-sync.ts).
 *
 * Auth: CRON_SECRET via x-cron-secret or legacy apikey header.
 */
export const Route = createFileRoute("/api/public/cron/oura-sync-all")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        if (isCloudflareBackend(process.env)) {
          try {
            const result = await runOuraIncrementalSync({ all: true });
            return new Response(JSON.stringify(result), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } catch (e) {
            console.error("oura cron (cloudflare) failed:", e);
            return new Response(
              JSON.stringify({ error: "Internal server error" }),
              { status: 502, headers: { "Content-Type": "application/json" } },
            );
          }
        }

        const url = process.env.SUPABASE_URL!;
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (!url || !serviceRole) {
          return new Response(
            JSON.stringify({ error: "Missing Supabase server config" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
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
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});