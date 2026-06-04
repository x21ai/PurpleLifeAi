import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RecipientSchema = z.object({
  email: z.string().email(),
  label: z.string().max(120).optional(),
});

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  active: z.boolean().default(true),
  cadence: z.enum(["monthly"]).default("monthly"),
  day_of_month: z.number().int().min(1).max(28).default(1),
  window_days: z.number().int().min(7).max(365).default(30),
  timezone: z.string().max(60).default("UTC"),
  recipients: z.array(RecipientSchema).max(10).default([]),
  sections: z
    .object({
      snapshot: z.boolean().default(true),
      meds: z.boolean().default(true),
      seizures: z.boolean().default(true),
      biometrics: z.boolean().default(true),
      labs: z.boolean().default(true),
      journal: z.boolean().default(true),
      extras: z.boolean().default(true),
      appendix: z.boolean().default(false),
    })
    .default({}),
});

export const listMedicalReportSchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("medical_report_schedules")
      .select(
        "id, active, cadence, day_of_month, window_days, timezone, recipients, sections, last_run_at, last_error, created_at, updated_at",
      )
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { schedules: data ?? [] };
  });

export const upsertMedicalReportSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      active: data.active,
      cadence: data.cadence,
      day_of_month: data.day_of_month,
      window_days: data.window_days,
      timezone: data.timezone,
      recipients: data.recipients,
      sections: data.sections,
    };
    if (data.id) {
      const { error } = await supabase
        .from("medical_report_schedules")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase
      .from("medical_report_schedules")
      .insert(payload)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed");
    return { id: row.id };
  });

export const deleteMedicalReportSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("medical_report_schedules")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });