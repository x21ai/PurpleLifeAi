import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

/**
 * Authenticated personal invite code for Flutter Account screen.
 * Mirrors `getOrCreatePersonalShareCode` in `src/lib/share-codes.functions.ts`.
 */
export const Route = createFileRoute("/api/account/personal-share-code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        const SERVICE_ROLE_KEY =
          process.env.SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SERVICE_ROLE_KEY) {
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

        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const existing = await supabaseAdmin
          .from("promo_codes")
          .select("code")
          .eq("created_by", userId)
          .eq("kind", "share")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing.data?.code) {
          return json({ code: existing.data.code });
        }

        for (let attempt = 0; attempt < 5; attempt++) {
          const code = makeCode();
          const ins = await supabaseAdmin
            .from("promo_codes")
            .insert({
              code,
              kind: "share",
              label: "Personal invite",
              created_by: userId,
              active: true,
            })
            .select("code")
            .single();
          if (!ins.error && ins.data) {
            return json({ code: ins.data.code });
          }
        }

        return json({ error: "Could not generate invite code" }, 500);
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
