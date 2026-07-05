import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Authenticated care-invite accept for Flutter and other non-TanStack clients.
 * Mirrors `acceptInvite` in `src/lib/care.functions.ts` via
 * `acceptCareInviteForUser` in `src/lib/care.server.ts`.
 *
 * Contract (see flutter/lib/features/care/care_repository.dart `acceptInvite`):
 * POST { invite_token } with `Authorization: Bearer <supabase access token>`.
 * Flutter web omits Content-Type to keep the CORS preflight simple, so the
 * body is parsed as JSON unconditionally. Success: 200
 * { relationship_id, owner_id }. Failure: { error: string } with a real status.
 *
 * SECURITY: never log the raw invite token.
 */

const bodySchema = z.object({ invite_token: z.string().min(20).max(128) });

export const Route = createFileRoute("/api/care/accept")({
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
          return json({ error: "This invite link is invalid or incomplete." }, 400);
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ error: "This invite link is invalid or incomplete." }, 400);
        }

        const { acceptCareInviteForUser, CareApiError } = await import("@/lib/care.server");
        try {
          const result = await acceptCareInviteForUser(userId, parsed.data.invite_token);
          return json(result);
        } catch (e) {
          if (e instanceof CareApiError) {
            return json({ error: e.message }, e.status);
          }
          console.error("[care] accept invite failed for user", userId, e);
          return json(
            { error: e instanceof Error ? e.message : "Couldn't accept this invite." },
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
