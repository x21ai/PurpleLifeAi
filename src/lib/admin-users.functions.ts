import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("super_admin") && !roles.includes("admin")) {
    throw new Error("Not authorized");
  }
  return { isSuper: roles.includes("super_admin") };
}

const userIdInput = z.object({ user_id: z.string().uuid() });

export const adminArchiveUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: new Date().toISOString(), purge_after: null })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRestoreUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: null, purge_after: null, suspended_at: null })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminScheduleDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({ user_id: z.string().uuid(), days: z.number().int().min(1).max(90).default(30) })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const purge = new Date(Date.now() + data.days * 86400_000).toISOString();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ purge_after: purge })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true, purge_after: purge };
  });

export const adminCancelDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ purge_after: null })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ email: z.string().email() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResetMfa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: factors, error: listErr } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: data.user_id,
    });
    if (listErr) throw new Error(listErr.message);
    for (const f of factors?.factors ?? []) {
      await supabaseAdmin.auth.admin.mfa.deleteFactor({ userId: data.user_id, id: f.id });
    }
    return { ok: true, removed: factors?.factors?.length ?? 0 };
  });

export const adminListUserCare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rels } = await supabaseAdmin
      .from("care_relationships")
      .select("id, caregiver_id, invite_email, role, status, created_at, accepted_at")
      .eq("owner_id", data.user_id)
      .order("created_at", { ascending: false });
    return { relationships: rels ?? [] };
  });

export const adminGetUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => userIdInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (error) throw new Error(error.message);
    return { email: u.user?.email ?? null };
  });
