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
        <div key={i} className="flex min-w-0 flex-col items-start text-left">
          <p className="numeric-display text-[36px] sm:text-[56px] leading-[1.1] text-foreground overflow-visible">
            {it.value}
          </p>
          <p className="label-eyebrow mt-3 whitespace-nowrap">{it.label}</p>
          {it.sub && (
            <p className="mt-1 text-xs text-muted-foreground">{it.sub}</p>
          )}
        </div>
      ))}
    </section>
  );
}