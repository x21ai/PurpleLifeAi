import { createFileRoute, Link, useParams, useRouter, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
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
  Dot,
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

const VALID = new Set<MetricKey>(METRIC_ORDER);

export const Route = createFileRoute("/_app/biometrics/$metric")({
  head: ({ params }) => {
    const meta = METRICS[params.metric as MetricKey];
    const label = meta?.label ?? "Metric";
    return {
      meta: [
        { title: `${label} — Purple` },
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

type Row = { recorded_at: string; value: number | null };
type Range = 7 | 30 | 90;

function MetricDrillPage() {
  useRouteTheme("dark");
  const { metric } = useParams({ from: "/_app/biometrics/$metric" });
  const meta = METRICS[metric as MetricKey];
  const { session } = useAuth();
  const uid = session?.user.id;

  const [range, setRange] = useState<Range>(30);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!uid || !meta) return;
    const since = new Date(Date.now() - range * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from("biometrics")
        .select(`recorded_at, ${meta.column}`)
        .eq("user_id", uid)
        .eq("source", "oura")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      const mapped: Row[] = (data ?? []).map((r: Record<string, unknown>) => {
        const raw = r[meta.column];
        const n = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        return {
          recorded_at: String(r.recorded_at ?? ""),
          value: Number.isFinite(n as number) ? (n as number) : null,
        };
      });
      setRows(mapped);
    })();
  }, [uid, meta, range, refreshKey]);

  const { chartData, baseline, current, status } = useMemo(() => {
    const data = (rows ?? []).map((r) => ({
      x: r.recorded_at,
      y: r.value,
      label: format(new Date(r.recorded_at), "MMM d"),
    }));
    const baseSet = (rows ?? []).slice(-30, -3).map((r) => r.value);
    const baselineStats = stats(baseSet);
    const last = [...(rows ?? [])].reverse().find((r) => r.value != null)?.value ?? null;
    const cls = classifyValue(meta, last, baselineStats);
    return { chartData: data, baseline: baselineStats, current: last, status: cls };
  }, [rows, meta]);

  if (!meta) return null;
  const tone = statusTone(meta, status);

  const sdHi =
    baseline.mean != null && baseline.stddev != null ? baseline.mean + baseline.stddev : null;
  const sdLo =
    baseline.mean != null && baseline.stddev != null ? baseline.mean - baseline.stddev : null;

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-24">
      <Link
        to="/biometrics"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All signals
      </Link>

      <div className="mt-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-eyebrow text-muted-foreground">{meta.short}</p>
          <h1 className="font-serif text-[40px] sm:text-5xl leading-[1.05] tracking-tight mt-3 text-foreground">
            {meta.label}
          </h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="font-serif text-[64px] sm:text-7xl leading-none">
              {meta.format(current)}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] tracking-wide uppercase font-medium ${tone.cls}`}
            >
              {tone.label}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {baseline.mean != null
              ? `Your 30-day baseline: ${meta.format(baseline.mean)}`
              : "Building your personal baseline…"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <OuraSyncStatus
            variant="compact"
            onSynced={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        {([7, 30, 90] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition " +
              (range === r
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-secondary/70")
            }
          >
            {r}d
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6 h-[340px]">
        {rows === null ? (
          <div className="h-full w-full animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
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
                formatter={(v) => [
                  meta.format(typeof v === "number" ? v : Number(v)),
                  meta.label,
                ]}
              />
              <Line
                type="monotone"
                dataKey="y"
                stroke="var(--purple-primary)"
                strokeWidth={2}
                connectNulls
                isAnimationActive={false}
                dot={(props: {
                  cx?: number;
                  cy?: number;
                  index?: number;
                  payload?: { y?: number | null };
                }) => {
                  const v = props.payload?.y;
                  const cx = props.cx ?? 0;
                  const cy = props.cy ?? 0;
                  if (v == null) return <></>;
                  const isAnomaly =
                    sdHi != null && sdLo != null && (v > sdHi || v < sdLo);
                  return (
                    <Dot
                      key={`d-${props.index ?? 0}`}
                      cx={cx}
                      cy={cy}
                      r={isAnomaly ? 3.5 : 2}
                      fill={isAnomaly ? "var(--warning)" : "var(--purple-primary)"}
                      stroke="none"
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <section className="mt-10">
        <p className="label-eyebrow text-muted-foreground">What this means for you</p>
        <p className="mt-3 font-serif text-lg leading-relaxed text-foreground/85 max-w-prose">
          {meta.meaning}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{meta.baselineHint}</p>
      </section>

      <section className="mt-10">
        <p className="label-eyebrow text-muted-foreground">Ask Purple about this</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            `How has my ${meta.short.toLowerCase()} been trending?`,
            `What was happening on days my ${meta.short.toLowerCase()} dropped?`,
            `What does the research say about ${meta.short.toLowerCase()} and seizures?`,
          ].map((q) => (
            <Link
              key={q}
              to="/chat"
              search={{ q }}
              className="text-left text-sm rounded-full border border-border/60 bg-secondary/40 hover:bg-secondary px-4 py-2 transition"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}