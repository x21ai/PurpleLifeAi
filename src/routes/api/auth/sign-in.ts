import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { signInWithPassword } from "@/lib/cloudflare/auth/service";

export const Route = createFileRoute("/api/auth/sign-in")({
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

        const result = await signInWithPassword(body.email, body.password);
        if (!result) {
          return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        return Response.json({
          access_token: result.accessToken,
          token_type: "bearer",
          expires_in: 3600,
          user: result.user,
        });
      },
    },
  },
});
