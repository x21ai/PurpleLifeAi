// One-shot migration helpers. Super-admin gated. Delete this file
// after the cutover to your own Supabase instance is complete.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { zipSync, strToU8 } from "fflate";

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

// ---- All-tables CSV export (zip) ----

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "object") {
    s = JSON.stringify(v);
  } else if (typeof v === "boolean" || typeof v === "number") {
    s = String(v);
  } else {
    s = String(v);
  }
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: any[]): { csv: string; columns: string[] } {
  if (rows.length === 0) return { csv: "", columns: [] };
  const columns = Object.keys(rows[0]);
  const header = columns.map(csvCell).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvCell(r[c])).join(","))
    .join("\n");
  return { csv: header + "\n" + body + "\n", columns };
}

export const exportAllTablesZip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Discover public tables
    const { data: tablesData, error: tablesErr } = await supabaseAdmin
      .rpc("exec_sql" as any, {})
      .then(() => ({ data: null, error: new Error("no rpc") }))
      .catch(() => ({ data: null, error: null as any }));
    // Fall back: hardcoded discovery via a query against a known view.
    // information_schema is not exposed by PostgREST; use a small RPC-less
    // approach: try a SELECT against pg_tables through PostgREST's
    // pg_catalog access is also unavailable. So we keep an explicit list
    // that matches the live schema and let unknown tables 404 cleanly.
    void tablesData;
    void tablesErr;

    const TABLES = [
      "admin_message_reads","admin_messages","ai_memory","alerts","app_settings",
      "apple_health_tokens","aura_events","behavior_taxonomy","biometrics",
      "care_audit_log","care_caregiver_visits","care_messages","care_relationships",
      "care_scopes","care_thread_participants","care_threads","community_comments",
      "community_posts","community_reactions","community_reports","community_resources",
      "condition_catalog","contact_messages","daily_behaviors","dna_files","dna_variants",
      "email_send_log","email_send_state","email_unsubscribe_tokens","feedback",
      "food_entries","friendships","hydration_intake","journal_entries",
      "medical_report_public_links","medical_report_schedules","medical_report_shares",
      "medical_reports","medication_doses","medication_side_effects","medications",
      "metric_dictionary","metric_insights","notification_delivery_log","oura_tokens",
      "pending_changes","phi_access_log","platform_rule_audit","platform_rules",
      "profiles","promo_code_redemptions","promo_codes","push_subscriptions",
      "report_documents","report_identity_aliases","report_metric_preferences",
      "report_metrics","research_sources","risk_forecasts","seizure_events",
      "subscriptions","suppressed_emails","trips","user_roles","vital_goals",
      "vitals_log","whoop_tokens",
    ] as const;

    const files: Record<string, Uint8Array> = {};
    const counts: Array<{ table: string; rows: number }> = [];
    const errors: Array<{ table: string; error: string }> = [];
    const PAGE = 1000;

    for (const table of TABLES) {
      try {
        const all: any[] = [];
        let from = 0;
        // paginate
        while (true) {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select("*")
            .range(from, from + PAGE - 1);
          if (error) throw new Error(error.message);
          if (!data || data.length === 0) break;
          all.push(...data);
          if (data.length < PAGE) break;
          from += PAGE;
        }
        const { csv } = rowsToCsv(all);
        files[`02-data/${table}.csv`] = strToU8(csv);
        counts.push({ table, rows: all.length });
      } catch (e: any) {
        errors.push({ table, error: e?.message ?? String(e) });
      }
    }

    // row-counts-source.txt
    const rowCountsTxt =
      counts
        .map((c) => `${c.table}\t${c.rows}`)
        .join("\n") + "\n";
    files["05-cutover/row-counts-source.txt"] = strToU8(rowCountsTxt);

    // rls-source.txt — best-effort via a SQL function if present, else stub
    // We can't query pg_catalog through PostgREST. Emit a placeholder with
    // the table list and a note; verify-rls.sql on NEW prints comparable output.
    const rlsTxt =
      "# Generated stub. Run 05-cutover/verify-rls.sql against SOURCE via a separate\n" +
      "# psql session if you have access, then diff against NEW output.\n" +
      TABLES.map((t) => `${t}\tunknown\tunknown`).join("\n") +
      "\n";
    files["05-cutover/rls-source.txt"] = strToU8(rlsTxt);

    // manifest.json
    const manifest = {
      generated_at: new Date().toISOString(),
      tables: counts,
      errors,
    };
    files["02-data/_manifest.json"] = strToU8(
      JSON.stringify(manifest, null, 2),
    );

    const zipped = zipSync(files, { level: 6 });
    // Return as base64 to keep RPC JSON-safe.
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < zipped.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        Array.from(zipped.subarray(i, i + chunk)) as any,
      );
    }
    const base64 = btoa(bin);
    return {
      filename: `purple-data-${new Date().toISOString().slice(0, 10)}.zip`,
      base64,
      bytes: zipped.length,
      table_count: counts.length,
      total_rows: counts.reduce((a, c) => a + c.rows, 0),
      errors,
    };
  });