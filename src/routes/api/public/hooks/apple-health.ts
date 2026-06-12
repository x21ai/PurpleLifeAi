import { createFileRoute } from "@tanstack/react-router";

/**
 * Health Auto Export webhook receiver.
 *
 * Auth: a per-user secret passed as `?token=…` (or `x-purple-token` header).
 * Lookup the user via `apple_health_tokens.webhook_secret`, parse the JSON
 * payload into daily rows, and upsert into `biometrics` with source='apple_health'.
 *
 * The route lives under /api/public/* so it bypasses session auth, the
 * secret in the URL IS the auth. The handler MUST verify it before doing
 * anything else with the body.
 */
export const Route = createFileRoute("/api/public/hooks/apple-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Lightweight ping so users can verify their webhook token from a
        // browser tab, Health Auto Export "Test", or curl. Returns 200 only
        // if the token resolves to a real user; touches last_webhook_at so
        // the settings card shows the test went through.
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? request.headers.get("x-purple-token") ?? "";
        if (!token || token.length < 16) {
          return json({ error: "Missing token" }, 401);
        }
        const { findUserBySecret, touchAppleHealthSync } =
          await import("@/lib/apple-health.server");
        const userId = await findUserBySecret(token);
        if (!userId) return json({ error: "Invalid token" }, 401);
        // A ping proves the connection, not a data import.
        await touchAppleHealthSync(userId, "ping");
        return json({ ok: true, message: "Token valid. Purple is listening." });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? request.headers.get("x-purple-token") ?? "";
        if (!token || token.length < 16) {
          return json({ error: "Missing token" }, 401);
        }

        const {
          findUserBySecret,
          mapHealthAutoExportPayload,
          upsertAppleHealthDays,
          touchAppleHealthSync,
        } = await import("@/lib/apple-health.server");

        const userId = await findUserBySecret(token);
        if (!userId) return json({ error: "Invalid token" }, 401);

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        try {
          const days = mapHealthAutoExportPayload(payload);
          const { inserted } = await upsertAppleHealthDays(userId, days);
          // Only count it as a sync when rows actually landed.
          await touchAppleHealthSync(userId, inserted > 0 ? "data" : "ping");
          return json({ ok: true, days: days.length, inserted });
        } catch (e) {
          console.error("apple-health webhook failed:", e);
          return json({ error: "Processing failed" }, 500);
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
