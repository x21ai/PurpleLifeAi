import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { navTree, filterNavTree, type NavGroup, type NavLeaf } from "./nav-items";
import { cn } from "@/lib/utils";
import { usePlatformFlags } from "@/lib/platform-flags";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";
import { CaregiverNavLink } from "./caregiver-nav-link";
import { ChatUnreadBadge } from "./chat-unread-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const COLLAPSE_KEY = "purple-sidebar-collapsed";
const COLLAPSE_EVENT = "purple-sidebar-collapsed-change";

function readCollapsedPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Shared collapse state. Returns `[collapsed, toggle]` and persists to
 * localStorage. Other components (AppShell) subscribe via the custom event
 * dispatched on every change.
 */
export function useSidebarCollapsedPref(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(readCollapsedPref());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setCollapsed(typeof detail === "boolean" ? detail : readCollapsedPref());
    };
    window.addEventListener(COLLAPSE_EVENT, onChange);
    return () => window.removeEventListener(COLLAPSE_EVENT, onChange);
  }, []);
  const toggle = () => {
    const next = !readCollapsedPref();
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent(COLLAPSE_EVENT, { detail: next }));
  };
  return [collapsed, toggle];
}

/**
 * True when the sidebar should render in its icon-only form, either because
 * the viewport is below `lg` or because the user has collapsed it.
 */
function useCollapsedRail(): boolean {
  const [viewportNarrow, setViewportNarrow] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(min-width: 1024px)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setViewportNarrow(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const [userCollapsed] = useSidebarCollapsedPref();
  return viewportNarrow || userCollapsed;
}

/**
 * Tooltip only on the collapsed icon rail. At lg+ labels are inline, so skip
 * Tooltip entirely to avoid Radix asChild duplication on multi-child rows.
 */
function RailTooltip({ label, children }: { label: string; children: ReactNode }) {
  const collapsed = useCollapsedRail();
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

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
  return group.children.some((c) =>
    c.exact ? pathname === c.to : pathname === c.to || pathname.startsWith(c.to + "/"),
  );
}

export function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const { flags } = usePlatformFlags();
  const tree = filterNavTree(navTree, flags);
  const [collapsed, toggleCollapsed] = useSidebarCollapsedPref();

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
    <TooltipProvider>
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-16 border-r border-border bg-sidebar text-sidebar-foreground",
          collapsed ? "lg:w-16" : "lg:w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center h-14 border-b border-border",
            collapsed ? "justify-center px-0" : "justify-center lg:justify-between px-0 lg:px-4",
          )}
        >
          <Link
            to="/today"
            className={cn(
              "flex items-center",
              collapsed ? "justify-center flex-1" : "justify-center lg:justify-start",
            )}
            aria-label="Purple, home"
          >
            <span
              className={cn(
                "wordmark text-[14px] text-foreground",
                collapsed ? "hidden" : "hidden lg:inline",
              )}
            >
              Purple
            </span>
            <span
              className={cn(
                "wordmark text-[16px] text-foreground",
                collapsed ? "inline" : "lg:hidden",
              )}
              aria-hidden
            >
              P
            </span>
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto hide-scrollbar py-4 px-2 lg:px-3 space-y-0.5" aria-label="Primary">
          {tree.map((group) =>
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
          <div className={cn("hidden px-1 pt-2", collapsed ? "" : "lg:block")}>
            <PendingInboxBadge variant="full" />
          </div>
        </nav>
      </aside>
    </TooltipProvider>
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
  const collapsed = useCollapsedRail();

  // On the collapsed icon rail (md to lg, e.g. iPad portrait) the inline child
  // list is hidden, which would strand nested routes. Surface them in a click
  // flyout anchored to the rail icon so every route stays reachable.
  if (collapsed && group.children && group.children.length > 0) {
    return (
      <Popover>
        <PopoverTrigger
          aria-label={group.label}
          className={cn(
            "group w-full flex items-center justify-center rounded-xl py-2.5 transition-colors",
            containsActive
              ? "bg-secondary text-foreground"
              : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 shrink-0",
              containsActive && "text-[color:var(--purple-primary)]",
            )}
            strokeWidth={containsActive ? 2 : 1.6}
          />
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-56 p-2">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          {group.to && (
            <SubLink
              to={group.to}
              label={group.label}
              Icon={group.icon}
              active={isExactActive}
            />
          )}
          {group.children.map((c) => (
            <SubLink
              key={c.to}
              to={c.to}
              label={c.label}
              Icon={c.icon}
              active={c.exact ? pathname === c.to : pathname === c.to || pathname.startsWith(c.to + "/")}
            />
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  const rowClass = cn(
    "group w-full flex items-center gap-3 rounded-xl px-0 lg:pl-3 lg:pr-1 py-2.5 text-[14px] transition-colors",
    "justify-center lg:justify-start",
    isExactActive
      ? "bg-secondary text-foreground font-medium"
      : containsActive
        ? "text-foreground font-medium"
        : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
  );

  const iconEl = (
    <Icon
      className={cn("h-5 w-5 shrink-0", containsActive && "text-[color:var(--purple-primary)]")}
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
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
    </button>
  );

  const linkClass = cn(
    "flex items-center gap-3 flex-1 min-w-0 rounded-xl px-0 lg:pl-3 lg:pr-3 py-2.5 text-[14px] transition-colors",
    "justify-center lg:justify-start",
    isExactActive
      ? "bg-secondary text-foreground font-medium"
      : containsActive
        ? "text-foreground font-medium"
        : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
  );

  return (
    <div>
      {group.to ? (
        <div className="flex items-center w-full">
          <RailTooltip label={group.label}>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={group.to as any}
              aria-current={isExactActive ? "page" : undefined}
              aria-label={group.label}
              className={linkClass}
            >
              {iconEl}
              <span className="hidden lg:inline flex-1 text-left">{group.label}</span>
            </Link>
          </RailTooltip>
          {chevron}
        </div>
      ) : (
        <RailTooltip label={group.label}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={group.label}
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
        </RailTooltip>
      )}
      {open && group.children && (
        <div className="hidden lg:block ml-3 pl-3 mt-0.5 mb-1.5 border-l border-border/60 space-y-0.5">
          {group.children.map((c) => (
            <SubLink
              key={c.to}
              to={c.to}
              label={c.label}
              Icon={c.icon}
              active={c.exact ? pathname === c.to : pathname === c.to || pathname.startsWith(c.to + "/")}
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
  const collapsed = useCollapsedRail();
  return (
    <RailTooltip label={label}>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={to as any}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
          collapsed ? "justify-center" : "justify-center lg:justify-start",
          active
            ? "bg-secondary text-foreground font-medium"
            : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        <Icon
          className={cn("h-5 w-5 shrink-0", active && "text-[color:var(--purple-primary)]")}
          strokeWidth={active ? 2 : 1.6}
        />
        {!collapsed && <span className="hidden lg:inline">{label}</span>}
      </Link>
    </RailTooltip>
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
