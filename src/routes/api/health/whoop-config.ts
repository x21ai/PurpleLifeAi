import { createFileRoute } from "@tanstack/react-router";

/**
 * Whoop OAuth client id for Flutter and other non-TanStack clients.
 * Mirrors `getWhoopConfig` in `src/lib/whoop.functions.ts`.
 */
export const Route = createFileRoute("/api/health/whoop-config")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getWhoopClientId } = await import("@/lib/whoop.server");
          return json({ client_id: getWhoopClientId() });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("whoop config failed:", e);
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
