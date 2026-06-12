import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dateKeyInTimeZone } from "@/lib/utils";

/**
 * 7-day trend strip, descriptive snapshot of sleep, HRV, and adherence
 * over the past week. Used on Today as a quick risk-context card.
 */

export type DayPoint = {
  date: string; // YYYY-MM-DD
  sleepMin: number | null;
  hrvMs: number | null;
  missedDoses: number;
};

export type SevenDayTrends = {
  days: DayPoint[];
  sleepAvgMin: number | null;
  sleepDebtMin: number | null; // (target * 7) - sum(sleep) if all 7 days present
  hrvAvgMs: number | null;
  hrvDelta14d: number | null; // 7d avg minus prior 7d avg
  missedDoses: number;
};

const SLEEP_TARGET_MIN = 7.5 * 60;

export const getSevenDayTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SevenDayTrends> => {
    const { supabase, userId } = context;
    const now = new Date();
    const since14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    // Day buckets follow the USER'S calendar (server runs in UTC; UTC keys
    // shift missed doses and sleep onto the wrong bar for non-UTC users).
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const tz = profileRow?.timezone || "UTC";
    const dayKey = (d: Date): string => dateKeyInTimeZone(d, tz);

    const [{ data: bios14 }, { data: doses }] = await Promise.all([
      supabase
        .from("biometrics")
        .select("recorded_at, sleep_total_min, hrv_rmssd_ms")
        .eq("user_id", userId)
        .gte("recorded_at", since14.toISOString())
        .order("recorded_at", { ascending: true }),
      supabase
        .from("medication_doses")
        .select("scheduled_at, status")
        .eq("user_id", userId)
        .gte("scheduled_at", since7.toISOString())
        .lte("scheduled_at", now.toISOString()),
    ]);

    const bios = (bios14 ?? []) as Array<{
      recorded_at: string;
      sleep_total_min: number | null;
      hrv_rmssd_ms: number | null;
    }>;
    const dosesArr = (doses ?? []) as Array<{ scheduled_at: string; status: string }>;

    // Reduce to one row per day (max sleep, max hrv).
    const byDay = new Map<string, { sleep: number | null; hrv: number | null }>();
    for (const b of bios) {
      const k = dayKey(new Date(b.recorded_at));
      const prev = byDay.get(k) ?? { sleep: null, hrv: null };
      if (b.sleep_total_min != null && (prev.sleep == null || b.sleep_total_min > prev.sleep)) {
        prev.sleep = b.sleep_total_min;
      }
      if (b.hrv_rmssd_ms != null && (prev.hrv == null || b.hrv_rmssd_ms > prev.hrv)) {
        prev.hrv = b.hrv_rmssd_ms;
      }
      byDay.set(k, prev);
    }

    const missedByDay = new Map<string, number>();
    for (const d of dosesArr) {
      if (d.status !== "missed" && d.status !== "skipped") continue;
      const k = dayKey(new Date(d.scheduled_at));
      missedByDay.set(k, (missedByDay.get(k) ?? 0) + 1);
    }

    // Build 7-day window (oldest -> today), stepping in 24h increments and
    // deduping on the user-local day key.
    const days: DayPoint[] = [];
    const seen = new Set<string>();
    for (let i = 6; i >= 0; i--) {
      const k = dayKey(new Date(now.getTime() - i * 24 * 3600 * 1000));
      if (seen.has(k)) continue;
      seen.add(k);
      const row = byDay.get(k);
      days.push({
        date: k,
        sleepMin: row?.sleep ?? null,
        hrvMs: row?.hrv ?? null,
        missedDoses: missedByDay.get(k) ?? 0,
      });
    }

    const sleeps7 = days.map((d) => d.sleepMin).filter((v): v is number => v != null);
    const sleepAvgMin = sleeps7.length
      ? Math.round(sleeps7.reduce((a, b) => a + b, 0) / sleeps7.length)
      : null;
    const sleepDebtMin =
      sleeps7.length === 7
        ? Math.max(0, Math.round(SLEEP_TARGET_MIN * 7 - sleeps7.reduce((a, b) => a + b, 0)))
        : null;

    const hrvs7 = days.map((d) => d.hrvMs).filter((v): v is number => v != null);
    const hrvAvgMs = hrvs7.length
      ? Math.round(hrvs7.reduce((a, b) => a + b, 0) / hrvs7.length)
      : null;

    // Prior 7d window for delta
    const prior: number[] = [];
    for (const b of bios) {
      const t = new Date(b.recorded_at).getTime();
      if (t < since14.getTime() || t >= since7.getTime()) continue;
      if (b.hrv_rmssd_ms != null) prior.push(b.hrv_rmssd_ms);
    }
    const hrvPriorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : null;
    const hrvDelta14d =
      hrvAvgMs != null && hrvPriorAvg != null ? Math.round(hrvAvgMs - hrvPriorAvg) : null;

    const missedDoses = days.reduce((a, d) => a + d.missedDoses, 0);

    return {
      days,
      sleepAvgMin,
      sleepDebtMin,
      hrvAvgMs,
      hrvDelta14d,
      missedDoses,
    };
  });
