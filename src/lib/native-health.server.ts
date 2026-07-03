/**
 * Native HealthKit / Health Connect sync helpers.
 * Authenticated clients send pre-aggregated daily biometric rows; we upsert
 * into `biometrics` with source `apple_health` or `health_connect`, scoped
 * to the authenticated user.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { touchAppleHealthSync } from "@/lib/apple-health.server";

export type NativeHealthSource = "apple_health" | "health_connect";

/** One day's metrics from a native health SDK (HealthKit or Health Connect). */
export type NativeHealthSample = {
  /** ISO date (YYYY-MM-DD). Preferred for daily aggregates. */
  date?: string;
  /** ISO timestamp. Normalized to UTC midnight when `date` is omitted. */
  recorded_at?: string;
  hrv_rmssd_ms?: number | null;
  resting_hr_bpm?: number | null;
  hr_bpm?: number | null;
  respiratory_rate_bpm?: number | null;
  spo2_pct?: number | null;
  skin_temp_c?: number | null;
  sleep_total_min?: number | null;
  sleep_rem_min?: number | null;
  sleep_deep_min?: number | null;
  sleep_awake_min?: number | null;
  steps?: number | null;
  active_calories?: number | null;
  workout_minutes?: number | null;
  vo2_max?: number | null;
};

export type NativeHealthSyncResult = {
  upserted: number;
  source: NativeHealthSource;
};

function round(v: number | null | undefined, dp: number): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  const p = 10 ** dp;
  return Math.round(v * p) / p;
}

function resolveDayKey(sample: NativeHealthSample): string | null {
  if (sample.date?.match(/^\d{4}-\d{2}-\d{2}$/)) return sample.date;
  if (sample.recorded_at) {
    const day = sample.recorded_at.slice(0, 10);
    if (day.match(/^\d{4}-\d{2}-\d{2}$/)) return day;
  }
  return null;
}

/** Merge duplicate day rows; later samples fill in non-null fields. */
function mergeSamplesByDay(samples: NativeHealthSample[]): NativeHealthSample[] {
  const byDay = new Map<string, NativeHealthSample>();
  for (const sample of samples) {
    const day = resolveDayKey(sample);
    if (!day) continue;
    const prev = byDay.get(day);
    byDay.set(day, prev ? { ...prev, ...sample, date: day } : { ...sample, date: day });
  }
  return Array.from(byDay.values());
}

function toBiometricRow(userId: string, source: NativeHealthSource, sample: NativeHealthSample) {
  const day = resolveDayKey(sample);
  if (!day) throw new Error("Each sample needs a valid date or recorded_at");
  return {
    user_id: userId,
    source,
    recorded_at: `${day}T00:00:00Z`,
    hrv_rmssd_ms: round(sample.hrv_rmssd_ms, 1),
    resting_hr_bpm: round(sample.resting_hr_bpm, 0),
    hr_bpm: round(sample.hr_bpm, 0),
    respiratory_rate_bpm: round(sample.respiratory_rate_bpm, 1),
    spo2_pct: round(sample.spo2_pct, 1),
    skin_temp_c: round(sample.skin_temp_c, 2),
    sleep_total_min: round(sample.sleep_total_min, 0),
    sleep_rem_min: round(sample.sleep_rem_min, 0),
    sleep_deep_min: round(sample.sleep_deep_min, 0),
    sleep_awake_min: round(sample.sleep_awake_min, 0),
    steps: sample.steps == null ? null : Math.round(sample.steps),
    active_calories: round(sample.active_calories, 0),
    workout_minutes: round(sample.workout_minutes, 0),
    vo2_max: round(sample.vo2_max, 1),
    created_by_kind: "self" as const,
  };
}

export async function upsertNativeHealthSamples(
  userId: string,
  source: NativeHealthSource,
  samples: NativeHealthSample[],
): Promise<NativeHealthSyncResult> {
  const days = mergeSamplesByDay(samples);
  if (days.length === 0) return { upserted: 0, source };

  const rows = days.map((d) => toBiometricRow(userId, source, d));
  const dates = rows.map((r) => r.recorded_at);

  await supabaseAdmin
    .from("biometrics")
    .delete()
    .eq("user_id", userId)
    .eq("source", source)
    .in("recorded_at", dates);

  const CHUNK = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error, count } = await supabaseAdmin
      .from("biometrics")
      .insert(slice, { count: "exact" });
    if (error) throw error;
    upserted += count ?? slice.length;
  }

  if (source === "apple_health") {
    await touchAppleHealthSync(userId, "manual");
  }

  return { upserted, source };
}

export async function logNativeHealthSyncAudit(
  userId: string,
  source: NativeHealthSource,
  upserted: number,
  channel: "api" | "server_fn",
) {
  await supabaseAdmin.from("phi_access_log").insert({
    user_id: userId,
    actor_id: userId,
    action: "write",
    resource_type: "biometrics",
    resource_id: null,
    metadata: { source, upserted, channel },
  });
}
