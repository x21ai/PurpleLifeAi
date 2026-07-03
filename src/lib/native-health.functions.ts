import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NativeHealthSampleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recorded_at: z.string().datetime().optional(),
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
}).refine((s) => Boolean(s.date || s.recorded_at), {
  message: "Each sample needs date or recorded_at",
});

const SyncInputSchema = z.object({
  source: z.enum(["apple_health", "health_connect"]),
  samples: z.array(NativeHealthSampleSchema).min(1).max(2000),
});

export type { NativeHealthSample, NativeHealthSource, NativeHealthSyncResult } from "./native-health.server";

/**
 * RPC entry for the Capacitor shell: authenticated users push native health
 * samples into `biometrics` without calling the HTTP route directly.
 */
export const syncNativeHealthBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SyncInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { upsertNativeHealthSamples, logNativeHealthSyncAudit } = await import(
      "./native-health.server"
    );
    const result = await upsertNativeHealthSamples(
      context.userId,
      data.source,
      data.samples,
    );
    await logNativeHealthSyncAudit(
      context.userId,
      data.source,
      result.upserted,
      "server_fn",
    );
    return { ok: true as const, ...result };
  });
