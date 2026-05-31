import { Link, useRouterState } from "@tanstack/react-router";
import { navItems, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const NAV_I18N: Record<string, string> = {
  "/today": "nav.today",
  "/journal": "nav.journal",
  "/timeline": "nav.timeline",
  "/insights": "nav.patterns",
  "/tools": "nav.tools",
  "/account": "nav.account",
  "/settings": "nav.settings",
};

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  // Top items (everything except Settings — which sticks to the bottom).
  const top = navItems.filter((i) => i.to !== "/settings");
  const settings = navItems.find((i) => i.to === "/settings");

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-16 lg:w-60 border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center h-20 px-4 lg:px-6 border-b border-border">
        <Link to="/today" className="flex items-center" aria-label="Purple — home">
          <span
            className="hidden lg:inline wordmark text-[14px] text-foreground"
          >
            Purple
          </span>
          <span
            className="lg:hidden inline-block h-7 w-7 rounded-full"
            style={{ background: "var(--purple-primary)" }}
            aria-hidden
          />
        </Link>
      </div>
      <nav className="flex-1 py-6 px-2 lg:px-3 space-y-1" aria-label="Primary">
        {top.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <SideLink
              key={item.to}
              to={item.to}
              label={t(NAV_I18N[item.to] ?? "", { defaultValue: item.label })}
              Icon={Icon}
              active={active}
            />
          );
        })}
      </nav>
      {settings && (
        <div className="border-t border-border p-2 lg:p-3">
          <SideLink
            to={settings.to}
            label={t(NAV_I18N[settings.to] ?? "", { defaultValue: settings.label })}
            Icon={settings.icon}
            active={pathname === settings.to}
          />
        </div>
      )}
    </aside>
  );
}

function SideLink({
  to,
  label,
  Icon,
  active,
}: {
  to: NavItem["to"];
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
        "justify-center lg:justify-start",
        active
          ? "bg-secondary text-foreground font-medium"
          : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active && "text-[color:var(--purple-primary)]",
        )}
        strokeWidth={active ? 2 : 1.6}
      />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}