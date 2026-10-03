import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { hashPassword } from "@/lib/cloudflare/auth/passwords";
import { verifyJwt } from "@/lib/cloudflare/auth/jwt";
import { redeemPasswordResetToken } from "@/lib/cloudflare/auth/sessions";
import { d1Run } from "@/lib/cloudflare/d1/client";

export const Route = createFileRoute("/api/auth/update-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "Use Supabase auth" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        let body: { password?: string; token?: string; reset_token?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const bearer = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        const token = body.reset_token ?? body.token ?? bearer;
        const secret = process.env.AUTH_JWT_SECRET;
        if (!token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!body.password || body.password.length < 8) {
          return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Opaque one-time reset tokens are hex, not JWTs.
        if (!token.includes(".")) {
          const redeemed = await redeemPasswordResetToken(token, body.password);
          if (!redeemed.ok) {
            return Response.json({ error: redeemed.error }, { status: redeemed.status });
          }
          return Response.json({ user: { id: redeemed.user.id, email: redeemed.user.email } });
        }

        if (!secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const claims = await verifyJwt(secret, token);
        if (!claims?.sub || claims.role === "password_reset") {
          return Response.json({ error: "Invalid token" }, { status: 401 });
        }

        const passwordHash = await hashPassword(body.password);
        await d1Run(
          `UPDATE auth_users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
          passwordHash,
          claims.sub,
        );

        return Response.json({ user: { id: claims.sub, email: claims.email } });
      },
    },
  },
});
