import { createFileRoute } from "@tanstack/react-router";

/**
 * Recover journal entries stuck in "processing":
 *  - older than STALE_MIN but younger than FAIL_MIN: re-invoke journal-processor
 *  - older than FAIL_MIN: mark "failed" so the UI offers a clean retry
 * Runs from the Cloudflare cron (see src/server.ts). The first AI invoke can
 * silently fail (fire-and-forget), so this is the safety net that makes entries
 * "retry themselves".
 */
const STALE_MIN = 3;
const FAIL_MIN = 30;
const BATCH = 10;

export const Route = createFileRoute("/api/public/cron/journal-reprocess")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET;
        const provided =
          request.headers.get("x-cron-secret") ?? request.headers.get("apikey");
        if (!cronSecret || provided !== cronSecret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = process.env.SUPABASE_URL;
        const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceRole) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        const headers = {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Content-Type": "application/json",
        };
        const staleBefore = new Date(Date.now() - STALE_MIN * 60_000).toISOString();
        const failBefore = new Date(Date.now() - FAIL_MIN * 60_000).toISOString();

        try {
          const res = await fetch(
            `${url}/rest/v1/journal_entries?status=eq.processing&created_at=lt.${encodeURIComponent(staleBefore)}&select=id,created_at&order=created_at.asc&limit=${BATCH}`,
            { headers },
          );
          if (!res.ok) {
            return Response.json({ error: `query ${res.status}` }, { status: 502 });
          }
          const rows = (await res.json()) as Array<{ id: string; created_at: string }>;

          let reprocessed = 0;
          let failed = 0;
          for (const row of rows) {
            if (row.created_at < failBefore) {
              await fetch(`${url}/rest/v1/journal_entries?id=eq.${row.id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status: "failed" }),
              }).catch(() => undefined);
              failed += 1;
            } else {
              await fetch(`${url}/functions/v1/journal-processor`, {
                method: "POST",
                headers,
                body: JSON.stringify({ entry_id: row.id }),
              }).catch(() => undefined);
              reprocessed += 1;
            }
          }
          return Response.json({ reprocessed, failed });
        } catch (e) {
          console.error("journal-reprocess failed", e);
          return Response.json({ error: "Internal error" }, { status: 502 });
        }
      },
    },
  },
});
