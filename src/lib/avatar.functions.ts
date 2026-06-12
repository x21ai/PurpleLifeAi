import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const setAvatarPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string | null }) =>
    z.object({ path: z.string().min(1).max(512).nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: data.path })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getAvatarSignedUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("avatar_path, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const path = (profile as { avatar_path?: string | null } | null)?.avatar_path ?? null;
    let url: string | null = null;
    if (path) {
      const { data: signed } = await supabase.storage
        .from("journal-media")
        .createSignedUrl(path, 60 * 60 * 24);
      url = signed?.signedUrl ?? null;
    }
    return {
      url,
      path,
      first_name: (profile as { first_name?: string | null } | null)?.first_name ?? null,
      last_name: (profile as { last_name?: string | null } | null)?.last_name ?? null,
    };
  });
