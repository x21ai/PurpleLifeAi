import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PatternCard = {
  key: string;
  title: string;
  detail: string;
  /** "supportive" = positive/steady; "watch" = worth noting; "info" = neutral. */
  tone: "supportive" | "watch" | "info";
  evidence?: string;
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function addDayKey(d: string, delta: number): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/**
 * Cross-signal pattern detection — purely descriptive heuristics over the
 * user's last 90 days of biometrics, seizures, journal entries, and missed
 * doses. We never claim causation; cards always say "appears" / "noticed".
 */
export const computeUserPatterns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const cards = await loadAndDerivePatternCards(supabase, userId);
    return { cards };
  });

type AnyClient = {
  from: (t: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        gte: (col: string, val: string) => Promise<{ data: unknown[] | null }>;
      };
    };
  };
};

/** Server-side helper that other server functions can reuse (e.g. PDF reports). */
export async function loadAndDerivePatternCards(
  supabase: AnyClient,
  userId: string,
  daysBack = 90,
): Promise<PatternCard[]> {
  const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString();
  const [biosRes, szRes, journalRes, dosesRes] = await Promise.all([
    supabase.from("biometrics")
      .select("recorded_at, sleep_total_min, hrv_rmssd_ms, resting_hr_bpm")
      .eq("user_id", userId).gte("recorded_at", since),
    supabase.from("seizure_events")
      .select("started_at, severity")
      .eq("user_id", userId).gte("started_at", since),
    supabase.from("journal_entries")
      .select("captured_at, ai_tags")
      .eq("user_id", userId).gte("captured_at", since),
    supabase.from("medication_doses")
      .select("scheduled_at, status")
      .eq("user_id", userId).gte("scheduled_at", since),
  ]);
  return derivePatternCards({
    bios: (biosRes.data as PatternBio[] | null) ?? [],
    sz: (szRes.data as PatternSeizure[] | null) ?? [],
    journal: (journalRes.data as PatternJournal[] | null) ?? [],
    doses: (dosesRes.data as PatternDose[] | null) ?? [],
  });
}

type PatternBio = { recorded_at: string; sleep_total_min: number | null; hrv_rmssd_ms: number | null; resting_hr_bpm: number | null };
type PatternSeizure = { started_at: string; severity: number | null };
type PatternJournal = { captured_at: string; ai_tags: string[] | null };
type PatternDose = { scheduled_at: string; status: string | null };

export function derivePatternCards(input: {
  bios: PatternBio[];
  sz: PatternSeizure[];
  journal: PatternJournal[];
  doses: PatternDose[];
}): PatternCard[] {
  const { bios, sz, journal, doses } = input;
    // Day → sleep minutes
    const sleepByDay = new Map<string, number>();
    for (const b of bios) {
      if (typeof b.sleep_total_min === "number") {
        sleepByDay.set(dayKey(b.recorded_at), b.sleep_total_min);
      }
    }
    const seizureDays = new Set(sz.map((s) => dayKey(s.started_at)));
    const missedDays = new Set(
      doses.filter((d) => d.status === "missed").map((d) => dayKey(d.scheduled_at)),
    );

    const cards: PatternCard[] = [];

    // --- Pattern 1: short-sleep nights vs next-day seizures
    if (sleepByDay.size >= 14 && seizureDays.size >= 2) {
      const sleepVals = Array.from(sleepByDay.values()).sort((a, b) => a - b);
      const lowCutoff = sleepVals[Math.floor(sleepVals.length * 0.25)] ?? 0;
      let lowDays = 0;
      let lowFollowedBySz = 0;
      let normalDays = 0;
      let normalFollowedBySz = 0;
      for (const [day, mins] of sleepByDay) {
        const next = addDayKey(day, 1);
        const hadSz = seizureDays.has(next);
        if (mins <= lowCutoff) {
          lowDays++;
          if (hadSz) lowFollowedBySz++;
        } else {
          normalDays++;
          if (hadSz) normalFollowedBySz++;
        }
      }
      const lowRate = lowDays > 0 ? lowFollowedBySz / lowDays : 0;
      const normalRate = normalDays > 0 ? normalFollowedBySz / normalDays : 0;
      if (lowDays >= 3 && lowRate > normalRate * 1.5 && lowFollowedBySz >= 2) {
        const pct = Math.round((lowRate - normalRate) * 100);
        cards.push({
          key: "short_sleep_then_seizure",
          title: "Short-sleep nights appear before seizure days",
          detail:
            `On your lowest-sleep nights, the next day had a seizure about ${Math.round(
              lowRate * 100,
            )}% of the time vs ${Math.round(normalRate * 100)}% on typical nights.`,
          tone: "watch",
          evidence: `Last 90 days · ${lowFollowedBySz}/${lowDays} short-sleep days followed by an event`,
        });
      } else if (lowDays >= 5 && lowRate <= normalRate) {
        cards.push({
          key: "sleep_no_signal",
          title: "Short sleep isn't lining up with seizure days",
          detail:
            "Across the last 90 days, low-sleep nights aren't reliably followed by events. Sleep still matters — it's just not the strongest signal for you.",
          tone: "info",
        });
      }
    }

    // --- Pattern 2: missed doses within 48h of seizure
    if (sz.length >= 2 && missedDays.size > 0) {
      let szWithRecentMissed = 0;
      for (const s of sz) {
        const d0 = dayKey(s.started_at);
        const d1 = addDayKey(d0, -1);
        const d2 = addDayKey(d0, -2);
        if (missedDays.has(d0) || missedDays.has(d1) || missedDays.has(d2)) {
          szWithRecentMissed++;
        }
      }
      const ratio = szWithRecentMissed / sz.length;
      if (ratio >= 0.4 && szWithRecentMissed >= 2) {
        cards.push({
          key: "missed_dose_before_seizure",
          title: "Missed doses tend to land close to events",
          detail: `${szWithRecentMissed} of your last ${sz.length} seizures came within 48 hours of a missed dose.`,
          tone: "watch",
          evidence: "A rescue-med or reminder tweak might help.",
        });
      }
    }

    // --- Pattern 3: weekday clustering
    if (sz.length >= 6) {
      const byDow = [0, 0, 0, 0, 0, 0, 0];
      for (const s of sz) byDow[new Date(s.started_at).getDay()]++;
      const max = Math.max(...byDow);
      const total = sz.length;
      const maxDow = byDow.indexOf(max);
      if (max / total >= 0.3) {
        const names = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
        cards.push({
          key: "weekday_cluster",
          title: `${names[maxDow]} show up more in your seizure log`,
          detail: `${max} of your last ${total} seizures happened on a ${names[maxDow].slice(0, -1)}.`,
          tone: "info",
        });
      }
    }

    // --- Pattern 4: symptom journaling streak
    const SYMPTOMS = new Set([
      "headache","migraine","aura","poor_sleep","insomnia","stress","anxiety",
      "fatigue","missed_meds","nausea","dizzy","pain","mood_low","overstimulated",
    ]);
    const symDays = new Set<string>();
    for (const j of journal) {
      const tags = (j.ai_tags as string[] | null) ?? [];
      if (tags.some((t) => SYMPTOMS.has(String(t).toLowerCase()))) {
        symDays.add(dayKey(j.captured_at));
      }
    }
    const last14 = new Set<string>();
    for (let i = 0; i < 14; i++) {
      last14.add(dayKey(new Date(Date.now() - i * 86400000).toISOString()));
    }
    const symLast14 = Array.from(symDays).filter((d) => last14.has(d)).length;
    if (symLast14 >= 5) {
      cards.push({
        key: "symptom_journal_streak",
        title: "You've been logging symptoms more often",
        detail: `${symLast14} of the last 14 days had a journal entry mentioning a symptom. Worth flagging at your next appointment.`,
        tone: "watch",
      });
    } else if (sleepByDay.size >= 10 && symDays.size === 0 && sz.length === 0) {
      cards.push({
        key: "steady_window",
        title: "Last 90 days have been steady",
        detail: "No seizures logged and no symptom-heavy journal entries. That's worth noticing.",
        tone: "supportive",
      });
    }

    // --- Pattern 5: top recurring triggers in journal tags (last 30d)
    const TRIGGER_TAGS = new Set([
      "stress","poor_sleep","insomnia","missed_meds","alcohol","caffeine",
      "menstrual","heat","dehydration","flashing_lights","overstimulated",
      "screen_time","skipped_meal","travel","illness",
    ]);
    const since30 = Date.now() - 30 * 86400000;
    const triggerCounts = new Map<string, number>();
    for (const j of journal) {
      if (new Date(j.captured_at).getTime() < since30) continue;
      const tags = (j.ai_tags as string[] | null) ?? [];
      for (const t of tags) {
        const k = String(t).toLowerCase();
        if (TRIGGER_TAGS.has(k)) triggerCounts.set(k, (triggerCounts.get(k) ?? 0) + 1);
      }
    }
    const topTriggers = Array.from(triggerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topTriggers.length > 0 && topTriggers[0][1] >= 3) {
      const pretty = (s: string) => s.replace(/_/g, " ");
      cards.push({
        key: "top_triggers_30d",
        title: "Recurring triggers in your journal",
        detail:
          "Over the last 30 days you've mentioned " +
          topTriggers
            .map(([k, n]) => `${pretty(k)} (${n}×)`)
            .join(", ") +
          ". Worth a glance with your clinician.",
        tone: "info",
        evidence: "Tagged in your own entries",
      });
    }

    // --- Pattern 6: time-of-day clustering for seizures
    if (sz.length >= 6) {
      const buckets = [0, 0, 0, 0]; // night 0-6, morning 6-12, afternoon 12-18, evening 18-24
      for (const s of sz) {
        const h = new Date(s.started_at).getHours();
        buckets[Math.min(3, Math.floor(h / 6))]++;
      }
      const labels = ["overnight (12am–6am)", "morning (6am–12pm)", "afternoon (12pm–6pm)", "evening (6pm–12am)"];
      const maxIdx = buckets.indexOf(Math.max(...buckets));
      const share = buckets[maxIdx] / sz.length;
      if (share >= 0.45) {
        cards.push({
          key: "time_of_day_cluster",
          title: `Events cluster ${labels[maxIdx]}`,
          detail: `${buckets[maxIdx]} of your last ${sz.length} seizures happened ${labels[maxIdx]}. A timing-aware med schedule or sleep check may help.`,
          tone: "watch",
        });
      }
    }

    return { cards };
  });