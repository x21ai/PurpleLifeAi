import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Daily "For you" AI observation cards for Flutter and other non-TanStack
 * clients. Mirrors `getDailyInsightCards` in
 * `src/lib/report-trends.functions.ts` via the shared
 * `getDailyInsightCardsForUser` implementation (same file) so the two call
 * paths can never drift.
 *
 * Contract: POST { force? } with `Authorization: Bearer <supabase access
 * token>`. Flutter web omits Content-Type to keep the CORS preflight
 * simple, so the body is parsed as JSON unconditionally. Success: 200
 * { cards, headline, cached, generatedFor, error? }. Transport failure:
 * { error: string } with a real status.
 *
 * SECURITY: uses the caller's own bearer token (not service role), so reads
 * are RLS-scoped exactly like the server fn's `supabase` context. Unlike
 * `getMetricInsight`, this runs the AI model automatically on first call of
 * the day (result is cached per user per day), matching web behavior, so
 * Flutter can call this on Insights screen load without a "Run AI" button.
 */

const bodySchema = z.object({ force: z.boolean().optional() });

export const Route = createFileRoute("/api/ai/daily-insight-cards")({
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

        let raw: unknown = {};
        try {
          const text = await request.text();
          raw = text ? JSON.parse(text) : {};
        } catch {
          return json({ error: "Invalid request." }, 400);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid request." }, 400);
        }

        const { getDailyInsightCardsForUser } = await import("@/lib/report-trends.functions");
        try {
          const result = await getDailyInsightCardsForUser(userClient, userId, parsed.data);
          return json(result);
        } catch (e) {
          console.error("[ai] daily insight cards failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't load your insights." },
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
