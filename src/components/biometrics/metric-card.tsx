import { Link } from "@tanstack/react-router";
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from "recharts";
import { Pin, PinOff } from "lucide-react";
import {
  METRICS,
  type MetricKey,
  classifyValue,
  statusTone,
  stats,
} from "@/lib/biometric-metrics";

type Series = Array<{ date: string; value: number | null }>;
type SourceKey = "oura" | "whoop" | "apple_health" | "manual";

const SOURCE_META: Record<SourceKey, { label: string; color: string; short: string }> = {
  oura:         { label: "Oura",         color: "var(--purple-primary)", short: "O" },
  whoop:        { label: "Whoop",        color: "#34D399",               short: "W" },
  apple_health: { label: "Apple Health", color: "#F472B6",               short: "A" },
  manual:       { label: "Manual",       color: "#A1A1AA",               short: "M" },
};

export function MetricCard({
  metric,
  series,
  seriesBySource,
  disableLink = false,
  compare,
  size = "default",
  pinned,
  onTogglePin,
}: {
  metric: MetricKey;
  /** Single-source series (legacy). Used as fallback when seriesBySource not provided. */
  series?: Series;
  /** Per-source series. When provided, the card renders one line per source. */
  seriesBySource?: Partial<Record<SourceKey, Series>>;
  /** When true, render as a plain card instead of a Link to /biometrics/$metric.
   *  Used by the caregiver view, where the link would point to the wrong user. */
  disableLink?: boolean;
  /** Optional comparison summary (e.g. vs previous period / vs year ago). */
  compare?: {
    label: string;
    deltaPct: number | null;
    compareValue: number | null;
  };
  /** "hero" renders a larger, more readable card for pinned favorites. */
  size?: "default" | "hero";
  /** Pin state. When `onTogglePin` is provided, a pin toggle is rendered. */
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  const meta = METRICS[metric];

  // Normalize input: prefer seriesBySource; fall back to single-source `series`.
  const bySource: Partial<Record<SourceKey, Series>> = seriesBySource ?? {
    oura: series ?? [],
  };
  const sources = (Object.keys(bySource) as SourceKey[]).filter(
    (s) => (bySource[s] ?? []).some((d) => d.value != null),
  );

  // Build a merged date axis (union of all source dates) for the sparkline.
  const dateSet = new Set<string>();
  for (const s of sources) for (const r of bySource[s] ?? []) dateSet.add(r.date);
  const allDates = Array.from(dateSet).sort();
  const recentDates = allDates.slice(-14);

  // For headline value + baseline + status, prefer the source with the most recent reading.
  const headlineSource: SourceKey =
    sources
      .map<[SourceKey, string | undefined]>((s) => [
        s,
        [...(bySource[s] ?? [])].reverse().find((d) => d.value != null)?.date,
      ])
      .sort((a, b) => (b[1] ?? "").localeCompare(a[1] ?? ""))[0]?.[0] ?? "oura";
  const headlineSeries = bySource[headlineSource] ?? [];
  const baselineWindow = headlineSeries.slice(-30, -3);
  const baseline = stats(baselineWindow.map((d) => d.value));
  const current = [...headlineSeries].reverse().find((d) => d.value != null)?.value ?? null;
  const status = classifyValue(meta, current, baseline);
  const tone = statusTone(meta, status);

  // Build chart rows: one row per date, one column per source.
  const sparkData = recentDates.map((d) => {
    const row: Record<string, string | number | null> = { x: d };
    for (const s of sources) {
      const found = (bySource[s] ?? []).find((r) => r.date === d);
      row[s] = found?.value ?? null;
    }
    return row;
  });
  const hasSpark = sources.some((s) => (bySource[s] ?? []).some((r) => r.value != null));
  const multi = sources.length > 1;

  const delta =
    current != null && baseline.mean != null ? current - baseline.mean : null;

  // Source-agreement chip: when 2+ sources reported in the last window, compare
  // their most recent values and flag divergence > 10%.
  let agreement: "agree" | "diverge" | null = null;
  if (sources.length >= 2) {
    const latestPerSource: number[] = [];
    for (const s of sources) {
      const v = [...(bySource[s] ?? [])].reverse().find((d) => d.value != null)?.value;
      if (v != null) latestPerSource.push(v);
    }
    if (latestPerSource.length >= 2) {
      const mean = latestPerSource.reduce((a, b) => a + b, 0) / latestPerSource.length;
      const maxDev = Math.max(...latestPerSource.map((v) => Math.abs(v - mean)));
      const pct = mean !== 0 ? (maxDev / Math.abs(mean)) * 100 : 0;
      agreement = pct > 10 ? "diverge" : "agree";
    }
  }

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="label-eyebrow text-muted-foreground">{meta.label}</p>
            {multi && (
              <span className="flex items-center gap-0.5">
                {sources.map((s) => (
                  <span
                    key={s}
                    title={SOURCE_META[s].label}
                    aria-label={SOURCE_META[s].label}
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-background"
                    style={{ background: SOURCE_META[s].color }}
                  >
                    {SOURCE_META[s].short}
                  </span>
                ))}
              </span>
            )}
            {agreement && (
              <span
                title={
                  agreement === "agree"
                    ? "Sources agree (within 10%)"
                    : "Sources disagree (>10% spread)"
                }
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  agreement === "agree" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            )}
          </div>
          <p
            className={
              size === "hero"
                ? "mt-3 font-serif text-5xl sm:text-6xl text-foreground leading-none"
                : "mt-2 font-serif text-3xl sm:text-4xl text-foreground leading-none"
            }
          >
            {meta.format(current)}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase font-medium ${tone.cls}`}
          >
            {tone.label}
          </span>
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin();
              }}
              aria-label={pinned ? `Unpin ${meta.label}` : `Pin ${meta.label}`}
              aria-pressed={!!pinned}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                pinned
                  ? "border-transparent bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)]"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {hasSpark && (
        <div className="mt-3 h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <YAxis hide domain={["auto", "auto"]} />
              {multi && (
                <Tooltip
                  cursor={{ stroke: "var(--border)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "11px",
                  }}
                  formatter={(v, name) => {
                    const s = name as SourceKey;
                    return [
                      meta.format(typeof v === "number" ? v : Number(v)),
                      SOURCE_META[s]?.label ?? String(name),
                    ];
                  }}
                  labelFormatter={() => ""}
                />
              )}
              {sources.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={SOURCE_META[s].color}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  connectNulls
                  dot={false}
                />
              ))}
            </LineChart>
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

      {compare && (
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{compare.label}</span>
          {compare.deltaPct == null ? (
            <span className="text-muted-foreground">, </span>
          ) : (
            <span
              className={
                Math.abs(compare.deltaPct) < 1
                  ? "text-muted-foreground"
                  : compare.deltaPct > 0
                    ? "text-emerald-500"
                    : "text-rose-500"
              }
            >
              {compare.deltaPct > 0 ? "+" : ""}
              {compare.deltaPct.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </>
  );

  if (disableLink) {
    return (
      <div
        className={`block rounded-2xl border border-border bg-card ${
          size === "hero" ? "p-5 sm:p-7" : "p-4 sm:p-5"
        }`}
      >
        {inner}
      </div>
    );
  }
  return (
    <Link
      to="/biometrics/$metric"
      params={{ metric }}
      className={`group block rounded-2xl border border-border bg-card transition hover:border-foreground/30 hover:shadow-sm ${
        size === "hero" ? "p-5 sm:p-7" : "p-4 sm:p-5"
      }`}
    >
      {inner}
    </Link>
  );
}