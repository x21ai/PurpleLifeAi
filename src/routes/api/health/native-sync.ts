import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

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

const SyncBodySchema = z.object({
  source: z.enum(["apple_health", "health_connect"]),
  samples: z.array(NativeHealthSampleSchema).min(1).max(2000),
});

/**
 * Authenticated batch ingest for native HealthKit / Health Connect samples.
 * Requires a Supabase session Bearer JWT; rows are always scoped to the
 * authenticated user (never a user_id in the body).
 */
export const Route = createFileRoute("/api/health/native-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
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

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }

        const parsed = SyncBodySchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            400,
          );
        }

        try {
          const { upsertNativeHealthSamples, logNativeHealthSyncAudit } = await import(
            "@/lib/native-health.server"
          );
          const result = await upsertNativeHealthSamples(
            userId,
            parsed.data.source,
            parsed.data.samples,
          );
          await logNativeHealthSyncAudit(
            userId,
            parsed.data.source,
            result.upserted,
            "api",
          );
          return json({ ok: true, ...result });
        } catch (e) {
          console.error("native-health sync failed:", e);
          return json({ error: "Processing failed" }, 500);
        }
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
