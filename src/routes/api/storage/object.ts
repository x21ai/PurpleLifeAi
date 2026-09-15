import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { r2GetObject, type R2BucketName } from "@/lib/cloudflare/r2/storage";

const ALLOWED: R2BucketName[] = [
  "journal-media",
  "reports",
  "medical-reports",
  "care-chat-attachments",
  "dna-uploads",
];

export const Route = createFileRoute("/api/storage/object")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(process.env)) {
          return new Response("Not found", { status: 404 });
        }

        const url = new URL(request.url);
        const bucket = url.searchParams.get("bucket") ?? "";
        const path = url.searchParams.get("path") ?? "";
        const token =
          url.searchParams.get("token") ??
          request.headers.get("authorization")?.replace("Bearer ", "") ??
          "";

        const { verifyJwt } = await import("@/lib/cloudflare/auth/jwt");
        const secret = process.env.AUTH_JWT_SECRET;
        if (!secret || !token) return new Response("Unauthorized", { status: 401 });
        const claims = await verifyJwt(secret, token);
        if (!claims?.sub) return new Response("Unauthorized", { status: 401 });

        if (!ALLOWED.includes(bucket as R2BucketName) || !path) {
          return new Response("Bad request", { status: 400 });
        }

        const obj = await r2GetObject(bucket as R2BucketName, claims.sub, path);
        if (!obj) return new Response("Not found", { status: 404 });

        const headers = new Headers();
        const ct = obj.httpMetadata?.contentType;
        if (ct) headers.set("Content-Type", ct);
        headers.set("Cache-Control", "private, max-age=3600");
        return new Response(obj.body, { headers });
      },
    },
  },
});
