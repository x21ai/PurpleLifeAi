import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ReportSourceData } from "./medical-report.server";

/**
 * Admin-context helper used by the monthly auto-send cron.
 * Mirrors the per-user assembleReportData in medical-report.functions.ts,
 * but uses the service-role client because cron runs without a user JWT.
 * Keeps biometrics grouped per-source so the PDF can draw overlay charts.
 */

const METRICS: Array<{
  label: string;
  column: string;
  unit: string;
  direction: "higher_better" | "lower_better" | "neutral";
  hint: string;
  refLow?: number;
  refHigh?: number;
}> = [
  { label: "Total sleep", column: "sleep_total_min", unit: "min", direction: "higher_better",
    hint: "Minutes asleep per night. Most adults do best 420–540.", refLow: 420, refHigh: 540 },
  { label: "HRV", column: "hrv_rmssd_ms", unit: "ms", direction: "higher_better",
    hint: "Overnight RMSSD. Sustained 15%+ drops can flag stress or illness." },
  { label: "Resting HR", column: "resting_hr_bpm", unit: "bpm", direction: "lower_better",
    hint: "Overnight resting heart rate. +7 bpm above baseline is notable.", refLow: 50, refHigh: 75 },
  { label: "SpO2", column: "spo2_pct", unit: "%", direction: "higher_better",
    hint: "Overnight blood oxygen. Below 94% is worth flagging clinically.", refLow: 94, refHigh: 100 },
  { label: "Readiness", column: "oura_readiness_score", unit: "", direction: "higher_better",
    hint: "Oura readiness score (0–100)." },
  { label: "Recovery", column: "whoop_recovery_pct", unit: "%", direction: "higher_better",
    hint: "Whoop recovery score." },
  { label: "Steps", column: "steps", unit: "", direction: "neutral",
    hint: "Daily step count." },
];

export type Sections = ReportSourceData["sections"];

export const DEFAULT_SECTIONS: Sections = {
  snapshot: true, meds: true, seizures: true, biometrics: true,
  labs: true, journal: true, extras: true, appendix: false,
};

export async function assembleReportDataAdmin(
  userId: string,
  from: string,
  to: string,
  sections: Sections,
): Promise<ReportSourceData> {
  const fromISO = new Date(`${from}T00:00:00Z`).toISOString();
  const toISO = new Date(`${to}T23:59:59Z`).toISOString();

  const [profileQ, medsQ, dosesQ, seizQ, bioQ, auraQ, journalQ] = await Promise.all([
    supabaseAdmin.from("profiles")
      .select("first_name, last_name, date_of_birth, conditions, conditions_note, email")
      .eq("id", userId).maybeSingle(),
    supabaseAdmin.from("medications")
      .select("id, name, dosage, dosage_amount, dosage_unit, times_of_day, start_date, end_date, active")
      .eq("user_id", userId),
    supabaseAdmin.from("medication_doses")
      .select("medication_id, scheduled_at, status, taken_at")
      .eq("user_id", userId)
      .gte("scheduled_at", fromISO).lte("scheduled_at", toISO),
    supabaseAdmin.from("seizure_events")
      .select("started_at, duration_seconds, type, severity, notes")
      .eq("user_id", userId)
      .gte("started_at", fromISO).lte("started_at", toISO)
      .order("started_at", { ascending: false }),
    supabaseAdmin.from("biometrics")
      .select("recorded_at, source, " + METRICS.map((m) => m.column).join(", "))
      .eq("user_id", userId)
      .gte("recorded_at", fromISO).lte("recorded_at", toISO),
    sections.extras
      ? supabaseAdmin.from("aura_events")
          .select("occurred_at, led_to_seizure")
          .eq("user_id", userId)
          .gte("occurred_at", fromISO).lte("occurred_at", toISO)
      : Promise.resolve({ data: [], error: null }),
    sections.journal
      ? supabaseAdmin.from("journal_entries")
          .select("created_at, ai_tags")
          .eq("user_id", userId)
          .gte("created_at", fromISO).lte("created_at", toISO)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Meds + adherence
  const dosesByMed = new Map<string, Array<{ status: string; scheduled_at: string; taken_at: string | null }>>();
  for (const d of dosesQ.data ?? []) {
    if (!dosesByMed.has(d.medication_id)) dosesByMed.set(d.medication_id, []);
    dosesByMed.get(d.medication_id)!.push(d as { status: string; scheduled_at: string; taken_at: string | null });
  }
  const meds = (medsQ.data ?? []).map((m) => {
    const list = dosesByMed.get(m.id) ?? [];
    const taken = list.filter((d) => d.status === "taken");
    const adherence_pct = list.length ? Math.round((taken.length / list.length) * 100) : null;
    const lastTaken = taken.map((d) => d.taken_at ?? d.scheduled_at).sort().pop() ?? null;
    const times: string[] = Array.isArray(m.times_of_day) ? m.times_of_day : [];
    const sched = times.length ? times.join(", ") : "as needed";
    const dosage = m.dosage ?? (m.dosage_amount ? `${m.dosage_amount} ${m.dosage_unit ?? ""}`.trim() : null);
    return {
      name: m.name, dosage, schedule_summary: sched,
      start_date: m.start_date as string | null,
      end_date: m.end_date as string | null,
      adherence_pct, last_taken: lastTaken, active: !!m.active,
    };
  });

  // Biometrics grouped per source for overlay charts
  const biometrics: ReportSourceData["biometrics"] = {};
  for (const meta of METRICS) {
    const bySource = new Map<string, Map<string, number[]>>(); // source -> date -> values
    const rows = ((bioQ.data ?? []) as unknown) as Array<Record<string, unknown>>;
    for (const row of rows) {
      const v = row[meta.column];
      if (v == null || typeof v !== "number") continue;
      const date = String(row.recorded_at).slice(0, 10);
      const source = String(row.source ?? "other");
      if (!bySource.has(source)) bySource.set(source, new Map());
      const m = bySource.get(source)!;
      if (!m.has(date)) m.set(date, []);
      m.get(date)!.push(v);
    }
    if (bySource.size === 0) continue;
    const series: Record<string, Array<{ date: string; value: number }>> = {};
    const allPoints: Array<{ date: string; value: number }> = [];
    for (const [source, dateMap] of bySource.entries()) {
      const points = Array.from(dateMap.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, vs]) => ({ date, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
      series[source] = points;
      allPoints.push(...points);
    }
    // Combined daily average as the fallback "points"
    const combined = new Map<string, number[]>();
    for (const p of allPoints) {
      if (!combined.has(p.date)) combined.set(p.date, []);
      combined.get(p.date)!.push(p.value);
    }
    const points = Array.from(combined.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, vs]) => ({ date, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
    biometrics[meta.label] = {
      unit: meta.unit,
      direction: meta.direction,
      points,
      hint: meta.hint,
      series,
      refLow: meta.refLow,
      refHigh: meta.refHigh,
    };
  }

  // Auras
  let auras: { count: number; led_to_seizure: number } | null = null;
  if (sections.extras) {
    const rows = (auraQ.data ?? []) as Array<{ led_to_seizure: boolean }>;
    auras = { count: rows.length, led_to_seizure: rows.filter((r) => r.led_to_seizure).length };
  }

  // Journal summary
  let journalSummary: string | null = null;
  if (sections.journal) {
    const entries = (journalQ.data ?? []) as Array<{ ai_tags: string[] | null }>;
    if (entries.length) {
      const tagCounts = new Map<string, number>();
      for (const e of entries) {
        for (const t of e.ai_tags ?? []) {
          tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        }
      }
      const topTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => `${t} (${n})`);
      const parts: string[] = [`${entries.length} journal entries in this window.`];
      if (topTags.length) parts.push(`Recurring themes: ${topTags.join(", ")}.`);
      journalSummary = parts.join(" ");
    }
  }

  // Labs — list user's report_documents in window
  const labs: ReportSourceData["labs"] = [];
  if (sections.labs) {
    const { data: docs } = await supabaseAdmin
      .from("report_documents")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .gte("created_at", fromISO).lte("created_at", toISO);
    for (const d of docs ?? []) {
      const { count } = await supabaseAdmin
        .from("report_metrics")
        .select("id", { count: "exact", head: true })
        .eq("report_id", d.id);
      labs.push({ title: d.title, created_at: d.created_at, metric_count: count ?? 0 });
    }
  }

  return {
    profile: {
      first_name: profileQ.data?.first_name ?? null,
      last_name: profileQ.data?.last_name ?? null,
      date_of_birth: profileQ.data?.date_of_birth ?? null,
      conditions: (profileQ.data?.conditions as string[] | null) ?? null,
      conditions_note: profileQ.data?.conditions_note ?? null,
      email: profileQ.data?.email ?? null,
    },
    window: { from, to },
    generatedAt: new Date().toISOString(),
    meds,
    seizures: (seizQ.data ?? []) as ReportSourceData["seizures"],
    biometrics,
    labs,
    journalSummary,
    hydration: null,
    auras,
    sections,
  };
}

/**
 * Generate the PDF and upload it to the medical-reports bucket using
 * the service-role client. Returns the report row id + a long-lived
 * signed URL suitable for emailing.
 */
export async function generateAndStoreMedicalReportAdmin(opts: {
  userId: string;
  from: string;
  to: string;
  sections: Sections;
  signedUrlSeconds?: number;
}): Promise<{ reportId: string; signedUrl: string; filePath: string }> {
  const data = await assembleReportDataAdmin(opts.userId, opts.from, opts.to, opts.sections);
  const { buildMedicalReportPdf } = await import("./medical-report.server");
  const bytes = await buildMedicalReportPdf(data);

  const id = crypto.randomUUID();
  const filePath = `${opts.userId}/${id}.pdf`;
  const up = await supabaseAdmin.storage
    .from("medical-reports")
    .upload(filePath, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) throw new Error(up.error.message);

  const ins = await supabaseAdmin.from("medical_reports").insert({
    id,
    user_id: opts.userId,
    window_from: opts.from,
    window_to: opts.to,
    file_path: filePath,
    sections: opts.sections,
  });
  if (ins.error) throw new Error(ins.error.message);

  const signed = await supabaseAdmin.storage
    .from("medical-reports")
    .createSignedUrl(filePath, opts.signedUrlSeconds ?? 60 * 60 * 24 * 14);
  if (signed.error) throw new Error(signed.error.message);

  return { reportId: id, signedUrl: signed.data.signedUrl, filePath };
}