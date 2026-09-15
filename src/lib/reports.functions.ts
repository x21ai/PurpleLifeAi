import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAIForUser, tryParseJson } from "./ai-provider.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { guessReportCategory } from "./report-categories";
import { getDataBackend } from "@/lib/cloudflare/data-backend";
import { d1All } from "@/lib/cloudflare/d1/client";

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

function flagFor(
  v: number | null | undefined,
  low: number | null | undefined,
  high: number | null | undefined,
): string | null {
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
    z
      .object({
        reportId: z.string().uuid(),
        decision: z.enum(["approve", "reject"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.decision === "reject") {
      // Keep the row as a tombstone so future re-uploads of the same content
      // are recognised and blocked. Remove metrics + file to free space.
      const { data: doc } = await supabase
        .from("report_documents")
        .select("file_path")
        .eq("id", data.reportId)
        .maybeSingle();
      await supabase.from("report_metrics").delete().eq("report_id", data.reportId);
      if (doc?.file_path) {
        await supabase.storage.from("reports").remove([doc.file_path]);
      }
      const { error } = await supabase
        .from("report_documents")
        .update({
          user_decision: "rejected",
          status: "rejected",
          error_message: "You rejected this report, its readings are excluded from trends.",
        })
        .eq("id", data.reportId);
      if (error) throw new Error(error.message);
      return { ok: true, deleted: true };
    }
    // Approve path: also remember the (patient_name, dob) printed on the doc
    // so future uploads with the same identity skip the banner.
    const { data: doc } = await supabase
      .from("report_documents")
      .select("user_id, patient_name, patient_dob")
      .eq("id", data.reportId)
      .maybeSingle();
    const { error } = await supabase
      .from("report_documents")
      .update({ identity_status: "manual_approved", user_decision: "kept" })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    let aliasRemembered = false;
    if (doc?.patient_name) {
      const nameNormalized = doc.patient_name.toLowerCase().replace(/\s+/g, " ").trim();
      if (nameNormalized.length > 0) {
        let q = supabase
          .from("report_identity_aliases")
          .select("id")
          .eq("user_id", doc.user_id)
          .eq("name_normalized", nameNormalized)
          .limit(1);
        q = doc.patient_dob ? q.eq("dob", doc.patient_dob) : q.is("dob", null);
        const { data: existingRows } = await q;
        if (!existingRows || existingRows.length === 0) {
          const { error: aliasErr } = await supabase.from("report_identity_aliases").insert({
            user_id: doc.user_id,
            name_normalized: nameNormalized,
            dob: doc.patient_dob ?? null,
            source: "approval",
          });
          if (!aliasErr) aliasRemembered = true;
        } else {
          aliasRemembered = true;
        }
      }
    }
    return { ok: true, deleted: false, aliasRemembered };
  });

async function extractWithAI(
  supabase: SupabaseClient,
  userId: string,
  text: string,
  media: { base64: string; mime: string } | null,
  dictionary: Array<{
    metric_key: string;
    display_name: string;
    aliases: string[];
    default_unit: string | null;
    default_ref_low: number | null;
    default_ref_high: number | null;
    panel?: string | null;
  }>,
): Promise<ExtractionResult> {
  const dictPrompt = dictionary
    .map(
      (d) =>
        `- ${d.metric_key} ("${d.display_name}", panel: ${d.panel ?? "other"}, aliases: ${d.aliases.join(", ") || "none"}, typical unit: ${d.default_unit ?? "?"})`,
    )
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

  const prompt =
    text.trim().length > 0
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

async function metricCountsByReportId(
  supabase: SupabaseClient,
  userId: string,
  reportIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (reportIds.length === 0) return counts;

  // D1/SQLite caps bind variables (~100). Avoid giant IN lists; one grouped query per user.
  if (getDataBackend(process.env) === "cloudflare") {
    const rows = await d1All<{ report_id: string; cnt: number }>(
      `SELECT report_id, COUNT(*) AS cnt FROM report_metrics WHERE user_id = ? GROUP BY report_id`,
      userId,
    );
    for (const row of rows) counts[row.report_id] = Number(row.cnt);
    return counts;
  }

  const { data: rows, error } = await supabase
    .from("report_metrics")
    .select("report_id")
    .in("report_id", reportIds);
  if (error) throw new Error(error.message);
  for (const m of rows ?? []) {
    counts[m.report_id] = (counts[m.report_id] ?? 0) + 1;
  }
  return counts;
}

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("report_documents")
      .select(
        "id, title, report_type, report_category, report_date, file_mime, status, created_at, summary, panel_keys, error_message, identity_status, patient_name, patient_dob, duplicate_of",
      )
      .order("report_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    const reports = data ?? [];
    const counts = await metricCountsByReportId(
      supabase,
      userId,
      reports.map((r) => r.id),
    );
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
      .select(
        "id, value, value_text, unit, reference_low, reference_high, flag, measured_at, report:report_documents(id, title, report_date)",
      )
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
      // Download the file directly via the storage API (avoids signed-URL
      // outbound fetch which can fail in the Worker dev runtime).
      const { data: blob, error: dlErr } = await supabase.storage
        .from("reports")
        .download(doc.file_path);
      if (dlErr || !blob) throw new Error(`File download failed: ${dlErr?.message ?? "no data"}`);
      const fileBuf = await blob.arrayBuffer();

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
        .select(
          "metric_key, display_name, aliases, default_unit, default_ref_low, default_ref_high, panel",
        );

      const extraction = await extractWithAI(supabase, doc.user_id, text, media, dict ?? []);

      // Clear existing extracted metrics for this report (idempotent re-process)
      await supabase.from("report_metrics").delete().eq("report_id", doc.id);

      const measuredAt = extraction.report_date
        ? new Date(extraction.report_date + "T12:00:00Z").toISOString()
        : new Date().toISOString();

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
            source_text: m.display_name ?? known?.display_name ?? m.key,
            value: m.value ?? null,
            value_text: m.value_text ?? null,
            unit: m.unit ?? known?.default_unit ?? null,
            reference_low: low,
            reference_high: high,
            flag: flagFor(m.value ?? null, low, high),
            measured_at: measuredAt,
          };
        });

      // Content hash: normalised metric pairs + report_date. Identifies re-uploads of the
      // same data even when the file path or filename differs.
      const hashBasis = [
        extraction.report_date ?? "",
        ...rows.map((r) => `${r.metric_key}=${r.value ?? r.value_text ?? ""}`).sort(),
      ].join("|");
      const contentHash = createHash("sha256").update(hashBasis).digest("hex");

      // Look for a prior decision on the same content for this user.
      const { data: priorDecided } = await supabase
        .from("report_documents")
        .select("id, user_decision, created_at")
        .eq("user_id", doc.user_id)
        .eq("content_hash", contentHash)
        .neq("id", doc.id)
        .not("user_decision", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);
      const prior = priorDecided?.[0] ?? null;

      if (prior?.user_decision === "rejected") {
        // Don't insert metrics. Mark this report as rejected to keep the decision sticky.
        const { data: signedFile } = await supabase
          .from("report_documents")
          .select("file_path")
          .eq("id", doc.id)
          .maybeSingle();
        if (signedFile?.file_path) {
          await supabase.storage.from("reports").remove([signedFile.file_path]);
        }
        await supabase
          .from("report_documents")
          .update({
            status: "rejected",
            user_decision: "rejected",
            content_hash: contentHash,
            error_message:
              "You previously rejected a report with these same readings, it was not added again.",
          })
          .eq("id", doc.id);
        return { ok: true, metricCount: 0, blocked: "previously_rejected" };
      }

      if (rows.length > 0) {
        await supabase.from("report_metrics").insert(rows);
      }
      await supabase
        .from("report_documents")
        .update({ content_hash: contentHash })
        .eq("id", doc.id);

      // If a previously kept duplicate exists, auto-link without prompting.
      let autoDuplicateOf: string | null = null;
      if (prior?.user_decision === "kept") {
        autoDuplicateOf = prior.id as string;
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
          report_category: guessReportCategory({
            title: extraction.title ?? doc.title,
            filename: doc.file_path,
            reportType: extraction.report_type ?? null,
          }),
          report_date: extraction.report_date ?? null,
          // Overwrite title with the AI-detected one when the current title is the
          // placeholder filename (no spaces, looks like a filename slug, or the
          // default "Untitled report"). This is a heuristic, keep user-edited
          // titles intact.
          ...(extraction.title && extraction.title.trim().length > 0
            ? { title: extraction.title.trim().slice(0, 200) }
            : {}),
          ocr_text: text.length > 0 ? text.slice(0, 50000) : null,
          summary: extraction.summary ?? null,
          panel_keys: Array.from(panelSet),
          findings:
            extraction.findings && extraction.findings.length > 0 ? extraction.findings : null,
          impressions:
            extraction.impressions && extraction.impressions.length > 0
              ? extraction.impressions
              : null,
          patient_name: extraction.patient_name ?? null,
          patient_dob: extraction.patient_dob ?? null,
        })
        .eq("id", doc.id);

      // 1) Identity verification: compare extracted patient_name / patient_dob with profile.
      // 2) Duplicate detection: same user + dob + report_date with overlapping metrics.
      const ruleEnabled = await isPlatformRuleEnabled(
        supabase,
        "require_identity_match_for_metrics",
      );
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, date_of_birth")
        .eq("id", doc.user_id)
        .maybeSingle();
      const profName = [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase();
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
        // If profile didn't match, check the user's remembered aliases.
        // An approved alias for the same (normalized name, dob) auto-verifies.
        if (identity !== "verified" && extName) {
          const aliasName = extName.replace(/\s+/g, " ").trim();
          let aq = supabase
            .from("report_identity_aliases")
            .select("id")
            .eq("user_id", doc.user_id)
            .eq("name_normalized", aliasName)
            .limit(1);
          aq = extDob ? aq.eq("dob", extDob) : aq.is("dob", null);
          const { data: aliasRows } = await aq;
          if (aliasRows && aliasRows.length > 0) {
            identity = "verified";
          }
        }
      } else {
        identity = "verified";
      }

      // Duplicate: same user + same patient_dob (when known) + same report_date (when known)
      let duplicateOf: string | null = null;
      if (autoDuplicateOf) duplicateOf = autoDuplicateOf;
      if (!duplicateOf && extraction.report_date) {
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
          const otherKeys = new Set(
            (otherRows ?? []).map((r) => `${r.metric_key}=${r.value ?? ""}`),
          );
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

/** 7-day signed URL for sharing a report file. */
export const getReportShareUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        expiresInDays: z.number().int().min(1).max(30).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("report_documents")
      .select("file_path, title")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !doc) throw new Error("Report not found");
    const days = data.expiresInDays ?? 7;
    const ttl = 60 * 60 * 24 * days;
    const { data: signed, error: sErr } = await supabase.storage
      .from("reports")
      .createSignedUrl(doc.file_path, ttl);
    if (sErr || !signed?.signedUrl) throw new Error("Could not sign URL");
    await supabase.from("phi_access_log").insert({
      user_id: userId,
      actor_id: userId,
      action: "share",
      resource_type: "report_document",
      resource_id: data.id,
      metadata: { ttl_seconds: ttl },
    });
    return { url: signed.signedUrl, title: doc.title, expiresInDays: days };
  });

/**
 * Bulk: return short-lived signed download URLs for a set of the user's
 * reports so the client can zip them locally. Caps at 200 to keep this
 * responsive , beyond that the user should narrow filters.
 */
export const bulkDownloadReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reportIds: z.array(z.string().uuid()).min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: docs, error } = await supabase
      .from("report_documents")
      .select("id, title, file_path, file_mime, report_date, created_at")
      .in("id", data.reportIds);
    if (error) throw new Error(error.message);
    const items: Array<{
      id: string;
      title: string;
      mime: string;
      url: string;
      suggestedName: string;
    }> = [];
    for (const d of docs ?? []) {
      const { data: signed } = await supabase.storage
        .from("reports")
        .createSignedUrl(d.file_path, 300);
      if (!signed?.signedUrl) continue;
      const ext = (() => {
        if (d.file_mime === "application/pdf") return "pdf";
        if (d.file_mime?.startsWith("image/")) return d.file_mime.split("/")[1] ?? "img";
        const m = d.file_path.match(/\.([a-z0-9]+)$/i);
        return m?.[1] ?? "bin";
      })();
      const safe = (d.title ?? "report").replace(/[^\w\-. ]+/g, "_").slice(0, 60);
      const date = (d.report_date ?? d.created_at ?? "").slice(0, 10);
      items.push({
        id: d.id,
        title: d.title ?? "Untitled",
        mime: d.file_mime,
        url: signed.signedUrl,
        suggestedName: `${date ? date + "_" : ""}${safe}.${ext}`,
      });
    }
    await supabase.from("phi_access_log").insert({
      user_id: userId,
      actor_id: userId,
      action: "bulk_download",
      resource_type: "report_document",
      resource_id: null,
      metadata: { count: items.length },
    });
    return { items };
  });

export type AiReportSummary = {
  headline: string;
  explanation: string;
  flagged: Array<{
    metric: string;
    value: string;
    concern: string;
    severity: "info" | "watch" | "attention";
  }>;
  questions: string[];
};

/**
 * Shared implementation behind the `summarizeReport` server fn and the
 * `/api/ai/summarize-report` Worker route (for Flutter and other
 * non-TanStack clients). Both pass an already auth-scoped `supabase` client
 * (RLS applies) plus the caller's `userId`; keep this the single source of
 * truth for the AI report-explanation logic.
 */
export async function summarizeReportForUser(
  supabase: SupabaseClient,
  userId: string,
  input: { id: string; force?: boolean },
): Promise<{ ok: true; cached: boolean; summary: AiReportSummary }> {
  const { data: doc, error } = await supabase
    .from("report_documents")
    .select(
      "id, user_id, title, report_type, report_date, report_category, summary, findings, impressions, ai_summary, ai_summary_at",
    )
    .eq("id", input.id)
    .maybeSingle();
  if (error || !doc) throw new Error("Report not found");

  if (!input.force && doc.ai_summary) {
    return { ok: true, cached: true, summary: doc.ai_summary as AiReportSummary };
  }

  const { data: metrics } = await supabase
    .from("report_metrics")
    .select(
      "metric_key, display_name, value, value_text, unit, reference_low, reference_high, flag",
    )
    .eq("report_id", doc.id);

  const metricLines = (metrics ?? [])
    .map((m) => {
      const v = m.value != null ? `${m.value}${m.unit ? ` ${m.unit}` : ""}` : (m.value_text ?? ",");
      const range =
        m.reference_low != null && m.reference_high != null
          ? ` (ref ${m.reference_low}–${m.reference_high}${m.unit ? ` ${m.unit}` : ""})`
          : "";
      const flag = m.flag && m.flag !== "normal" ? ` [${m.flag.toUpperCase()}]` : "";
      return `- ${m.display_name ?? m.metric_key}: ${v}${range}${flag}`;
    })
    .join("\n");

  const system = `You are explaining a medical report to a patient in calm, plain English.
You are NOT a doctor. Never diagnose, prescribe, or recommend treatments. Stay factual.
Tone: gentle, respectful of the reader's energy. No alarmism.

Return ONLY a JSON object with this shape:
{
  "headline": "One short sentence summarising the report in plain English (max 140 chars).",
  "explanation": "2-4 sentences explaining what this report measures and what the results suggest in context. Plain English, no jargon unless defined inline.",
  "flagged": [
    { "metric": "LDL Cholesterol", "value": "164 mg/dL", "concern": "Above the typical reference range.", "severity": "watch" }
  ],
  "questions": ["Up to 3 short questions the reader could bring up with their clinician."]
}

severity must be one of: "info" | "watch" | "attention".
Only include items in "flagged" that are actually out of range or otherwise notable.
If there are no notable values, return flagged: [].`;

  const prompt = `Report title: ${doc.title ?? "Untitled"}
Report type: ${doc.report_type ?? "unknown"}
Report date: ${doc.report_date ?? "unknown"}
Category: ${doc.report_category ?? "other"}

Extracted values:
${metricLines || "(none)"}

Existing short summary (from extraction): ${doc.summary ?? "(none)"}
Findings: ${Array.isArray(doc.findings) ? (doc.findings as string[]).join("; ") : "(none)"}
Impressions: ${Array.isArray(doc.impressions) ? (doc.impressions as string[]).join("; ") : "(none)"}`;

  const responseText = await callAIForUser(supabase, userId, {
    system,
    prompt,
    jsonMode: true,
    maxTokens: 2048,
  });
  const parsed = tryParseJson<{
    headline?: string;
    explanation?: string;
    flagged?: Array<{ metric?: string; value?: string; concern?: string; severity?: string }>;
    questions?: string[];
  }>(responseText);
  if (!parsed) throw new Error("Couldn't parse AI response");

  const cleaned: AiReportSummary = {
    headline: String(parsed.headline ?? "").slice(0, 200),
    explanation: String(parsed.explanation ?? "").slice(0, 2000),
    flagged: Array.isArray(parsed.flagged)
      ? parsed.flagged.slice(0, 10).map((f) => ({
          metric: String(f.metric ?? "").slice(0, 120),
          value: String(f.value ?? "").slice(0, 80),
          concern: String(f.concern ?? "").slice(0, 400),
          severity: (["info", "watch", "attention"].includes(String(f.severity))
            ? f.severity
            : "info") as "info" | "watch" | "attention",
        }))
      : [],
    questions: Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 3).map((q) => String(q).slice(0, 200))
      : [],
  };

  await supabase
    .from("report_documents")
    .update({ ai_summary: cleaned, ai_summary_at: new Date().toISOString() })
    .eq("id", doc.id);

  return { ok: true, cached: false, summary: cleaned };
}

/**
 * Phase 4: Run an on-demand AI explanation of a report (plain-English summary
 * plus flagged values). Cached on the report row; pass `force=true` to re-run.
 */
export const summarizeReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        force: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) =>
    summarizeReportForUser(context.supabase, context.userId, data),
  );
