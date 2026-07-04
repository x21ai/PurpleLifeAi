import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, HeartPulse, TrendingUp, Settings2, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Tab = { to: string; icon: LucideIcon; key: string; label: string };

// Four primary tabs flank a raised center capture button (Oura-style).
const TABS: Tab[] = [
  { to: "/today", icon: Sun, key: "nav.today", label: "Today" },
  { to: "/my-health", icon: HeartPulse, key: "nav.body", label: "My Body" },
  { to: "/insights", icon: TrendingUp, key: "nav.patterns", label: "Insights" },
  { to: "/settings", icon: Settings2, key: "nav.settings", label: "Settings" },
];

export function BottomNav({ variant = "responsive" }: { variant?: "responsive" | "native" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const visibilityClass = variant === "native" ? "fixed" : "md:hidden fixed";

  const renderTab = (tab: Tab) => {
    const active = pathname === tab.to || pathname.startsWith(tab.to + "/");
    const Icon = tab.icon;
    const label = t(tab.key, { defaultValue: tab.label });
    return (
      <Link
        key={tab.to}
        to={tab.to}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-1 min-h-[60px] text-[11px] transition-colors",
          active
            ? "text-[color:var(--purple-primary)]"
            : "text-[color:var(--text-tertiary)] hover:text-foreground",
        )}
      >
        <Icon className="h-6 w-6" aria-hidden="true" strokeWidth={active ? 2 : 1.6} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className={`${visibilityClass} bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 items-center">
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}
        <div className="flex items-center justify-center">
          <Link
            to="/journal/new"
            aria-label={t("nav.capture", { defaultValue: "Capture" })}
            className="-mt-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--purple-primary)] text-white shadow-lg shadow-[color:var(--purple-primary)]/40 active:scale-95 transition"
          >
            <Plus className="h-7 w-7" aria-hidden="true" />
          </Link>
        </div>
        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </div>
    </nav>
  );
}
