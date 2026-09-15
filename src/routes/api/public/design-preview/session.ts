import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { mintDesignPreviewSession } from "@/lib/cloudflare/auth/design-preview";
import { isDesignPreviewEnabled } from "@/lib/design-preview";

export const Route = createFileRoute("/api/public/design-preview/session")({
  server: {
    handlers: {
      GET: async () => {
        setRequestBindings(process.env);
        if (!isDesignPreviewEnabled(process.env)) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        if (!isCloudflareBackend(process.env)) {
          return Response.json(
            { error: "Design preview requires DATA_BACKEND=cloudflare" },
            { status: 503 },
          );
        }

        try {
          const session = await mintDesignPreviewSession(process.env);
          if (!session) {
            return Response.json({ error: "not_found" }, { status: 404 });
          }
          return Response.json(session, {
            headers: {
              "Cache-Control": "no-store",
              "X-Purple-Design-Preview": "1",
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "bootstrap_failed";
          console.error("[design-preview] session bootstrap failed:", message);
          return Response.json({ error: message }, { status: 503 });
        }
      },
    },
  },
});
