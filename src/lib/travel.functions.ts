import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TripInput = z.object({
  label: z.string().max(120).optional().nullable(),
  destination_tz: z.string().min(1).max(80),
  depart_at: z.string().min(1),
  return_at: z.string().min(1),
});

export const listTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("trips")
      .select("id, label, destination_tz, depart_at, return_at, status, created_at")
      .order("depart_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { trips: data ?? [] };
  });

export const getActiveTrip = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("trips")
      .select("id, label, destination_tz, depart_at, return_at, status")
      .lte("depart_at", nowIso)
      .gte("return_at", nowIso)
      .neq("status", "cancelled")
      .order("depart_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { trip: data ?? null };
  });

export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TripInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        label: data.label ?? null,
        destination_tz: data.destination_tz,
        depart_at: data.depart_at,
        return_at: data.return_at,
        status: "planned",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create trip");
    return { id: row.id };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("trips").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });