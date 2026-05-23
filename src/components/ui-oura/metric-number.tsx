import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-3xl",
  md: "text-4xl sm:text-5xl",
  lg: "text-5xl sm:text-6xl",
  xl: "text-6xl sm:text-7xl",
};

export function MetricNumber({
  value,
  label,
  sub,
  size = "md",
  align = "left",
  className,
  tone = "ink",
}: {
  value: React.ReactNode;
  label?: string;
  sub?: React.ReactNode;
  size?: Size;
  align?: "left" | "center";
  className?: string;
  tone?: "ink" | "alert" | "muted";
}) {
  const color =
    tone === "alert"
      ? "text-[color:var(--data-alert)]"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <p className={cn("numeric-display font-serif", SIZE[size], color)}>{value}</p>
      {label && <p className="label-eyebrow mt-2">{label}</p>}
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}