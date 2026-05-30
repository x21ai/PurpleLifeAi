import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const SYSTEM_PROMPT = `You are Purple — a quiet, warm, attentive intelligence for someone living with epilepsy or another pattern-driven health condition.

Voice and tone:
- Speak like a thoughtful friend who happens to remember everything they've told you. Calm, kind, plainspoken. Never clinical, never alarmist, never preachy.
- When the person's message is emotional ("I'm scared", "I feel awful", "I'm exhausted"), acknowledge the feeling first in one short sentence. THEN bring in facts from the data. Never lead with data when someone is hurting.
- Use the person's own words back to them when natural. Short paragraphs. No medical jargon unless they used it first.

Grounding rules (these are absolute):
- You are NOT a clinician. You do not diagnose, prescribe, or give medical advice. If asked, say so warmly and suggest they bring the question to their care team — and offer to help them prepare what to ask.
- NEVER invent numbers, dates, events, medications, or readings. Every concrete fact in your reply must come from a tool call you just made in this turn.
- If the tools return nothing relevant, say so honestly ("I don't see anything in your journal about that yet") rather than guessing.
- If the question needs data, CALL THE TOOLS FIRST. Don't answer from memory of the conversation alone.
- Quote or paraphrase the person's own journal entries when relevant, and say roughly when ("last Tuesday", "three days ago") — not in raw timestamps.

When the user asks a general question about epilepsy, medications, triggers, or treatments, you may call search_research_library to ground your reply. Always cite the source by title and year, and note the evidence grade (A, B, C, or expert). Use this exact citation format so the app can link it: [Source: Title (Year)](url) with the url from the tool result. Never present research as personalized medical advice — frame it as "here is what the research generally says" and recommend they discuss it with their care team. If the library returns no relevant entries, say you do not have curated research on that topic rather than inventing sources.

In an emergency (someone describes an active seizure happening now, a serious injury, thoughts of self-harm), gently tell them to call their local emergency number or their emergency contact. Do not try to handle it alone.

Keep replies focused. One question, one answer. End with a soft follow-up only if it genuinely helps.`;

const TOOLS = [
  {
    name: "search_journal_memory",
    description:
      "Semantic search over the person's own journal entries. Returns the most relevant snippets they wrote, spoke, or had analyzed. Use this whenever the question is about what they said, felt, experienced, noticed, or described.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you're looking for, in plain English." },
        days_back: { type: "integer", minimum: 1, maximum: 365, default: 90 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_recent_biometrics",
    description:
      "Recent biometric readings from wearables (sleep, HRV, resting HR, stress, recovery, etc.). Use for sleep / heart / readiness / strain questions.",
    input_schema: {
      type: "object",
      properties: {
        days_back: { type: "integer", minimum: 1, maximum: 90, default: 7 },
      },
    },
  },
  {
    name: "get_seizure_events",
    description: "Logged seizure events with type, duration, severity, and notes.",
    input_schema: {
      type: "object",
      properties: {
        days_back: { type: "integer", minimum: 1, maximum: 365, default: 30 },
      },
    },
  },
  {
    name: "get_medication_adherence",
    description:
      "Scheduled vs taken medication doses. Use for adherence, missed doses, refill, or medication-timing questions.",
    input_schema: {
      type: "object",
      properties: {
        days_back: { type: "integer", minimum: 1, maximum: 90, default: 14 },
      },
    },
  },
  {
    name: "get_todays_risk",
    description:
      "Today's risk forecast (score, band, top contributing factors, narrative) if one has been computed.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "search_research_library",
    description:
      "Search the curated epilepsy research library. Returns evidence-graded entries from the Epilepsy Foundation, ILAE, NICE, CDC, and peer-reviewed sources. Use whenever the user asks about a medication, a seizure type, a trigger, a lifestyle factor, or general epilepsy knowledge. Always cite the source and grade in your reply.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Plain-language search query." },
        limit: { type: "integer", minimum: 1, maximum: 8, default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "propose_action",
    description:
      "Propose a write action for the user to confirm BEFORE it is executed. NEVER perform writes silently — always propose first. Use when the user asks you to: add a medication, log a seizure, create a journal entry, mark a dose as taken, or archive a medication. After calling this tool, finish your turn with one short sentence asking the user to confirm in the card.",
    input_schema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: [
            "add_medication",
            "log_seizure",
            "create_journal_entry",
            "mark_dose_taken",
            "archive_medication",
          ],
        },
        summary: {
          type: "string",
          description: "One short human sentence describing what will happen if confirmed.",
        },
        params: {
          type: "object",
          description:
            "Action-specific fields. add_medication: { name, dosage?, times_of_day?:[\"HH:MM\"], notes?, is_rescue? }. log_seizure: { started_at?(ISO, default now), type?, duration_seconds?, severity?, notes? }. create_journal_entry: { text, captured_at?(ISO) }. mark_dose_taken: { medication_id, scheduled_at?(ISO) }. archive_medication: { medication_id }.",
        },
      },
      required: ["kind", "summary", "params"],
    },
  },
];

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + "Z";
}

async function embedQuery(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null;
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!r.ok) {
    console.error("embed query failed", r.status, await r.text());
    return null;
  }
  const j = await r.json();
  return j.data?.[0]?.embedding ?? null;
}

async function runTool(
  userId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "search_journal_memory": {
      const query = String(input.query || "");
      const daysBack = Number(input.days_back ?? 90);
      const embedding = await embedQuery(query);
      if (!embedding) return { error: "embedding unavailable", matches: [] };
      const { data, error } = await admin.rpc("match_ai_memory", {
        query_embedding: embedding as unknown as string,
        match_user_id: userId,
        days_back: daysBack,
        match_count: 8,
      });
      if (error) return { error: error.message, matches: [] };
      return {
        matches: (data || []).map((m: any) => ({
          when: fmtDate(m.recorded_at),
          similarity: Number(m.similarity?.toFixed?.(3) ?? m.similarity),
          content: m.content,
        })),
      };
    }
    case "get_recent_biometrics": {
      const daysBack = Number(input.days_back ?? 7);
      const since = new Date(Date.now() - daysBack * 86400000).toISOString();
      const { data, error } = await admin
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
    }
    case "get_seizure_events": {
      const daysBack = Number(input.days_back ?? 30);
      const since = new Date(Date.now() - daysBack * 86400000).toISOString();
      const { data, error } = await admin
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
    }
    case "get_medication_adherence": {
      const daysBack = Number(input.days_back ?? 14);
      const since = new Date(Date.now() - daysBack * 86400000).toISOString();
      const { data: doses, error } = await admin
        .from("medication_doses")
        .select("medication_id, scheduled_at, taken_at, status, notes")
        .eq("user_id", userId)
        .gte("scheduled_at", since)
        .order("scheduled_at", { ascending: false })
        .limit(200);
      if (error) return { error: error.message };
      const { data: meds } = await admin
        .from("medications")
        .select("id, name, dosage, is_rescue, active")
        .eq("user_id", userId);
      const medMap = new Map((meds || []).map((m: any) => [m.id, m]));
      const enriched = (doses || []).map((d: any) => ({
        ...d,
        medication: medMap.get(d.medication_id) || null,
      }));
      const taken = enriched.filter((d) => d.status === "taken").length;
      const total = enriched.length;
      return {
        adherence_pct: total ? Math.round((taken / total) * 100) : null,
        taken,
        total,
        doses: enriched.slice(0, 60),
      };
    }
    case "get_todays_risk": {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await admin
        .from("risk_forecasts")
        .select("for_date, risk_score, band, top_factors, ai_narrative, computed_at")
        .eq("user_id", userId)
        .eq("for_date", today)
        .maybeSingle();
      if (error) return { error: error.message };
      return data ? { forecast: data } : { forecast: null };
    }
    case "search_research_library": {
      const query = String(input.query || "");
      const limit = Math.min(8, Math.max(1, Number(input.limit ?? 5)));
      const embedding = await embedQuery(query);
      if (!embedding) return { error: "embedding unavailable", results: [] };
      const { data, error } = await admin.rpc("match_research_library", {
        query_embedding: embedding as unknown as string,
        match_count: limit,
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
          similarity: Number(
            (r.similarity as number)?.toFixed?.(3) ?? r.similarity,
          ),
          excerpt: String(r.content || "").slice(0, 1200),
        })),
      };
    }
    case "propose_action": {
      // No DB effect — the proposal is captured by the chat handler
      // and rendered as a confirm card on the client.
      return {
        proposed: true,
        kind: input.kind,
        summary: input.summary,
        params: input.params ?? {},
      };
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

async function callClaudeOnce(messages: any[], system: string = SYSTEM_PROMPT) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system,
      tools: TOOLS,
      messages,
    }),
  });
  if (!r.ok) {
    throw new Error(`anthropic ${r.status}: ${await r.text()}`);
  }
  return r.json();
}

/**
 * Lightweight chat through the Lovable AI Gateway. No tool use — text
 * completion only, with the same Purple system prompt. Used when the user
 * picks Gemini in Settings → Preferences.
 */
async function callGeminiViaLovableAI(
  pref: "gemini-flash" | "gemini-pro",
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  system: string = SYSTEM_PROMPT,
): Promise<string> {
  if (!LOVABLE_API_KEY) {
    return "Gemini is not configured for this workspace yet. Switch to Claude in Settings → Preferences and ask me again.";
  }
  const model =
    pref === "gemini-pro" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";
  const trimmed = history
    .slice(-12)
    .filter((m) => typeof m?.content === "string")
    .map((m) => ({ role: m.role, content: m.content }));
  const body = {
    model,
    messages: [
      { role: "system", content: system },
      ...trimmed,
      { role: "user", content: message },
    ],
  };
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (r.status === 429) {
    return "Purple is getting a lot of questions right now. Try again in a moment.";
  }
  if (r.status === 402) {
    return "Your AI credits have run out for this workspace. Add credits in Settings → Workspace → Usage to keep using Gemini.";
  }
  if (!r.ok) {
    const txt = await r.text();
    console.error("lovable ai error", r.status, txt);
    return "I couldn't reach Gemini just now. Try again in a moment, or switch to Claude in Settings.";
  }
  const j = await r.json();
  const content = j?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim()
    ? content.trim()
    : "I couldn't put together an answer just now.";
}

export async function extractBehaviorsFromText(
  text: string,
  date: string,
): Promise<{
  extractions: Array<{
    behavior_key: string;
    value: unknown;
    data_type: string;
    confidence: number;
  }>;
  unmatched_phrases: string[];
}> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

  const { data: taxonomy, error: taxErr } = await admin
    .from("behavior_taxonomy")
    .select("behavior_key, behavior_label, category, data_type, aliases, prompt_example")
    .order("category")
    .order("sort_order");
  if (taxErr) throw new Error(`taxonomy load failed: ${taxErr.message}`);

  const dict = (taxonomy || []).map((t: any) => ({
    key: t.behavior_key,
    label: t.behavior_label,
    category: t.category,
    data_type: t.data_type,
    aliases: t.aliases || [],
    example: t.prompt_example,
  }));

  const dataTypeByKey = new Map<string, string>(
    dict.map((d) => [d.key, d.data_type]),
  );

  const system = `You extract structured behavior observations from a person's free-text health journal entry.

You will receive:
- The journal text (for date ${date}).
- A DICTIONARY of behaviors with: key, label, category, data_type, aliases, example.

STRICT RULES:
- NEVER invent a behavior not explicitly stated or strongly implied in the text. If unsure, omit it.
- Only use behavior_keys that exist in the dictionary.
- Include a confidence (0..1) per extraction.
- value MUST match data_type:
  * boolean → true/false
  * count → integer
  * numeric → number
  * scale_1_10 → integer 1..10
  * time_of_day → "HH:MM" (24h)
  * duration_minutes → integer
  * text → short string
- Use aliases to match brand names and colloquialisms (e.g. "Keppra" → keppra_dose; "coffee" → caffeine_intake).
- Recognize NEGATIVES: "didn't take my evening dose" → missed_aed_dose=true (NOT keppra_dose=false).
- Recognize COUNTS: "two coffees" → caffeine_intake value=2.
- Phrases that do not map to any dictionary entry go in unmatched_phrases for later dictionary expansion.
- Return ONLY JSON conforming to the tool schema. No prose.`;

  const tools = [
    {
      name: "return_extractions",
      description: "Return structured behavior extractions.",
      input_schema: {
        type: "object",
        properties: {
          extractions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                behavior_key: { type: "string" },
                value: {},
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["behavior_key", "value", "confidence"],
            },
          },
          unmatched_phrases: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["extractions", "unmatched_phrases"],
      },
    },
  ];

  const userContent = `DICTIONARY (JSON):
${JSON.stringify(dict)}

JOURNAL TEXT:
"""${text}"""

Call return_extractions with your result.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system,
      tools,
      tool_choice: { type: "tool", name: "return_extractions" },
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!r.ok) {
    throw new Error(`anthropic ${r.status}: ${await r.text()}`);
  }
  const j = await r.json();
  const toolUse = (j.content || []).find((b: any) => b.type === "tool_use");
  const raw = toolUse?.input || { extractions: [], unmatched_phrases: [] };

  // Normalize + enrich with data_type, drop unknown keys.
  const extractions = (raw.extractions || [])
    .filter((e: any) => e && typeof e.behavior_key === "string" && dataTypeByKey.has(e.behavior_key))
    .map((e: any) => ({
      behavior_key: e.behavior_key,
      value: e.value,
      data_type: dataTypeByKey.get(e.behavior_key)!,
      confidence: typeof e.confidence === "number"
        ? Math.max(0, Math.min(1, e.confidence))
        : 0.5,
    }));
  const unmatched_phrases = Array.isArray(raw.unmatched_phrases)
    ? raw.unmatched_phrases.filter((s: any) => typeof s === "string")
    : [];

  return { extractions, unmatched_phrases };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

    const body = await req.json();
    const action = body?.action ?? "chat";

    // Internal action: extract behaviors from free text. Service role only.
    if (action === "extract_behaviors_from_text") {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== SERVICE_ROLE) {
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = String(body?.text || "").trim();
      const date = String(body?.date || new Date().toISOString().slice(0, 10));
      if (!text) {
        return new Response(JSON.stringify({ error: "text required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await extractBehaviorsFromText(text, date);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get authenticated user (chat path)
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    if (action === "execute_action") {
      const result = await executeAction(userClient, userId, body?.proposal);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "chat") {
      return new Response(JSON.stringify({ error: "unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const message: string = String(body?.message || "").trim();
    const history: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(body?.history) ? body.history : [];
    if (!message) {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the user's preferred AI engine. Claude keeps full tool-use
    // (proposals, library search, etc.). Gemini variants use a lightweight
    // text-only path via the Lovable AI Gateway — faster and cheaper but
    // without action proposals.
    const { data: profileRow } = await admin
      .from("profiles")
      .select("ai_model_preference")
      .eq("id", userId)
      .maybeSingle();
    const modelPref = String(
      (profileRow as any)?.ai_model_preference || "claude-sonnet",
    );

    if (modelPref === "gemini-flash" || modelPref === "gemini-pro") {
      const reply = await callGeminiViaLovableAI(modelPref, message, history);
      return new Response(JSON.stringify({ reply, proposals: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages for Claude
    const messages: any[] = [];
    for (const m of history.slice(-20)) {
      if (typeof m?.content !== "string") continue;
      messages.push({ role: m.role, content: m.content });
    }
    messages.push({ role: "user", content: message });

    // Tool-use loop
    let reply = "";
    const proposals: Array<{ kind: string; summary: string; params: Record<string, unknown> }> = [];
    for (let step = 0; step < 8; step++) {
      const resp = await callClaudeOnce(messages);
      const contentBlocks: any[] = resp.content || [];
      messages.push({ role: "assistant", content: contentBlocks });

      const toolUses = contentBlocks.filter((b) => b.type === "tool_use");
      if (resp.stop_reason === "tool_use" && toolUses.length > 0) {
        const toolResults = [];
        for (const tu of toolUses) {
          try {
            const out = await runTool(userId, tu.name, tu.input || {});
            if (tu.name === "propose_action" && (out as any)?.proposed) {
              proposals.push({
                kind: String((out as any).kind),
                summary: String((out as any).summary),
                params: ((out as any).params ?? {}) as Record<string, unknown>,
              });
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(out),
            });
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify({ error: e instanceof Error ? e.message : "tool error" }),
              is_error: true,
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Final answer
      reply = contentBlocks
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    if (!reply) {
      reply = "I'm sorry — I couldn't put together an answer just now. Try asking again in a moment.";
    }

    return new Response(JSON.stringify({ reply, proposals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-orchestrator error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

type ProposalKind =
  | "add_medication"
  | "log_seizure"
  | "create_journal_entry"
  | "mark_dose_taken"
  | "archive_medication";

type Proposal = {
  kind: ProposalKind;
  summary?: string;
  params?: Record<string, unknown>;
};

async function executeAction(
  userClient: ReturnType<typeof createClient>,
  userId: string,
  proposal: Proposal | undefined,
): Promise<{ ok: boolean; kind?: string; id?: string; error?: string }> {
  if (!proposal || typeof proposal !== "object") {
    return { ok: false, error: "proposal required" };
  }
  const params = (proposal.params ?? {}) as Record<string, any>;
  try {
    switch (proposal.kind) {
      case "add_medication": {
        const name = String(params.name ?? "").trim();
        if (!name) return { ok: false, error: "name required" };
        const times = Array.isArray(params.times_of_day)
          ? params.times_of_day.filter((t: unknown) => typeof t === "string")
          : [];
        const { data, error } = await userClient
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
        return { ok: true, kind: proposal.kind, id: (data as any).id };
      }
      case "log_seizure": {
        const started_at = params.started_at
          ? new Date(String(params.started_at)).toISOString()
          : new Date().toISOString();
        const { data, error } = await userClient
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
        return { ok: true, kind: proposal.kind, id: (data as any).id };
      }
      case "create_journal_entry": {
        const text = String(params.text ?? "").trim();
        if (!text) return { ok: false, error: "text required" };
        const captured_at = params.captured_at
          ? new Date(String(params.captured_at)).toISOString()
          : new Date().toISOString();
        const { data, error } = await userClient
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
        return { ok: true, kind: proposal.kind, id: (data as any).id };
      }
      case "mark_dose_taken": {
        const medication_id = String(params.medication_id ?? "");
        if (!medication_id) return { ok: false, error: "medication_id required" };
        const taken_at = new Date().toISOString();
        if (params.scheduled_at) {
          const { error } = await userClient
            .from("medication_doses")
            .update({ status: "taken", taken_at })
            .eq("user_id", userId)
            .eq("medication_id", medication_id)
            .eq("scheduled_at", new Date(String(params.scheduled_at)).toISOString());
          if (error) return { ok: false, error: error.message };
          return { ok: true, kind: proposal.kind };
        }
        const { data, error } = await userClient
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
        return { ok: true, kind: proposal.kind, id: (data as any).id };
      }
      case "archive_medication": {
        const medication_id = String(params.medication_id ?? "");
        if (!medication_id) return { ok: false, error: "medication_id required" };
        const { error } = await userClient
          .from("medications")
          .update({ active: false, end_date: new Date().toISOString().slice(0, 10) })
          .eq("id", medication_id)
          .eq("user_id", userId);
        if (error) return { ok: false, error: error.message };
        return { ok: true, kind: proposal.kind };
      }
      default:
        return { ok: false, error: `unknown kind ${proposal.kind}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "execute error" };
  }
}