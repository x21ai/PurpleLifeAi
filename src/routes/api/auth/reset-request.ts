import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { requestPasswordReset } from "@/lib/cloudflare/auth/password-reset";

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

        const result = await requestPasswordReset({
          email: body.email,
          redirectTo: body.redirectTo,
        });
        return Response.json(result.body, { status: result.status });
      },
    },
  },
});
