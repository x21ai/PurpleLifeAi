import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { generateText, Output } from "ai";

export type TrendMetricRow = {
  metric_key: string;
  display_name: string | null;
  unit: string | null;
  count: number;
  latest_value: number | null;
  latest_text: string | null;
  latest_flag: string | null;
  latest_at: string | null;
  reference_low: number | null;
  reference_high: number | null;
  pinned: boolean;
  hidden: boolean;
  sort_order: number;
  series: Array<{ at: string; value: number | null; source_text: string | null; report_id: string }>;
};

/** List every metric the user has in ≥2 reports plus its sparkline series + prefs. */
export const listTrendMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: metrics, error: mErr }, { data: prefs, error: pErr }, { data: docs }] = await Promise.all([
      supabase
        .from("report_metrics")
        .select("metric_key, display_name, value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, report_id, source_text")
        .order("created_at", { ascending: true }),
      supabase
        .from("report_metric_preferences")
        .select("metric_key, pinned, hidden, sort_order"),
      supabase
        .from("report_documents")
        .select("id, identity_status, duplicate_of, excluded_from_trends"),
    ]);
    if (mErr) throw new Error(mErr.message);
    if (pErr) throw new Error(pErr.message);

    const prefMap = new Map<string, { pinned: boolean; hidden: boolean; sort_order: number }>();
    for (const p of prefs ?? []) prefMap.set(p.metric_key, { pinned: !!p.pinned, hidden: !!p.hidden, sort_order: p.sort_order ?? 0 });

    // Only include metrics from reports whose identity is verified/manual_approved
    // AND that aren't marked as duplicates of another report.
    const includedReports = new Set<string>();
    for (const d of docs ?? []) {
      const status = (d.identity_status as string | null) ?? "unverified";
      if (d.duplicate_of) continue;
      if (d.excluded_from_trends) continue;
      if (status === "verified" || status === "manual_approved") includedReports.add(d.id as string);
    }

    const byKey = new Map<string, TrendMetricRow>();
    for (const m of metrics ?? []) {
      if (!includedReports.has(m.report_id as string)) continue;
      const key = m.metric_key;
      const at = (m.measured_at as string | null) ?? (m.created_at as string);
      const row = byKey.get(key) ?? {
        metric_key: key,
        display_name: m.display_name as string | null,
        unit: m.unit as string | null,
        count: 0,
        latest_value: null,
        latest_text: null,
        latest_flag: null,
        latest_at: null,
        reference_low: m.reference_low as number | null,
        reference_high: m.reference_high as number | null,
        pinned: prefMap.get(key)?.pinned ?? false,
        hidden: prefMap.get(key)?.hidden ?? false,
        sort_order: prefMap.get(key)?.sort_order ?? 0,
        series: [],
      };
      row.count += 1;
      row.series.push({ at, value: m.value as number | null, source_text: (m.source_text as string | null), report_id: m.report_id as string });
      if (!row.latest_at || at > row.latest_at) {
        row.latest_at = at;
        row.latest_value = m.value as number | null;
        row.latest_text = m.value_text as string | null;
        row.latest_flag = m.flag as string | null;
        if (m.unit) row.unit = m.unit as string;
        if (m.display_name) row.display_name = m.display_name as string;
        if (m.reference_low != null) row.reference_low = m.reference_low as number;
        if (m.reference_high != null) row.reference_high = m.reference_high as number;
      }
      byKey.set(key, row);
    }

    // Only metrics with ≥2 data points get a trend row; everyone else stays on detail pages.
    // Defensive dedupe: collapse same-day points within a metric by averaging.
    // Prevents future double-uploads from producing doubled dots even if duplicate_of
    // is not yet set on the report_document.
    for (const row of byKey.values()) {
      const byDay = new Map<string, { sum: number; n: number; at: string; source_text: string | null; report_id: string }>();
      const nonNumeric: Array<{ at: string; value: number | null; source_text: string | null; report_id: string }> = [];
      for (const p of row.series) {
        if (p.value == null) {
          nonNumeric.push(p);
          continue;
        }
        const day = p.at.slice(0, 10);
        const cur = byDay.get(day);
        if (cur) {
          cur.sum += p.value;
          cur.n += 1;
          if (p.at > cur.at) {
            cur.at = p.at;
            cur.source_text = p.source_text;
            cur.report_id = p.report_id;
          }
        } else {
          byDay.set(day, { sum: p.value, n: 1, at: p.at, source_text: p.source_text, report_id: p.report_id });
        }
      }
      const collapsed = Array.from(byDay.values()).map((b) => ({
        at: b.at,
        value: b.sum / b.n,
        source_text: b.source_text,
        report_id: b.report_id,
      }));
      row.series = [...collapsed, ...nonNumeric].sort((a, b) => (a.at < b.at ? -1 : 1));
      row.count = row.series.length;
    }
    const list = Array.from(byKey.values()).filter((r) => r.count >= 2);
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return (b.latest_at ?? "").localeCompare(a.latest_at ?? "");
    });
    return { metrics: list };
  });

const SetPrefInput = z.object({
  metricKey: z.string().min(1).max(80),
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const setMetricPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetPrefInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { user_id: userId, metric_key: data.metricKey };
    if (typeof data.pinned === "boolean") patch.pinned = data.pinned;
    if (typeof data.hidden === "boolean") patch.hidden = data.hidden;
    if (typeof data.sortOrder === "number") patch.sort_order = data.sortOrder;
    const { error } = await supabase
      .from("report_metric_preferences")
      .upsert(patch as any, { onConflict: "user_id,metric_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ReorderInput = z.object({
  order: z.array(z.string().min(1).max(80)).max(200),
});

export const reorderMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReorderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.order.map((metric_key, i) => ({
      user_id: userId,
      metric_key,
      sort_order: i,
    }));
    if (rows.length === 0) return { ok: true };
    const { error } = await supabase
      .from("report_metric_preferences")
      .upsert(rows, { onConflict: "user_id,metric_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SeriesInput = z.object({
  metricKey: z.string().min(1).max(80),
  days: z.number().int().min(7).max(3650).optional(),
});

export const getMetricSeries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SeriesInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("report_metrics")
      .select("id, value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, display_name, source_text, report_id, report_documents(title, report_date, identity_status, duplicate_of)")
      .eq("metric_key", data.metricKey)
      .order("measured_at", { ascending: true, nullsFirst: true });
    if (data.days) {
      const since = new Date(Date.now() - data.days * 86400_000).toISOString();
      q = q.gte("created_at", since);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const filtered = (rows ?? []).filter((r: any) => {
      const d = r.report_documents;
      if (!d) return true;
      if (d.duplicate_of) return false;
      const status = d.identity_status ?? "unverified";
      return status === "verified" || status === "manual_approved";
    });
    return { rows: filtered };
  });

const InsightInput = z.object({
  metricKey: z.string().min(1).max(80),
  force: z.boolean().optional(),
});

/** AI-generated trend summary for a single metric.
 *  On-demand: only runs when force=true; otherwise returns cached value if any.
 *  Cached per (user_id, metric_key, latest_at) so re-opens don't re-bill. */
export const getMetricInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InsightInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: rows, error }, { data: profile }] = await Promise.all([
      supabase
        .from("report_metrics")
        .select("value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, display_name, report_documents(title, report_date)")
        .eq("metric_key", data.metricKey)
        .order("measured_at", { ascending: true, nullsFirst: true }),
      supabase.from("profiles").select("conditions, conditions_note").eq("id", userId).maybeSingle(),
    ]);
    if (error) return { summary: null, bullets: [], suggestedQuestions: [], error: error.message, cached: false, latestAt: null };

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
      return { summary: null, bullets: [], suggestedQuestions: [], error: "not_enough_data", cached: false, latestAt: null };
    }
    const latestAt = points[points.length - 1].at;

    // Check cache first
    const { data: cached } = await supabase
      .from("metric_insights")
      .select("summary, bullets, suggested_questions")
      .eq("user_id", userId)
      .eq("metric_key", data.metricKey)
      .eq("latest_at", latestAt)
      .maybeSingle();
    if (cached && !data.force) {
      return {
        summary: cached.summary,
        bullets: (cached.bullets as string[]) ?? [],
        suggestedQuestions: (cached.suggested_questions as string[]) ?? [],
        error: null,
        cached: true,
        latestAt,
      };
    }
    if (!cached && !data.force) {
      // Don't run AI automatically; wait for the user to click "Run AI insights".
      return { summary: null, bullets: [], suggestedQuestions: [], error: null, cached: false, latestAt };
    }

    const label = (rows?.[0] as any)?.display_name ?? data.metricKey.replace(/_/g, " ");
    const unit = (rows?.[rows.length - 1] as any)?.unit ?? null;
    const refLow = (rows?.[rows.length - 1] as any)?.reference_low ?? null;
    const refHigh = (rows?.[rows.length - 1] as any)?.reference_high ?? null;
    const conditions = (profile?.conditions as string[] | null) ?? [];

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { summary: null, bullets: [], suggestedQuestions: [], error: "AI unavailable", cached: false, latestAt };

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const prompt = [
        `Metric: ${label}${unit ? ` (${unit})` : ""}`,
        refLow != null && refHigh != null ? `Reference range: ${refLow}–${refHigh}${unit ? ` ${unit}` : ""}` : "Reference range: unknown",
        conditions.length ? `User conditions: ${conditions.join(", ")}` : "User conditions: not specified",
        "",
        "Readings (chronological):",
        ...points.map((p) => `- ${p.at}: ${p.value ?? p.text}${p.flag ? ` [${p.flag}]` : ""}${p.report ? `, ${p.report}` : ""}`),
      ].join("\n");

      const { experimental_output: output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        experimental_output: Output.object({
          schema: z.object({
            summary: z.string(),
            bullets: z.array(z.string()).max(5),
            suggestedQuestions: z.array(z.string()).max(4),
          }),
        }),
        system:
          "You are Purple, a calm, careful health-journal assistant. Summarize a single lab/biomarker trend for the user (not a clinician). 2–3 sentence summary describing direction and any notable spikes/dips with dates. 3–5 short bullets calling out specifics (out-of-range readings, deltas, possible patterns relative to their conditions). 2–4 short questions the user could ask their clinician. Never diagnose. Never recommend treatment changes. If the data is sparse or noisy, say so.",
        prompt,
      });

      // Cache the result keyed by the latest reading anchor.
      await supabase.from("metric_insights").upsert(
        {
          user_id: userId,
          metric_key: data.metricKey,
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
  });