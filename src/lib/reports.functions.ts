import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  metrics: ExtractedMetric[];
  summary?: string | null;
  panel_keys?: string[];
  findings?: string[];
  impressions?: string[];
};

function flagFor(v: number | null | undefined, low: number | null | undefined, high: number | null | undefined): string | null {
  if (v == null) return null;
  if (low != null && v < low) return "low";
  if (high != null && v > high) return "high";
  return "normal";
}

async function extractWithAI(text: string, imageDataUrl: string | null, dictionary: Array<{ metric_key: string; display_name: string; aliases: string[]; default_unit: string | null; default_ref_low: number | null; default_ref_high: number | null; panel?: string | null }>): Promise<ExtractionResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const dictPrompt = dictionary
    .map((d) => `- ${d.metric_key} ("${d.display_name}", panel: ${d.panel ?? "other"}, aliases: ${d.aliases.join(", ") || "none"}, typical unit: ${d.default_unit ?? "?"})`)
    .join("\n");

  const systemPrompt = `You are a medical report extractor for a patient-facing health journal app.
Extract structured data from medical reports — labs (blood/urine), imaging (CT/MRI/ultrasound/X-ray), and clinical narratives.
Match each lab value to a metric_key from this canonical dictionary. For values not in the dictionary, use a normalized snake_case key and assign a panel from this list:
lipids, cardiometabolic, thyroid, liver, kidney, hematology, vitamins, hormones, inflammation, imaging, other.

CANONICAL METRICS:
${dictPrompt}

Always include:
- A 2-3 sentence plain-language "summary" written for a layperson (no diagnoses, no prescribing).
- "panel_keys": distinct list of panels present in this report.
- For imaging/narrative reports: "findings" (short bullets of objective observations) and "impressions" (short bullets of the radiologist/clinician's overall read).

Return ONLY a JSON object with this exact shape:
{
  "report_type": "blood_panel" | "lipid_panel" | "thyroid_panel" | "metabolic_panel" | "vitamin_panel" | "hormone_panel" | "imaging_ct" | "imaging_mri" | "imaging_ultrasound" | "imaging_xray" | "narrative" | "other",
  "report_date": "YYYY-MM-DD" or null,
  "summary": "Plain-language 2-3 sentence summary",
  "panel_keys": ["lipids", "liver"],
  "findings": ["..."],
  "impressions": ["..."],
  "metrics": [
    { "key": "vitamin_d", "display_name": "Vitamin D", "value": 32, "unit": "ng/mL", "reference_low": 30, "reference_high": 100, "panel": "vitamins" }
  ]
}

Do NOT include diagnoses, treatments, prescriptions, or recommendations. Only extract what is on the page.`;

  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
  if (text.trim().length > 0) {
    userContent.push({ type: "text", text: `Extract from this lab report text:\n\n${text.slice(0, 30000)}` });
  }
  if (imageDataUrl) {
    userContent.push({ type: "text", text: "Extract from this lab report image:" });
    userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
  }
  if (userContent.length === 0) {
    throw new Error("Nothing to extract");
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI extraction failed (${res.status}): ${err.slice(0, 200)}`);
  }
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as ExtractionResult;
  } catch {
    return { report_type: null, report_date: null, metrics: [] };
  }
}

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("report_documents")
      .select("id, title, report_type, report_date, file_mime, status, created_at")
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

    return { report: doc, metrics: metrics ?? [], signedUrl: signed?.signedUrl ?? null };
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
      let imageDataUrl: string | null = null;

      if (doc.file_mime.startsWith("image/")) {
        const b64 = Buffer.from(fileBuf).toString("base64");
        imageDataUrl = `data:${doc.file_mime};base64,${b64}`;
      } else if (doc.file_mime === "application/pdf") {
        // Send PDF to Gemini directly as inline data; Gemini handles PDFs.
        const b64 = Buffer.from(fileBuf).toString("base64");
        imageDataUrl = `data:application/pdf;base64,${b64}`;
      } else {
        text = new TextDecoder().decode(fileBuf);
      }

      const { data: dict } = await supabase
        .from("metric_dictionary")
        .select("metric_key, display_name, aliases, default_unit, default_ref_low, default_ref_high, panel");

      const extraction = await extractWithAI(text, imageDataUrl, dict ?? []);

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
          ocr_text: text.length > 0 ? text.slice(0, 50000) : null,
          summary: extraction.summary ?? null,
          panel_keys: Array.from(panelSet),
          findings: extraction.findings && extraction.findings.length > 0 ? extraction.findings : null,
          impressions: extraction.impressions && extraction.impressions.length > 0 ? extraction.impressions : null,
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
      await supabase
        .from("report_documents")
        .update({ status: "failed", error_message: msg })
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