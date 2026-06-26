import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { navTree, filterNavTree, type NavGroup } from "./nav-items";
import { usePlatformFlags } from "@/lib/platform-flags";
import { cn } from "@/lib/utils";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";
import { CaregiverNavLink } from "./caregiver-nav-link";
import { ProfileMenu } from "./profile-menu";
import { HeaderSyncButton } from "@/components/biometrics/header-sync-button";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { flags } = usePlatformFlags();
  const tree = filterNavTree(navTree, flags);

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 min-h-12 bg-background/90 backdrop-blur border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link to="/today" className="wordmark text-[12px] text-foreground" aria-label="Purple, home">
        Purple
      </Link>
      <div className="flex items-center gap-1">
        <HeaderSyncButton />
        <PendingInboxBadge />
        <ProfileMenu />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex h-11 w-11 -mr-2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-5 pt-6 pb-3 text-left">
              <SheetTitle className="wordmark text-[13px] text-foreground">Purple</SheetTitle>
            </SheetHeader>
            <nav className="px-3 py-2 space-y-1" aria-label="Mobile primary">
              {tree.map((group) => (
                <MobileGroup
                  key={group.id}
                  group={group}
                  pathname={pathname}
                  isOpen={!!openGroups[group.id]}
                  onToggle={() => setOpenGroups((p) => ({ ...p, [group.id]: !p[group.id] }))}
                  onNavigate={() => setOpen(false)}
                />
              ))}
              <CaregiverNavLink variant="sheet" onClick={() => setOpen(false)} />
            </nav>
            <div className="mt-2 mx-3 pt-4 border-t border-border space-y-1 text-[14px]">
              <Link
                to="/charter"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Charter
              </Link>
              <Link
                to="/privacy"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Privacy & safety
              </Link>
              <Link
                to="/terms"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <a
                href="https://github.com/purplelife/purple"
                target="_blank"
                rel="noreferrer noopener"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Open source on GitHub
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function MobileGroup({
  group,
  pathname,
  isOpen,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const Icon = group.icon;
  const active =
    (!!group.to && pathname === group.to) ||
    (group.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/")) ?? false);

  const rowClass = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors w-full",
    active
      ? "bg-secondary text-foreground font-medium"
      : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
  );

  // Leaf (no children): plain link.
  if (!group.children || group.children.length === 0) {
    return (
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={group.to! as any}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={rowClass}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
        <span className="flex-1 text-left">{group.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <div className={cn(rowClass, "pr-1")}>
        {group.to ? (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={group.to as any}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className="flex items-center gap-3 flex-1 -my-2.5 py-2.5"
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
            <span className="flex-1 text-left">{group.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-3 flex-1 -my-2.5 py-2.5"
            aria-expanded={isOpen}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
            <span className="flex-1 text-left">{group.label}</span>
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>
      {isOpen && (
        <div className="ml-4 pl-3 mt-0.5 mb-1 border-l border-border/60 space-y-0.5">
          {group.children.map((c) => {
            const childActive = pathname === c.to || pathname.startsWith(c.to + "/");
            const ChildIcon = c.icon;
            return (
              <Link
                key={c.to}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={c.to as any}
                onClick={onNavigate}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] transition-colors",
                  childActive
                    ? "bg-secondary text-foreground"
                    : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <ChildIcon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
