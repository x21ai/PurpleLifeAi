import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { navTree, type NavGroup, type NavLeaf } from "./nav-items";
import { cn } from "@/lib/utils";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";
import { CaregiverNavLink } from "./caregiver-nav-link";
import { ChatUnreadBadge } from "./chat-unread-badge";

const STORAGE_KEY = "purple-sidebar-open-groups";

function loadOpen(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function isPathInGroup(group: NavGroup, pathname: string): boolean {
  if (group.to && pathname === group.to) return true;
  if (!group.children) return false;
  return group.children.some(
    (c) => pathname === c.to || pathname.startsWith(c.to + "/"),
  );
}

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setOpen(loadOpen());
  }, []);

  // Auto-open the group containing the current route.
  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const g of navTree) {
        if (g.children && isPathInGroup(g, pathname) && !next[g.id]) {
          next[g.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-16 lg:w-64 border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center h-20 px-4 lg:px-6 border-b border-border">
        <Link to="/today" className="flex items-center flex-1" aria-label="Purple, home">
          <span className="hidden lg:inline wordmark text-[14px] text-foreground">Purple</span>
          <span
            className="lg:hidden inline-block h-7 w-7 rounded-full"
            style={{ background: "var(--purple-primary)" }}
            aria-hidden
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 lg:px-3 space-y-0.5" aria-label="Primary">
        {navTree.map((group) =>
          group.children ? (
            <GroupItem
              key={group.id}
              group={group}
              open={!!open[group.id]}
              onToggle={() => toggle(group.id)}
              pathname={pathname}
            />
          ) : (
            <LeafLink
              key={group.id}
              to={group.to!}
              label={group.label}
              Icon={group.icon}
              active={pathname === group.to}
            />
          ),
        )}
        <CaregiverNavLink />
        <div className="hidden lg:block px-1 pt-2">
          <PendingInboxBadge variant="full" />
        </div>
      </nav>
    </aside>
  );
}

function GroupItem({
  group,
  open,
  onToggle,
  pathname,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const Icon = group.icon;
  const containsActive = isPathInGroup(group, pathname);
  const isExactActive = !!group.to && pathname === group.to;

  const rowClass = cn(
    "group w-full flex items-center gap-3 rounded-xl pl-3 pr-1 py-2.5 text-[14px] transition-colors",
    "justify-center lg:justify-start",
    isExactActive
      ? "bg-secondary text-foreground font-medium"
      : containsActive
        ? "text-foreground font-medium"
        : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
  );

  const iconEl = (
    <Icon
      className={cn(
        "h-5 w-5 shrink-0",
        containsActive && "text-[color:var(--purple-primary)]",
      )}
      strokeWidth={containsActive ? 2 : 1.6}
    />
  );

  const chevron = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-expanded={open}
      aria-label={open ? `Collapse ${group.label}` : `Expand ${group.label}`}
      className="hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
    >
      <ChevronDown
        className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
      />
    </button>
  );

  return (
    <div>
      {group.to ? (
        <div className={rowClass}>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={group.to as any}
            aria-current={isExactActive ? "page" : undefined}
            className="flex items-center gap-3 flex-1 min-w-0 -ml-3 pl-3 -my-2.5 py-2.5 rounded-xl"
          >
            {iconEl}
            <span className="hidden lg:inline flex-1 text-left">{group.label}</span>
          </Link>
          {chevron}
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className={rowClass}
        >
          {iconEl}
          <span className="hidden lg:inline flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={cn(
              "hidden lg:inline h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      )}
      {open && group.children && (
        <div className="hidden lg:block ml-3 pl-3 mt-0.5 mb-1.5 border-l border-border/60 space-y-0.5">
          {group.children.map((c) => (
            <SubLink
              key={c.to}
              to={c.to}
              label={c.label}
              Icon={c.icon}
              active={pathname === c.to || pathname.startsWith(c.to + "/")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeafLink({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
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
        className={cn("h-5 w-5 shrink-0", active && "text-[color:var(--purple-primary)]")}
        strokeWidth={active ? 2 : 1.6}
      />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

function SubLink({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: NavLeaf["icon"];
  active: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
      <span>{label}</span>
      {to === "/chat-care" && <ChatUnreadBadge />}
    </Link>
  );
}