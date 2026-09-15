import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { r2PutObject, type R2BucketName } from "@/lib/cloudflare/r2/storage";

const ALLOWED: R2BucketName[] = [
  "journal-media",
  "reports",
  "medical-reports",
  "care-chat-attachments",
  "dna-uploads",
];

export const Route = createFileRoute("/api/storage/upload")({
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

        const form = await request.formData();
        const bucket = String(form.get("bucket") ?? "");
        const path = String(form.get("path") ?? "");
        const file = form.get("file");
        const contentType = String(form.get("contentType") ?? "") || undefined;

        if (!ALLOWED.includes(bucket as R2BucketName)) {
          return Response.json({ error: "Invalid bucket" }, { status: 400 });
        }
        if (!path || !(file instanceof Blob)) {
          return Response.json({ error: "path and file required" }, { status: 400 });
        }

        await r2PutObject(
          bucket as R2BucketName,
          claims.sub,
          path,
          await file.arrayBuffer(),
          contentType ?? file.type,
        );

        return Response.json({ path, bucket });
      },
    },
  },
});
