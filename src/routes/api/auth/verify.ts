import { createFileRoute } from "@tanstack/react-router";
import { setRequestBindings, getBindings } from "@/lib/cloudflare/bindings";
import { verifyJwt } from "@/lib/cloudflare/auth/jwt";

export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        setRequestBindings(process.env);
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace("Bearer ", "");
        const secret = getBindings().AUTH_JWT_SECRET ?? process.env.AUTH_JWT_SECRET;
        if (!secret || !token) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const claims = await verifyJwt(secret, token);
        if (!claims) return Response.json({ error: "Invalid token" }, { status: 401 });
        return Response.json({ claims });
      },
    },
  },
});
