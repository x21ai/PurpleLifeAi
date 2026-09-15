import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings, getBindings } from "@/lib/cloudflare/bindings";
import { d1First, d1Run } from "@/lib/cloudflare/d1/client";
import { signJwt } from "@/lib/cloudflare/auth/jwt";
import { importAuthUser } from "@/lib/cloudflare/auth/service";

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

        const email = googleUser.email?.toLowerCase();
        if (!email) return Response.json({ error: "Email required" }, { status: 400 });

        let user = await d1First<{ id: string; email: string }>(
          `SELECT u.id, u.email FROM auth_users u
           LEFT JOIN auth_identities i ON i.user_id = u.id
           WHERE u.email = ? OR (i.provider = 'google' AND i.provider_user_id = ?)
           LIMIT 1`,
          email,
          googleUser.id,
        );

        if (!user) {
          const id = crypto.randomUUID();
          await importAuthUser({
            id,
            email,
            email_confirmed_at: googleUser.verified_email ? new Date().toISOString() : null,
          });
          user = { id, email };
        }

        await d1Run(
          `INSERT INTO auth_identities (id, user_id, provider, provider_user_id, identity_data, created_at, updated_at)
           VALUES (?, ?, 'google', ?, ?, datetime('now'), datetime('now'))
           ON CONFLICT(provider, provider_user_id) DO UPDATE SET user_id = excluded.user_id, updated_at = datetime('now')`,
          crypto.randomUUID(),
          user.id,
          googleUser.id,
          JSON.stringify(googleUser),
        );

        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) return Response.json({ error: "Auth not configured" }, { status: 500 });
        const accessToken = await signJwt(secret, {
          sub: user.id,
          email: user.email,
          expSeconds: 3600,
        });

        return Response.json({
          access_token: accessToken,
          expires_in: 3600,
          user: { id: user.id, email: user.email },
        });
      },
    },
  },
});
