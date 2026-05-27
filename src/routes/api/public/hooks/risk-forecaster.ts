import { createFileRoute } from "@tanstack/react-router";

// Cron-callable endpoint. pg_cron POSTs here daily; we forward to the
// risk-forecaster edge function with service-role context. No body params
// are required, but if `user_id` is provided we run for just that user.
export const Route = createFileRoute("/api/public/hooks/risk-forecaster")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const apikey = request.headers.get("apikey");
        // Authenticate cron callers with a dedicated secret (CRON_SECRET).
        // The Supabase publishable/anon key is embedded in the public JS bundle
        // and must NEVER be used as an auth secret for server endpoints.
        const expected = process.env.CRON_SECRET;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json().catch(() => ({} as Record<string, unknown>));
        const action = (body as { action?: string })?.action ?? "run-all";
        const userId = (body as { user_id?: string })?.user_id;

        const url = `${process.env.SUPABASE_URL}/functions/v1/risk-forecaster`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          },
          body: JSON.stringify(userId ? { action: "run-user", user_id: userId } : { action }),
        });
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
