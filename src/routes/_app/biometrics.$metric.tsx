import { createFileRoute, Link, useParams, useRouter, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import {
  METRICS,
  METRIC_ORDER,
  type MetricKey,
  classifyValue,
  statusTone,
  stats,
} from "@/lib/biometric-metrics";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";
import { useTranslation } from "react-i18next";
import { MetricShell, MetricTitle, MetricStatCards, AskPurpleRail } from "@/components/reports/metric-shell";

const VALID = new Set<MetricKey>(METRIC_ORDER);

export const Route = createFileRoute("/_app/biometrics/$metric")({
  head: ({ params }) => {
    const meta = METRICS[params.metric as MetricKey];
    const label = meta?.label ?? "Metric";
    return {
      meta: [
        { title: `${label} · Purple` },
        { name: "description", content: meta?.meaning ?? "" },
      ],
    };
  },
  loader: ({ params }) => {
    if (!VALID.has(params.metric as MetricKey)) throw notFound();
    return null;
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="font-serif text-3xl">Metric not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link to="/biometrics" className="underline">
          See all your signals
        </Link>
      </p>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-serif text-3xl">Something went sideways.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          type="button"
          className="mt-6 text-sm underline"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Try again
        </button>
      </div>
    );
  },
  component: MetricDrillPage,
});

type Row = { recorded_at: string; value: number | null; source: string };
type Range = 1 | 7 | 30 | 90 | 365;
type CompareMode = "none" | "previous" | "year_ago";
type SourceKey = "oura" | "whoop" | "apple_health" | "manual";
const SOURCE_COLORS: Record<SourceKey, string> = {
  oura:         "var(--purple-primary)",
  whoop:        "#34D399",
  apple_health: "#F472B6",
  manual:       "#A1A1AA",
};
const SOURCE_LABELS: Record<SourceKey, string> = {
  oura: "Oura",
  whoop: "Whoop",
  apple_health: "Apple Health",
  manual: "Manual",
};

function MetricDrillPage() {
  const { t } = useTranslation();
  useRouteTheme("light");
  const { metric } = useParams({ from: "/_app/biometrics/$metric" });
  const meta = METRICS[metric as MetricKey];
  const { session } = useAuth();
  const uid = session?.user.id;
  const navigate = useNavigate();

  const [range, setRange] = useState<Range>(30);
  const [compare, setCompare] = useState<CompareMode>("previous");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!uid || !meta) return;
    // Fetch enough history to cover the comparison window too.
    const daysBack =
      compare === "year_ago" ? 365 + range : compare === "previous" ? range * 2 : range;
    const since = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const query = supabase
        .from("biometrics")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(`recorded_at, source, ${meta.column}` as any)
        .eq("user_id", uid)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      const { data } = await query;
      const rowsRaw = (data ?? []) as unknown as Array<Record<string, unknown>>;
      const mapped: Row[] = rowsRaw.map((r) => {
        const raw = r[meta.column];
        const n = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        return {
          recorded_at: String(r.recorded_at ?? ""),
          source: String(r.source ?? "oura"),
          value: Number.isFinite(n as number) ? (n as number) : null,
        };
      });
      setRows(mapped);
    })();
  }, [uid, meta, range, compare, refreshKey]);

  const {
    chartData,
    sourcesPresent,
    baseline,
    current,
    status,
    currentAvg,
    compareAvg,
    delta,
  } = useMemo(() => {
    const allRows = rows ?? [];
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    const curStart = now - range * dayMs;
    const cmpOffset =
      compare === "year_ago"
        ? 365 * dayMs
        : compare === "previous"
          ? range * dayMs
          : 0;
    const curRows = allRows.filter((r) => new Date(r.recorded_at).getTime() >= curStart);
    const cmpRows =
      compare === "none"
        ? []
        : allRows.filter((r) => {
            const t = new Date(r.recorded_at).getTime();
            return t >= curStart - cmpOffset && t < now - cmpOffset;
          });

    const dateSet = new Set<string>();
    for (const r of curRows) dateSet.add(r.recorded_at);
    const dates = Array.from(dateSet).sort();
    const present = Array.from(new Set(curRows.map((r) => r.source))) as SourceKey[];

    // Shift comparison rows forward so they overlay on the current axis.
    const cmpByDate = new Map<string, number | null>();
    if (compare !== "none") {
      for (const r of cmpRows) {
        const shifted = new Date(new Date(r.recorded_at).getTime() + cmpOffset)
          .toISOString()
          .slice(0, 10);
        if (r.value != null) cmpByDate.set(shifted, r.value);
      }
    }

    const data = dates.map((d) => {
      const row: Record<string, string | number | null> = {
        x: d,
        label: format(new Date(d), range >= 90 ? "MMM" : "MMM d"),
      };
      for (const s of present) {
        const found = curRows.find((r) => r.recorded_at === d && r.source === s);
        row[s] = found?.value ?? null;
      }
      const key = d.slice(0, 10);
      const cmp = cmpByDate.get(key);
      if (cmp != null) row.__compare = cmp;
      return row;
    });

    const avg = (rs: Row[]) => {
      const vs = rs.map((r) => r.value).filter((v): v is number => v != null);
      if (vs.length === 0) return null;
      return vs.reduce((a, b) => a + b, 0) / vs.length;
    };
    const curAvg = avg(curRows);
    const cmpAvg = avg(cmpRows);
    const dlt =
      curAvg != null && cmpAvg != null && cmpAvg !== 0
        ? ((curAvg - cmpAvg) / Math.abs(cmpAvg)) * 100
        : null;

    // Baseline + status from full history (preferred source).
    const preferred: SourceKey = present.includes("oura" as SourceKey)
      ? ("oura" as SourceKey)
      : (present[0] ?? ("oura" as SourceKey));
    const headlineRows = allRows.filter((r) => r.source === preferred);
    const baseSet = headlineRows.slice(-30, -3).map((r) => r.value);
    const baselineStats = stats(baseSet);
    const last = [...curRows].reverse().find((r) => r.value != null)?.value ?? null;
    const cls = classifyValue(meta, last, baselineStats);
    return {
      chartData: data,
      sourcesPresent: present,
      baseline: baselineStats,
      current: last,
      status: cls,
      currentAvg: curAvg,
      compareAvg: cmpAvg,
      delta: dlt,
    };
  }, [rows, meta, range, compare]);

  if (!meta) return null;
  const tonePill = statusTone(meta, status);
  const shellTone: "alert" | "warn" | "good" | "neutral" =
    status === "in_range"
      ? "good"
      : status === "unknown"
        ? "neutral"
        : ((meta.direction === "higher_better" && status === "low") ||
            (meta.direction === "lower_better" && status === "high") ||
            meta.direction === "neutral")
          ? "warn"
          : "neutral";

  const sdHi =
    baseline.mean != null && baseline.stddev != null ? baseline.mean + baseline.stddev : null;
  const sdLo =
    baseline.mean != null && baseline.stddev != null ? baseline.mean - baseline.stddev : null;

  return (
    <MetricShell back={{ to: "/biometrics", label: t("nav.allSignals") }}>
      <MetricTitle
        title={meta.label}
        status={{
          tone: shellTone,
          label: tonePill.label,
          value: current != null ? meta.format(current) : undefined,
        }}
      />

      <MetricStatCards
        latest={{ value: meta.format(current), tone: shellTone }}
        optimal={{
          value: baseline.mean != null ? meta.format(baseline.mean) : "–",
        }}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-foreground/60">
          {baseline.mean != null
            ? `Your 30-day baseline · ${meta.format(baseline.mean)}`
            : "Building your personal baseline…"}
        </p>
        <OuraSyncStatus
          variant="compact"
          onSynced={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {([1, 7, 30, 90, 365] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition " +
              (range === r
                ? "bg-foreground text-background"
                : "bg-secondary/60 text-foreground hover:bg-secondary")
            }
          >
            {r === 1 ? "Today" : r === 365 ? "1y" : `${r}d`}
          </button>
        ))}
        <span className="mx-2 text-[11px] text-foreground/60">vs</span>
        {(
          [
            { v: "previous", l: range === 1 ? "Yesterday" : range === 7 ? "Last week" : range === 30 ? "Last month" : range === 90 ? "Prev 90d" : "Prev year" },
            { v: "year_ago", l: "Year ago" },
            { v: "none", l: "None" },
          ] as Array<{ v: CompareMode; l: string }>
        ).map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setCompare(opt.v)}
            className={
              "rounded-full px-3 py-1.5 text-[11px] font-medium transition " +
              (compare === opt.v
                ? "bg-foreground text-background"
                : "bg-secondary/40 text-foreground hover:bg-secondary")
            }
          >
            {opt.l}
          </button>
        ))}
      </div>

      {compare !== "none" && currentAvg != null && compareAvg != null && (
        <div className="mt-3 flex flex-wrap items-baseline gap-3 text-sm">
          <span className="text-foreground/60">
            Avg this window: <span className="text-foreground">{meta.format(currentAvg)}</span>
          </span>
          <span className="text-foreground/60">
            · vs <span className="text-foreground">{meta.format(compareAvg)}</span>
          </span>
          {delta != null && (
            <span
              className={
                "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                (Math.abs(delta) < 1
                  ? "bg-secondary text-foreground"
                  : delta > 0
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-rose-500/15 text-rose-700")
              }
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
        </div>
      )}

      <div className="metric-sheet mt-4 p-4 sm:p-6 h-[340px]">
        {rows === null ? (
          <div className="h-full w-full animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-foreground/60">
            No readings in this window yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={36}
                domain={["auto", "auto"]}
              />
              {sdHi != null && sdLo != null && (
                <ReferenceArea
                  y1={sdLo}
                  y2={sdHi}
                  fill="var(--purple-primary)"
                  fillOpacity={0.08}
                  stroke="none"
                />
              )}
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v, name) => [
                  meta.format(typeof v === "number" ? v : Number(v)),
                  name === "__compare"
                    ? "Comparison"
                    : SOURCE_LABELS[name as SourceKey] ?? meta.label,
                ]}
              />
              {sourcesPresent.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  name={s}
                  stroke={SOURCE_COLORS[s] ?? "var(--purple-primary)"}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                  dot={false}
                />
              ))}
              {compare !== "none" && (
                <Line
                  type="monotone"
                  dataKey="__compare"
                  name="__compare"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  connectNulls
                  isAnimationActive={false}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {sourcesPresent.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-foreground/60">
          {sourcesPresent.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-5 rounded-full"
                style={{ background: SOURCE_COLORS[s] ?? "var(--purple-primary)" }}
              />
              {SOURCE_LABELS[s] ?? s}
            </span>
          ))}
        </div>
      )}

      <section className="mt-10">
        <p className="label-eyebrow text-foreground/60">What this means for you</p>
        <p className="mt-3 font-serif text-lg leading-relaxed text-foreground/85 max-w-prose">
          {meta.meaning}
        </p>
        <p className="mt-3 text-sm text-foreground/60">{meta.baselineHint}</p>
      </section>

      <AskPurpleRail
        prompts={[
          `How has my ${meta.short.toLowerCase()} been trending?`,
          `What was happening on days my ${meta.short.toLowerCase()} dropped?`,
          `What does the research say about ${meta.short.toLowerCase()} and seizures?`,
        ]}
        onPick={(q) => navigate({ to: "/chat", search: { q } })}
      />
    </MetricShell>
  );
}