import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings, getBindings } from "@/lib/cloudflare/bindings";
import { completeOAuthSignIn } from "@/lib/cloudflare/auth/oauth-complete";
import { isAllowedSocialOAuthRedirectUri } from "@/lib/oauth-allowed-origins";

export const Route = createFileRoute("/api/auth/oauth/google/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "Use Supabase OAuth" }, { status: 400 });
        }

        let body: { code?: string; redirect_uri?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const clientId =
          getBindings().GOOGLE_CLIENT_ID ??
          process.env.GOOGLE_CLIENT_ID ??
          process.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret =
          getBindings().GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret || !body.code || !body.redirect_uri) {
          return Response.json({ error: "OAuth not configured" }, { status: 500 });
        }
        if (!isAllowedSocialOAuthRedirectUri(body.redirect_uri)) {
          return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
        }

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: body.code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: body.redirect_uri,
            grant_type: "authorization_code",
          }),
        });
        if (!tokenRes.ok) {
          return Response.json({ error: "Token exchange failed" }, { status: 502 });
        }
        const tokens = (await tokenRes.json()) as { access_token?: string };
        if (!tokens.access_token) {
          return Response.json({ error: "No access token" }, { status: 502 });
        }

        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!userRes.ok) {
          return Response.json({ error: "Userinfo failed" }, { status: 502 });
        }
        const googleUser = (await userRes.json()) as {
          id: string;
          email?: string;
          verified_email?: boolean;
        };

        const email = googleUser.email?.toLowerCase() ?? null;
        if (!email) return Response.json({ error: "Email required" }, { status: 400 });

        const result = await completeOAuthSignIn({
          provider: "google",
          providerUserId: googleUser.id,
          email,
          emailVerified: googleUser.verified_email,
          identityData: googleUser,
        });

        if ("error" in result) {
          return Response.json({ error: result.error }, { status: result.status });
        }

        return Response.json(result);
      },
    },
  },
});
