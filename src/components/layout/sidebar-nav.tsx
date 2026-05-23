import { Link, useRouterState } from "@tanstack/react-router";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-16 lg:w-60 border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center h-16 px-4 lg:px-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-7 w-7 rounded-md bg-primary" aria-hidden />
          <span className="hidden lg:inline font-serif text-xl text-foreground">Purple</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                "justify-center lg:justify-start",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="hidden lg:block px-6 py-4 text-xs text-muted-foreground border-t border-border">
        <p className="font-serif italic">Purple</p>
        <p className="mt-1">Free forever. Open source. Yours.</p>
      </div>
    </aside>
  );
}