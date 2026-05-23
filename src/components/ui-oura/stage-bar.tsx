import { cn } from "@/lib/utils";

export type Stage = {
  label: string;
  /** minutes */
  value: number;
  color: string; // css color
};

/** Horizontal stacked bar like Oura's sleep-stage chart */
export function StageBar({
  stages,
  className,
  ariaLabel,
}: {
  stages: Stage[];
  className?: string;
  ariaLabel?: string;
}) {
  const total = stages.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn("space-y-2", className)}
      role="img"
      aria-label={
        ariaLabel ??
        `Sleep stages: ${stages.map((s) => `${s.label} ${fmt(s.value)}`).join(", ")}`
      }
    >
      <div className="flex h-2 overflow-hidden rounded-full bg-[color:var(--ring-track)]">
        {stages.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            className="h-full"
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
        {stages.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-serif text-foreground tabular-nums">{fmt(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmt(min: number) {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}