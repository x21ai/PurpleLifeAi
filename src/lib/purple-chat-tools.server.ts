import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
}

async function embedQuery(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { data?: Array<{ embedding?: number[] }> };
  return j.data?.[0]?.embedding ?? null;
}

export type ProposalKind =
  | "add_medication"
  | "log_seizure"
  | "create_journal_entry"
  | "mark_dose_taken"
  | "archive_medication";

export const ProposalSchema = z.object({
  kind: z.enum([
    "add_medication",
    "log_seizure",
    "create_journal_entry",
    "mark_dose_taken",
    "archive_medication",
  ]),
  summary: z.string().min(1).max(400),
  params: z.record(z.string(), z.unknown()),
});

export function buildPurpleTools(userId: string) {
  return {
    searchJournalMemory: tool({
      description:
        "Semantic search over the person's own journal entries. Returns the most relevant snippets they wrote, spoke, or had analyzed. Use whenever the question is about what they said, felt, experienced, noticed, or described.",
      inputSchema: z.object({
        query: z.string().min(1).max(500),
        days_back: z.number().int().min(1).max(365).default(90).optional(),
      }),
      execute: async ({ query, days_back }) => {
        const embedding = await embedQuery(query);
        if (!embedding) return { error: "embedding unavailable", matches: [] };
        const { data, error } = await supabaseAdmin.rpc("match_ai_memory", {
          query_embedding: embedding as unknown as string,
          match_user_id: userId,
          days_back: days_back ?? 90,
          match_count: 8,
        });
        if (error) return { error: error.message, matches: [] };
        return {
          matches: (data || []).map((m: { recorded_at?: string; similarity?: number; content?: string }) => ({
            when: fmtDate(m.recorded_at),
            similarity: Number(m.similarity?.toFixed?.(3) ?? m.similarity),
            content: m.content,
          })),
        };
      },
    }),

    getRecentBiometrics: tool({
      description:
        "Recent biometric readings from wearables (sleep, HRV, resting HR, stress, recovery, etc.). Use for sleep / heart / readiness / strain questions.",
      inputSchema: z.object({
        days_back: z.number().int().min(1).max(90).default(7).optional(),
      }),
      execute: async ({ days_back }) => {
        const since = new Date(Date.now() - (days_back ?? 7) * 86400000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("biometrics")
          .select(
            "recorded_at, source, hr_bpm, resting_hr_bpm, hrv_rmssd_ms, sleep_total_min, sleep_score, sleep_efficiency_pct, oura_readiness_score, oura_stress_score, whoop_strain, whoop_recovery_pct, steps, skin_temp_c, body_temp_deviation_c, menstrual_phase",
          )
          .eq("user_id", userId)
          .gte("recorded_at", since)
          .order("recorded_at", { ascending: false })
          .limit(60);
        if (error) return { error: error.message, readings: [] };
        return { readings: data ?? [] };
      },
    }),

    getSeizureEvents: tool({
      description: "Logged seizure events with type, duration, severity, and notes.",
      inputSchema: z.object({
        days_back: z.number().int().min(1).max(365).default(30).optional(),
      }),
      execute: async ({ days_back }) => {
        const since = new Date(Date.now() - (days_back ?? 30) * 86400000).toISOString();
        const { data, error } = await supabaseAdmin
          .from("seizure_events")
          .select(
            "started_at, ended_at, duration_seconds, type, severity, witnessed, injury, rescue_med_given, rescue_med_name, recovery_minutes, notes, auto_detected",
          )
          .eq("user_id", userId)
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(50);
        if (error) return { error: error.message, events: [] };
        return { events: data ?? [] };
      },
    }),

    getMedicationAdherence: tool({
      description:
        "Scheduled vs taken medication doses. Use for adherence, missed doses, refill, or medication-timing questions.",
      inputSchema: z.object({
        days_back: z.number().int().min(1).max(90).default(14).optional(),
      }),
      execute: async ({ days_back }) => {
        const since = new Date(Date.now() - (days_back ?? 14) * 86400000).toISOString();
        const { data: doses, error } = await supabaseAdmin
          .from("medication_doses")
          .select("medication_id, scheduled_at, taken_at, status, notes")
          .eq("user_id", userId)
          .gte("scheduled_at", since)
          .order("scheduled_at", { ascending: false })
          .limit(200);
        if (error) return { error: error.message };
        const { data: meds } = await supabaseAdmin
          .from("medications")
          .select("id, name, dosage, is_rescue, active")
          .eq("user_id", userId);
        const medMap = new Map((meds || []).map((m: { id: string }) => [m.id, m]));
        const enriched = (doses || []).map((d: { medication_id: string; status?: string | null }) => ({
          ...d,
          medication: medMap.get(d.medication_id) ?? null,
        }));
        const taken = enriched.filter((d) => d.status === "taken").length;
        const total = enriched.length;
        return {
          adherence_pct: total ? Math.round((taken / total) * 100) : null,
          taken,
          total,
          doses: enriched.slice(0, 60),
        };
      },
    }),

    getTodaysRisk: tool({
      description:
        "Today's risk forecast (score, band, top contributing factors, narrative) if one has been computed.",
      inputSchema: z.object({}),
      execute: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabaseAdmin
          .from("risk_forecasts")
          .select("for_date, risk_score, band, top_factors, ai_narrative, computed_at")
          .eq("user_id", userId)
          .eq("for_date", today)
          .maybeSingle();
        if (error) return { error: error.message };
        return data ? { forecast: data } : { forecast: null };
      },
    }),

    searchResearchLibrary: tool({
      description:
        "Search the curated epilepsy research library. Returns evidence-graded entries from the Epilepsy Foundation, ILAE, NICE, CDC, and peer-reviewed sources. Use whenever the user asks about a medication, a seizure type, a trigger, a lifestyle factor, or general epilepsy knowledge. Always cite the source and grade in your reply.",
      inputSchema: z.object({
        query: z.string().min(1).max(500),
        limit: z.number().int().min(1).max(8).default(5).optional(),
      }),
      execute: async ({ query, limit }) => {
        const embedding = await embedQuery(query);
        if (!embedding) return { error: "embedding unavailable", results: [] };
        const { data, error } = await supabaseAdmin.rpc("match_research_library", {
          query_embedding: embedding as unknown as string,
          match_count: Math.min(8, Math.max(1, limit ?? 5)),
        });
        if (error) return { error: error.message, results: [] };
        return {
          results: (data || []).map((r: Record<string, unknown>) => ({
            title: r.title,
            authors: r.authors,
            publication: r.publication,
            year: r.year,
            url: r.url,
            source_type: r.source_type,
            evidence_grade: r.evidence_grade,
            abstract: r.abstract,
            similarity: Number((r.similarity as number)?.toFixed?.(3) ?? r.similarity),
            excerpt: String(r.content || "").slice(0, 1200),
          })),
        };
      },
    }),

    proposeAction: tool({
      description:
        "Propose a write action for the user to confirm BEFORE it is executed. NEVER perform writes silently, always propose first. Use when the user asks you to: add a medication, log a seizure, create a journal entry, mark a dose as taken, or archive a medication. After calling this tool, finish your turn with one short sentence asking the user to confirm in the card.",
      inputSchema: ProposalSchema,
      // No execute(), the client renders a confirm card and calls executePurpleAction.
    }),
  } as const;
}