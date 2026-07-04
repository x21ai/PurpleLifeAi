import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useNativeAppContext } from "@/lib/native-app-context";

/**
 * Floating "Ask Purple" button. Visible on every authenticated route
 * EXCEPT /chat itself. Driven by profiles.floating_ask_enabled.
 * Hidden on mobile because the bottom nav already exposes Ask.
 */
export function AskFab() {
  const { session } = useAuth();
  const { isNativeApp } = useNativeAppContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [enabled, setEnabled] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!session?.user.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("floating_ask_enabled")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!cancelled) setEnabled(data?.floating_ask_enabled ?? true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  if (!enabled) return null;
  if (isNativeApp) return null;
  if (pathname.startsWith("/chat")) return null;
  // Hide on routes that already render their own primary floating action,
  // so the buttons don't stack on tablet/desktop.
  const routesWithOwnFab = [
    "/journal",
    "/journal/new",
    "/meds",
    "/community-new",
    "/seizures/new",
  ];
  if (routesWithOwnFab.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <Link
      to="/chat"
      aria-label="Ask Purple"
      className="inline-flex fixed bottom-28 md:bottom-6 right-5 md:right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:bg-primary/90 active:scale-95 transition"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <MessageCircle className="h-6 w-6" />
    </Link>
  );
}