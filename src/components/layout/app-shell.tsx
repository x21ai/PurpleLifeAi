import { Outlet } from "@tanstack/react-router";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SidebarNav />
      <main className="md:pl-16 lg:pl-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}