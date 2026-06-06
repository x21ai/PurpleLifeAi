import { useId, useMemo } from "react";

export type WaveSeries = {
  label: string;
  /** chronological values, oldest → newest */
  values: number[];
  /** css color, e.g. "var(--data-1)" */
  color: string;
  /** how to render the right-edge label */
  format?: (v: number) => string;
};

/**
 * Hand-rolled smooth multi-line trend. No axis chrome, endpoint dot + label
 * on the right, faint baseline. Mirrors Oura's "Resting Heart Rate" /
 * stacked-metrics styling.
 */
export function WaveTrend({
  series,
  height = 160,
  className,
  ariaLabel,
}: {
  series: WaveSeries[];
  height?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  const padX = 12;
  const padTop = 16;
  const padBottom = 24;
  const width = 600; // viewBox; scales responsively

  // Normalize every series to a shared 0..1 by its own min/max so curves are visible.
  const paths = useMemo(() => {
    return series.map((s, idx) => {
      const vals = s.values.length === 0 ? [0, 0] : s.values;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const span = max - min || 1;
      const stepX = (width - padX * 2) / Math.max(1, vals.length - 1);
      const innerH = height - padTop - padBottom;
      // Stack the three series vertically with overlap.
      const slotH = innerH / Math.max(1, series.length);
      const yBase = padTop + slotH * idx + slotH * 0.85;
      const yTop = padTop + slotH * idx + slotH * 0.15;
      const points = vals.map((v, i) => {
        const t = (v - min) / span;
        return {
          x: padX + stepX * i,
          y: yBase - (yBase - yTop) * t,
        };
      });
      const d = smoothPath(points);
      const last = points[points.length - 1]!;
      const lastVal = vals[vals.length - 1] ?? 0;
      return { ...s, d, last, lastVal };
    });
  }, [series, height]);

  const a11y =
    ariaLabel ??
    series.map((s) => `${s.label}: ${(s.format ?? String)(s.values[s.values.length - 1] ?? 0)}`).join(", ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={a11y}
      preserveAspectRatio="none"
      style={{ width: "100%", height }}
    >
      {/* baseline grid */}
      {paths.map((p, idx) => (
        <line
          key={`b-${idx}`}
          x1={padX}
          x2={width - padX}
          y1={p.last.y + 0.5}
          y2={p.last.y + 0.5}
          stroke="var(--border)"
          strokeDasharray="2 4"
          strokeWidth={1}
          opacity={0.4}
        />
      ))}
      {paths.map((p, idx) => (
        <g key={`p-${idx}`}>
          <path
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="stroke-dasharray"
              from="1, 2000"
              to="2000, 0"
              dur="1.2s"
              fill="freeze"
            />
          </path>
          {/* endpoint */}
          <circle cx={p.last.x} cy={p.last.y} r={3.5} fill={p.color} />
          <circle cx={p.last.x} cy={p.last.y} r={6} fill={p.color} opacity={0.18} />
          <text
            x={p.last.x - 10}
            y={p.last.y - 8}
            textAnchor="end"
            fontFamily="var(--font-serif)"
            fontSize={14}
            fill={p.color}
          >
            {(p.format ?? String)(p.lastVal)}
          </text>
          <text
            x={padX}
            y={p.last.y - 8}
            fontFamily="var(--font-sans)"
            fontSize={9}
            letterSpacing={2}
            fill="var(--muted-foreground)"
          >
            {p.label.toUpperCase()}
          </text>
        </g>
      ))}
      <title>{a11y}</title>
      <desc id={id}>{a11y}</desc>
    </svg>
  );
}

/** Cubic-bezier smoothing through points */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0]!;
    return `M ${p.x} ${p.y}`;
  }
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const tension = 0.2;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}