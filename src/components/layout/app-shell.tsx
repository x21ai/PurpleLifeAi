import { Outlet } from "@tanstack/react-router";
import { SidebarNav, useSidebarCollapsedPref } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { TopBar } from "./top-bar";
import { AskFab } from "@/components/chat/ask-fab";
import { ReminderAlarmSheet } from "@/components/meds/reminder-alarm-sheet";

export function AppShell() {
  const [collapsed] = useSidebarCollapsedPref();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SidebarNav />
      <MobileTopBar />
      <main
        className={
          "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 min-h-dvh flex flex-col md:pl-16 " +
          (collapsed ? "lg:pl-16" : "lg:pl-64")
        }
      >
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