import { Link, useRouterState } from "@tanstack/react-router";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Mobile keeps 5 tabs. Account & Tools live one tap inside the Settings hub.
  const MOBILE_TABS = new Set(["/today", "/journal", "/timeline", "/insights", "/settings"]);
  const items = navItems.filter((i) => MOBILE_TABS.has(i.to));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[60px] text-[11px] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-[color:var(--text-tertiary)] hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active && "text-[color:var(--purple-primary)]",
                  )}
                  aria-hidden="true"
                  strokeWidth={active ? 2 : 1.6}
                />
                <span className="text-[11px] font-medium">{item.label}</span>
                {active && (
                  <span
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-[color:var(--purple-primary)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}