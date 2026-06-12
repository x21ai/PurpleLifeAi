import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("super_admin") && !roles.includes("admin")) {
    throw new Error("Not authorized");
  }
}

export type DuplicateReportRow = {
  id: string;
  user_id: string;
  title: string;
  report_type: string | null;
  report_date: string | null;
  content_hash: string | null;
  duplicate_of: string | null;
  excluded_from_trends: boolean;
  identity_status: string;
  created_at: string;
  patient_name: string | null;
  owner_name: string | null;
};

export type DuplicateGroup = {
  key: string;
  user_id: string;
  owner_name: string | null;
  report_date: string | null;
  fingerprint: string;
  reports: DuplicateReportRow[];
};

export const listSuspectedDuplicates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: docs, error } = await supabaseAdmin
      .from("report_documents")
      .select(
        "id, user_id, title, report_type, report_date, content_hash, duplicate_of, excluded_from_trends, identity_status, created_at, patient_name",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((docs ?? []).map((d) => d.user_id as string)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const nameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      const n = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      nameMap.set(p.id as string, n || "Unnamed");
    }

    const groups = new Map<string, DuplicateGroup>();
    for (const d of docs ?? []) {
      const fp = (d.content_hash as string | null) || `${d.report_type ?? ""}|${d.title ?? ""}`;
      const key = `${d.user_id}|${d.report_date ?? "nodate"}|${fp}`;
      const g = groups.get(key) ?? {
        key,
        user_id: d.user_id as string,
        owner_name: nameMap.get(d.user_id as string) ?? null,
        report_date: d.report_date as string | null,
        fingerprint: fp,
        reports: [],
      };
      g.reports.push({
        id: d.id as string,
        user_id: d.user_id as string,
        title: d.title as string,
        report_type: d.report_type as string | null,
        report_date: d.report_date as string | null,
        content_hash: d.content_hash as string | null,
        duplicate_of: d.duplicate_of as string | null,
        excluded_from_trends: !!d.excluded_from_trends,
        identity_status: (d.identity_status as string | null) ?? "unverified",
        created_at: d.created_at as string,
        patient_name: d.patient_name as string | null,
        owner_name: nameMap.get(d.user_id as string) ?? null,
      });
      groups.set(key, g);
    }

    const list = Array.from(groups.values())
      .filter((g) => g.reports.length >= 2)
      .sort((a, b) => (b.report_date ?? "").localeCompare(a.report_date ?? ""));
    return { groups: list };
  });

const idInput = z.object({ id: z.string().uuid() });
const markInput = z.object({ id: z.string().uuid(), keeperId: z.string().uuid() });

export const markDuplicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => markInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === data.keeperId) throw new Error("Cannot mark a report as a duplicate of itself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("report_documents")
      .update({ duplicate_of: data.keeperId, excluded_from_trends: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excludeFromTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => idInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("report_documents")
      .update({ excluded_from_trends: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => idInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("report_documents")
      .update({ excluded_from_trends: false, duplicate_of: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
