import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { SiteFooter } from "./site-footer";
import { MobileTopBar } from "./mobile-top-bar";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";
import { useAuth } from "@/integrations/supabase/auth-context";

export function AppShell() {
  const { session, loading } = useAuth();

  useEffect(() => {
    void (async () => {
      await ensureServiceWorker();
      await rearmMedicationNotifications();
    })();
  }, []);

  // Avoid the dashboard flashing before the client-side redirect to /sign-in.
  // SSR renders this shell without auth context; on the client we wait until
  // the session has been resolved. If there's no session, render a blank
  // surface — the route's beforeLoad will throw a redirect.
  if (loading || !session) {
    return <div className="min-h-dvh bg-background" aria-hidden="true" />;
  }

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