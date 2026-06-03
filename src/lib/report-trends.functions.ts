import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  series: Array<{ at: string; value: number | null }>;
};

/** List every metric the user has in ≥2 reports plus its sparkline series + prefs. */
export const listTrendMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: metrics, error: mErr }, { data: prefs, error: pErr }] = await Promise.all([
      supabase
        .from("report_metrics")
        .select("metric_key, display_name, value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, report_id")
        .order("created_at", { ascending: true }),
      supabase
        .from("report_metric_preferences")
        .select("metric_key, pinned, hidden, sort_order"),
    ]);
    if (mErr) throw new Error(mErr.message);
    if (pErr) throw new Error(pErr.message);

    const prefMap = new Map<string, { pinned: boolean; hidden: boolean; sort_order: number }>();
    for (const p of prefs ?? []) prefMap.set(p.metric_key, { pinned: !!p.pinned, hidden: !!p.hidden, sort_order: p.sort_order ?? 0 });

    const byKey = new Map<string, TrendMetricRow>();
    for (const m of metrics ?? []) {
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
      row.series.push({ at, value: m.value as number | null });
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
      .upsert(patch, { onConflict: "user_id,metric_key" });
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
      .select("id, value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at, display_name, report_id, report_documents(title, report_date)")
      .eq("metric_key", data.metricKey)
      .order("measured_at", { ascending: true, nullsFirst: true });
    if (data.days) {
      const since = new Date(Date.now() - data.days * 86400_000).toISOString();
      q = q.gte("created_at", since);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });