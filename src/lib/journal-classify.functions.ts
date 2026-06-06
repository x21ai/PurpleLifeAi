import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Phase-3 auto-routing: when a journal entry has an attached medical document
 * (PDF or photo of a lab/imaging report), classify it with Gemini and, if it
 * looks clinical, copy it into the `reports` bucket, create a report_documents
 * row, kick off the same extraction pipeline as a manual upload, and tag the
 * journal entry.
 *
 * Idempotent: skips entries already tagged `auto-routed-to-reports`.
 */

const Input = z.object({ journalEntryId: z.string().uuid() });

type Classification = {
  is_clinical: boolean;
  title: string | null;
  report_type: string | null;
  confidence: number | null;
};

async function classifyAttachment(
  mime: string,
  bytes: ArrayBuffer,
): Promise<Classification> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const b64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${mime};base64,${b64}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You decide whether an uploaded file is a clinical document (lab report, blood/urine panel, imaging report, discharge summary, prescription, doctor's note). Reply strictly with JSON: {\"is_clinical\": boolean, \"title\": string|null, \"report_type\": \"blood_panel\"|\"lipid_panel\"|\"imaging_ct\"|\"imaging_mri\"|\"imaging_ultrasound\"|\"imaging_xray\"|\"narrative\"|\"prescription\"|\"other\"|null, \"confidence\": 0-1}. A casual food/selfie/screenshot is NOT clinical. A printout, scan, or photo of a lab/imaging/clinical document IS clinical.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify this attachment." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    return { is_clinical: false, title: null, report_type: null, confidence: 0 };
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  try {
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    return {
      is_clinical: !!parsed.is_clinical,
      title: typeof parsed.title === "string" ? parsed.title.slice(0, 180) : null,
      report_type: typeof parsed.report_type === "string" ? parsed.report_type : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
    };
  } catch {
    return { is_clinical: false, title: null, report_type: null, confidence: 0 };
  }
}

export const autoRouteJournalToReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: entry, error } = await supabase
      .from("journal_entries")
      .select("id, user_id, ai_tags, ai_extracted, captured_at, text")
      .eq("id", data.journalEntryId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!entry || entry.user_id !== userId) {
      return { ok: false, reason: "not_found" as const };
    }
    const tags = entry.ai_tags ?? [];
    if (tags.includes("auto-routed-to-reports") || tags.includes("not-medical")) {
      return { ok: true, skipped: true as const };
    }

    // List storage objects under journal-media/<userId>/<entryId>/
    const folder = `${userId}/${entry.id}`;
    const { data: files } = await supabase.storage
      .from("journal-media")
      .list(folder, { limit: 20 });
    if (!files || files.length === 0) {
      return { ok: true, skipped: true as const };
    }

    const created: string[] = [];
    for (const f of files) {
      const name = f.name.toLowerCase();
      const isPdf = name.endsWith(".pdf");
      const isImage =
        name.endsWith(".jpg") || name.endsWith(".jpeg") ||
        name.endsWith(".png") || name.endsWith(".heic") ||
        name.endsWith(".webp");
      if (!isPdf && !isImage) continue;

      const path = `${folder}/${f.name}`;
      const dl = await supabase.storage.from("journal-media").download(path);
      if (dl.error || !dl.data) continue;
      const bytes = await dl.data.arrayBuffer();
      const mime = isPdf ? "application/pdf" : `image/${name.split(".").pop()}`;

      // Cap classifier inputs at ~8MB so we don't spend on huge videos
      if (bytes.byteLength > 8 * 1024 * 1024) continue;

      let cls: Classification;
      try {
        cls = await classifyAttachment(mime, bytes);
      } catch {
        continue;
      }
      if (!cls.is_clinical || (cls.confidence ?? 0) < 0.55) continue;

      // Copy into reports bucket
      const ext = isPdf ? "pdf" : (name.split(".").pop() || "bin");
      const newPath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("reports")
        .upload(newPath, bytes, { contentType: mime, upsert: false });
      if (up.error) continue;

      const title =
        cls.title?.trim() ||
        (entry.text ? entry.text.slice(0, 80) : "Journal attachment");
      const reportDate = (entry.captured_at ?? "").slice(0, 10) || null;

      const { data: doc, error: insErr } = await supabase
        .from("report_documents")
        .insert({
          user_id: userId,
          title,
          file_path: newPath,
          file_mime: mime,
          report_date: reportDate,
          status: "processing",
        })
        .select("id")
        .single();
      if (insErr || !doc) continue;

      // Fire the extraction pipeline (don't block on its completion)
      try {
        const { processReport } = await import("./reports.functions");
        void processReport({ data: { reportId: doc.id } }).catch(() => {});
      } catch {
        // ignore, report row is still created
      }
      created.push(doc.id);
    }

    if (created.length === 0) {
      return { ok: true, created: 0 };
    }

    const newTags = Array.from(new Set([...tags, "auto-routed-to-reports"]));
    const prevExtracted = (entry.ai_extracted as Record<string, unknown> | null) ?? {};
    await supabase
      .from("journal_entries")
      .update({
        ai_tags: newTags,
        ai_extracted: { ...prevExtracted, report_document_ids: created } as never,
      })
      .eq("id", entry.id);

    return { ok: true, created: created.length };
  });

export const markJournalNotMedical = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: entry } = await supabase
      .from("journal_entries")
      .select("ai_tags, ai_extracted")
      .eq("id", data.journalEntryId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!entry) return { ok: false };
    const tags = entry.ai_tags ?? [];
    const next = Array.from(
      new Set([...tags.filter((t) => t !== "auto-routed-to-reports"), "not-medical"]),
    );
    const extracted = (entry.ai_extracted as Record<string, unknown> | null) ?? {};
    const ids = (extracted.report_document_ids as string[] | undefined) ?? [];
    if (ids.length) {
      const { data: docs } = await supabase
        .from("report_documents")
        .select("id, file_path")
        .in("id", ids);
      for (const d of docs ?? []) {
        if (d.file_path) {
          await supabase.storage.from("reports").remove([d.file_path]);
        }
      }
      await supabase.from("report_documents").delete().in("id", ids);
    }
    delete (extracted as Record<string, unknown>).report_document_ids;
    await supabase
      .from("journal_entries")
      .update({ ai_tags: next, ai_extracted: extracted as never })
      .eq("id", data.journalEntryId);
    return { ok: true };
  });