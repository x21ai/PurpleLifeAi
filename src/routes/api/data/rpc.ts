import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { regenerateTodayPendingDoses } from "@/lib/cloudflare/d1/regenerate-today-doses";

export const Route = createFileRoute("/api/data/rpc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return Response.json({ error: "cloudflare backend only" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "");
        const { verifyJwt } = await import("@/lib/cloudflare/auth/jwt");
        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret) return Response.json({ error: "Auth not configured" }, { status: 500 });
        const claims = await verifyJwt(secret, token);
        if (!claims?.sub) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: { fn?: string; args?: Record<string, unknown> };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const fn = body.fn;
        const args = body.args ?? {};

        if (fn === "regenerate_today_pending_doses") {
          const userId = (args._user_id as string | undefined) ?? claims.sub;
          if (userId !== claims.sub) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          await regenerateTodayPendingDoses(userId);
          return Response.json({ data: null });
        }

        return Response.json({ error: `RPC ${fn} not implemented` }, { status: 501 });
      },
    },
  },
});
