import { cn } from "@/lib/utils";

type Item = {
  value: React.ReactNode;
  label: string;
  sub?: string;
};

/**
 * Three large statistics, no card chrome, generous vertical padding.
 */
export function BodyMeasurementsRow({
  items,
  className,
}: {
  items: Item[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid grid-cols-3 gap-4 py-12 sm:py-16 border-y border-border",
        className,
      )}
    >
      {items.map((it, i) => (
        <div key={i} className="flex flex-col items-start text-left">
          <p className="numeric-display text-[44px] sm:text-[64px] text-foreground">
            {it.value}
          </p>
          <p className="label-eyebrow mt-3">{it.label}</p>
          {it.sub && (
            <p className="mt-1 text-xs text-muted-foreground">{it.sub}</p>
          )}
        </div>
      ))}
    </section>
  );
}