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
          "glass-press relative flex flex-col items-center justify-center gap-0.5 min-h-[60px] min-w-[44px] touch-manipulation cursor-pointer text-[11px] transition-[color,opacity] active:opacity-80",
          active
            ? "nav-glass-tab-active text-[color:var(--purple-primary)]"
            : "text-[color:var(--text-tertiary)] hover:text-foreground",
        )}
      >
        <span className="nav-tab-icon-wrap" aria-hidden="true">
          <Icon className="h-6 w-6" strokeWidth={active ? 2 : 1.6} />
        </span>
        <span className="nav-tab-label font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className={`${visibilityClass} bottom-0 inset-x-0 z-40 pointer-events-none touch-manipulation`}
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <div className="mx-auto w-full max-w-3xl px-4 pointer-events-auto">
        <div className="nav-glass-bar">
          <div className="grid grid-cols-5 items-center">
            {renderTab(TABS[0])}
            {renderTab(TABS[1])}
            <div className="flex items-center justify-center">
              <Link
                to="/journal/new"
                aria-label={t("nav.capture", { defaultValue: "Capture" })}
                className="glass-press -mt-6 inline-flex h-14 w-14 min-h-[56px] min-w-[56px] touch-manipulation cursor-pointer items-center justify-center rounded-full bg-[color:var(--purple-primary)] text-white shadow-lg shadow-[color:var(--purple-primary)]/40 ring-2 ring-[color:var(--glass-nav-border)] transition-[transform,opacity]"
              >
                <Plus className="h-7 w-7" aria-hidden="true" />
              </Link>
            </div>
            {renderTab(TABS[2])}
            {renderTab(TABS[3])}
          </div>
        </div>
      </div>
    </nav>
  );
}
