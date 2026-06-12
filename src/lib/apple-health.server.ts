/**
 * Apple Health server helpers.
 * Apple Health data reaches Purple two ways:
 *   1. Health Auto Export iOS app POSTs JSON to /api/public/hooks/apple-health
 *      with a per-user secret in the URL (recurring near-realtime sync).
 *   2. The user uploads export.xml on the import page; the browser parses
 *      it into daily aggregates and submits via applyAppleHealthBackfill.
 *
 * Both paths produce the same `DailyMetric[]` shape and funnel through
 * upsertAppleHealthDays so downstream invariants stay consistent.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** A single day's worth of metrics, already aggregated client-side or from HAE. */
export type DailyMetric = {
  /** ISO date (YYYY-MM-DD), interpreted as midnight UTC for recorded_at. */
  date: string;
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

/** Health Auto Export metric name -> our column. */
const HAE_METRIC_MAP: Record<string, keyof DailyMetric> = {
  heart_rate_variability: "hrv_rmssd_ms",
  resting_heart_rate: "resting_hr_bpm",
  heart_rate: "hr_bpm",
  respiratory_rate: "respiratory_rate_bpm",
  oxygen_saturation: "spo2_pct",
  apple_sleeping_wrist_temperature: "skin_temp_c",
  wrist_temperature: "skin_temp_c",
  step_count: "steps",
  active_energy: "active_calories",
  apple_exercise_time: "workout_minutes",
  vo2_max: "vo2_max",
};

/** Convert Health Auto Export's JSON payload into per-day rows. */
export function mapHealthAutoExportPayload(payload: unknown): DailyMetric[] {
  const root = (payload as { data?: { metrics?: unknown[] } })?.data;
  const metrics = Array.isArray(root?.metrics) ? root!.metrics : [];
  const byDay = new Map<string, DailyMetric>();

  const bumpAvg = (acc: { sum: number; n: number } | undefined, v: number) => {
    const next = acc ?? { sum: 0, n: 0 };
    next.sum += v;
    next.n += 1;
    return next;
  };
  const avgBuckets: Record<string, Map<string, { sum: number; n: number }>> = {};

  for (const raw of metrics) {
    const m = raw as {
      name?: string;
      data?: {
        qty?: number;
        date?: string;
        value?: string;
        sleepStart?: string;
        sleepEnd?: string;
        asleep?: number;
        inBed?: number;
      }[];
    };
    const name = String(m.name ?? "").toLowerCase();
    const col = HAE_METRIC_MAP[name];
    const samples = Array.isArray(m.data) ? m.data : [];

    if (name === "sleep_analysis") {
      for (const s of samples) {
        const day = (s.sleepEnd ?? s.date ?? "").slice(0, 10);
        if (!day) continue;
        const row = byDay.get(day) ?? { date: day };
        const asleepHrs = typeof s.asleep === "number" ? s.asleep : 0;
        if (asleepHrs > 0) row.sleep_total_min = (row.sleep_total_min ?? 0) + asleepHrs * 60;
        byDay.set(day, row);
      }
      continue;
    }

    if (!col) continue;

    for (const s of samples) {
      const day = (s.date ?? "").slice(0, 10);
      const qty = typeof s.qty === "number" ? s.qty : Number(s.qty);
      if (!day || !Number.isFinite(qty)) continue;
      const row = byDay.get(day) ?? { date: day };

      // Cumulative metrics: sum. Otherwise: average.
      if (col === "steps" || col === "active_calories" || col === "workout_minutes") {
        (row as Record<string, unknown>)[col] = ((row[col] as number | undefined) ?? 0) + qty;
      } else {
        avgBuckets[col] = avgBuckets[col] ?? new Map();
        const bucket = avgBuckets[col].get(day);
        avgBuckets[col].set(day, bumpAvg(bucket, qty));
      }
      byDay.set(day, row);
    }
  }

  // Apply averages.
  for (const [col, days] of Object.entries(avgBuckets)) {
    for (const [day, acc] of days) {
      const row = byDay.get(day) ?? { date: day };
      (row as Record<string, unknown>)[col] = acc.sum / acc.n;
      byDay.set(day, row);
    }
  }

  return Array.from(byDay.values());
}

/** Insert/update a batch of daily Apple Health rows for one user. */
export async function upsertAppleHealthDays(userId: string, days: DailyMetric[]) {
  if (days.length === 0) return { inserted: 0 };
  // Round numeric metrics so we don't store noise.
  const rows = days.map((d) => ({
    user_id: userId,
    source: "apple_health" as const,
    recorded_at: `${d.date}T00:00:00Z`,
    hrv_rmssd_ms: round(d.hrv_rmssd_ms, 1),
    resting_hr_bpm: round(d.resting_hr_bpm, 0),
    hr_bpm: round(d.hr_bpm, 0),
    respiratory_rate_bpm: round(d.respiratory_rate_bpm, 1),
    spo2_pct: round(d.spo2_pct, 1),
    skin_temp_c: round(d.skin_temp_c, 2),
    sleep_total_min: round(d.sleep_total_min, 0),
    sleep_rem_min: round(d.sleep_rem_min, 0),
    sleep_deep_min: round(d.sleep_deep_min, 0),
    sleep_awake_min: round(d.sleep_awake_min, 0),
    steps: d.steps == null ? null : Math.round(d.steps),
    active_calories: round(d.active_calories, 0),
    workout_minutes: round(d.workout_minutes, 0),
    vo2_max: round(d.vo2_max, 1),
    created_by_kind: "self" as const,
  }));

  // Delete any existing apple_health rows for these dates, then insert.
  // This keeps the row count stable across re-imports.
  const dates = rows.map((r) => r.recorded_at);
  await supabaseAdmin
    .from("biometrics")
    .delete()
    .eq("user_id", userId)
    .eq("source", "apple_health")
    .in("recorded_at", dates);

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error, count } = await supabaseAdmin
      .from("biometrics")
      .insert(slice, { count: "exact" });
    if (error) throw error;
    inserted += count ?? slice.length;
  }
  return { inserted };
}

function round(v: number | null | undefined, dp: number): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  const p = 10 ** dp;
  return Math.round(v * p) / p;
}

export async function findUserBySecret(secret: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("apple_health_tokens")
    .select("user_id")
    .eq("webhook_secret", secret)
    .maybeSingle();
  return data?.user_id ?? null;
}

/**
 * Timestamp semantics, kept honest:
 * - last_webhook_at: a webhook or test ping reached us (connection works)
 * - last_sync_at: health DATA was actually imported
 * Pings and empty payloads must not move last_sync_at, or the UI claims a
 * sync that never delivered anything.
 */
export async function touchAppleHealthSync(userId: string, kind: "ping" | "data" | "manual") {
  const stamp = new Date().toISOString();
  await supabaseAdmin
    .from("apple_health_tokens")
    .update(
      kind === "data"
        ? { last_webhook_at: stamp, last_sync_at: stamp }
        : kind === "ping"
          ? { last_webhook_at: stamp }
          : { last_sync_at: stamp },
    )
    .eq("user_id", userId);
}
