import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Whoop OAuth code exchange for Flutter and other non-TanStack clients.
 * Mirrors `exchangeWhoopAuthCode` in `src/lib/whoop.functions.ts`.
 */
export const Route = createFileRoute("/api/health/whoop-exchange")({
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

        let body: { code?: string; redirect_uri?: string };
        try {
          body = (await request.json()) as { code?: string; redirect_uri?: string };
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const code = body.code?.trim();
        const redirect_uri = body.redirect_uri?.trim();
        if (!code || !redirect_uri) {
          return json({ error: "code and redirect_uri are required" }, 400);
        }

        try {
          const { exchangeWhoopCode, persistTokensAndBackfill } = await import(
            "@/lib/whoop.server"
          );
          const tok = await exchangeWhoopCode(code, redirect_uri);
          const result = await persistTokensAndBackfill(userId, tok, 30);
          return json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("whoop oauth exchange failed:", e);
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
