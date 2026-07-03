import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegisterTokenSchema = z.object({
  token: z.string().trim().min(1).max(2000),
  platform: z.enum(["ios", "android"]),
});

/** Upsert an APNs/FCM device token for the signed-in user (native shell only). */
export const registerDeviceToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RegisterTokenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { upsertNativePushToken } = await import("./native-push.server");
    await upsertNativePushToken(context.supabase, context.userId, data.token, data.platform);
    return { ok: true as const };
  });
