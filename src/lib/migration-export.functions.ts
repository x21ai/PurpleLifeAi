// One-shot migration helpers. Super-admin gated. Delete this file
// after the cutover to your own Supabase instance is complete.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKETS = [
  "journal-media",
  "reports",
  "medical-reports",
  "care-chat-attachments",
  "dna-uploads",
] as const;

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: super_admin required");
}

export const exportAuthUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const out: any[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        out.push({
          id: u.id,
          email: u.email,
          phone: u.phone,
          email_confirmed_at: u.email_confirmed_at,
          phone_confirmed_at: u.phone_confirmed_at,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          user_metadata: u.user_metadata,
          app_metadata: u.app_metadata,
          providers: (u.identities ?? []).map((i: any) => i.provider),
        });
      }
      if (data.users.length < perPage) break;
      page += 1;
    }
    return { count: out.length, users: out };
  });

export const exportStorageManifest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const manifest: Array<{
      bucket: string;
      path: string;
      size: number | null;
      contentType: string | null;
      signedUrl: string;
      metadata: any;
    }> = [];

    async function walk(bucket: string, prefix: string) {
      let offset = 0;
      const limit = 1000;
      while (true) {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
        if (error) throw new Error(`${bucket}:${prefix} ${error.message}`);
        if (!data || data.length === 0) break;
        for (const entry of data) {
          const full = prefix ? `${prefix}/${entry.name}` : entry.name;
          // A folder shows up as id===null
          if ((entry as any).id == null) {
            await walk(bucket, full);
          } else {
            const { data: signed, error: signErr } = await supabaseAdmin.storage
              .from(bucket)
              .createSignedUrl(full, 60 * 60 * 24 * 7);
            if (signErr) throw new Error(`sign ${bucket}/${full}: ${signErr.message}`);
            const meta: any = (entry as any).metadata ?? {};
            manifest.push({
              bucket,
              path: full,
              size: meta.size ?? null,
              contentType: meta.mimetype ?? null,
              signedUrl: signed!.signedUrl,
              metadata: meta,
            });
          }
        }
        if (data.length < limit) break;
        offset += limit;
      }
    }

    for (const b of BUCKETS) await walk(b, "");
    const totalBytes = manifest.reduce((a, m) => a + (m.size ?? 0), 0);
    return { count: manifest.length, totalBytes, buckets: BUCKETS, manifest };
  });