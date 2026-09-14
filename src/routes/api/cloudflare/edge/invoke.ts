import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { invokeEdgeFunction } from "@/lib/cloudflare/edge";

/**
 * Internal edge-function dispatch when DATA_BACKEND=cloudflare.
 * POST { name: "oura-sync" | "journal-processor", ...body }
 */
export const Route = createFileRoute("/api/cloudflare/edge/invoke")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(getBindings())) {
          return Response.json({ error: "cloudflare backend not active" }, { status: 400 });
        }

        const cronSecret = getBindings().CRON_SECRET;
        const authHeader = request.headers.get("authorization") ?? "";
        const providedSecret =
          request.headers.get("x-cron-secret") ?? authHeader.replace("Bearer ", "");
        const isService = cronSecret && providedSecret === cronSecret;

        if (!isService && !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let payload: { name?: string } & Record<string, unknown> = {};
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const name = payload.name;
        if (!name || typeof name !== "string") {
          return Response.json({ error: "name required" }, { status: 400 });
        }

        const { name: _n, ...body } = payload;
        return invokeEdgeFunction(name, body);
      },
    },
  },
});
