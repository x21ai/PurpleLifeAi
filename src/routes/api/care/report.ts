import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Caregiver dashboard single-report read for Flutter and other non-TanStack
 * clients. Mirrors `caregiverReadReport` in `src/lib/care.functions.ts` via
 * `caregiverReadReportForUser` in `src/lib/care.server.ts`, including the
 * `phi_access_log` audit write on success.
 *
 * Contract: POST { owner_id, report_id } with `Authorization: Bearer
 * <supabase access token>`. Flutter web omits Content-Type, so the body is
 * parsed as JSON unconditionally. Success: 200 { report, metrics }. Failure:
 * { error: string } with a real status.
 */

const bodySchema = z.object({
  owner_id: z.string().uuid(),
  report_id: z.string().uuid(),
});

export const Route = createFileRoute("/api/care/report")({
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

        const { caregiverReadReportForUser, CareApiError } = await import("@/lib/care.server");
        try {
          const result = await caregiverReadReportForUser(
            userId,
            parsed.data.owner_id,
            parsed.data.report_id,
          );
          return json(result);
        } catch (e) {
          if (e instanceof CareApiError) {
            return json({ error: e.message }, e.status);
          }
          console.error("[care] read report failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't load this report." },
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
