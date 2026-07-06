import { Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./bottom-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { AskFab } from "@/components/chat/ask-fab";
import { ReminderAlarmSheet } from "@/components/meds/reminder-alarm-sheet";
import { NativeConnectivityGate } from "@/components/native/native-connectivity-gate";
import { NativeRouteGuard } from "@/components/native/native-route-guard";
import { NativeShellProvider } from "@/lib/native/shell-context";

/** Routes that own full viewport height (no tab bar, top bar, or Ask FAB). */
const NATIVE_SHELL_FULL_BLEED_ROUTES = [
  "/welcome",
  "/journal/new",
  "/chat",
  "/chat-care",
] as const;

function nativeShellHidesChrome(pathname: string): boolean {
  return NATIVE_SHELL_FULL_BLEED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * iOS/Android shell: always mobile-native chrome (tab bar, top bar, safe areas).
 * No sidebar, no desktop top bar, no responsive breakpoint that promotes web layout.
 */
export function NativeAppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideChrome = nativeShellHidesChrome(pathname);

  return (
    <NativeRouteGuard>
      <NativeConnectivityGate>
        <NativeShellProvider>
        <div className="app-route native-shell h-dvh bg-background text-foreground flex flex-col overflow-hidden">
          {!hideChrome && <MobileTopBar variant="native" />}
          <main
            className={
              hideChrome
                ? "native-shell-main flex-1 flex flex-col min-h-0 overflow-y-auto"
                : "native-shell-main native-shell-main--tabbed flex-1 flex flex-col min-h-0 overflow-y-auto"
            }
          >
            <div className="flex-1 min-h-0">
              <Outlet />
            </div>
          </main>
          {!hideChrome && <BottomNav variant="native" />}
          {!hideChrome && <AskFab />}
          <ReminderAlarmSheet />
        </div>
        </NativeShellProvider>
      </NativeConnectivityGate>
    </NativeRouteGuard>
  );
}
