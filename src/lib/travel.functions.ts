import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateTripDoses, type MedSlot, type TripLeg } from "@/lib/travel-scheduler";

const LegSchema = z.object({
  tz: z.string().min(1).max(80),
  from_at: z.string().min(1),
  label: z.string().max(120).optional(),
});

const TripInput = z.object({
  label: z.string().max(120).optional().nullable(),
  destination_tz: z.string().min(1).max(80),
  depart_at: z.string().min(1),
  return_at: z.string().min(1),
  legs: z.array(LegSchema).max(20).optional(),
  shift_strategy: z.enum(["home", "snap", "gradual"]).optional(),
  shift_hours_per_day: z.number().min(0).max(12).optional(),
});

export const listTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("trips")
      .select(
        "id, label, destination_tz, depart_at, return_at, status, legs, shift_strategy, shift_hours_per_day, home_tz_snapshot, schedule_generated_at, created_at",
      )
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const homeTz = profile?.timezone ?? "UTC";
    const { data: row, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        label: data.label ?? null,
        destination_tz: data.destination_tz,
        depart_at: data.depart_at,
        return_at: data.return_at,
        legs: data.legs ?? [],
        shift_strategy: data.shift_strategy ?? "snap",
        shift_hours_per_day: data.shift_hours_per_day ?? 2,
        home_tz_snapshot: homeTz,
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
    // Remove any pending doses materialized for this trip first.
    await supabase
      .from("medication_doses")
      .delete()
      .eq("trip_id", data.id)
      .eq("status", "pending");
    const { error } = await supabase.from("trips").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Materialize medication_doses for a trip according to its itinerary.
 * Deletes any prior pending doses (own or tagged with this trip_id) inside the
 * trip window, then inserts fresh ones with `trip_id` set.
 */
export const generateTripSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ trip_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select(
        "id, depart_at, return_at, legs, shift_strategy, shift_hours_per_day, home_tz_snapshot, destination_tz",
      )
      .eq("id", data.trip_id)
      .maybeSingle();
    if (tripErr || !trip) throw new Error(tripErr?.message ?? "Trip not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    const homeTz = trip.home_tz_snapshot ?? profile?.timezone ?? "UTC";

    const { data: meds, error: medsErr } = await supabase
      .from("medications")
      .select("id, schedule, times_of_day, dosage_amount, dosage_unit, is_rescue, active, start_date, end_date")
      .eq("user_id", userId)
      .eq("active", true)
      .eq("is_rescue", false);
    if (medsErr) throw new Error(medsErr.message);

    type ScheduleSlot = { time?: string; amount?: string | number; unit?: string };
    const slots: MedSlot[] = [];
    for (const m of meds ?? []) {
      const sched = (m.schedule as ScheduleSlot[] | null) ?? [];
      if (sched.length > 0) {
        for (const s of sched) {
          if (!s.time || !/^\d{1,2}:\d{2}$/.test(s.time)) continue;
          slots.push({
            medication_id: m.id,
            time: s.time,
            amount: s.amount != null && s.amount !== "" ? Number(s.amount) : m.dosage_amount,
            unit: s.unit || m.dosage_unit,
          });
        }
      } else if (m.times_of_day) {
        for (const t of m.times_of_day as string[]) {
          if (!/^\d{1,2}:\d{2}$/.test(t)) continue;
          slots.push({
            medication_id: m.id,
            time: t,
            amount: m.dosage_amount,
            unit: m.dosage_unit,
          });
        }
      }
    }

    const doses = generateTripDoses({
      homeTz,
      departAt: trip.depart_at,
      returnAt: trip.return_at,
      legs: (trip.legs as TripLeg[]) ?? [],
      slots,
      strategy: (trip.shift_strategy as "home" | "snap" | "gradual") ?? "snap",
      shiftHoursPerDay: Number(trip.shift_hours_per_day ?? 2),
    });

    // Wipe pending doses in the trip window before re-inserting.
    await supabase
      .from("medication_doses")
      .delete()
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("scheduled_at", trip.depart_at)
      .lte("scheduled_at", trip.return_at);

    if (doses.length > 0) {
      const rows = doses.map((d) => ({
        user_id: userId,
        medication_id: d.medication_id,
        scheduled_at: d.scheduled_at,
        amount: d.amount,
        unit: d.unit,
        status: "pending" as const,
        trip_id: trip.id,
      }));
      const { error: insErr } = await supabase.from("medication_doses").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    await supabase
      .from("trips")
      .update({ schedule_generated_at: new Date().toISOString() })
      .eq("id", trip.id);

    return { generated: doses.length, slots: slots.length };
  });