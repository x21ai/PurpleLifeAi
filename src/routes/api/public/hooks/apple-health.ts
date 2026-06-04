import { createFileRoute } from "@tanstack/react-router";

/**
 * Health Auto Export webhook receiver.
 *
 * Auth: a per-user secret passed as `?token=…` (or `x-purple-token` header).
 * Lookup the user via `apple_health_tokens.webhook_secret`, parse the JSON
 * payload into daily rows, and upsert into `biometrics` with source='apple_health'.
 *
 * The route lives under /api/public/* so it bypasses session auth — the
 * secret in the URL IS the auth. The handler MUST verify it before doing
 * anything else with the body.
 */
export const Route = createFileRoute("/api/public/hooks/apple-health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const token =
          url.searchParams.get("token") ??
          request.headers.get("x-purple-token") ??
          "";
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
          await touchAppleHealthSync(userId, "webhook");
          return json({ ok: true, days: days.length, inserted });
        } catch (e) {
          console.error("apple-health webhook failed:", e);
          return json({ error: e instanceof Error ? e.message : String(e) }, 500);
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