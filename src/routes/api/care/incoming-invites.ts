import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

/**
 * List pending care invites addressed to the signed-in user's email, for
 * Flutter and other non-TanStack clients. Mirrors `listIncomingCareInvites`
 * in `src/lib/care.functions.ts` via `listIncomingInvitesForUser` in
 * `src/lib/care.server.ts`.
 *
 * Contract (see flutter/lib/features/care/care_repository.dart
 * `_loadIncomingCareInvites`): GET with `Authorization: Bearer <supabase
 * access token>`. Success: 200 { invites: [...] }. Failure: { error: string }
 * with a real status. Skips Content-Type/body entirely so Flutter web keeps
 * this a CORS-simple-ish GET (still needs the preflight allow-list entry for
 * the Authorization header).
 */

export const Route = createFileRoute("/api/care/incoming-invites")({
  server: {
    handlers: {
      GET: async ({ request }) => {
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

        const { listIncomingInvitesForUser, CareApiError } = await import("@/lib/care.server");
        try {
          const result = await listIncomingInvitesForUser(userId);
          return json(result);
        } catch (e) {
          if (e instanceof CareApiError) {
            return json({ error: e.message }, e.status);
          }
          console.error("[care] list incoming invites failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't load your invites." },
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
