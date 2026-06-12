import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Medication intelligence, derived signals from the user's own meds &
 * dose history. Purely descriptive, no clinical advice. Used on /meds.
 */

export type RefillProjection = {
  medId: string;
  name: string;
  pillsRemaining: number;
  dosesPerDay: number;
  daysLeft: number;
  runoutDate: string; // ISO date
  threshold: number;
};

export type TimeBucket = "morning" | "midday" | "evening" | "night";

export type MissedPattern = {
  bucket: TimeBucket;
  missed: number;
  scheduled: number;
  pct: number;
};

export type MedIntelligence = {
  refills: RefillProjection[];
  streakDays: number;
  missedPattern: MissedPattern | null;
  onTimePct14d: number | null;
};

function bucketFor(hour: number): TimeBucket {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  if (hour < 22) return "evening";
  return "night";
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const getMedIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MedIntelligence> => {
    const { supabase, userId } = context;
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const since14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
    const since60 = new Date(now.getTime() - 60 * 24 * 3600 * 1000);

    const [{ data: meds }, { data: doses30 }] = await Promise.all([
      supabase
        .from("medications")
        .select(
          "id, name, times_of_day, pills_remaining, refill_threshold, is_rescue, kind, active",
        )
        .eq("user_id", userId)
        .eq("active", true),
      supabase
        .from("medication_doses")
        .select("id, scheduled_at, status, medication_id")
        .eq("user_id", userId)
        .gte("scheduled_at", since60.toISOString())
        .lte("scheduled_at", now.toISOString())
        .order("scheduled_at", { ascending: true }),
    ]);

    const medsList = (meds ?? []) as Array<{
      id: string;
      name: string;
      times_of_day: string[] | null;
      pills_remaining: number | null;
      refill_threshold: number | null;
      is_rescue: boolean;
      kind: string;
    }>;
    const doses = (doses30 ?? []) as Array<{
      scheduled_at: string;
      status: string;
      medication_id: string;
    }>;

    // --- Refill projections ---
    const refills: RefillProjection[] = [];
    for (const m of medsList) {
      if (m.is_rescue || m.kind === "rescue") continue;
      if (m.pills_remaining == null) continue;
      const dosesPerDay = Math.max(1, (m.times_of_day ?? []).length || 1);
      const daysLeft = Math.max(0, Math.floor(m.pills_remaining / dosesPerDay));
      const runout = new Date(now.getTime() + daysLeft * 24 * 3600 * 1000);
      refills.push({
        medId: m.id,
        name: m.name,
        pillsRemaining: m.pills_remaining,
        dosesPerDay,
        daysLeft,
        runoutDate: dayKey(runout),
        threshold: m.refill_threshold ?? 7,
      });
    }
    refills.sort((a, b) => a.daysLeft - b.daysLeft);

    // --- On-time pct (14d), independent of existing card, used for digest. ---
    const recent14 = doses.filter((d) => new Date(d.scheduled_at) >= since14);
    const total14 = recent14.length;
    const taken14 = recent14.filter((d) => d.status === "taken").length;
    const onTimePct14d = total14 === 0 ? null : Math.round((taken14 / total14) * 100);

    // --- Adherence streak ---
    // Walk back from yesterday (today may still have pending doses); count
    // days where every scheduled dose with status != 'pending' was taken.
    const dosesByDay = new Map<string, Array<{ status: string; scheduledAt: Date }>>();
    for (const d of doses) {
      const dt = new Date(d.scheduled_at);
      const key = dayKey(dt);
      const arr = dosesByDay.get(key) ?? [];
      arr.push({ status: d.status, scheduledAt: dt });
      dosesByDay.set(key, arr);
    }
    let streak = 0;
    const cursor = new Date(now);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    cursor.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const k = dayKey(cursor);
      const list = dosesByDay.get(k) ?? [];
      if (list.length === 0) {
        // No scheduled doses → don't break streak, but also don't count.
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      }
      const allTaken = list.every((d) => d.status === "taken");
      if (!allTaken) break;
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // --- Missed-dose time pattern (30d) ---
    const recent30 = doses.filter((d) => new Date(d.scheduled_at) >= since30);
    const buckets: Record<TimeBucket, { missed: number; scheduled: number }> = {
      morning: { missed: 0, scheduled: 0 },
      midday: { missed: 0, scheduled: 0 },
      evening: { missed: 0, scheduled: 0 },
      night: { missed: 0, scheduled: 0 },
    };
    for (const d of recent30) {
      const b = bucketFor(new Date(d.scheduled_at).getHours());
      buckets[b].scheduled += 1;
      if (d.status === "missed" || d.status === "skipped") buckets[b].missed += 1;
    }
    let pattern: MissedPattern | null = null;
    for (const [bucket, v] of Object.entries(buckets) as Array<
      [TimeBucket, { missed: number; scheduled: number }]
    >) {
      if (v.scheduled < 6 || v.missed < 3) continue;
      const pct = v.missed / v.scheduled;
      if (pct < 0.4) continue;
      // Check other buckets are calmer.
      const others = (
        Object.entries(buckets) as Array<[TimeBucket, { missed: number; scheduled: number }]>
      )
        .filter(([k]) => k !== bucket)
        .filter(([, x]) => x.scheduled >= 3);
      const allOthersLower = others.every(
        ([, x]) => x.missed / Math.max(1, x.scheduled) < pct - 0.15,
      );
      if (!allOthersLower) continue;
      if (!pattern || pct > pattern.pct) {
        pattern = { bucket, missed: v.missed, scheduled: v.scheduled, pct: Math.round(pct * 100) };
      }
    }

    return { refills, streakDays: streak, missedPattern: pattern, onTimePct14d };
  });
