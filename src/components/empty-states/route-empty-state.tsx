import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  testId: string;
  eyebrow?: string;
  heading: string;
  body: string;
  action: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

/**
 * Calm, full-width empty state for core routes before the user has data.
 * One message about what will appear, one primary action.
 */
export function RouteEmptyState({
  testId,
  eyebrow,
  heading,
  body,
  action,
  icon: Icon,
  className,
}: Props) {
  return (
    <section
      data-testid={testId}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12",
        className,
      )}
      aria-label={heading}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-primary, var(--primary))" }}
        aria-hidden
      />
      {eyebrow && (
        <p className="label-eyebrow text-muted-foreground relative">{eyebrow}</p>
      )}
      {Icon && (
        <Icon
          className="relative mt-4 h-10 w-10 text-[color:var(--purple-primary)]/80"
          aria-hidden
        />
      )}
      <h2
        className={cn(
          "relative font-serif text-3xl sm:text-4xl leading-[1.08] tracking-tight text-foreground max-w-[22ch]",
          eyebrow || Icon ? "mt-4" : "mt-0",
        )}
      >
        {heading}
      </h2>
      <p className="relative mt-5 body-serif text-foreground/75 max-w-[44ch]">{body}</p>
      <div className="relative mt-8">{action}</div>
    </section>
  );
}
