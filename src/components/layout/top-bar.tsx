import { ProfileMenu } from "./profile-menu";
import { PendingInboxBadge } from "@/components/care/pending-inbox-badge";

export function TopBar() {
  return (
    <header className="hidden md:flex sticky top-0 z-20 h-14 items-center justify-end gap-2 px-4 lg:px-6 bg-background/70 backdrop-blur border-b border-border/60">
      <PendingInboxBadge />
      <ProfileMenu />
    </header>
  );
}
