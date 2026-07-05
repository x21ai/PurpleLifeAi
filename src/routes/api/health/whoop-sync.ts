import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Authenticated Whoop incremental sync for Flutter and other non-TanStack clients.
 * Mirrors `whoopIncrementalSync` in `src/lib/whoop.functions.ts`.
 */
export const Route = createFileRoute("/api/health/whoop-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return json({ error: "Server configuration error" }, 500);
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          return json({ error: "Unauthorized" }, 401);
        }

        const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData?.user) {
          return json({ error: "Unauthorized" }, 401);
        }
        const userId = userData.user.id;

        try {
          const { incrementalSyncForUser } = await import("@/lib/whoop.server");
          const result = await incrementalSyncForUser(userId, 3);
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("Whoop session expired") || msg.includes("No Whoop token")) {
            return json({ ok: false, reason: "reconnect_required", message: msg });
          }
          console.error("whoop incremental sync failed:", e);
          return json({ error: msg }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
