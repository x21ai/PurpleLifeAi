import { createFileRoute, redirect } from "@tanstack/react-router";
import { setCloudflareSession } from "@/lib/auth/cloudflare-session";
import { nativeOAuthHandoffUrl } from "@/lib/auth/native-oauth-handoff";

export const Route = createFileRoute("/oauth/apple/callback")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const hash = new URLSearchParams(
      window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash,
    );
    const hashedToken = hash.get("access_token");
    if (hashedToken) {
      const session = {
        access_token: hashedToken,
        refresh_token: hash.get("refresh_token") ?? undefined,
        expires_in: Number(hash.get("expires_in") ?? 3600),
        user: {
          id: hash.get("user_id") ?? "",
          email: hash.get("email"),
        },
      };
      setCloudflareSession(session);
      const next = hash.get("next");
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/today";
      window.history.replaceState({}, "", "/oauth/apple/callback");
      throw redirect({ to: dest as "/today" });
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state") ?? "/today";
    const user = params.get("user");
    if (!code) {
      throw redirect({ to: "/sign-in", search: { error: "oauth_failed" } });
    }

    const res = await fetch("/api/auth/oauth/apple/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: `${window.location.origin}/oauth/apple/callback`,
        ...(user ? { user } : {}),
      }),
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
