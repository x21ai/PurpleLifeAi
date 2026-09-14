import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { createUserWithPassword, findUserByEmail } from "@/lib/cloudflare/auth/service";
import { signJwt } from "@/lib/cloudflare/auth/jwt";

export const Route = createFileRoute("/api/auth/sign-up")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(getBindings())) {
          return Response.json(
            { error: "Use Supabase client auth when DATA_BACKEND=supabase" },
            { status: 400 },
          );
        }

        let body: { email?: string; password?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (!body.email || !body.password) {
          return Response.json({ error: "email and password required" }, { status: 400 });
        }
        if (body.password.length < 8) {
          return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const existing = await findUserByEmail(body.email);
        if (existing) {
          return Response.json({ error: "User already exists" }, { status: 409 });
        }

        const user = await createUserWithPassword(body.email, body.password);
        const secret = getBindings().AUTH_JWT_SECRET;
        if (!secret) {
          return Response.json({ error: "AUTH_JWT_SECRET not configured" }, { status: 500 });
        }
        const accessToken = await signJwt(secret, {
          sub: user.id,
          email: user.email ?? undefined,
          expSeconds: 3600,
        });

        return Response.json({
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          user,
        });
      },
    },
  },
});
