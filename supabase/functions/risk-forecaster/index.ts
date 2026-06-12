import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const MODEL_VERSION = "v2-scorecard-2026.06";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

type Factor = {
  key: string;
  label: string;
  detail: string;
  weight: number;
};

type Band = "low" | "moderate" | "elevated" | "high";

function bandFor(score: number): Band {
  if (score <= 29) return "low";
  if (score <= 54) return "moderate";
  if (score <= 74) return "elevated";
  return "high";
}

function avg(nums: Array<number | null | undefined>): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

async function narrate(score: number, band: Band, factors: Factor[]): Promise<string> {
  const fallback = factors.length === 0
    ? "Things look steady today. Nothing standing out — just keep doing what you're doing."
    : "Your body's a bit off baseline this week. Nothing dramatic, just worth slowing down today.";

  if (!ANTHROPIC_API_KEY) return fallback;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system:
          "You are Purple. Reply in 1-2 warm, non-clinical sentences spoken to the person directly. Never give medical advice, never use clinical language, never alarm. Acknowledge what's actually shifting in their body in plain words. Example tone: 'Your sleep dropped a bit this week and your HRV is running below your usual. Nothing dramatic, just worth slowing down today.'",
        messages: [
          {
            role: "user",
            content: `Today's risk score: ${score} (band: ${band}).\nFactors that fired:\n${
              factors.length === 0
                ? "- none"
                : factors.map((f) => `- ${f.label}: ${f.detail}`).join("\n")
            }`,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("anthropic", res.status, await res.text());
      return fallback;
    }
    const data = await res.json();
    const text = (data?.content ?? [])
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text ?? "" : ""))
      .join("");
    if (typeof text === "string" && text.trim().length > 0) return text.trim();
    return fallback;
  } catch (err) {
    console.error("anthropic error", err);
    return fallback;
  }
}

async function runForUser(userId: string): Promise<{ ok: boolean; reason?: string; score?: number; band?: Band }> {
  const since14 = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const cutoffRecent = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const sincePrior7d = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

  const { data: bios, error: biosErr } = await admin
    .from("biometrics")
    .select("recorded_at, sleep_total_min, sleep_score, sleep_efficiency_pct, hrv_rmssd_ms, hr_bpm, resting_hr_bpm, oura_readiness_score, oura_stress_score, body_temp_deviation_c, menstrual_phase")
    .eq("user_id", userId)
    .gte("recorded_at", since14)
    .order("recorded_at", { ascending: true });

  if (biosErr) {
    console.error("biometrics fetch", userId, biosErr);
    return { ok: false, reason: "biometrics_fetch_failed" };
  }

  const rows = bios ?? [];
  const recent = rows.filter((r) => r.recorded_at >= cutoffRecent);
  const baseline = rows.filter((r) => r.recorded_at < cutoffRecent);

  if (baseline.length < 4) {
    return { ok: false, reason: "insufficient_baseline" };
  }

  const recentSleep = avg(recent.map((r) => r.sleep_total_min as number | null));
  const baselineSleep = avg(baseline.map((r) => r.sleep_total_min as number | null));
  const recentHrv = avg(recent.map((r) => r.hrv_rmssd_ms as number | null));
  const baselineHrv = avg(baseline.map((r) => r.hrv_rmssd_ms as number | null));
  const recentRestHr = avg(recent.map((r) => r.resting_hr_bpm as number | null));
  const baselineRestHr = avg(baseline.map((r) => r.resting_hr_bpm as number | null));
  const recentStress = avg(recent.map((r) => r.oura_stress_score as number | null));
  const baselineStress = avg(baseline.map((r) => r.oura_stress_score as number | null));
  const recentSleepScore = avg(recent.map((r) => r.sleep_score as number | null));
  const baselineSleepScore = avg(baseline.map((r) => r.sleep_score as number | null));
  const inLutealOrMenstrual = recent.some((r) => {
    const p = String(r.menstrual_phase ?? "").toLowerCase();
    return p === "luteal" || p === "menstrual";
  });
  const recentTempDevMax = Math.max(
    0,
    ...recent.map((r) => Math.abs(Number(r.body_temp_deviation_c ?? 0))),
  );
  const recentReadinessMin = recent
    .map((r) => r.oura_readiness_score as number | null)
    .filter((n): n is number => typeof n === "number")
    .reduce<number | null>((m, v) => (m === null || v < m ? v : m), null);

  const { data: doses, error: dosesErr } = await admin
    .from("medication_doses")
    .select("status")
    .eq("user_id", userId)
    .eq("status", "missed")
    .gte("scheduled_at", since48h);

  if (dosesErr) console.error("doses fetch", userId, dosesErr);
  const missed = doses?.length ?? 0;

  // Scorecard
  let score = 30;
  const factors: Factor[] = [];

  if (recentSleep !== null && baselineSleep !== null && recentSleep < baselineSleep - 60) {
    score += 15;
    factors.push({
      key: "sleep_deficit",
      label: "Sleep is short",
      detail: `You're averaging ${formatMin(recentSleep)} vs. your usual ${formatMin(baselineSleep)}.`,
      weight: 15,
    });
  }

  if (recentHrv !== null && baselineHrv !== null && recentHrv < baselineHrv * 0.85) {
    score += 15;
    factors.push({
      key: "hrv_drop",
      label: "HRV is running low",
      detail: `Heart-rate variability is about ${Math.round(((baselineHrv - recentHrv) / baselineHrv) * 100)}% below your baseline.`,
      weight: 15,
    });
  }

  if (recentTempDevMax > 0.4) {
    score += 10;
    factors.push({
      key: "temp_deviation",
      label: "Body temperature is off",
      detail: `Your skin temperature has drifted ${recentTempDevMax.toFixed(2)}°C from your normal.`,
      weight: 10,
    });
  }

  if (missed > 0) {
    const w = Math.min(20, missed * 10);
    score += w;
    factors.push({
      key: "missed_doses",
      label: missed === 1 ? "A missed dose" : `${missed} missed doses`,
      detail: `In the last 48 hours${missed >= 2 ? ", capped at +20 to the score" : ""}.`,
      weight: w,
    });
  }

  // v2: recent seizure pressure (last 7d vs prior 7d)
  const { data: seizures7d } = await admin
    .from("seizure_events")
    .select("started_at")
    .eq("user_id", userId)
    .gte("started_at", sincePrior7d);
  const sz = seizures7d ?? [];
  const szRecent = sz.filter((s) => s.started_at >= since7d).length;
  const szPrior = sz.length - szRecent;
  if (szRecent >= 2 || (szRecent > 0 && szRecent > szPrior)) {
    const w = Math.min(18, szRecent * 6);
    score += w;
    factors.push({
      key: "seizure_pressure",
      label: szRecent === 1 ? "Recent seizure" : `${szRecent} seizures this week`,
      detail:
        szPrior > 0
          ? `Up from ${szPrior} the week before.`
          : `None the week before — worth taking it easy.`,
      weight: w,
    });
  }

  // v2: aura signals in last 48h
  const { data: auras } = await admin
    .from("aura_events")
    .select("occurred_at, led_to_seizure")
    .eq("user_id", userId)
    .gte("occurred_at", since48h);
  const auraCount = auras?.length ?? 0;
  if (auraCount > 0) {
    const w = Math.min(14, 6 + auraCount * 2);
    score += w;
    factors.push({
      key: "recent_auras",
      label: auraCount === 1 ? "An aura in the last 48h" : `${auraCount} auras in the last 48h`,
      detail: "Auras are a signal your nervous system is more reactive right now.",
      weight: w,
    });
  }

  // v2: journal symptom signal — symptom-laden tags in last 3 days
  const SYMPTOM_TAGS = new Set([
    "headache","migraine","aura","poor_sleep","insomnia","stress","anxiety",
    "fatigue","exhaustion","missed_meds","nausea","dizzy","pain","mood_low",
    "overstimulated","sensory_overload","seizure_warning",
  ]);
  const { data: journal } = await admin
    .from("journal_entries")
    .select("captured_at, ai_tags")
    .eq("user_id", userId)
    .gte("captured_at", cutoffRecent);
  const symptomEntries = (journal ?? []).filter((j) => {
    const tags = (j.ai_tags as string[] | null) ?? [];
    return tags.some((t) => SYMPTOM_TAGS.has(String(t).toLowerCase()));
  }).length;
  if (symptomEntries >= 2) {
    const w = Math.min(10, symptomEntries * 3);
    score += w;
    factors.push({
      key: "journal_symptoms",
      label: "You've been noting symptoms",
      detail: `${symptomEntries} journal entries in the last 3 days mention symptoms.`,
      weight: w,
    });
  }

  if (recentReadinessMin !== null && recentReadinessMin < 70) {
    score += 8;
    factors.push({
      key: "oura_readiness_low",
      label: "Oura readiness is low",
      detail: `Your ring read ${Math.round(recentReadinessMin)} in the last few days.`,
      weight: 8,
    });
  }

  if (recentRestHr !== null && baselineRestHr !== null && recentRestHr > baselineRestHr + 5) {
    score += 8;
    factors.push({
      key: "resting_hr_up",
      label: "Resting heart rate is up",
      detail: `Averaging ${Math.round(recentRestHr)} bpm vs. your usual ${Math.round(baselineRestHr)}.`,
      weight: 8,
    });
  }

  if (recentStress !== null && baselineStress !== null && recentStress > baselineStress + 15) {
    score += 8;
    factors.push({
      key: "stress_spike",
      label: "Stress is running higher",
      detail: `Stress score around ${Math.round(recentStress)} vs. baseline ${Math.round(baselineStress)}.`,
      weight: 8,
    });
  }

  if (
    recentSleepScore !== null &&
    baselineSleepScore !== null &&
    recentSleepScore < baselineSleepScore - 10
  ) {
    score += 6;
    factors.push({
      key: "sleep_quality_drop",
      label: "Sleep quality is down",
      detail: `Sleep score around ${Math.round(recentSleepScore)} vs. ${Math.round(baselineSleepScore)}.`,
      weight: 6,
    });
  }

  if (inLutealOrMenstrual) {
    score += 4;
    factors.push({
      key: "cycle_phase",
      label: "Cycle phase to watch",
      detail: "You're in a phase some people report as more sensitive.",
      weight: 4,
    });
  }

  score = Math.max(0, Math.min(100, score));
  const band = bandFor(score);

  const narrative = await narrate(score, band, factors);

  // for_date is the USER'S calendar day, not the server's UTC day; a UTC key
  // serves yesterday's forecast all morning in UTC+10 and tomorrow's all
  // evening in UTC-8.
  const { data: profileTz } = await admin
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const tz = (profileTz?.timezone as string | null) || "UTC";
  let today: string;
  try {
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    today = new Date().toISOString().slice(0, 10);
  }

  const { error: upsertErr } = await admin
    .from("risk_forecasts")
    .upsert(
      {
        user_id: userId,
        for_date: today,
        risk_score: score,
        band,
        top_factors: factors,
        ai_narrative: narrative,
        model_version: MODEL_VERSION,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,for_date" },
    );

  if (upsertErr) {
    console.error("forecast upsert", userId, upsertErr);
    return { ok: false, reason: "upsert_failed" };
  }

  if (band === "elevated" || band === "high") {
    await admin.from("alerts").insert({
      user_id: userId,
      kind: "risk_forecast",
      severity: band === "high" ? "warning" : "info",
      title: band === "high" ? "Today reads high" : "Today reads elevated",
      body: narrative,
    });
  }

  // Gentle stacked pre-seizure nudge: fires when >=2 signals stack the same day.
  // Hard rate limits: max 1 per 24h, suppressed if a seizure was logged in last 12h.
  if (factors.length >= 2) {
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const since12h = new Date(Date.now() - 12 * 3600 * 1000).toISOString();

    const [{ data: recentAlerts }, { data: recentSeizures }] = await Promise.all([
      admin
        .from("alerts")
        .select("id")
        .eq("user_id", userId)
        .eq("kind", "pre_seizure_stack")
        .gte("created_at", since24h)
        .limit(1),
      admin
        .from("seizure_events")
        .select("id")
        .eq("user_id", userId)
        .gte("started_at", since12h)
        .limit(1),
    ]);

    if ((recentAlerts?.length ?? 0) === 0 && (recentSeizures?.length ?? 0) === 0) {
      const stackCount = factors.length;
      const stackSeverity = stackCount >= 4 ? "warning" : "info";
      const headline =
        stackCount >= 4
          ? "A few signals are stacking today"
          : "A couple of signals are nudging today";
      const top = factors
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((f) => `• ${f.label} — ${f.detail}`)
        .join("\n");
      const body =
        `${top}\n\nNothing to be alarmed about — just worth slowing down, hydrating, and being gentle with yourself today.`;
      await admin.from("alerts").insert({
        user_id: userId,
        kind: "pre_seizure_stack",
        severity: stackSeverity,
        title: headline,
        body,
      });
    }
  }

  return { ok: true, score, band };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // AuthN: this function is internal-only — invoked by the cron hook with
    // the service-role key. Reject any other caller to prevent unauthenticated
    // reads of biometric data and injection of fake risk alerts.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!SERVICE_ROLE || token !== SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action: string = body?.action ?? "run-all";

    if (action === "run-user") {
      const userId = body?.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await runForUser(userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // run-all
    const { data: profiles, error } = await admin.from("profiles").select("id");
    if (error) throw error;

    const results: Array<{ user_id: string; ok: boolean; reason?: string; score?: number; band?: Band }> = [];
    for (const p of profiles ?? []) {
      const r = await runForUser(p.id);
      results.push({ user_id: p.id, ...r });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        model_version: MODEL_VERSION,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("risk-forecaster error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
