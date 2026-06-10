import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
        const v = (r as Record<string, number | null>)[key];
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

    return {
      weightKg: weight.value,
      bpSystolic: sbp.value,
      bpDiastolic: dbp.value,
      glucoseMgDl: glu.value,
      spo2Pct: latestNonNull("spo2_pct"),
      bodyTempC: latestNonNull("skin_temp_c"),
      respRate: latestNonNull("respiratory_rate_bpm"),
      weightAt: weight.at,
      bpAt: sbp.at,
      glucoseAt: glu.at,
    };
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