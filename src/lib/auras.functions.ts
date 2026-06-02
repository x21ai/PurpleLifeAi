import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const auraKind = z.enum([
  "deja_vu", "jamais_vu", "epigastric", "visual", "olfactory", "emotional", "other",
]);

export const logAura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    user_id?: string;
    occurred_at: string;
    kind: "deja_vu" | "jamais_vu" | "epigastric" | "visual" | "olfactory" | "emotional" | "other";
    duration_seconds?: number | null;
    notes?: string | null;
    led_to_seizure?: boolean;
  }) =>
    z.object({
      user_id: z.string().uuid().optional(),
      occurred_at: z.string().datetime(),
      kind: auraKind,
      duration_seconds: z.number().int().min(0).max(3600).nullable().optional(),
      notes: z.string().trim().max(500).nullable().optional(),
      led_to_seizure: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const target = data.user_id ?? userId;
    const isCaregiver = target !== userId;
    const { data: row, error } = await supabase
      .from("aura_events")
      .insert({
        user_id: target,
        occurred_at: data.occurred_at,
        kind: data.kind,
        duration_seconds: data.duration_seconds ?? null,
        notes: data.notes ?? null,
        led_to_seizure: data.led_to_seizure ?? false,
        created_by_kind: isCaregiver ? "caregiver" : "self",
        created_by_id: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listAurasForDay = createServerFn({ method: "GET" })
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
      .from("aura_events")
      .select("id, occurred_at, kind, duration_seconds, notes, led_to_seizure, created_by_kind")
      .eq("user_id", target)
      .gte("occurred_at", data.from)
      .lt("occurred_at", data.to)
      .order("occurred_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteAura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("aura_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });