import * as React from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Shield, Users, MessageSquare, Mail, MessageCircle, Flag, BookMarked, Ticket, SlidersHorizontal } from "lucide-react";
import { useIsAdmin } from "@/lib/use-is-admin";

const navItems: Array<{ to: string; label: string; icon: typeof Shield; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: Shield, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/promo", label: "Promo codes", icon: Ticket },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/contact", label: "Contact", icon: Mail },
  { to: "/admin/feedback", label: "Feedback", icon: MessageCircle },
  { to: "/admin/community", label: "Community", icon: Flag },
  { to: "/admin/resources", label: "Resources", icon: BookMarked },
  { to: "/admin/rules", label: "Platform rules", icon: SlidersHorizontal },
];

export function AdminShell({ children }: { children?: React.ReactNode }) {
  const { loading, isAdmin } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-3xl">Restricted</h1>
        <p className="mt-3 text-muted-foreground">You don't have access to this area.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 pt-8 pb-24">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Shield className="h-3.5 w-3.5" /> Admin
      </div>
      <nav className="mt-4 -mx-1 flex gap-1 overflow-x-auto pb-2">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as "/admin"}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8">{children ?? <Outlet />}</div>
    </div>
  );
}