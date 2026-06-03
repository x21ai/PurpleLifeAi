import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";
import { CaregiverNavLink } from "./caregiver-nav-link";
import { ProfileMenu } from "./profile-menu";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-12 bg-background/90 backdrop-blur border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link to="/today" className="wordmark text-[12px] text-foreground" aria-label="Purple — home">
        Purple
      </Link>
      <div className="flex items-center gap-1">
        <PendingInboxBadge />
        <ProfileMenu />
        <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open menu"
          className="rounded-md p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-5 pt-6 pb-3 text-left">
            <SheetTitle className="wordmark text-[13px] text-foreground">Purple</SheetTitle>
          </SheetHeader>
          <nav className="px-3 py-2 space-y-1" aria-label="Mobile primary">
            {navItems.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
                    active
                      ? "bg-secondary text-foreground font-medium"
                      : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
                  {item.label}
                </Link>
              );
            })}
            <CaregiverNavLink variant="sheet" onClick={() => setOpen(false)} />
          </nav>
          <div className="mt-2 mx-3 pt-4 border-t border-border space-y-1 text-[14px]">
            <Link to="/charter" onClick={() => setOpen(false)} className="block px-3 py-2 text-muted-foreground hover:text-foreground">Charter</Link>
            <Link to="/privacy" onClick={() => setOpen(false)} className="block px-3 py-2 text-muted-foreground hover:text-foreground">Privacy & safety</Link>
            <Link to="/terms" onClick={() => setOpen(false)} className="block px-3 py-2 text-muted-foreground hover:text-foreground">Terms</Link>
            <a
              href="https://github.com/lovable-dev/purple"
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