import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, AlertTriangle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import {
  METRIC_ORDER,
  METRICS,
  type MetricKey,
  METRIC_CATEGORY,
  CATEGORY_ORDER,
  CATEGORY_LABEL,
  type MetricCategory,
  classifyValue,
  stats,
  isAttention,
} from "@/lib/biometric-metrics";
import { MetricCard } from "@/components/biometrics/metric-card";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useFreshAccount } from "@/hooks/use-fresh-account";
import { RouteEmptyState } from "@/components/empty-states/route-empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/biometrics/")({
  head: () => ({
    meta: [
      { title: "Your body · Purple" },
      { name: "description", content: "All the signals Purple is reading from your body." },
    ],
  }),
  component: BiometricsIndex,
});

type BioRow = Record<string, number | string | null>;
type SourceKey = "oura" | "whoop" | "apple_health" | "manual";
const SOURCES: SourceKey[] = ["oura", "whoop", "apple_health", "manual"];

type RangeKey = "1d" | "7d" | "30d" | "90d" | "365d";
type CompareMode = "none" | "previous" | "year_ago";

const RANGE_DAYS: Record<RangeKey, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90, "365d": 365 };
const RANGE_LABELS: Record<RangeKey, string> = {
  "1d": "Today",
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "365d": "1y",
};

function BiometricsIndex() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user.id;
  const freshQuery = useFreshAccount();
  const isFresh = freshQuery.data?.isFresh === true;
  const [rows, setRows] = useState<BioRow[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [compareMode, setCompareMode] = useState<CompareMode>("none");
  const [pinned, setPinned] = useState<string[]>([]);
  const windowDays = RANGE_DAYS[rangeKey];

  // Load pinned metrics from profile.
  useEffect(() => {
    if (!uid) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("biometrics_pinned" as any)
        .eq("id", uid)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (data as any)?.biometrics_pinned;
      if (Array.isArray(list)) setPinned(list as string[]);
    })();
  }, [uid]);

  const togglePin = async (key: MetricKey) => {
    if (!uid) return;
    const next = pinned.includes(key)
      ? pinned.filter((k) => k !== key)
      : [...pinned, key];
    setPinned(next); // optimistic
    const { error } = await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ biometrics_pinned: next } as any)
      .eq("id", uid);
    if (error) {
      setPinned(pinned); // rollback
      toast.error("Could not save pin");
    }
  };

  useEffect(() => {
    if (!uid) return;
    const cols = [
      "recorded_at",
      "source",
      ...new Set(Object.values(METRICS).map((m) => m.column)),
    ].join(", ");
    // Pull enough history to cover the chosen window + comparison window.
    const lookbackDays =
      compareMode === "year_ago"
        ? 365 + windowDays
        : compareMode === "previous"
          ? windowDays * 2
          : windowDays;
    const since = new Date(Date.now() - lookbackDays * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from("biometrics")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(cols as any)
        .eq("user_id", uid)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      setRows((data as unknown as BioRow[] | null) ?? []);
    })();
  }, [uid, refreshKey, windowDays, compareMode]);

  const seriesByMetric = useMemo(() => {
    const out: Record<MetricKey, Partial<Record<SourceKey, Array<{ date: string; value: number | null }>>>> = {} as never;
    for (const key of METRIC_ORDER) {
      const meta = METRICS[key];
      const bySrc: Partial<Record<SourceKey, Array<{ date: string; value: number | null }>>> = {};
      for (const src of SOURCES) bySrc[src] = [];
      for (const r of rows ?? []) {
        const src = (String(r.source ?? "") as SourceKey);
        if (!SOURCES.includes(src)) continue;
        const raw = r[meta.column];
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        bySrc[src]!.push({
          date: String(r.recorded_at ?? ""),
          value: Number.isFinite(num as number) ? (num as number) : null,
        });
      }
      // Drop sources with no real readings.
      for (const src of SOURCES) {
        if (!bySrc[src]!.some((d) => d.value != null)) delete bySrc[src];
      }
      out[key] = bySrc;
    }
    return out;
  }, [rows]);

  // Compute per-metric averages across the current window vs the comparison window.
  const comparison = useMemo(() => {
    const now = Date.now();
    const day = 24 * 3600 * 1000;
    const curStart = now - windowDays * day;
    let cmpStart: number | null = null;
    let cmpEnd: number | null = null;
    if (compareMode === "previous") {
      cmpStart = now - windowDays * 2 * day;
      cmpEnd = curStart;
    } else if (compareMode === "year_ago") {
      cmpStart = now - (365 + windowDays) * day;
      cmpEnd = now - 365 * day;
    }
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const out: Record<
      MetricKey,
      { current: number | null; compare: number | null; deltaPct: number | null }
    > = {} as never;
    for (const key of METRIC_ORDER) {
      const meta = METRICS[key];
      const cur: number[] = [];
      const cmp: number[] = [];
      for (const r of rows ?? []) {
        const t = new Date(String(r.recorded_at ?? "")).getTime();
        const raw = r[meta.column];
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        if (num == null || !Number.isFinite(num)) continue;
        if (t >= curStart && t <= now) cur.push(num);
        else if (cmpStart != null && cmpEnd != null && t >= cmpStart && t < cmpEnd) cmp.push(num);
      }
      const a = avg(cur);
      const b = avg(cmp);
      const deltaPct = a != null && b != null && b !== 0 ? ((a - b) / Math.abs(b)) * 100 : null;
      out[key] = { current: a, compare: b, deltaPct };
    }
    return out;
  }, [rows, windowDays, compareMode]);

  const empty = rows !== null && rows.length === 0;

  // Status per metric, used for "needs a look" summary and attention pills.
  const statusByMetric = useMemo(() => {
    const out: Record<MetricKey, "in_range" | "low" | "high" | "unknown"> =
      {} as never;
    for (const m of METRIC_ORDER) {
      const bySource = seriesByMetric[m];
      // Pick the source with most-recent reading for the headline.
      const srcKeys = Object.keys(bySource ?? {}) as SourceKey[];
      let headline: { date: string; value: number | null } | null = null;
      let series: Array<{ date: string; value: number | null }> = [];
      for (const s of srcKeys) {
        const arr = bySource[s] ?? [];
        const last = [...arr].reverse().find((d) => d.value != null);
        if (last && (!headline || last.date > headline.date)) {
          headline = last;
          series = arr;
        }
      }
      if (!series.length) {
        out[m] = "unknown";
        continue;
      }
      const baseline = stats(series.slice(-30, -3).map((d) => d.value));
      out[m] = classifyValue(METRICS[m], headline?.value ?? null, baseline);
    }
    return out;
  }, [seriesByMetric]);

  const attentionKeys = useMemo(
    () => METRIC_ORDER.filter((m) => isAttention(METRICS[m], statusByMetric[m])),
    [statusByMetric],
  );

  // Group available metrics by category, hide categories with no data.
  const byCategory = useMemo(() => {
    const out: Partial<Record<MetricCategory, MetricKey[]>> = {};
    for (const m of METRIC_ORDER) {
      if (pinned.includes(m)) continue; // pinned shown in hero strip
      const hasData = Object.values(seriesByMetric[m] ?? {}).some(
        (arr) => arr && arr.some((d) => d.value != null),
      );
      if (!hasData) continue;
      const cat = METRIC_CATEGORY[m];
      (out[cat] ||= []).push(m);
    }
    return out;
  }, [seriesByMetric, pinned]);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-24">
      <Link
        to="/today"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("biometrics.backToToday")}
      </Link>

      <p className="label-eyebrow mt-10 text-muted-foreground">{t("biometrics.eyebrow")}</p>
      <h1 className="font-serif text-[40px] sm:text-6xl leading-[1.04] tracking-[-0.02em] mt-3 text-foreground">
        {t("biometrics.title1")}
        <br />
        {t("biometrics.title2")}
      </h1>

      <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4">
        <OuraSyncStatus onSynced={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Range + comparison pickers */}
      {!isFresh && (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setRangeKey(k)}
              className={`rounded-full px-3 py-1 text-[12px] transition ${
                rangeKey === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGE_LABELS[k]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-0.5">
          {(["none", "previous", "year_ago"] as CompareMode[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCompareMode(c)}
              className={`rounded-full px-3 py-1 text-[12px] transition ${
                compareMode === c ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "none" ? "No compare" : c === "previous" ? "vs previous" : "vs year ago"}
            </button>
          ))}
        </div>
      </div>
      )}

      {rows === null ? (
        !isFresh ? (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        ) : null
      ) : empty ? (
        <div className="mt-10">
          <RouteEmptyState
            testId="fresh-empty-biometrics"
            eyebrow={t("biometrics.eyebrow")}
            heading={t("biometrics.noDataTitle")}
            body={t("biometrics.noDataBody")}
            icon={Activity}
            action={
              <Button asChild size="lg" className="rounded-full h-12 px-6 text-base">
                <Link to="/tools">{t("biometrics.noDataCta")}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {/* Attention summary */}
          {attentionKeys.length > 0 && (
            <div className="rounded-2xl border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 px-5 py-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-[color:var(--warning)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {attentionKeys.length === 1
                    ? "1 signal needs a look"
                    : `${attentionKeys.length} signals need a look`}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {attentionKeys
                    .map((m) => METRICS[m].short)
                    .slice(0, 6)
                    .join(", ")}
                  {attentionKeys.length > 6 ? "…" : ""}
                </p>
              </div>
            </div>
          )}

          {/* Pinned hero strip */}
          {pinned.length > 0 && (
            <section>
              <p className="label-eyebrow text-muted-foreground mb-3">Pinned</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinned
                  .filter((k): k is MetricKey => (METRIC_ORDER as string[]).includes(k))
                  .map((m) => (
                    <MetricCard
                      key={m}
                      metric={m}
                      seriesBySource={seriesByMetric[m]}
                      size="hero"
                      pinned
                      onTogglePin={() => togglePin(m)}
                      compare={
                        compareMode === "none"
                          ? undefined
                          : {
                              label: compareMode === "previous" ? "vs previous" : "vs year ago",
                              deltaPct: comparison[m].deltaPct,
                              compareValue: comparison[m].compare,
                            }
                      }
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Grouped by category */}
          {CATEGORY_ORDER.map((cat) => {
            const metrics = byCategory[cat];
            if (!metrics || metrics.length === 0) return null;
            return (
              <section key={cat}>
                <p className="label-eyebrow text-muted-foreground mb-3">
                  {CATEGORY_LABEL[cat]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {metrics.map((m) => (
                    <MetricCard
                      key={m}
                      metric={m}
                      seriesBySource={seriesByMetric[m]}
                      pinned={false}
                      onTogglePin={() => togglePin(m)}
                      compare={
                        compareMode === "none"
                          ? undefined
                          : {
                              label:
                                compareMode === "previous" ? "vs previous" : "vs year ago",
                              deltaPct: comparison[m].deltaPct,
                              compareValue: comparison[m].compare,
                            }
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!isFresh && (
        <>
      <SourceLegend />
      <SourceFieldMatrix />
        </>
      )}
    </div>
  );
}

function SourceLegend() {
  const items = [
    { label: "Oura",         color: "var(--purple-primary)" },
    { label: "Whoop",        color: "#34D399" },
    { label: "Apple Health", color: "#F472B6" },
    { label: "Manual",       color: "#A1A1AA" },
  ];
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
      <span className="label-eyebrow">Sources</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function SourceFieldMatrix() {
  // Rough capability matrix. Daily-summary granularity, varies by ring/watch.
  const rows: Array<{ label: string; oura: boolean; whoop: boolean; apple: boolean }> = [
    { label: "Total sleep",        oura: true,  whoop: true,  apple: true  },
    { label: "Sleep score",        oura: true,  whoop: true,  apple: false },
    { label: "REM / Deep sleep",   oura: true,  whoop: true,  apple: true  },
    { label: "HRV (RMSSD)",        oura: true,  whoop: true,  apple: true  },
    { label: "Resting HR",         oura: true,  whoop: true,  apple: true  },
    { label: "Respiratory rate",   oura: true,  whoop: true,  apple: true  },
    { label: "SpO₂",               oura: true,  whoop: false, apple: true  },
    { label: "Skin temperature",   oura: true,  whoop: false, apple: true  },
    { label: "Readiness / Recovery", oura: true, whoop: true, apple: false },
    { label: "Stress / Strain",    oura: true,  whoop: true,  apple: false },
    { label: "Steps",              oura: true,  whoop: false, apple: true  },
    { label: "Active calories",    oura: true,  whoop: true,  apple: true  },
    { label: "VO₂max",             oura: false, whoop: false, apple: true  },
    { label: "Workout minutes",    oura: true,  whoop: true,  apple: true  },
  ];
  const cell = (yes: boolean) => (
    <td className="px-3 py-1.5 text-center text-foreground/70">{yes ? "✓" : "–"}</td>
  );
  return (
    <details className="mt-6 rounded-2xl border border-border bg-card p-5">
      <summary className="cursor-pointer text-sm text-foreground">
        What does each source provide?
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-normal">Signal</th>
              <th className="px-3 py-2 font-normal text-center">Oura</th>
              <th className="px-3 py-2 font-normal text-center">Whoop</th>
              <th className="px-3 py-2 font-normal text-center">Apple Health</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border/60">
                <td className="px-3 py-1.5 text-foreground">{r.label}</td>
                {cell(r.oura)}
                {cell(r.whoop)}
                {cell(r.apple)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted-foreground">
          When multiple sources report the same signal, the card shows one colored line per source so you can compare them side by side.
        </p>
      </div>
    </details>
  );
}