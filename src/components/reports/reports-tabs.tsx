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
    <div className="mb-6 inline-flex rounded-full border border-foreground/10 bg-foreground/[0.04] p-1 text-sm">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              active
                ? "bg-primary text-primary-foreground"
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
