import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { exchangeAppleCode } from "@/lib/cloudflare/auth/apple-exchange";

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

        if (!body.code || !body.redirect_uri) {
          return Response.json({ error: "OAuth not configured" }, { status: 500 });
        }

        const result = await exchangeAppleCode({
          code: body.code,
          redirectUri: body.redirect_uri,
          user: body.user,
        });

        if ("error" in result) {
          return Response.json({ error: result.error }, { status: result.status });
        }

        return Response.json(result);
      },
    },
  },
});
