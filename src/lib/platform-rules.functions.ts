import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Known rule keys with friendly labels so the admin UI can seed them
 *  even before any row exists. Add new ones here as we use them in code. */
export const KNOWN_RULE_KEYS: Array<{
  key: string;
  label: string;
  description: string;
  defaultValue: string | number | boolean;
}> = [
  {
    key: "require_identity_match_for_metrics",
    label: "Require name + DOB match before counting metrics",
    description:
      "When on, an uploaded report's metrics are excluded from trends unless the name and DOB on the report match the user's profile (or the user manually approves it).",
    defaultValue: true,
  },
  {
    key: "dedupe_overlap_threshold",
    label: "Duplicate detection overlap (%)",
    description:
      "Two reports with the same date are considered duplicates when this share of metric/value pairs match. 60 means 60%.",
    defaultValue: 60,
  },
  {
    key: "block_rejected_reuploads",
    label: "Block re-uploads of previously rejected reports",
    description:
      "When on, uploading a file with the same content hash that the user previously rejected is refused at upload time.",
    defaultValue: true,
  },
];

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

export const listPlatformRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);
    const [{ data: rules, error }, { data: audit }] = await Promise.all([
      supabase
        .from("platform_rules")
        .select("id, scope, scope_value, key, value, enabled, description, created_at, updated_at")
        .order("scope", { ascending: true })
        .order("key", { ascending: true }),
      supabase
        .from("platform_rule_audit")
        .select("id, rule_id, scope, scope_value, key, actor_id, action, before, after, at")
        .order("at", { ascending: false })
        .limit(50),
    ]);
    if (error) throw new Error(error.message);
    return { rules: rules ?? [], audit: audit ?? [], knownKeys: KNOWN_RULE_KEYS };
  });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  scope: z.enum(["platform", "role", "user"]),
  scope_value: z.string().max(120).nullable().optional(),
  key: z.string().min(1).max(120),
  value: z.unknown(),
  enabled: z.boolean().optional(),
  description: z.string().max(500).nullable().optional(),
});

export const upsertPlatformRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);

    let before: unknown = null;
    if (data.id) {
      const { data: prev } = await supabase
        .from("platform_rules")
        .select("id, scope, scope_value, key, value, enabled, description")
        .eq("id", data.id)
        .maybeSingle();
      before = prev ?? null;
    } else {
      let q = supabase
        .from("platform_rules")
        .select("id, scope, scope_value, key, value, enabled, description")
        .eq("scope", data.scope)
        .eq("key", data.key);
      q = data.scope_value == null ? q.is("scope_value", null) : q.eq("scope_value", data.scope_value);
      const { data: prev } = await q.maybeSingle();
      before = prev ?? null;
    }

    const row = {
      scope: data.scope,
      scope_value: data.scope === "platform" ? null : data.scope_value ?? null,
      key: data.key,
      value: data.value as never,
      enabled: data.enabled ?? true,
      description: data.description ?? null,
      created_by: userId,
    } as any;
    const { data: saved, error } = await supabase
      .from("platform_rules")
      .upsert(row, { onConflict: "scope,scope_value,key" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("platform_rule_audit").insert({
      rule_id: saved.id,
      scope: saved.scope,
      scope_value: saved.scope_value,
      key: saved.key,
      actor_id: userId,
      action: before ? "update" : "create",
      before,
      after: saved,
    });

    return { rule: saved };
  });

export const deletePlatformRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertSuperAdmin(supabase, userId);
    const { data: before } = await supabase
      .from("platform_rules")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabase.from("platform_rules").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (before) {
      await supabase.from("platform_rule_audit").insert({
        rule_id: data.id,
        scope: before.scope,
        scope_value: before.scope_value,
        key: before.key,
        actor_id: userId,
        action: "delete",
        before,
        after: null,
      });
    }
    return { ok: true };
  });