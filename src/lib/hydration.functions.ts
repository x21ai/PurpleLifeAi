import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const drinkKind = z.enum(["water", "electrolyte", "coffee", "tea", "other"]);

export const logHydration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    user_id?: string;
    consumed_at: string;
    volume_ml: number;
    kind: "water" | "electrolyte" | "coffee" | "tea" | "other";
    electrolyte_brand?: string | null;
    sodium_mg?: number | null;
    notes?: string | null;
  }) =>
    z.object({
      user_id: z.string().uuid().optional(),
      consumed_at: z.string().datetime(),
      volume_ml: z.number().int().min(1).max(5000),
      kind: drinkKind,
      electrolyte_brand: z.string().trim().max(80).nullable().optional(),
      sodium_mg: z.number().int().min(0).max(10000).nullable().optional(),
      notes: z.string().trim().max(500).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.user_id ?? userId;
    const isCaregiver = target !== userId;
    const { data: row, error } = await supabase
      .from("hydration_intake")
      .insert({
        user_id: target,
        consumed_at: data.consumed_at,
        volume_ml: data.volume_ml,
        kind: data.kind,
        electrolyte_brand: data.electrolyte_brand ?? null,
        sodium_mg: data.sodium_mg ?? null,
        notes: data.notes ?? null,
        created_by_kind: isCaregiver ? "caregiver" : "self",
        created_by_id: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listHydrationForDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id?: string; from: string; to: string }) =>
    z.object({
      user_id: z.string().uuid().optional(),
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.user_id ?? userId;
    const { data: rows, error } = await supabase
      .from("hydration_intake")
      .select("id, consumed_at, volume_ml, kind, electrolyte_brand, sodium_mg, notes, created_by_kind")
      .eq("user_id", target)
      .gte("consumed_at", data.from)
      .lt("consumed_at", data.to)
      .order("consumed_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteHydration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("hydration_intake").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });