import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * On-demand AI report explanation for Flutter and other non-TanStack
 * clients. Mirrors `summarizeReport` in `src/lib/reports.functions.ts` via
 * the shared `summarizeReportForUser` implementation (same file) so the two
 * call paths can never drift.
 *
 * Contract: POST { id, force? } with `Authorization: Bearer <supabase access
 * token>`. Flutter web omits Content-Type to keep the CORS preflight simple,
 * so the body is parsed as JSON unconditionally. Success: 200
 * { ok, cached, summary }. Failure: { error: string } with a real status.
 *
 * SECURITY: uses the caller's own bearer token (not service role), so the
 * report read/update is RLS-scoped exactly like the server fn's `supabase`
 * context. Costs a small amount of AI credits on `force=true` or first run.
 */

const bodySchema = z.object({
  id: z.string().uuid(),
  force: z.boolean().optional(),
});

export const Route = createFileRoute("/api/ai/summarize-report")({
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

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ error: "Invalid request." }, 400);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid request." }, 400);
        }

        const { summarizeReportForUser } = await import("@/lib/reports.functions");
        try {
          const result = await summarizeReportForUser(userClient, userId, parsed.data);
          return json(result);
        } catch (e) {
          console.error("[ai] summarize report failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't explain this report." },
            500,
          );
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
