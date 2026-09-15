import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { setRequestBindings } from "@/lib/cloudflare/bindings";
import { d1From } from "@/lib/cloudflare/d1/query-builder";

export const Route = createFileRoute("/api/data/query")({
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

        let body: {
          table?: string;
          mode?: string;
          select?: string;
          returnSelect?: string | null;
          filters?: Array<{ op: string; col: string; val: unknown }>;
          order?: Array<{ col: string; ascending: boolean }>;
          limit?: number | null;
          insert?: Record<string, unknown> | Record<string, unknown>[];
          update?: Record<string, unknown>;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const table = (body.table ?? "").replace(/[^a-z_]/g, "");
        if (!table) return Response.json({ error: "table required" }, { status: 400 });

        let q = d1From(table, claims.sub);
        if (body.select) q = q.select(body.select);
        for (const f of body.filters ?? []) {
          if (f.op === "eq") q = q.eq(f.col.replace(/[^a-z_]/g, ""), f.val);
          if (f.op === "gte") q = q.gte(f.col.replace(/[^a-z_]/g, ""), f.val);
          if (f.op === "lte") q = q.lte(f.col.replace(/[^a-z_]/g, ""), f.val);
          if (f.op === "in") q = q.in(f.col.replace(/[^a-z_]/g, ""), f.val as unknown[]);
        }
        for (const o of body.order ?? []) {
          q = q.order(o.col.replace(/[^a-z_]/g, ""), { ascending: o.ascending });
        }
        if (body.limit != null) q = q.limit(body.limit);

        if (body.mode === "insert" && body.insert) {
          q = q.insert(body.insert);
          if (body.returnSelect) {
            const { data, error } = await q.then();
            return Response.json({ data, error: error?.message ?? null });
          }
          const { data, error } = await q.then();
          return Response.json({ data, error: error?.message ?? null });
        }
        if (body.mode === "update" && body.update) {
          q = q.update(body.update);
          const { error } = await q.then();
          return Response.json({ data: null, error: error?.message ?? null });
        }
        if (body.mode === "delete") {
          q = q.delete();
          const { error } = await q.then();
          return Response.json({ data: null, error: error?.message ?? null });
        }

        if (body.limit === 1) {
          const { data, error } = await q.maybeSingle();
          return Response.json({ data, error: error?.message ?? null });
        }
        const { data, error } = await q.then();
        return Response.json({ data, error: error?.message ?? null });
      },
    },
  },
});
