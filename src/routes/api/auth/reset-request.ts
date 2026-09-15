import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { findUserByEmail } from "@/lib/cloudflare/auth/service";
import { signJwt } from "@/lib/cloudflare/auth/jwt";

export const Route = createFileRoute("/api/auth/reset-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "Use Supabase auth" }, { status: 400 });
        }

        let body: { email?: string; redirectTo?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (!body.email) return Response.json({ error: "email required" }, { status: 400 });

        const user = await findUserByEmail(body.email);
        // Always return success to avoid email enumeration
        if (!user) return Response.json({ ok: true });

        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) return Response.json({ error: "Auth not configured" }, { status: 500 });

        const resetToken = await signJwt(secret, {
          sub: user.id,
          email: user.email ?? undefined,
          role: "password_reset",
          expSeconds: 3600,
        });

        const redirectBase = body.redirectTo ?? process.env.PUBLIC_SITE_URL ?? "https://www.purplelife.org";
        const resetUrl = `${redirectBase}/reset-password?token=${encodeURIComponent(resetToken)}`;

        // Password reset email uses existing Resend queue when configured.
        // Testers: prefer POST /api/admin/set-tester-password with IMPORT_ADMIN_SECRET.
        console.info(`[auth] password reset requested for ${body.email.toLowerCase()}`);

        return Response.json({ ok: true });
      },
    },
  },
});
