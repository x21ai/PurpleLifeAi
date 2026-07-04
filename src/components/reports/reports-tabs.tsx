import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * Pill tab bar that switches between /reports/documents and /reports/metrics.
 * Lives at the top of both child pages so the dark ReportShell stays consistent.
 */
export function ReportsTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs: Array<{ to: "/reports/documents" | "/reports/metrics"; label: string }> = [
    { to: "/reports/metrics", label: "Metrics" },
    { to: "/reports/documents", label: "Reports" },
  ];
  return (
    <div className="mb-6 glass-surface inline-flex rounded-full p-1 text-sm">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "glass-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-4 py-2 transition-[color,transform]",
              active
                ? "nav-glass-row-active text-foreground font-medium scale-[1.02]"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
