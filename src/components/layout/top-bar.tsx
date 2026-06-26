import { Menu } from "lucide-react";
import { ProfileMenu } from "./profile-menu";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";
import { HeaderSyncButton } from "@/components/biometrics/header-sync-button";
import { useSidebarCollapsedPref } from "./sidebar-nav";

export function TopBar() {
  const [collapsed, toggleCollapsed] = useSidebarCollapsedPref();
  return (
    <header className="hidden md:flex sticky top-0 z-20 h-14 items-center justify-between gap-2 px-4 lg:px-6 bg-background/70 backdrop-blur border-b border-border/60">
      <div className="flex items-center">
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <HeaderSyncButton />
        <PendingInboxBadge />
        <ProfileMenu />
      </div>
    </header>
  );
}