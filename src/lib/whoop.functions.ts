import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Whoop connector server functions.
 * Heavy lifting lives in whoop.server.ts; this file only exposes the RPC
 * surface that the WhoopConnection component + callback page call into.
 */

export const getWhoopConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { getWhoopClientId } = await import("./whoop.server");
  return { client_id: getWhoopClientId() };
});

export const exchangeWhoopAuthCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        code: z.string().min(1),
        redirect_uri: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { exchangeWhoopCode, persistTokensAndBackfill } = await import(
      "./whoop.server"
    );
    const tok = await exchangeWhoopCode(data.code, data.redirect_uri);
    const result = await persistTokensAndBackfill(context.userId, tok, 30);
    return { ok: true, ...result };
  });

export const whoopIncrementalSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { incrementalSyncForUser } = await import("./whoop.server");
    try {
      const result = await incrementalSyncForUser(context.userId, 3);
      return { ok: true as const, ...result };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Whoop session expired")) {
        return { ok: false as const, reason: "reconnect_required" as const, message: msg };
      }
      throw e;
    }
  });

export const whoopBackfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { syncWhoopRange } = await import("./whoop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - data.days * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const result = await syncWhoopRange(context.userId, start, end);
    await supabaseAdmin
      .from("whoop_tokens")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    return { ok: true, ...result };
  });