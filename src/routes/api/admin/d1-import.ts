import { createFileRoute } from "@tanstack/react-router";
import { isCloudflareBackend } from "@/lib/cloudflare/data-backend";
import { getBindings, setRequestBindings } from "@/lib/cloudflare/bindings";
import { importAuthUser } from "@/lib/cloudflare/auth/service";
import { d1Run } from "@/lib/cloudflare/d1/client";

/**
 * Admin import endpoint for cutover (no live Supabase creds in repo).
 * Caller supplies exported JSON/CSV payloads from purple-migration export bundle.
 *
 * POST { kind: "auth_users", records: [...] }
 * POST { kind: "table_rows", table: "profiles", rows: [{...}] }
 *
 * Protected by IMPORT_ADMIN_SECRET (Doppler). Disabled when DATA_BACKEND=supabase.
 */
export const Route = createFileRoute("/api/admin/d1-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        setRequestBindings(process.env);
        if (!isCloudflareBackend(getBindings())) {
          return Response.json(
            { error: "Enable DATA_BACKEND=cloudflare before D1 import" },
            { status: 400 },
          );
        }

        const secret = process.env.IMPORT_ADMIN_SECRET;
        const provided = request.headers.get("x-import-secret");
        if (!secret || provided !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: {
          kind?: string;
          records?: unknown[];
          table?: string;
          rows?: Record<string, unknown>[];
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        if (body.kind === "auth_users" && Array.isArray(body.records)) {
          let imported = 0;
          for (const rec of body.records) {
            const r = rec as {
              id: string;
              email?: string | null;
              email_confirmed_at?: string | null;
              user_metadata?: unknown;
              app_metadata?: unknown;
            };
            if (!r.id) continue;
            await importAuthUser(r);
            imported += 1;
          }
          return Response.json({ ok: true, imported });
        }

        if (body.kind === "table_rows" && body.table && Array.isArray(body.rows)) {
          const table = body.table.replace(/[^a-z_]/g, "");
          let imported = 0;
          for (const row of body.rows) {
            const cols = Object.keys(row);
            const placeholders = cols.map(() => "?").join(", ");
            const values = cols.map((c) => {
              const v = row[c];
              if (v === null || v === undefined) return null;
              if (typeof v === "object") return JSON.stringify(v);
              return v;
            });
            await d1Run(
              `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`,
              ...values,
            );
            imported += 1;
          }
          return Response.json({ ok: true, table, imported });
        }

        return Response.json({ error: "Unknown kind" }, { status: 400 });
      },
    },
  },
});
