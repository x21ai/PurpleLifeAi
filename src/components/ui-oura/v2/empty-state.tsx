import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * Spec'd empty state, 48px icon, Source Serif 4 message, generous padding.
 */
export function EmptyState({
  icon: Icon,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-16 px-6 rounded-[24px] bg-card/40", className)}>
      <Icon className="h-12 w-12 mx-auto text-[color:var(--purple-primary)]/70" />
      <p className="mt-6 font-serif text-lg leading-relaxed text-foreground max-w-md mx-auto">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
