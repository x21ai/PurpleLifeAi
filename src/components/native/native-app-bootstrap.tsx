import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useNativeAppContext } from "@/lib/native-app-context";
import { hideNativeLaunchChrome, initNativeApp } from "@/lib/native";
import { NativeLaunchDiagnosticStrip } from "@/components/native/native-launch-diagnostic-strip";

const MARKETING_PATHS = new Set([
  "/",
  "/features",
  "/pricing",
  "/about",
  "/charter",
  "/research",
  "/epilepsy",
  "/trust",
  "/contact",
  "/community",
]);

/**
 * Cold-start routing for Capacitor: never leave users on the marketing homepage.
 */
export function NativeAppBootstrap() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isNativeApp } = useNativeAppContext();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!isNativeApp) return;
    if (!MARKETING_PATHS.has(pathname)) return;
    if (loading) return;

    void navigate({ to: (session ? "/today" : "/sign-in") as never, replace: true });
  }, [pathname, navigate, isNativeApp, session, loading]);

  useEffect(() => {
    if (!isNativeApp) return;
    const splash = document.getElementById("purple-splash");
    if (splash) {
      splash.style.pointerEvents = "none";
      splash.style.opacity = "0";
      splash.remove();
    }
    void hideNativeLaunchChrome();
    void initNativeApp();
  }, [isNativeApp]);

  return <NativeLaunchDiagnosticStrip />;
}
