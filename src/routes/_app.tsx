import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { isOAuthCallbackUrl, waitForOAuthSession } from "@/lib/auth-oauth";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Only enforce on the client, SSR/prerender has no session.
    if (typeof window === "undefined") return;
    if (isOAuthCallbackUrl()) {
      await waitForOAuthSession();
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/sign-in" });
    }
    // First-run onboarding: source of truth is the DB so it persists across devices.
    // localStorage is a fast-path hint to avoid an extra query on every nav.
    if (location.pathname === "/welcome") return;
    if (localStorage.getItem("purple-onboarded") === "1") return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at, first_name")
      .eq("id", data.session.user.id)
      .maybeSingle();
    const done = !!(profile?.onboarded_at || profile?.first_name);
    if (done) {
      localStorage.setItem("purple-onboarded", "1");
      return;
    }
    throw redirect({ to: "/welcome" });
  },
  component: AppShell,
});