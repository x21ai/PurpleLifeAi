import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type NativePushPlatform = "ios" | "android";

export async function upsertNativePushToken(
  supabase: SupabaseClient<Database>,
  userId: string,
  token: string,
  platform: NativePushPlatform,
): Promise<void> {
  const { error } = await supabase.from("native_push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform,
    },
    { onConflict: "user_id,token" },
  );
  if (error) throw new Error(error.message);
}
