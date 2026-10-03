import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { createUserWithPassword, findUserByEmail } from "@/lib/cloudflare/auth/service";
import { issueSession } from "@/lib/cloudflare/auth/sessions";

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
        try {
          const session = await issueSession({ id: user.id, email: user.email });
          return Response.json(session);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Auth not configured";
          if (message.includes("AUTH_JWT_SECRET")) {
            return Response.json({ error: "AUTH_JWT_SECRET not configured" }, { status: 500 });
          }
          throw error;
        }
      },
    },
  },
});
