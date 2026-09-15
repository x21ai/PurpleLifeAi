import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { findUserByEmail } from "@/lib/cloudflare/auth/service";
import { hashPassword } from "@/lib/cloudflare/auth/passwords";
import { d1Run } from "@/lib/cloudflare/d1/client";

const TESTER_EMAILS = [
  "pmt@eigital.com",
  "samuelc1@yahoo.com",
  "devynrosewalker@gmail.com",
];

/**
 * One-time admin route to set tester passwords on Cloudflare auth.
 * POST { email, password } with x-import-secret: IMPORT_ADMIN_SECRET
 */
export const Route = createFileRoute("/api/admin/set-tester-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "cloudflare backend only" }, { status: 400 });
        }

        const secret = process.env.IMPORT_ADMIN_SECRET;
        const provided = request.headers.get("x-import-secret");
        if (!secret || provided !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: { email?: string; password?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const email = body.email?.toLowerCase().trim();
        if (!email || !body.password || body.password.length < 8) {
          return Response.json({ error: "email and password (8+ chars) required" }, { status: 400 });
        }

        if (!TESTER_EMAILS.includes(email)) {
          return Response.json({ error: "Email not in tester allowlist" }, { status: 403 });
        }

        const user = await findUserByEmail(email);
        if (!user) {
          return Response.json({ error: "User not found in auth_users" }, { status: 404 });
        }

        const passwordHash = await hashPassword(body.password);
        await d1Run(
          `UPDATE auth_users SET password_hash = ?, email_confirmed_at = COALESCE(email_confirmed_at, datetime('now')), updated_at = datetime('now') WHERE id = ?`,
          passwordHash,
          user.id,
        );

        return Response.json({ ok: true, email, userId: user.id });
      },
    },
  },
});
