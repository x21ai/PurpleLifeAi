import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Pin, PinOff, EyeOff, TrendingUp } from "lucide-react";
import {
  listTrendMetrics,
  setMetricPreference,
  type TrendMetricRow,
} from "@/lib/report-trends.functions";

function flagTone(flag: string | null) {
  if (flag === "high") return "text-[#FFA8BD]";
  if (flag === "low") return "text-[#F3D58B]";
  if (flag === "normal") return "text-[#5CE0AC]";
  return "report-muted";
}

function MetricCard({
  m,
  onTogglePin,
  onHide,
}: {
  m: TrendMetricRow;
  onTogglePin: () => void;
  onHide: () => void;
}) {
  const label = m.display_name ?? m.metric_key.replace(/_/g, " ");
  const chartData = m.series
    .filter((p) => p.value != null)
    .map((p) => ({ at: p.at, v: p.value as number }));

  return (
    <div className="group report-card relative flex flex-col gap-3 p-4">
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
          aria-label={m.pinned ? "Unpin" : "Pin to top"}
          title={m.pinned ? "Unpin" : "Pin to top"}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHide();
          }}
          aria-label="Hide"
          title="Hide from trends"
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link
        to="/reports/trends/$metricKey"
        params={{ metricKey: m.metric_key }}
        className="flex flex-col gap-2 min-w-0"
      >
        <div className="min-w-0 pr-16">
          <p className="text-sm text-white capitalize line-clamp-2 leading-snug">{label}</p>
          <p className="mt-1 text-[11px] report-muted">
            {m.count} readings
            {m.latest_value != null && (
              <>
                {" · latest "}
                <span className={flagTone(m.latest_flag)}>
                  {m.latest_value}
                  {m.unit ? ` ${m.unit}` : ""}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="h-14 w-full">
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#5CE0AC"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded bg-white/5" />
          )}
        </div>
      </Link>
    </div>
  );
}

export function TrendsSection() {
  const fetchList = useServerFn(listTrendMetrics);
  const setPref = useServerFn(setMetricPreference);
  const qc = useQueryClient();
  const [showHidden, setShowHidden] = React.useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["report-trend-metrics"],
    queryFn: () => fetchList(),
  });
  const metrics = (data?.metrics ?? []) as TrendMetricRow[];
  const visible = metrics.filter((m) => showHidden || !m.hidden);

  const labelOf = (m: TrendMetricRow) =>
    (m.display_name ?? m.metric_key.replace(/_/g, " ")).toLowerCase();
  const sorted = [...visible].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return labelOf(a).localeCompare(labelOf(b));
  });

  async function togglePin(m: TrendMetricRow) {
    await setPref({ data: { metricKey: m.metric_key, pinned: !m.pinned } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
  }

  async function hide(m: TrendMetricRow) {
    await setPref({ data: { metricKey: m.metric_key, hidden: true } });
    await qc.invalidateQueries({ queryKey: ["report-trend-metrics"] });
  }

  if (isLoading) return null;
  if (metrics.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl text-white">
            <TrendingUp className="h-4 w-4 text-[#5CE0AC]" /> Trends
          </h2>
          <p className="mt-1 text-sm report-muted">
            Every metric from your reports, in alphabetical order. Pin the ones that matter most.
          </p>
        </div>
        {metrics.some((m) => m.hidden) && (
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="text-xs text-white/60 hover:text-white"
          >
            {showHidden ? "Hide hidden" : "Show hidden"}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {sorted.map((m) => (
          <MetricCard
            key={m.metric_key}
            m={m}
            onTogglePin={() => void togglePin(m)}
            onHide={() => void hide(m)}
          />
        ))}
      </div>
    </section>
  );
}