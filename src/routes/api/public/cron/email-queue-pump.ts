import { createFileRoute } from "@tanstack/react-router";

/**
 * Backup email queue pump on Cloudflare Cron (every minute).
 * Supabase pg_cron also POSTs to /api/email/queue/process; this keeps auth
 * mail moving if the vault secret or net.http_post path stalls.
 */
export const Route = createFileRoute("/api/public/cron/email-queue-pump")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRole) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        const base = process.env.PUBLIC_SITE_URL || "https://www.purplelife.org";
        const res = await fetch(`${base}/api/email/queue/process`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRole}`,
            "Content-Type": "application/json",
          },
          body: "{}",
        });

        const text = await res.text();
        let body: unknown = text;
        try {
          body = JSON.parse(text);
        } catch {
          /* plain text response */
        }
        return Response.json(body, { status: res.status });
      },
    },
  },
});
