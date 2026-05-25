import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { SiteFooter } from "./site-footer";
import { MobileTopBar } from "./mobile-top-bar";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";

export function AppShell() {
  useEffect(() => {
    void (async () => {
      await ensureServiceWorker();
      await rearmMedicationNotifications();
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SidebarNav />
      <MobileTopBar />
      <main className="md:pl-16 lg:pl-60 pb-24 md:pb-0 min-h-dvh flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <SiteFooter />
      </main>
      <BottomNav />
    </div>
  );
}