import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generateText, Output } from "ai";
import { resolvePlatformModel } from "@/lib/ai-gateway.server";
import { callAIForUser, tryParseJson } from "@/lib/ai-provider.server";

/**
 * Flutter-callable mirrors of the AI insight server functions defined in
 * `src/lib/reports.functions.ts` (`summarizeReport`) and
 * `src/lib/report-trends.functions.ts` (`getMetricInsight`,
 * `getDailyInsightCards`). Those are TanStack `createServerFn` RPCs reachable
 * only from the web client; these plain functions take an already
 * user-scoped Supabase client (RLS enforces ownership) plus an explicit
 * `userId` so they can be called from the Worker JSON routes under
 * `src/routes/api/ai/*` (see `care.server.ts` / `care/accept.ts` for the
 * established pattern). Keep the prompts/logic here in sync with the
 * `*.functions.ts` originals if either changes.
 */

export class AiInsightsApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AiInsightsApiError";
    this.status = status;
  }
}

/** Phase 4: on-demand plain-English AI explanation of a report document. */
export async function summarizeReportForUser(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
  force: boolean,
) {
  const { data: doc, error } = await supabase
    .from("report_documents")
    .select(
      "id, user_id, title, report_type, report_date, report_category, summary, findings, impressions, ai_summary, ai_summary_at",
    )
    .eq("id", reportId)
    .maybeSingle();
  if (error || !doc) throw new AiInsightsApiError("Report not found", 404);

  if (!force && doc.ai_summary) {
    return { ok: true, cached: true, summary: doc.ai_summary };
  }

  const { data: metrics } = await supabase
    .from("report_metrics")
    .select(
      "metric_key, display_name, value, value_text, unit, reference_low, reference_high, flag",
    )
    .eq("report_id", doc.id);

  const metricLines = (metrics ?? [])
    .map((m) => {
      const v =
        m.value != null ? `${m.value}${m.unit ? ` ${m.unit}` : ""}` : (m.value_text ?? ",");
      const range =
        m.reference_low != null && m.reference_high != null
          ? ` (ref ${m.reference_low}\u2013${m.reference_high}${m.unit ? ` ${m.unit}` : ""})`
          : "";
      const flag = m.flag && m.flag !== "normal" ? ` [${m.flag.toUpperCase()}]` : "";
      return `- ${m.display_name ?? m.metric_key}: ${v}${range}${flag}`;
    })
    .join("\n");

  const system = `You are explaining a medical report to a patient in calm, plain English.
You are NOT a doctor. Never diagnose, prescribe, or recommend treatments. Stay factual.
Tone: gentle, respectful of the reader's energy. No alarmism.

Return ONLY a JSON object with this shape:
{
  "headline": "One short sentence summarising the report in plain English (max 140 chars).",
  "explanation": "2-4 sentences explaining what this report measures and what the results suggest in context. Plain English, no jargon unless defined inline.",
  "flagged": [
    { "metric": "LDL Cholesterol", "value": "164 mg/dL", "concern": "Above the typical reference range.", "severity": "watch" }
  ],
  "questions": ["Up to 3 short questions the reader could bring up with their clinician."]
}

severity must be one of: "info" | "watch" | "attention".
Only include items in "flagged" that are actually out of range or otherwise notable.
If there are no notable values, return flagged: [].`;

  const prompt = `Report title: ${doc.title ?? "Untitled"}
Report type: ${doc.report_type ?? "unknown"}
Report date: ${doc.report_date ?? "unknown"}
Category: ${doc.report_category ?? "other"}

Extracted values:
${metricLines || "(none)"}

Existing short summary (from extraction): ${doc.summary ?? "(none)"}
Findings: ${Array.isArray(doc.findings) ? (doc.findings as string[]).join("; ") : "(none)"}
Impressions: ${Array.isArray(doc.impressions) ? (doc.impressions as string[]).join("; ") : "(none)"}`;

  const responseText = await callAIForUser(supabase, userId, {
    system,
    prompt,
    jsonMode: true,
    maxTokens: 2048,
  });
  const parsed = tryParseJson<{
    headline?: string;
    explanation?: string;
    flagged?: Array<{ metric?: string; value?: string; concern?: string; severity?: string }>;
    questions?: string[];
  }>(responseText);
  if (!parsed) throw new AiInsightsApiError("Couldn't parse AI response", 502);

  const cleaned = {
    headline: String(parsed.headline ?? "").slice(0, 200),
    explanation: String(parsed.explanation ?? "").slice(0, 2000),
    flagged: Array.isArray(parsed.flagged)
      ? parsed.flagged.slice(0, 10).map((f) => ({
          metric: String(f.metric ?? "").slice(0, 120),
          value: String(f.value ?? "").slice(0, 80),
          concern: String(f.concern ?? "").slice(0, 400),
          severity: (["info", "watch", "attention"].includes(String(f.severity))
            ? f.severity
            : "info") as "info" | "watch" | "attention",
        }))
      : [],
    questions: Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 3).map((q) => String(q).slice(0, 200))
      : [],
  };

  await supabase
    .from("report_documents")
    .update({ ai_summary: cleaned, ai_summary_at: new Date().toISOString() })
    .eq("id", doc.id);

  return { ok: true, cached: false, summary: cleaned };
}

/** AI-generated trend summary for a single metric, cached per (user, metric, latest reading). */
export async function getMetricInsightForUser(
  supabase: SupabaseClient,
  userId: string,
  metricKey: string,
  force: boolean,
) {
  const [{ data: rows, error }, { data: profile }] = await Promise.all([
    supabase
      .from("report_metrics")
      .select(
        "value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, display_name, report_documents(title, report_date)",
      )
      .eq("metric_key", metricKey)
      .order("measured_at", { ascending: true, nullsFirst: true }),
    supabase.from("profiles").select("conditions, conditions_note").eq("id", userId).maybeSingle(),
  ]);
  if (error) {
    return {
      summary: null,
      bullets: [],
      suggestedQuestions: [],
      error: error.message,
      cached: false,
      latestAt: null,
    };
  }

  const points = (rows ?? [])
    .map((r: any) => ({
      at: (r.measured_at ?? r.created_at ?? "").slice(0, 10),
      value: r.value as number | null,
      text: r.value_text as string | null,
      flag: r.flag as string | null,
      unit: r.unit as string | null,
      report: r.report_documents?.title ?? null,
    }))
    .filter((p) => p.value != null || p.text);
  if (points.length < 2) {
    return {
      summary: null,
      bullets: [],
      suggestedQuestions: [],
      error: "not_enough_data",
      cached: false,
      latestAt: null,
    };
  }
  const latestAt = points[points.length - 1].at;

  const { data: cached } = await supabase
    .from("metric_insights")
    .select("summary, bullets, suggested_questions")
    .eq("user_id", userId)
    .eq("metric_key", metricKey)
    .eq("latest_at", latestAt)
    .maybeSingle();
  if (cached && !force) {
    return {
      summary: cached.summary,
      bullets: (cached.bullets as string[]) ?? [],
      suggestedQuestions: (cached.suggested_questions as string[]) ?? [],
      error: null,
      cached: true,
      latestAt,
    };
  }
  if (!cached && !force) {
    return { summary: null, bullets: [], suggestedQuestions: [], error: null, cached: false, latestAt };
  }

  const label = (rows?.[0] as any)?.display_name ?? metricKey.replace(/_/g, " ");
  const unit = (rows?.[rows.length - 1] as any)?.unit ?? null;
  const refLow = (rows?.[rows.length - 1] as any)?.reference_low ?? null;
  const refHigh = (rows?.[rows.length - 1] as any)?.reference_high ?? null;
  const conditions = (profile?.conditions as string[] | null) ?? [];

  const model = resolvePlatformModel(null);
  if (!model) {
    return {
      summary: null,
      bullets: [],
      suggestedQuestions: [],
      error: "AI unavailable",
      cached: false,
      latestAt,
    };
  }

  try {
    const prompt = [
      `Metric: ${label}${unit ? ` (${unit})` : ""}`,
      refLow != null && refHigh != null
        ? `Reference range: ${refLow}\u2013${refHigh}${unit ? ` ${unit}` : ""}`
        : "Reference range: unknown",
      conditions.length ? `User conditions: ${conditions.join(", ")}` : "User conditions: not specified",
      "",
      "Readings (chronological):",
      ...points.map(
        (p) => `- ${p.at}: ${p.value ?? p.text}${p.flag ? ` [${p.flag}]` : ""}${p.report ? `, ${p.report}` : ""}`,
      ),
    ].join("\n");

    const { experimental_output: output } = await generateText({
      model,
      experimental_output: Output.object({
        schema: z.object({
          summary: z.string(),
          bullets: z.array(z.string()).max(5),
          suggestedQuestions: z.array(z.string()).max(4),
        }),
      }),
      system:
        "You are Purple, a calm, careful health-journal assistant. Summarize a single lab/biomarker trend for the user (not a clinician). 2\u20133 sentence summary describing direction and any notable spikes/dips with dates. 3\u20135 short bullets calling out specifics (out-of-range readings, deltas, possible patterns relative to their conditions). 2\u20134 short questions the user could ask their clinician. Never diagnose. Never recommend treatment changes. If the data is sparse or noisy, say so.",
      prompt,
    });

    await supabase.from("metric_insights").upsert(
      {
        user_id: userId,
        metric_key: metricKey,
        latest_at: latestAt,
        summary: output.summary,
        bullets: output.bullets ?? [],
        suggested_questions: output.suggestedQuestions ?? [],
      },
      { onConflict: "user_id,metric_key,latest_at" },
    );

    return {
      summary: output.summary,
      bullets: output.bullets ?? [],
      suggestedQuestions: output.suggestedQuestions ?? [],
      error: null,
      cached: false,
      latestAt,
    };
  } catch (e: any) {
    const msg = e?.message ?? "AI request failed";
    const kind = /429|rate/i.test(msg) ? "rate_limited" : /402|credit/i.test(msg) ? "credits_exhausted" : msg;
    return { summary: null, bullets: [], suggestedQuestions: [], error: kind, cached: false, latestAt };
  }
}

/**
 * Phase 4.3: 1-3 plain-English "For you" cards summarizing the most notable
 * recent observations across the user's metrics + vitals. Cached once per
 * day under the sentinel metric key `__daily_cards__`.
 */
export async function getDailyInsightCardsForUser(
  supabase: SupabaseClient,
  userId: string,
  force: boolean,
) {
  const today = new Date().toISOString().slice(0, 10);

  if (!force) {
    const { data: cached } = await supabase
      .from("metric_insights")
      .select("summary, bullets")
      .eq("user_id", userId)
      .eq("metric_key", "__daily_cards__")
      .eq("latest_at", today)
      .maybeSingle();
    if (cached) {
      return {
        cards: (cached.bullets as Array<{ title: string; body: string; tone?: string; metricKey?: string }>) ?? [],
        headline: cached.summary ?? null,
        cached: true,
        generatedFor: today,
      };
    }
  }

  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const [{ data: metrics }, { data: vitals }, { data: profile }] = await Promise.all([
    supabase
      .from("report_metrics")
      .select("metric_key, display_name, value, value_text, unit, flag, measured_at, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vitals_log")
      .select("metric_key, value, unit, recorded_at")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(80),
    supabase.from("profiles").select("conditions, conditions_note").eq("id", userId).maybeSingle(),
  ]);

  const metricLines = (metrics ?? [])
    .slice(0, 80)
    .map(
      (m: any) =>
        `- [report] ${m.display_name ?? m.metric_key}: ${m.value ?? m.value_text}${m.unit ? ` ${m.unit}` : ""}${m.flag ? ` [${m.flag}]` : ""} on ${(m.measured_at ?? m.created_at).slice(0, 10)}`,
    );
  const vitalLines = (vitals ?? [])
    .slice(0, 40)
    .map(
      (v: any) =>
        `- [vital] ${v.metric_key}: ${v.value}${v.unit ? ` ${v.unit}` : ""} on ${v.recorded_at.slice(0, 10)}`,
    );
  if (metricLines.length + vitalLines.length < 3) {
    await supabase.from("metric_insights").upsert(
      {
        user_id: userId,
        metric_key: "__daily_cards__",
        latest_at: today,
        summary: null,
        bullets: [],
        suggested_questions: [],
      },
      { onConflict: "user_id,metric_key,latest_at" },
    );
    return { cards: [], headline: null, cached: false, generatedFor: today };
  }

  const model = resolvePlatformModel(null);
  if (!model) return { cards: [], headline: null, cached: false, generatedFor: today, error: "AI unavailable" };

  try {
    const conditions = (profile?.conditions as string[] | null) ?? [];
    const prompt = [
      conditions.length ? `User conditions: ${conditions.join(", ")}` : "User conditions: not specified",
      "",
      "Recent readings (newest first):",
      ...metricLines,
      ...vitalLines,
    ].join("\n");

    const { experimental_output: output } = await generateText({
      model,
      experimental_output: Output.object({
        schema: z.object({
          headline: z.string(),
          cards: z
            .array(
              z.object({
                title: z.string(),
                body: z.string(),
                tone: z.enum(["info", "watch", "attention"]),
                metricKey: z.string().optional(),
              }),
            )
            .min(1)
            .max(3),
        }),
      }),
      system:
        "You are Purple, a calm, careful health-journal assistant writing a 'For you' summary card row. Surface the 1-3 most notable observations from the user's recent data: out-of-range readings repeating, clear trends across multiple readings, or single dramatic spikes. Skip noise. Never diagnose. Never recommend dosage or treatment changes. If you mention a number, include the date. Tone: quiet, respectful. Headline is one short sentence framing today. Cards have short specific titles like 'LDL trending up' and 1-2 sentence bodies in plain English. tone: info (neutral), watch (worth noticing), attention (repeated abnormal). metricKey: snake_case key from the data when the card is about a specific metric.",
      prompt,
    });

    await supabase.from("metric_insights").upsert(
      {
        user_id: userId,
        metric_key: "__daily_cards__",
        latest_at: today,
        summary: output.headline,
        bullets: output.cards ?? [],
        suggested_questions: [],
      },
      { onConflict: "user_id,metric_key,latest_at" },
    );

    return { cards: output.cards ?? [], headline: output.headline, cached: false, generatedFor: today };
  } catch (e: any) {
    return { cards: [], headline: null, cached: false, generatedFor: today, error: e?.message ?? "AI failed" };
  }
}
