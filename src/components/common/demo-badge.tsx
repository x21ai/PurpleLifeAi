import { cn } from "@/lib/utils";

/**
 * Small pill shown next to sample figures so demo values are never mistaken
 * for the user's real data. Render it whenever a screen falls back to demo
 * numbers because no real biometrics exist yet.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />
      Demo data
    </span>
  );
}

/**
 * One-line explainer for a screen that is currently showing demo values.
 * Pairs with DemoBadge at the top of Vitals and My Health.
 */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-[13px] text-muted-foreground", className)}>
      Showing demo data. Connect a device or log a few days to see your own numbers.
    </p>
  );
}
