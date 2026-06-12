import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROVIDERS = ["claude", "openai", "gemini", "grok", "maya"] as const;

export const getAiProvider = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("ai_provider")
      .eq("id", userId)
      .maybeSingle();
    return { provider: (data?.ai_provider as string | null) ?? "claude" };
  });

export const setAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ provider: z.enum(PROVIDERS) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ ai_provider: data.provider })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, provider: data.provider };
  });
