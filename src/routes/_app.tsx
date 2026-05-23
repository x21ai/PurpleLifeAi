import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    // Only enforce on the client — SSR/prerender has no session.
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/sign-in" });
    }
    // First-run onboarding: send to welcome until the user finishes (or skips).
    const onboarded = localStorage.getItem("purple-onboarded") === "1";
    if (!onboarded && location.pathname !== "/welcome") {
      throw redirect({ to: "/welcome" });
    }
  },
  component: AppShell,
});