import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SectionsSchema = z.object({
  snapshot: z.boolean().default(true),
  meds: z.boolean().default(true),
  seizures: z.boolean().default(true),
  biometrics: z.boolean().default(true),
  labs: z.boolean().default(true),
  journal: z.boolean().default(true),
  extras: z.boolean().default(true),
  appendix: z.boolean().default(false),
});

const GenerateInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sections: SectionsSchema.optional(),
});

type Section = z.infer<typeof SectionsSchema>;

const DEFAULT_SECTIONS: Section = {
  snapshot: true, meds: true, seizures: true, biometrics: true,
  labs: true, journal: true, extras: true, appendix: false,
};

const METRICS: Array<{
  label: string;
  column: string;
  unit: string;
  direction: "higher_better" | "lower_better" | "neutral";
  hint: string;
}> = [
  { label: "Total sleep", column: "sleep_total_min", unit: "min", direction: "higher_better",
    hint: "Minutes asleep per night. Most adults do best 420–540." },
  { label: "HRV", column: "hrv_rmssd_ms", unit: "ms", direction: "higher_better",
    hint: "Overnight RMSSD. Sustained 15%+ drops can flag stress or illness." },
  { label: "Resting HR", column: "resting_hr_bpm", unit: "bpm", direction: "lower_better",
    hint: "Overnight resting heart rate. +7 bpm above baseline is notable." },
  { label: "SpO2", column: "spo2_pct", unit: "%", direction: "higher_better",
    hint: "Overnight blood oxygen. Below 94% is worth flagging clinically." },
  { label: "Readiness", column: "oura_readiness_score", unit: "", direction: "higher_better",
    hint: "Oura readiness score (0–100)." },
  { label: "Recovery", column: "whoop_recovery_pct", unit: "%", direction: "higher_better",
    hint: "Whoop recovery score." },
  { label: "Steps", column: "steps", unit: "", direction: "neutral",
    hint: "Daily step count." },
];

async function assembleReportData(userId: string, from: string, to: string, sections: Section) {
  const fromISO = new Date(`${from}T00:00:00Z`).toISOString();
  const toISO = new Date(`${to}T23:59:59Z`).toISOString();

  const [profileQ, medsQ, dosesQ, seizQ, bioQ, auraQ] = await Promise.all([
    supabaseAdmin.from("profiles")
      .select("first_name, last_name, date_of_birth, conditions, conditions_note")
      .eq("id", userId).maybeSingle(),
    supabaseAdmin.from("medications")
      .select("id, name, dosage, dosage_amount, dosage_unit, schedule, times_of_day, start_date, end_date, active")
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
      : Promise.resolve({ data: [] as Array<{ occurred_at: string; led_to_seizure: boolean }>, error: null }),
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
    const adherence_pct = list.length
      ? Math.round((taken.length / list.length) * 100)
      : null;
    const lastTaken = taken
      .map((d) => d.taken_at ?? d.scheduled_at)
      .sort()
      .pop() ?? null;
    const times: string[] = Array.isArray(m.times_of_day) ? m.times_of_day : [];
    const sched = times.length ? times.join(", ") : "as needed";
    const dosage = m.dosage ?? (m.dosage_amount ? `${m.dosage_amount} ${m.dosage_unit ?? ""}`.trim() : null);
    return {
      name: m.name,
      dosage,
      schedule_summary: sched,
      start_date: m.start_date as string | null,
      end_date: m.end_date as string | null,
      adherence_pct,
      last_taken: lastTaken,
      active: !!m.active,
    };
  });

  // Biometrics — collapse per-day average across sources
  const biometrics: Record<string, {
    unit: string;
    direction: "higher_better" | "lower_better" | "neutral";
    points: Array<{ date: string; value: number }>;
    hint: string;
  }> = {};
  for (const meta of METRICS) {
    const buckets = new Map<string, number[]>();
    const bioRows = ((bioQ.data ?? []) as unknown) as Array<Record<string, unknown>>;
    for (const row of bioRows) {
      const v = row[meta.column];
      if (v == null || typeof v !== "number") continue;
      const date = String(row.recorded_at).slice(0, 10);
      if (!buckets.has(date)) buckets.set(date, []);
      buckets.get(date)!.push(v);
    }
    if (buckets.size === 0) continue;
    const points = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, vs]) => ({ date, value: vs.reduce((a, b) => a + b, 0) / vs.length }));
    biometrics[meta.label] = { unit: meta.unit, direction: meta.direction, points, hint: meta.hint };
  }

  // Hydration summary intentionally skipped — not in the generated types.
  const hydration: { total_logs: number; avg_ml_per_day: number | null } | null = null;

  // Auras
  let auras: { count: number; led_to_seizure: number } | null = null;
  if (sections.extras) {
    const rows = ((auraQ.data ?? []) as unknown) as Array<{ led_to_seizure: boolean }>;
    auras = { count: rows.length, led_to_seizure: rows.filter((r) => r.led_to_seizure).length };
  }

  // Labs intentionally skipped — handled by the existing /reports route.
  const labs: Array<{ title: string; created_at: string; metric_count: number }> = [];

  // Journal summary — simple count + tag frequency.
  let journalSummary: string | null = null;
  if (sections.journal) {
    const { data: entries } = await supabaseAdmin
      .from("journal_entries")
      .select("created_at, ai_tags")
      .eq("user_id", userId)
      .gte("created_at", fromISO).lte("created_at", toISO);
    if (entries && entries.length) {
      const tagCounts = new Map<string, number>();
      for (const e of entries) {
        for (const t of (e.ai_tags ?? []) as string[]) {
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

  return {
    profile: {
      first_name: profileQ.data?.first_name ?? null,
      last_name: profileQ.data?.last_name ?? null,
      date_of_birth: profileQ.data?.date_of_birth ?? null,
      conditions: (profileQ.data?.conditions as string[] | null) ?? null,
      conditions_note: profileQ.data?.conditions_note ?? null,
    },
    window: { from, to },
    generatedAt: new Date().toISOString(),
    meds,
    seizures: (seizQ.data ?? []) as Array<{
      started_at: string;
      duration_seconds: number | null;
      type: string | null;
      severity: number | null;
      notes: string | null;
    }>,
    biometrics,
    labs,
    journalSummary,
    hydration,
    auras,
    sections,
  };
}

/** Generate the PDF, store it, return a signed URL + report id. */
export const generateMedicalHistoryReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const sections: Section = { ...DEFAULT_SECTIONS, ...(data.sections ?? {}) };
    const assembled = await assembleReportData(userId, data.from, data.to, sections);
    const { buildMedicalReportPdf } = await import("./medical-report.server");
    const bytes = await buildMedicalReportPdf(assembled);

    const id = crypto.randomUUID();
    const filePath = `${userId}/${id}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("medical-reports")
      .upload(filePath, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { error: insErr } = await supabaseAdmin.from("medical_reports").insert({
      id,
      user_id: userId,
      window_from: data.from,
      window_to: data.to,
      file_path: filePath,
      sections,
    });
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin.from("medical_report_shares").insert({
      report_id: id,
      user_id: userId,
      channel: "download",
    });

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("medical-reports")
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    if (sErr) throw new Error(sErr.message);

    return { reportId: id, url: signed.signedUrl, filePath };
  });

/** List the user's existing medical history reports. */
export const listMedicalHistoryReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("medical_reports")
      .select("id, window_from, window_to, created_at, file_path")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });

/** Re-sign a stored report. */
export const getMedicalReportSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reportId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("medical_reports").select("file_path")
      .eq("id", data.reportId).eq("user_id", context.userId).maybeSingle();
    if (error || !row) throw new Error("Report not found");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("medical-reports").createSignedUrl(row.file_path, 60 * 60);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });

/** Delete a stored report (and its file). */
export const deleteMedicalHistoryReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reportId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await supabaseAdmin
      .from("medical_reports").select("file_path")
      .eq("id", data.reportId).eq("user_id", context.userId).maybeSingle();
    if (row?.file_path) {
      await supabaseAdmin.storage.from("medical-reports").remove([row.file_path]);
    }
    await supabaseAdmin.from("medical_reports")
      .delete().eq("id", data.reportId).eq("user_id", context.userId);
    return { ok: true };
  });

/** Email the signed link of a report. */
export const emailMedicalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      reportId: z.string().uuid(),
      recipientEmail: z.string().email(),
      message: z.string().max(1000).optional(),
      self: z.boolean().default(false),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("medical_reports").select("file_path, window_from, window_to")
      .eq("id", data.reportId).eq("user_id", userId).maybeSingle();
    if (!row) throw new Error("Report not found");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("medical-reports").createSignedUrl(row.file_path, 60 * 60 * 24 * 7); // 7 days
    if (sErr) throw new Error(sErr.message);

    const { data: prof } = await supabaseAdmin
      .from("profiles").select("first_name, last_name")
      .eq("id", userId).maybeSingle();
    const senderName = [prof?.first_name, prof?.last_name].filter(Boolean).join(" ").trim() || "A Purple user";

    const { sendTransactionalEmail } = await import("./email/send");
    const result = await sendTransactionalEmail({
      templateName: "medical-report-share",
      recipientEmail: data.recipientEmail,
      idempotencyKey: `mr-${data.reportId}-${data.recipientEmail}`,
      templateData: {
        senderName,
        message: data.message ?? "",
        windowFrom: row.window_from,
        windowTo: row.window_to,
        downloadUrl: signed.signedUrl,
        isSelf: data.self,
      },
    });
    if (!result.ok) throw new Error("Email send failed");

    await supabaseAdmin.from("medical_report_shares").insert({
      report_id: data.reportId,
      user_id: userId,
      channel: data.self ? "email_self" : "email_provider",
      recipient_email: data.recipientEmail,
      message: data.message ?? null,
    });
    return { ok: true };
  });

/** Share a report into an existing care chat thread. */
export const shareMedicalReportInThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      reportId: z.string().uuid(),
      threadId: z.string().uuid(),
      message: z.string().max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("medical_reports").select("file_path, window_from, window_to")
      .eq("id", data.reportId).eq("user_id", userId).maybeSingle();
    if (!row) throw new Error("Report not found");

    const { data: part } = await supabaseAdmin
      .from("care_thread_participants").select("thread_id")
      .eq("thread_id", data.threadId).eq("user_id", userId).maybeSingle();
    if (!part) throw new Error("Not a participant in that thread");

    const { data: signed } = await supabaseAdmin.storage
      .from("medical-reports").createSignedUrl(row.file_path, 60 * 60 * 24 * 7);

    const body = [
      data.message?.trim(),
      `📄 Medical history report (${row.window_from} → ${row.window_to})`,
      signed?.signedUrl ? `Download: ${signed.signedUrl}` : null,
      "Link expires in 7 days.",
    ].filter(Boolean).join("\n\n");

    const { error } = await supabaseAdmin.from("care_messages").insert({
      thread_id: data.threadId,
      sender_id: userId,
      body,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("medical_report_shares").insert({
      report_id: data.reportId,
      user_id: userId,
      channel: "care_thread",
      thread_id: data.threadId,
      message: data.message ?? null,
    });
    return { ok: true };
  });