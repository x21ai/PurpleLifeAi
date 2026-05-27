import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import {
  METRICS,
  type MetricKey,
  classifyValue,
  statusTone,
  stats,
} from "@/lib/biometric-metrics";

type Series = Array<{ date: string; value: number | null }>;

export function MetricCard({ metric, series }: { metric: MetricKey; series: Series }) {
  const meta = METRICS[metric];
  const recent = series.slice(-14);
  const baselineWindow = series.slice(-30, -3);
  const baseline = stats(baselineWindow.map((d) => d.value));
  const current = [...series].reverse().find((d) => d.value != null)?.value ?? null;
  const status = classifyValue(meta, current, baseline);
  const tone = statusTone(meta, status);
  const sparkData = recent.map((d) => ({ x: d.date, y: d.value }));
  const hasSpark = sparkData.some((d) => typeof d.y === "number");

  const delta =
    current != null && baseline.mean != null ? current - baseline.mean : null;

  return (
    <Link
      to="/biometrics/$metric"
      params={{ metric }}
      className="group block rounded-2xl border border-border bg-card p-4 sm:p-5 transition hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-eyebrow text-muted-foreground">{meta.label}</p>
          <p className="mt-2 font-serif text-3xl sm:text-4xl text-foreground leading-none">
            {meta.format(current)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase font-medium ${tone.cls}`}
        >
          {tone.label}
        </span>
      </div>

      {hasSpark && (
        <div className="mt-3 h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <defs>
                <linearGradient id={`spark-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--purple-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--purple-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke="var(--purple-primary)"
                strokeWidth={1.5}
                fill={`url(#spark-${metric})`}
                isAnimationActive={false}
                connectNulls
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {baseline.mean != null
            ? `Baseline ${meta.format(baseline.mean)}`
            : "Building baseline…"}
        </span>
        {delta != null && baseline.mean != null && Math.abs(delta) > 0.01 && (
          <span>
            {delta > 0 ? "▲" : "▼"} {meta.format(Math.abs(delta))}
          </span>
        )}
      </div>
    </Link>
  );
}