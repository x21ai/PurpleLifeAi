import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function makeCode(): string {
  // 8-char readable code, no ambiguous chars
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export const getOrCreatePersonalShareCode = createServerFn({ method: "POST" })
  .handler(async ({ context }) => {
    const { userId } = (context as { userId: string });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, label, kind, active, max_uses, used_count")
      .eq("created_by", userId)
      .eq("kind", "share")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.data) return { code: existing.data.code };

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
      if (!ins.error && ins.data) return { code: ins.data.code };
      // collision -> retry
    }
    throw new Error("Could not generate invite code");
  });
(getOrCreatePersonalShareCode as unknown as { middleware: (m: unknown[]) => unknown }).middleware([requireSupabaseAuth]);