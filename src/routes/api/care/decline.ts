import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Authenticated care-invite decline for Flutter and other non-TanStack clients.
 * Mirrors `declineIncomingCareInvite` in `src/lib/care.functions.ts` via
 * `declineCareInviteForUser` in `src/lib/care.server.ts`. Replaces the Flutter
 * client's direct `.update()` which is silently RLS-blocked (0-row no-op).
 *
 * Contract: POST { relationship_id } with
 * `Authorization: Bearer <supabase access token>`. Flutter web omits
 * Content-Type, so the body is parsed as JSON unconditionally.
 * Success: 200 { ok: true }. Failure: { error: string } with a real status.
 */

const bodySchema = z.object({ relationship_id: z.string().uuid() });

export const Route = createFileRoute("/api/care/decline")({
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
          return json({ error: "Invalid invite." }, 400);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "Invalid invite." }, 400);
        }

        const { declineCareInviteForUser, CareApiError } = await import("@/lib/care.server");
        try {
          const result = await declineCareInviteForUser(userId, parsed.data.relationship_id);
          return json(result);
        } catch (e) {
          if (e instanceof CareApiError) {
            return json({ error: e.message }, e.status);
          }
          console.error("[care] decline invite failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't decline this invite." },
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
