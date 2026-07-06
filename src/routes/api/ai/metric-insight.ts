import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * On-demand AI trend summary for a single metric, for Flutter and other
 * non-TanStack clients. Mirrors `getMetricInsight` in
 * `src/lib/report-trends.functions.ts` via the shared
 * `getMetricInsightForUser` implementation (same file) so the two call
 * paths can never drift.
 *
 * Contract: POST { metricKey, force? } with `Authorization: Bearer <supabase
 * access token>`. Flutter web omits Content-Type to keep the CORS preflight
 * simple, so the body is parsed as JSON unconditionally. Success: 200
 * { summary, bullets, suggestedQuestions, error, cached, latestAt }.
 * Transport failure: { error: string } with a real status.
 *
 * SECURITY: uses the caller's own bearer token (not service role), so reads
 * are RLS-scoped exactly like the server fn's `supabase` context. Like the
 * web behavior, this does NOT run the AI model unless `force=true` or no
 * cache exists is explicitly requested by the caller (see
 * `getMetricInsightForUser` for the exact gating); Flutter should show a
 * "Run AI insights" affordance rather than auto-calling with force=true.
 */

const bodySchema = z.object({
  metricKey: z.string().min(1).max(80),
  force: z.boolean().optional(),
});

export const Route = createFileRoute("/api/ai/metric-insight")({
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

        const { getMetricInsightForUser } = await import("@/lib/report-trends.functions");
        try {
          const result = await getMetricInsightForUser(userClient, userId, parsed.data);
          return json(result);
        } catch (e) {
          console.error("[ai] metric insight failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't load this insight." },
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
