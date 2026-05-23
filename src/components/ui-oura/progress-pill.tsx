import { cn } from "@/lib/utils";

export function ProgressPill({
  label,
  value,
  pct,
  tone = "ink",
  className,
}: {
  label: string;
  value: React.ReactNode;
  /** 0–100 */
  pct: number;
  tone?: "ink" | "alert" | "muted";
  className?: string;
}) {
  const fill =
    tone === "alert"
      ? "bg-[color:var(--data-alert)]"
      : tone === "muted"
        ? "bg-[color:var(--data-5)]"
        : "bg-[color:var(--ring-fill)]";
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2", className)}>
      <span className="font-serif text-[15px] text-foreground/85">{label}</span>
      <span className="numeric-display font-serif text-base text-foreground tabular-nums">
        {value}
      </span>
      <div
        className="col-span-2 h-2 rounded-full bg-[color:var(--ring-track)] overflow-hidden"
        role="progressbar"
        aria-label={`${label}: ${typeof value === "string" ? value : clamped + "%"}`}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", fill)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}