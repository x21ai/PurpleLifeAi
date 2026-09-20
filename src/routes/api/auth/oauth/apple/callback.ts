import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings, getBindings } from "@/lib/cloudflare/bindings";
import { completeOAuthSignIn, decodeJwtPayload } from "@/lib/cloudflare/auth/oauth-complete";
import { isAllowedSocialOAuthRedirectUri } from "@/lib/oauth-allowed-origins";

export const Route = createFileRoute("/api/auth/oauth/apple/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "Use Supabase OAuth" }, { status: 400 });
        }

        let body: { code?: string; redirect_uri?: string; user?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const clientId =
          getBindings().APPLE_CLIENT_ID ??
          process.env.APPLE_CLIENT_ID;
        const clientSecret =
          getBindings().APPLE_CLIENT_SECRET ??
          process.env.APPLE_CLIENT_SECRET;
        if (!clientId || !clientSecret || !body.code || !body.redirect_uri) {
          return Response.json({ error: "OAuth not configured" }, { status: 500 });
        }
        if (!isAllowedSocialOAuthRedirectUri(body.redirect_uri)) {
          return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
        }

        const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
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

        const tokens = (await tokenRes.json()) as { id_token?: string };
        if (!tokens.id_token) {
          return Response.json({ error: "No id_token" }, { status: 502 });
        }

        let claims: Record<string, unknown>;
        try {
          claims = decodeJwtPayload(tokens.id_token);
        } catch {
          return Response.json({ error: "Invalid id_token" }, { status: 502 });
        }

        const providerUserId = String(claims.sub ?? "");
        if (!providerUserId) {
          return Response.json({ error: "Missing subject" }, { status: 502 });
        }

        let email =
          typeof claims.email === "string" ? claims.email.toLowerCase() : null;
        const emailVerified =
          claims.email_verified === true || claims.email_verified === "true";

        if (!email && body.user) {
          try {
            const userInfo = JSON.parse(body.user) as { email?: string };
            if (userInfo.email) email = userInfo.email.toLowerCase();
          } catch {
            /* ignore malformed user payload */
          }
        }

        const result = await completeOAuthSignIn({
          provider: "apple",
          providerUserId,
          email,
          emailVerified,
          identityData: { ...claims, first_sign_in_user: body.user ?? null },
        });

        if ("error" in result) {
          return Response.json({ error: result.error }, { status: result.status });
        }

        return Response.json(result);
      },
    },
  },
});
