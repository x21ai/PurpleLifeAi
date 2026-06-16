import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIForUser } from "./ai-provider.server";
import { loadAndDerivePatternCards } from "./insights-patterns.functions";

/**
 * Latest known wearable / biometric scores for the Vitals and My Health
 * screens. Every field is null when the user has no data for it, so the UI can
 * fall back to clearly labelled demo values rather than inventing numbers.
 */
export type ScoreSnapshot = {
  readiness: number | null;
  sleepScore: number | null;
  activity: number | null;
  stress: number | null;
  hrvMs: number | null;
  restingHr: number | null;
  vo2max: number | null;
  spo2: number | null;
  steps: number | null;
  stepsAvg30: number | null;
  stepsAvg60: number | null;
  latestAt: string | null;
  /** True when at least one biometric row exists in the lookback window. */
  hasData: boolean;
};

type ScoreRow = {
  recorded_at: string;
  oura_readiness_score: number | null;
  sleep_score: number | null;
  oura_activity_score: number | null;
  oura_stress_score: number | null;
  hrv_rmssd_ms: number | null;
  resting_hr_bpm: number | null;
  vo2_max: number | null;
  spo2_pct: number | null;
  steps: number | null;
};

const DAY_MS = 24 * 3600 * 1000;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export const getScoreSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScoreSnapshot> => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 60 * DAY_MS).toISOString();

    const { data } = await supabase
      .from("biometrics")
      .select(
        "recorded_at, oura_readiness_score, sleep_score, oura_activity_score, oura_stress_score, hrv_rmssd_ms, resting_hr_bpm, vo2_max, spo2_pct, steps",
      )
      .eq("user_id", userId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(200);

    const rows = (data as ScoreRow[] | null) ?? [];

    const latest = <K extends keyof ScoreRow>(key: K): number | null => {
      for (const row of rows) {
        const value = row[key];
        if (value != null) return Number(value);
      }
      return null;
    };

    const now = Date.now();
    const stepsWithin = (days: number): number[] =>
      rows
        .filter(
          (r) => r.steps != null && now - new Date(r.recorded_at).getTime() <= days * DAY_MS,
        )
        .map((r) => Number(r.steps));

    return {
      readiness: latest("oura_readiness_score"),
      sleepScore: latest("sleep_score"),
      activity: latest("oura_activity_score"),
      stress: latest("oura_stress_score"),
      hrvMs: latest("hrv_rmssd_ms"),
      restingHr: latest("resting_hr_bpm"),
      vo2max: latest("vo2_max"),
      spo2: latest("spo2_pct"),
      steps: latest("steps"),
      stepsAvg30: average(stepsWithin(30)),
      stepsAvg60: average(stepsWithin(60)),
      latestAt: rows[0]?.recorded_at ?? null,
      hasData: rows.length > 0,
    };
  });

/**
 * A short, grounded health narrative for the My Health hero. Cached once per
 * day per user in `health_narratives` so the model is called at most daily.
 * Returns `demo: true` with a generic, non-fabricated line when there is not
 * enough real data to summarize.
 */
export type HealthNarrative = { narrative: string; demo: boolean };

const DEMO_NARRATIVE =
  "This is a sample overview. Once you connect a device or log a few days, Purple will summarize your real patterns here.";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const getHealthNarrative = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HealthNarrative> => {
    const { supabase, userId } = context;
    const day = todayKey();

    const { data: cached } = await supabase
      .from("health_narratives")
      .select("narrative")
      .eq("user_id", userId)
      .eq("day", day)
      .maybeSingle();
    if (cached?.narrative) {
      return { narrative: cached.narrative as string, demo: false };
    }

    const since = new Date(Date.now() - 60 * DAY_MS).toISOString();
    const [{ data: bio }, { data: profile }, cards] = await Promise.all([
      supabase
        .from("biometrics")
        .select(
          "recorded_at, sleep_score, oura_readiness_score, oura_activity_score, oura_stress_score, hrv_rmssd_ms, resting_hr_bpm, steps",
        )
        .eq("user_id", userId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false })
        .limit(120),
      supabase.from("profiles").select("conditions").eq("id", userId).maybeSingle(),
      loadAndDerivePatternCards(supabase, userId).catch(() => []),
    ]);

    const rows = (bio as Array<Record<string, number | string | null>> | null) ?? [];
    const hasData = rows.length > 0 || cards.length > 0;
    if (!hasData) {
      return { narrative: DEMO_NARRATIVE, demo: true };
    }

    const conditions = ((profile?.conditions as string[] | null) ?? []).join(", ") || "none recorded";
    const patternLines = cards.map((c) => `- ${c.title}: ${c.detail}`).join("\n");
    const recent = rows.slice(0, 14);
    const metricLines = recent
      .map((r) => {
        const parts: string[] = [];
        if (r.sleep_score != null) parts.push(`sleep ${r.sleep_score}`);
        if (r.oura_readiness_score != null) parts.push(`readiness ${r.oura_readiness_score}`);
        if (r.oura_activity_score != null) parts.push(`activity ${r.oura_activity_score}`);
        if (r.resting_hr_bpm != null) parts.push(`RHR ${r.resting_hr_bpm}`);
        if (r.hrv_rmssd_ms != null) parts.push(`HRV ${r.hrv_rmssd_ms}`);
        if (r.steps != null) parts.push(`${r.steps} steps`);
        const date = typeof r.recorded_at === "string" ? r.recorded_at.slice(0, 10) : "";
        return parts.length ? `${date}: ${parts.join(", ")}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const system =
      "You are Purple, a calm, careful health companion. Write a short overview (2 to 3 sentences, under 60 words) of the person's recent health balance. " +
      "Describe only what the data shows. Never invent numbers, never claim causation, never give medical advice or diagnoses. " +
      "Use plain, warm language. Do not use the em dash character.";
    const prompt =
      `Conditions: ${conditions}\n\n` +
      `Detected patterns:\n${patternLines || "(none detected)"}\n\n` +
      `Recent daily metrics (most recent first):\n${metricLines || "(no metrics)"}\n\n` +
      "Write the overview now.";

    let narrative: string;
    try {
      narrative = (await callAIForUser(supabase, userId, { system, prompt, maxTokens: 220 })).trim();
    } catch {
      // If the model is unavailable, fall back to the demo line rather than
      // surfacing an error or fabricating a summary.
      return { narrative: DEMO_NARRATIVE, demo: true };
    }
    if (!narrative) {
      return { narrative: DEMO_NARRATIVE, demo: true };
    }

    await supabase
      .from("health_narratives")
      .upsert({ user_id: userId, day, narrative }, { onConflict: "user_id,day" });

    return { narrative, demo: false };
  });
