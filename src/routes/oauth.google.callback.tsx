import { createFileRoute, redirect } from "@tanstack/react-router";
import { setCloudflareSession } from "@/lib/auth/cloudflare-session";
import { nativeOAuthHandoffUrl } from "@/lib/auth/native-oauth-handoff";

export const Route = createFileRoute("/oauth/google/callback")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") ?? "/today";
    if (!code) {
      throw redirect({ to: "/sign-in", search: { error: "oauth_failed" } });
    }

    const res = await fetch("/api/auth/oauth/google/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/oauth/google/callback` }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw redirect({ to: "/sign-in", search: { error: "oauth_failed" } });
    }

    const session = {
      access_token: data.access_token as string,
      refresh_token: data.refresh_token as string | undefined,
      expires_in: (data.expires_in as number) ?? 3600,
      user: data.user as { id: string; email?: string | null },
    };
    setCloudflareSession(session);

    const nativeUrl = nativeOAuthHandoffUrl(state, session);
    if (nativeUrl) {
      window.location.replace(nativeUrl);
      return;
    }

    const dest = decodeURIComponent(state).startsWith("http")
      ? "/today"
      : decodeURIComponent(state) || "/today";
    throw redirect({ to: dest as "/today" });
  },
  component: () => null,
});
