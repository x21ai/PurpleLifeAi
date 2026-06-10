import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Apple-style "vitals" snapshot for the Insights header.
 * Latest known value for each, drawn from biometrics + report_metrics.
 * Null when not available.
 */
export type VitalsSnapshot = {
  weightKg: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  glucoseMgDl: number | null;
  spo2Pct: number | null;
  bodyTempC: number | null;
  respRate: number | null;
  weightAt: string | null;
  bpAt: string | null;
  glucoseAt: string | null;
};

const REPORT_METRIC_KEYS = [
  "weight", "body_weight",
  "blood_pressure_systolic", "systolic_bp", "sbp",
  "blood_pressure_diastolic", "diastolic_bp", "dbp",
  "glucose", "fasting_glucose", "blood_glucose",
];

export const getVitalsSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VitalsSnapshot> => {
    const { supabase, userId } = context;

    // Latest biometrics row that has any of spo2/temp/resp.
    const { data: bio } = await supabase
      .from("biometrics")
      .select("recorded_at, spo2_pct, skin_temp_c, respiratory_rate_bpm")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(30);

    const latestNonNull = <K extends "spo2_pct" | "skin_temp_c" | "respiratory_rate_bpm">(
      key: K,
    ): number | null => {
      for (const r of bio ?? []) {
        const v = (r as unknown as Record<string, number | null>)[key];
        if (v != null) return v;
      }
      return null;
    };

    // Pull recent matching report_metrics rows; pick newest per key.
    const { data: rm } = await supabase
      .from("report_metrics")
      .select("metric_key, value, measured_at")
      .eq("user_id", userId)
      .in("metric_key", REPORT_METRIC_KEYS)
      .order("measured_at", { ascending: false })
      .limit(200);

    const latestFor = (keys: string[]): { value: number | null; at: string | null } => {
      for (const r of rm ?? []) {
        if (keys.includes(r.metric_key) && r.value != null) {
          return { value: Number(r.value), at: r.measured_at };
        }
      }
      return { value: null, at: null };
    };

    const weight = latestFor(["weight", "body_weight"]);
    const sbp = latestFor(["blood_pressure_systolic", "systolic_bp", "sbp"]);
    const dbp = latestFor(["blood_pressure_diastolic", "diastolic_bp", "dbp"]);
    const glu = latestFor(["glucose", "fasting_glucose", "blood_glucose"]);

    // Manual quick-logs win when newer than report/biometrics readings.
    const { data: logs } = await supabase
      .from("vitals_log")
      .select("kind, value, value2, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(200);
    const latestLog = (kind: string) =>
      (logs ?? []).find((l) => l.kind === kind) ?? null;

    const pick = (
      a: { value: number | null; at: string | null },
      logKind: string,
    ): { value: number | null; at: string | null } => {
      const l = latestLog(logKind);
      if (!l || l.value == null) return a;
      if (!a.at || (l.measured_at && l.measured_at > a.at)) {
        return { value: Number(l.value), at: l.measured_at };
      }
      return a;
    };

    const pickBp = (): { sys: number | null; dia: number | null; at: string | null } => {
      const l = latestLog("bp");
      const fromReport = { sys: sbp.value, dia: dbp.value, at: sbp.at };
      if (!l || l.value == null) return fromReport;
      if (!fromReport.at || (l.measured_at && l.measured_at > fromReport.at)) {
        return { sys: Number(l.value), dia: l.value2 != null ? Number(l.value2) : null, at: l.measured_at };
      }
      return fromReport;
    };

    const w = pick(weight, "weight");
    const g = pick(glu, "glucose");
    const bp = pickBp();
    const spo2Log = latestLog("spo2");
    const tempLog = latestLog("temp");
    const respLog = latestLog("resp_rate");
    const spo2Bio = latestNonNull("spo2_pct");
    const tempBio = latestNonNull("skin_temp_c");
    const respBio = latestNonNull("respiratory_rate_bpm");

    return {
      weightKg: w.value,
      bpSystolic: bp.sys,
      bpDiastolic: bp.dia,
      glucoseMgDl: g.value,
      spo2Pct: spo2Log?.value != null ? Number(spo2Log.value) : spo2Bio,
      bodyTempC: tempLog?.value != null ? Number(tempLog.value) : tempBio,
      respRate: respLog?.value != null ? Number(respLog.value) : respBio,
      weightAt: w.at,
      bpAt: bp.at,
      glucoseAt: g.at,
    };
  });

/** Manual quick-log for a vital reading. */
export const logVital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      kind: z.enum(["weight", "bp", "glucose", "spo2", "temp", "resp_rate"]),
      value: z.number().finite(),
      value2: z.number().finite().nullable().optional(),
      unit: z.string().max(20).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      measuredAt: z.string().datetime().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("vitals_log").insert({
      user_id: userId,
      kind: data.kind,
      value: data.value,
      value2: data.value2 ?? null,
      unit: data.unit ?? null,
      notes: data.notes ?? null,
      measured_at: data.measuredAt ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Counts per report_category for the Health Records hub tiles. */
export const getHealthRecordsCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: reports }, { data: dna }] = await Promise.all([
      supabase
        .from("report_documents")
        .select("report_category")
        .eq("user_id", userId)
        .neq("status", "rejected"),
      supabase
        .from("dna_files")
        .select("id")
        .eq("user_id", userId),
    ]);
    const counts: Record<string, number> = {};
    for (const r of reports ?? []) {
      const k = r.report_category ?? "other";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    counts.dna = (counts.dna ?? 0) + (dna?.length ?? 0);
    return { counts };
  });

/* ---------- Phase 7: Vital goals / targets ---------- */

export type VitalGoal = {
  kind: "weight" | "bp" | "glucose" | "spo2" | "temp" | "resp_rate";
  target_min: number | null;
  target_max: number | null;
  target_min2: number | null;
  target_max2: number | null;
  unit: string | null;
  note: string | null;
};

export const getVitalGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ goals: VitalGoal[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("vital_goals")
      .select("kind, target_min, target_max, target_min2, target_max2, unit, note")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { goals: (data ?? []) as VitalGoal[] };
  });

export const setVitalGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      kind: z.enum(["weight", "bp", "glucose", "spo2", "temp", "resp_rate"]),
      target_min: z.number().finite().nullable().optional(),
      target_max: z.number().finite().nullable().optional(),
      target_min2: z.number().finite().nullable().optional(),
      target_max2: z.number().finite().nullable().optional(),
      unit: z.string().max(20).nullable().optional(),
      note: z.string().max(280).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("vital_goals")
      .upsert(
        {
          user_id: userId,
          kind: data.kind,
          target_min: data.target_min ?? null,
          target_max: data.target_max ?? null,
          target_min2: data.target_min2 ?? null,
          target_max2: data.target_max2 ?? null,
          unit: data.unit ?? null,
          note: data.note ?? null,
        },
        { onConflict: "user_id,kind" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVitalGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      kind: z.enum(["weight", "bp", "glucose", "spo2", "temp", "resp_rate"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("vital_goals")
      .delete()
      .eq("user_id", userId)
      .eq("kind", data.kind);
    if (error) throw new Error(error.message);
    return { ok: true };
  });