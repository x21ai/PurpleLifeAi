import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { TopBar } from "./top-bar";
import { AskFab } from "@/components/chat/ask-fab";
import { ensureServiceWorker, rearmMedicationNotifications } from "@/lib/med-notifications";
import { ReminderAlarmSheet } from "@/components/meds/reminder-alarm-sheet";
import { useOfflineJournalSync } from "@/hooks/use-offline-journal-sync";

export function AppShell() {
  // App-wide offline journal flush: previously this only ran while the
  // journal list page was mounted, so entries queued offline stayed queued
  // until the user happened to visit /journal.
  useOfflineJournalSync();

  useEffect(() => {
    void (async () => {
      await ensureServiceWorker();
      await rearmMedicationNotifications();
    })();
  }, []);

  // Render an identical tree on SSR and the first client render.
  // The `/_app` route's `beforeLoad` handles redirects to /sign-in when
  // there's no session, so we never gate the shell on auth state here
  // (that branch was the source of hydration mismatches).
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SidebarNav />
      <MobileTopBar />
      <main className="md:pl-16 lg:pl-60 pb-24 md:pb-0 min-h-dvh flex flex-col">
        <TopBar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <AskFab />
      <ReminderAlarmSheet />
    </div>
  );
}
