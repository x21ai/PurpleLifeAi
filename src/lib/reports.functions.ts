import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIForUser, tryParseJson } from "./ai-provider.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const ProcessInput = z.object({
  reportId: z.string().uuid(),
});

const UpsertMetricInput = z.object({
  reportId: z.string().uuid(),
  metricKey: z.string().min(1).max(80),
  value: z.number().nullable().optional(),
  valueText: z.string().max(120).nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  referenceLow: z.number().nullable().optional(),
  referenceHigh: z.number().nullable().optional(),
});

type ExtractedMetric = {
  key: string;
  display_name?: string;
  value?: number | null;
  value_text?: string | null;
  unit?: string | null;
  reference_low?: number | null;
  reference_high?: number | null;
  panel?: string | null;
};

type ExtractionResult = {
  report_type: string | null;
  report_date: string | null;
  title?: string | null;
  metrics: ExtractedMetric[];
  summary?: string | null;
  panel_keys?: string[];
  findings?: string[];
  impressions?: string[];
  patient_name?: string | null;
  patient_dob?: string | null;
};

function flagFor(v: number | null | undefined, low: number | null | undefined, high: number | null | undefined): string | null {
  if (v == null) return null;
  if (low != null && v < low) return "low";
  if (high != null && v > high) return "high";
  return "normal";
}

async function isPlatformRuleEnabled(supabase: SupabaseClient, key: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("platform_rules")
      .select("value, enabled, scope")
      .eq("key", key)
      .eq("scope", "platform")
      .eq("enabled", true)
      .maybeSingle();
    if (!data) return false;
    return data.value === true || data.value === "true";
  } catch {
    return false;
  }
}

export const setReportIdentityDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      reportId: z.string().uuid(),
      decision: z.enum(["approve", "reject"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.decision === "reject") {
      // Remember the rejection so future re-uploads of the same content are blocked.
      await supabase
        .from("report_documents")
        .update({ user_decision: "rejected" })
        .eq("id", data.reportId);
      const { error } = await supabase.from("report_documents").delete().eq("id", data.reportId);
      if (error) throw new Error(error.message);
      return { ok: true, deleted: true };
    }
    const { error } = await supabase
      .from("report_documents")
      .update({ identity_status: "manual_approved", user_decision: "kept" })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: false };
  });

async function extractWithAI(
  supabase: SupabaseClient,
  userId: string,
  text: string,
  media: { base64: string; mime: string } | null,
  dictionary: Array<{ metric_key: string; display_name: string; aliases: string[]; default_unit: string | null; default_ref_low: number | null; default_ref_high: number | null; panel?: string | null }>,
): Promise<ExtractionResult> {
  const dictPrompt = dictionary
    .map((d) => `- ${d.metric_key} ("${d.display_name}", panel: ${d.panel ?? "other"}, aliases: ${d.aliases.join(", ") || "none"}, typical unit: ${d.default_unit ?? "?"})`)
    .join("\n");

  const systemPrompt = `You are a medical report extractor for a patient-facing health journal app.
Extract structured data from medical reports, labs (blood/urine), imaging (CT/MRI/ultrasound/X-ray), and clinical narratives.
Match each lab value to a metric_key from this canonical dictionary. For values not in the dictionary, use a normalized snake_case key and assign a panel from this list:
lipids, cardiometabolic, thyroid, liver, kidney, hematology, vitamins, hormones, inflammation, imaging, other.

CANONICAL METRICS:
${dictPrompt}

Always include:
- A 2-3 sentence plain-language "summary" written for a layperson (no diagnoses, no prescribing).
- A short "title" (max 80 chars) summarizing what the report is (e.g. "Quest CBC + lipids", "Brain MRI", "TSH panel").
- "panel_keys": distinct list of panels present in this report.
- For imaging/narrative reports: "findings" (short bullets of objective observations) and "impressions" (short bullets of the radiologist/clinician's overall read).
- "patient_name" (full name on the report, as printed) and "patient_dob" (ISO YYYY-MM-DD) when visible on the document, or null.

Return ONLY a JSON object with this exact shape:
{
  "report_type": "blood_panel" | "lipid_panel" | "thyroid_panel" | "metabolic_panel" | "vitamin_panel" | "hormone_panel" | "imaging_ct" | "imaging_mri" | "imaging_ultrasound" | "imaging_xray" | "narrative" | "other",
  "report_date": "YYYY-MM-DD" or null,
  "title": "Short report title",
  "summary": "Plain-language 2-3 sentence summary",
  "panel_keys": ["lipids", "liver"],
  "findings": ["..."],
  "impressions": ["..."],
  "patient_name": "Jane Q. Doe" or null,
  "patient_dob": "1985-04-12" or null,
  "metrics": [
    { "key": "vitamin_d", "display_name": "Vitamin D", "value": 32, "unit": "ng/mL", "reference_low": 30, "reference_high": 100, "panel": "vitamins" }
  ]
}

Do NOT include diagnoses, treatments, prescriptions, or recommendations. Only extract what is on the page.`;

  const prompt = text.trim().length > 0
    ? `Extract from this lab report text:\n\n${text.slice(0, 30000)}`
    : "Extract from this lab report file.";

  const responseText = await callAIForUser(supabase, userId, {
    system: systemPrompt,
    prompt,
    media,
    jsonMode: true,
    maxTokens: 8192,
  });
  const parsed = tryParseJson<ExtractionResult>(responseText);
  return parsed ?? { report_type: null, report_date: null, metrics: [] };
}

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("report_documents")
      .select("id, title, report_type, report_date, file_mime, status, created_at, summary, panel_keys, error_message, identity_status, patient_name, patient_dob, duplicate_of")
      .order("report_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    const reports = data ?? [];
    // Cheap metric counts in one round-trip.
    const ids = reports.map((r) => r.id);
    let counts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: rows } = await supabase
        .from("report_metrics")
        .select("report_id")
        .in("report_id", ids);
      for (const m of rows ?? []) {
        counts[m.report_id] = (counts[m.report_id] ?? 0) + 1;
      }
    }
    return {
      reports: reports.map((r) => ({ ...r, metric_count: counts[r.id] ?? 0 })),
    };
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("report_documents")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Report not found");

    const { data: metrics } = await supabase
      .from("report_metrics")
      .select("*")
      .eq("report_id", data.id)
      .order("metric_key");

    // Attach panel from dictionary so the UI can group tiles.
    const keys = Array.from(new Set((metrics ?? []).map((m) => m.metric_key)));
    let panelByKey = new Map<string, string | null>();
    if (keys.length > 0) {
      const { data: dictRows } = await supabase
        .from("metric_dictionary")
        .select("metric_key, panel")
        .in("metric_key", keys);
      panelByKey = new Map((dictRows ?? []).map((r) => [r.metric_key, r.panel ?? null]));
    }
    const metricsWithPanel = (metrics ?? []).map((m) => ({
      ...m,
      panel: panelByKey.get(m.metric_key) ?? "other",
    }));

    // Audit log
    await supabase.from("phi_access_log").insert({
      user_id: userId,
      actor_id: userId,
      action: "read",
      resource_type: "report_document",
      resource_id: data.id,
    });

    const { data: signed } = await supabase.storage
      .from("reports")
      .createSignedUrl(doc.file_path, 60);

    return { report: doc, metrics: metricsWithPanel, signedUrl: signed?.signedUrl ?? null };
  });

export const getMetricTrend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ metricKey: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("report_metrics")
      .select("id, value, value_text, unit, reference_low, reference_high, flag, measured_at, report:report_documents(id, title, report_date)")
      .eq("metric_key", data.metricKey)
      .order("measured_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: dict } = await supabase
      .from("metric_dictionary")
      .select("display_name, default_unit, default_ref_low, default_ref_high, hints, category")
      .eq("metric_key", data.metricKey)
      .maybeSingle();

    return { points: rows ?? [], dictionary: dict ?? null };
  });

export const processReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProcessInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("report_documents")
      .select("id, user_id, file_path, file_mime, title")
      .eq("id", data.reportId)
      .maybeSingle();
    if (error || !doc) throw new Error("Report not found");

    // Mark processing
    await supabase
      .from("report_documents")
      .update({ status: "processing", error_message: null })
      .eq("id", doc.id);

    try {
      // Download file via signed URL
      const { data: signed } = await supabase.storage
        .from("reports")
        .createSignedUrl(doc.file_path, 300);
      if (!signed?.signedUrl) throw new Error("Could not access file");

      const fileRes = await fetch(signed.signedUrl);
      if (!fileRes.ok) throw new Error("File download failed");
      const fileBuf = await fileRes.arrayBuffer();

      let text = "";
      let media: { base64: string; mime: string } | null = null;

      if (doc.file_mime.startsWith("image/")) {
        media = { base64: Buffer.from(fileBuf).toString("base64"), mime: doc.file_mime };
      } else if (doc.file_mime === "application/pdf") {
        media = { base64: Buffer.from(fileBuf).toString("base64"), mime: "application/pdf" };
      } else {
        text = new TextDecoder().decode(fileBuf);
      }

      const { data: dict } = await supabase
        .from("metric_dictionary")
        .select("metric_key, display_name, aliases, default_unit, default_ref_low, default_ref_high, panel");

      const extraction = await extractWithAI(supabase, doc.user_id, text, media, dict ?? []);

      // Clear existing extracted metrics for this report (idempotent re-process)
      await supabase.from("report_metrics").delete().eq("report_id", doc.id);

      const measuredAt = extraction.report_date ? new Date(extraction.report_date + "T12:00:00Z").toISOString() : new Date().toISOString();

      const dictByKey = new Map((dict ?? []).map((d) => [d.metric_key, d]));
      const rows = extraction.metrics
        .filter((m) => m.key && m.key.length <= 80)
        .map((m) => {
          const known = dictByKey.get(m.key);
          const low = m.reference_low ?? known?.default_ref_low ?? null;
          const high = m.reference_high ?? known?.default_ref_high ?? null;
          return {
            report_id: doc.id,
            user_id: doc.user_id,
            metric_key: m.key,
            display_name: m.display_name ?? known?.display_name ?? m.key,
            value: m.value ?? null,
            value_text: m.value_text ?? null,
            unit: m.unit ?? known?.default_unit ?? null,
            reference_low: low,
            reference_high: high,
            flag: flagFor(m.value ?? null, low, high),
            measured_at: measuredAt,
          };
        });

      if (rows.length > 0) {
        await supabase.from("report_metrics").insert(rows);
      }

      // Derive panel_keys from extraction or from dictionary lookup
      const panelSet = new Set<string>();
      for (const p of extraction.panel_keys ?? []) {
        if (typeof p === "string" && p.length <= 40) panelSet.add(p);
      }
      for (const m of extraction.metrics) {
        const panel = m.panel ?? dictByKey.get(m.key)?.panel;
        if (panel) panelSet.add(panel);
      }

      await supabase
        .from("report_documents")
        .update({
          status: "ready",
          report_type: extraction.report_type ?? null,
          report_date: extraction.report_date ?? null,
          // Overwrite title with the AI-detected one when the current title is the
          // placeholder filename (no spaces, looks like a filename slug, or the
          // default "Untitled report"). This is a heuristic — keep user-edited
          // titles intact.
          ...(extraction.title && extraction.title.trim().length > 0
            ? { title: extraction.title.trim().slice(0, 200) }
            : {}),
          ocr_text: text.length > 0 ? text.slice(0, 50000) : null,
          summary: extraction.summary ?? null,
          panel_keys: Array.from(panelSet),
          findings: extraction.findings && extraction.findings.length > 0 ? extraction.findings : null,
          impressions: extraction.impressions && extraction.impressions.length > 0 ? extraction.impressions : null,
          patient_name: extraction.patient_name ?? null,
          patient_dob: extraction.patient_dob ?? null,
        })
        .eq("id", doc.id);

      // 1) Identity verification: compare extracted patient_name / patient_dob with profile.
      // 2) Duplicate detection: same user + dob + report_date with overlapping metrics.
      const ruleEnabled = await isPlatformRuleEnabled(supabase, "require_identity_match_for_metrics");
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, date_of_birth")
        .eq("id", doc.user_id)
        .maybeSingle();
      const profName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim().toLowerCase();
      const extName = (extraction.patient_name ?? "").trim().toLowerCase();
      const extDob = extraction.patient_dob ?? null;
      const profDob = (profile?.date_of_birth as string | null) ?? null;
      let identity: "verified" | "mismatch" | "unverified" = "unverified";
      if (ruleEnabled) {
        if (profName && extName && profDob && extDob) {
          const nameOk =
            extName === profName ||
            (profName.length >= 4 && extName.includes(profName)) ||
            (extName.length >= 4 && profName.includes(extName));
          const dobOk = extDob === profDob;
          identity = nameOk && dobOk ? "verified" : "mismatch";
        } else if (!extName && !extDob) {
          identity = "unverified";
        } else {
          identity = "mismatch";
        }
      } else {
        identity = "verified";
      }

      // Duplicate: same user + same patient_dob (when known) + same report_date (when known)
      let duplicateOf: string | null = null;
      if (extraction.report_date) {
        const { data: candidates } = await supabase
          .from("report_documents")
          .select("id")
          .eq("user_id", doc.user_id)
          .eq("report_date", extraction.report_date)
          .neq("id", doc.id)
          .is("duplicate_of", null);
        for (const c of candidates ?? []) {
          const { data: otherRows } = await supabase
            .from("report_metrics")
            .select("metric_key, value")
            .eq("report_id", c.id);
          const otherKeys = new Set((otherRows ?? []).map((r) => `${r.metric_key}=${r.value ?? ""}`));
          if (otherKeys.size === 0) continue;
          const mine = new Set(rows.map((r) => `${r.metric_key}=${r.value ?? ""}`));
          let overlap = 0;
          for (const k of mine) if (otherKeys.has(k)) overlap += 1;
          const ratio = overlap / Math.max(mine.size, otherKeys.size);
          if (ratio >= 0.6) {
            duplicateOf = c.id as string;
            break;
          }
        }
      }

      await supabase
        .from("report_documents")
        .update({
          identity_status: identity,
          ...(duplicateOf ? { duplicate_of: duplicateOf } : {}),
        })
        .eq("id", doc.id);

      await supabase.from("phi_access_log").insert({
        user_id: doc.user_id,
        actor_id: userId,
        action: "extract",
        resource_type: "report_document",
        resource_id: doc.id,
        metadata: { metric_count: rows.length },
      });

      return { ok: true, metricCount: rows.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const code = (err as { code?: string } | null)?.code;
      const status =
        code === "ai_credits_exhausted"
          ? "needs_credits"
          : code === "ai_rate_limited"
            ? "rate_limited"
            : "failed";
      await supabase
        .from("report_documents")
        .update({ status, error_message: msg })
        .eq("id", doc.id);
      throw new Error(msg);
    }
  });

export const updateMetric = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertMetricInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const flag = flagFor(data.value ?? null, data.referenceLow ?? null, data.referenceHigh ?? null);
    const { error } = await supabase
      .from("report_metrics")
      .update({
        value: data.value ?? null,
        value_text: data.valueText ?? null,
        unit: data.unit ?? null,
        reference_low: data.referenceLow ?? null,
        reference_high: data.referenceHigh ?? null,
        flag,
        user_corrected: true,
      })
      .eq("report_id", data.reportId)
      .eq("metric_key", data.metricKey);
    if (error) throw new Error(error.message);
    await supabase.from("phi_access_log").insert({
      user_id: userId,
      actor_id: userId,
      action: "update",
      resource_type: "report_metric",
      resource_id: data.reportId,
      metadata: { metric_key: data.metricKey },
    });
    return { ok: true };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase
      .from("report_documents")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (doc?.file_path) {
      await supabase.storage.from("reports").remove([doc.file_path]);
    }
    const { error } = await supabase.from("report_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("phi_access_log").insert({
      user_id: userId,
      actor_id: userId,
      action: "delete",
      resource_type: "report_document",
      resource_id: data.id,
    });
    return { ok: true };
  });

/** Short-lived signed URL for the uploaded report file (PDF/image/text). */
export const getReportFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc, error } = await supabase
      .from("report_documents")
      .select("file_path, file_mime, title")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !doc) throw new Error("Report not found");
    const { data: signed, error: sErr } = await supabase.storage
      .from("reports")
      .createSignedUrl(doc.file_path, 300);
    if (sErr || !signed?.signedUrl) throw new Error("Could not sign URL");
    return { url: signed.signedUrl, mime: doc.file_mime, title: doc.title };
  });