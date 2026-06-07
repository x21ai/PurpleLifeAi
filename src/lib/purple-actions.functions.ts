import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProposalInput = z.object({
  kind: z.enum([
    "add_medication",
    "log_seizure",
    "create_journal_entry",
    "mark_dose_taken",
    "archive_medication",
  ]),
  summary: z.string().max(400).optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export type PurpleActionResult = {
  ok: boolean;
  kind?: string;
  id?: string;
  error?: string;
};

export const executePurpleAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProposalInput.parse(input))
  .handler(async ({ data, context }): Promise<PurpleActionResult> => {
    const { supabase, userId } = context as {
      supabase: import("@supabase/supabase-js").SupabaseClient;
      userId: string;
    };
    const params = (data.params ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

    try {
      switch (data.kind) {
        case "add_medication": {
          const name = str(params.name).trim();
          if (!name) return { ok: false, error: "name required" };
          const times = Array.isArray(params.times_of_day)
            ? (params.times_of_day as unknown[]).filter((t) => typeof t === "string")
            : [];
          const { data: row, error } = await supabase
            .from("medications")
            .insert({
              user_id: userId,
              name,
              dosage: params.dosage ?? null,
              times_of_day: times,
              notes: params.notes ?? null,
              is_rescue: !!params.is_rescue,
              active: true,
            })
            .select("id")
            .single();
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: data.kind, id: (row as { id: string }).id };
        }
        case "log_seizure": {
          const started_at = params.started_at
            ? new Date(str(params.started_at)).toISOString()
            : new Date().toISOString();
          const { data: row, error } = await supabase
            .from("seizure_events")
            .insert({
              user_id: userId,
              started_at,
              type: params.type ?? null,
              duration_seconds: params.duration_seconds ?? null,
              severity: params.severity ?? null,
              notes: params.notes ?? null,
              detection_source: "ai_chat",
            })
            .select("id")
            .single();
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: data.kind, id: (row as { id: string }).id };
        }
        case "create_journal_entry": {
          const text = str(params.text).trim();
          if (!text) return { ok: false, error: "text required" };
          const captured_at = params.captured_at
            ? new Date(str(params.captured_at)).toISOString()
            : new Date().toISOString();
          const { data: row, error } = await supabase
            .from("journal_entries")
            .insert({
              user_id: userId,
              kind: "text",
              status: "processing",
              text,
              captured_at,
            })
            .select("id")
            .single();
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: data.kind, id: (row as { id: string }).id };
        }
        case "mark_dose_taken": {
          const medication_id = str(params.medication_id);
          if (!medication_id) return { ok: false, error: "medication_id required" };
          const taken_at = new Date().toISOString();
          if (params.scheduled_at) {
            const { error } = await supabase
              .from("medication_doses")
              .update({ status: "taken", taken_at })
              .eq("user_id", userId)
              .eq("medication_id", medication_id)
              .eq("scheduled_at", new Date(str(params.scheduled_at)).toISOString());
            if (error) return { ok: false, error: error.message };
            return { ok: true, kind: data.kind };
          }
          const { data: row, error } = await supabase
            .from("medication_doses")
            .insert({
              user_id: userId,
              medication_id,
              scheduled_at: taken_at,
              status: "taken",
              taken_at,
            })
            .select("id")
            .single();
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: data.kind, id: (row as { id: string }).id };
        }
        case "archive_medication": {
          const medication_id = str(params.medication_id);
          if (!medication_id) return { ok: false, error: "medication_id required" };
          const { error } = await supabase
            .from("medications")
            .update({ active: false, end_date: new Date().toISOString().slice(0, 10) })
            .eq("id", medication_id)
            .eq("user_id", userId);
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: data.kind };
        }
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "execute error" };
    }
  });