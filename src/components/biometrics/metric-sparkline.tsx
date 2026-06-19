import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip } from "recharts";

export type SparkSource = { key: string; color: string; label: string };

/**
 * The recharts sparkline for a MetricCard, split into its own module so the
 * (heavy) recharts dependency can be lazy-loaded. /biometrics renders ~18
 * metric cards; pulling recharts out of the synchronous render keeps it off
 * the first-paint critical path. The h-12 wrapper in MetricCard reserves the
 * height so the async chart does not cause layout shift.
 */
export default function MetricSparkline({
  data,
  sources,
  multi,
  format,
}: {
  data: Array<Record<string, string | number | null>>;
  sources: SparkSource[];
  multi: boolean;
  format: (v: number | null) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
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
              const s = sources.find((x) => x.key === name);
              return [format(typeof v === "number" ? v : Number(v)), s?.label ?? String(name)];
            }}
            labelFormatter={() => ""}
          />
        )}
        {sources.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={1.5}
            isAnimationActive={false}
            connectNulls
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
