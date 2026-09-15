import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShellRouter } from "@/components/layout/app-shell-router";
import { supabase } from "@/integrations/supabase/client";
import { isOAuthCallbackUrl, waitForOAuthSession } from "@/lib/auth-oauth";
import { isDesignPreviewClient } from "@/lib/design-preview";
import { ensureDesignPreviewSession } from "@/lib/design-preview-session.client";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Only enforce on the client, SSR/prerender has no session.
    if (typeof window === "undefined") return;
    if (isOAuthCallbackUrl()) {
      await waitForOAuthSession();
    }
    if (isDesignPreviewClient()) {
      await ensureDesignPreviewSession();
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/sign-in" });
    }
    // Design staging skips onboarding so crawlers reach Today immediately.
    if (isDesignPreviewClient()) return;
    // First-run onboarding: source of truth is the DB so it persists across devices.
    // localStorage is a fast-path hint to avoid an extra query on every nav.
    if (location.pathname === "/welcome") return;
    try {
      if (localStorage.getItem("purple-onboarded") === "1") return;
    } catch {
      // Restrictive WKWebView storage policies must not abort route boot.
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at, first_name")
      .eq("id", data.session.user.id)
      .maybeSingle();
    const done = !!(profile?.onboarded_at || profile?.first_name);
    if (done) {
      try {
        localStorage.setItem("purple-onboarded", "1");
      } catch {
        // Best-effort cache only; DB remains source of truth.
      }
      return;
    }
    throw redirect({ to: "/welcome" });
  },
  component: AppShellRouter,
});
