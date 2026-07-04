import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "@/lib/native/capacitor";

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

  useEffect(() => {
    if (!isNativeApp()) return;
    if (!MARKETING_PATHS.has(pathname)) return;

    void supabase.auth.getSession().then(({ data }) => {
      navigate({ to: (data.session ? "/today" : "/sign-in") as never, replace: true });
    });
  }, [pathname, navigate]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const splash = document.getElementById("purple-splash");
    if (splash) splash.remove();
  }, []);

  return null;
}
