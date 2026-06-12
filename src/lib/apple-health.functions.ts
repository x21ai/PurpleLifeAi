import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Apple Health server fns called from the Connection card + XML import page.
 */

const DailyMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hrv_rmssd_ms: z.number().nullable().optional(),
  resting_hr_bpm: z.number().nullable().optional(),
  hr_bpm: z.number().nullable().optional(),
  respiratory_rate_bpm: z.number().nullable().optional(),
  spo2_pct: z.number().nullable().optional(),
  skin_temp_c: z.number().nullable().optional(),
  sleep_total_min: z.number().nullable().optional(),
  sleep_rem_min: z.number().nullable().optional(),
  sleep_deep_min: z.number().nullable().optional(),
  sleep_awake_min: z.number().nullable().optional(),
  steps: z.number().nullable().optional(),
  active_calories: z.number().nullable().optional(),
  workout_minutes: z.number().nullable().optional(),
  vo2_max: z.number().nullable().optional(),
});

/**
 * Lazily creates the user's per-account webhook secret and returns it
 * with the canonical webhook URL the user pastes into Health Auto Export.
 */
export const getOrCreateAppleHealthConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("apple_health_tokens")
      .select("webhook_secret, last_sync_at, last_webhook_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return existing;

    // Generate a URL-safe 32-byte token.
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    const secret = Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data, error } = await supabaseAdmin
      .from("apple_health_tokens")
      .insert({ user_id: context.userId, webhook_secret: secret })
      .select("webhook_secret, last_sync_at, last_webhook_at")
      .single();
    if (error) throw error;
    return data;
  });

export const rotateAppleHealthSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    const secret = Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data, error } = await supabaseAdmin
      .from("apple_health_tokens")
      .update({ webhook_secret: secret })
      .eq("user_id", context.userId)
      .select("webhook_secret")
      .single();
    if (error) throw error;
    return data;
  });

export const disconnectAppleHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("apple_health_tokens").delete().eq("user_id", context.userId);
    return { ok: true };
  });

/**
 * Accept a chunk of pre-aggregated daily Apple Health rows from the XML
 * import flow. The browser parses export.xml into daily rows because the
 * file is too big to ship to the Worker.
 */
export const applyAppleHealthBackfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        days: z.array(DailyMetricSchema).min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { upsertAppleHealthDays, touchAppleHealthSync } = await import("./apple-health.server");
    const result = await upsertAppleHealthDays(context.userId, data.days);
    await touchAppleHealthSync(context.userId, "manual");
    return result;
  });
