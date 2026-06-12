import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { dateKeyInTimeZone } from "@/lib/utils";

/**
 * Weekly journal recap, last 7 days at a glance.
 * Counts entries, mines simple trigger keywords from text/voice transcript,
 * rolls up top ai_tags, plus seizure & missed-dose counts.
 * Purely descriptive, no clinical advice.
 */

export type WeeklyRecap = {
  rangeDays: number;
  entryCount: number;
  voiceCount: number;
  topTags: Array<{ tag: string; count: number }>;
  triggers: Array<{ key: string; label: string; count: number }>;
  seizureCount: number;
  missedDoses: number;
  streakDays: number; // consecutive days ending today with ≥1 entry
};

const TRIGGER_PATTERNS: Array<{ key: string; label: string; rx: RegExp }> = [
  {
    key: "sleep",
    label: "Sleep changes",
    rx: /\b(poor sleep|bad sleep|insomnia|woke up|couldn'?t sleep|tired|exhausted|nap)\b/i,
  },
  {
    key: "stress",
    label: "Stress",
    rx: /\b(stress|anxious|anxiety|overwhelmed|panicked|worried)\b/i,
  },
  { key: "hydration", label: "Hydration", rx: /\b(dehydrat|thirsty|forgot to drink|low water)\b/i },
  {
    key: "skipped_meal",
    label: "Skipped meal",
    rx: /\b(skipped (?:a )?meal|didn'?t eat|forgot to eat|low blood sugar)\b/i,
  },
  { key: "alcohol", label: "Alcohol", rx: /\b(beer|wine|cocktail|drank|hangover|alcohol)\b/i },
  {
    key: "screens_light",
    label: "Screens/light",
    rx: /\b(screen time|too much screen|flashing|strobe|bright light|fluorescent)\b/i,
  },
  { key: "heat", label: "Heat", rx: /\b(too hot|heat|overheated|hot weather|humid)\b/i },
  {
    key: "missed_dose",
    label: "Missed dose",
    rx: /\b(missed (?:a )?dose|forgot (?:my )?med|skipped (?:my )?med)\b/i,
  },
  { key: "period", label: "Menstrual cycle", rx: /\b(period|menstru|cycle|pms|cramps)\b/i },
  {
    key: "weather",
    label: "Weather change",
    rx: /\b(barometric|pressure change|storm|weather chang)\b/i,
  },
  { key: "caffeine", label: "Caffeine", rx: /\b(coffee|caffeine|espresso|energy drink)\b/i },
  { key: "exercise", label: "Exercise", rx: /\b(workout|ran|run|gym|hike|exercise)\b/i },
];

export const getWeeklyJournalRecap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyRecap> => {
    const { supabase, userId } = context;
    const now = new Date();

    // Streak days are the USER'S calendar days. This runs on the server (UTC),
    // so UTC day keys would break streaks for evening entries in most of the
    // world. Resolve days in the profile timezone instead.
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const tz = profileRow?.timezone || "UTC";
    const dayKey = (d: Date): string => dateKeyInTimeZone(d, tz);
    const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const sinceIso = since.toISOString();

    const [{ data: entries }, { data: seizures }, { data: doses }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id, captured_at, text, voice_transcript, ai_tags, kind")
        .eq("user_id", userId)
        .is("archived_at", null)
        .gte("captured_at", sinceIso),
      supabase
        .from("seizure_events")
        .select("id")
        .eq("user_id", userId)
        .gte("started_at", sinceIso),
      supabase
        .from("medication_doses")
        .select("id, status")
        .eq("user_id", userId)
        .gte("scheduled_at", sinceIso)
        .lte("scheduled_at", now.toISOString()),
    ]);

    const entryList = (entries ?? []) as Array<{
      captured_at: string;
      text: string | null;
      voice_transcript: string | null;
      ai_tags: string[] | null;
      kind: string;
    }>;

    // Tag rollup
    const tagCounts = new Map<string, number>();
    for (const e of entryList) {
      for (const t of e.ai_tags ?? []) {
        if (!t) continue;
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trigger keyword mining
    const triggerCounts = new Map<string, number>();
    for (const e of entryList) {
      const blob = `${e.text ?? ""} ${e.voice_transcript ?? ""}`;
      if (!blob.trim()) continue;
      for (const p of TRIGGER_PATTERNS) {
        if (p.rx.test(blob)) {
          triggerCounts.set(p.key, (triggerCounts.get(p.key) ?? 0) + 1);
        }
      }
    }
    const triggers = TRIGGER_PATTERNS.filter((p) => triggerCounts.has(p.key))
      .map((p) => ({ key: p.key, label: p.label, count: triggerCounts.get(p.key)! }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Streak (consecutive user-local days ending today with ≥1 entry)
    const daySet = new Set(entryList.map((e) => dayKey(new Date(e.captured_at))));
    let streak = 0;
    const cur = new Date(now);
    for (let i = 0; i < 7; i++) {
      if (daySet.has(dayKey(cur))) {
        streak += 1;
        cur.setTime(cur.getTime() - 24 * 3600 * 1000);
      } else {
        break;
      }
    }

    const dosesArr = (doses ?? []) as Array<{ status: string }>;
    const missedDoses = dosesArr.filter(
      (d) => d.status === "missed" || d.status === "skipped",
    ).length;
    const voiceCount = entryList.filter((e) => (e.voice_transcript ?? "").trim().length > 0).length;

    return {
      rangeDays: 7,
      entryCount: entryList.length,
      voiceCount,
      topTags,
      triggers,
      seizureCount: (seizures ?? []).length,
      missedDoses,
      streakDays: streak,
    };
  });
