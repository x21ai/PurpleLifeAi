import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ code: z.string().min(3).max(64) });

export const redeemInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => input.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const code = data.code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: promo, error: lookupErr } = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, kind, active, max_uses, used_count, expires_at")
      .eq("code", code)
      .maybeSingle();
    if (lookupErr) throw new Error(lookupErr.message);
    if (!promo || !promo.active) return { ok: false as const, reason: "invalid" as const };
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return { ok: false as const, reason: "expired" as const };
    }
    if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
      return { ok: false as const, reason: "exhausted" as const };
    }

    // Already redeemed by this user?
    const { data: existing } = await supabaseAdmin
      .from("promo_code_redemptions")
      .select("id")
      .eq("user_id", userId)
      .eq("promo_code_id", promo.id)
      .maybeSingle();
    if (existing) return { ok: true as const, alreadyRedeemed: true, code };

    const { error: insErr } = await supabaseAdmin
      .from("promo_code_redemptions")
      .insert({ user_id: userId, promo_code_id: promo.id });
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin
      .from("promo_codes")
      .update({ used_count: (promo.used_count ?? 0) + 1 })
      .eq("id", promo.id);

    return { ok: true as const, alreadyRedeemed: false, code };
  });