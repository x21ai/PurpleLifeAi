import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings, getBindings } from "@/lib/cloudflare/bindings";

export const Route = createFileRoute("/api/auth/oauth/$provider")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "Use Supabase OAuth" }, { status: 400 });
        }

        const url = new URL(request.url);
        const redirectTo = url.searchParams.get("redirect_to") ?? process.env.PUBLIC_SITE_URL ?? "https://www.purplelife.org";
        const provider = params.provider;

        if (provider === "google") {
          const clientId =
            getBindings().GOOGLE_CLIENT_ID ??
            process.env.GOOGLE_CLIENT_ID ??
            process.env.VITE_GOOGLE_CLIENT_ID;
          if (!clientId) {
            return Response.json({ error: "Google OAuth not configured" }, { status: 500 });
          }
          const callback = `${redirectTo.replace(/\/$/, "")}/oauth/google/callback`;
          const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authUrl.searchParams.set("client_id", clientId);
          authUrl.searchParams.set("redirect_uri", callback);
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", "openid email profile");
          authUrl.searchParams.set("access_type", "offline");
          authUrl.searchParams.set("prompt", "select_account");
          authUrl.searchParams.set("state", encodeURIComponent(redirectTo));
          return Response.redirect(authUrl.toString(), 302);
        }

        return Response.json({ error: `OAuth provider ${provider} not configured` }, { status: 501 });
      },
    },
  },
});
