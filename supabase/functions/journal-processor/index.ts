import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const SYSTEM_PROMPT = `You read a single journal entry from a person managing a long-term health condition (epilepsy and related pattern-driven conditions). Your job is to read the entry carefully and extract structure that will help them understand their own patterns over time.

Be warm and human, never clinical or alarming. Paraphrase in their own voice. Do not diagnose. Do not give medical advice. Surface only what is genuinely present in the entry — never invent symptoms, events, or triggers.

You must respond ONLY with a single JSON object using the provided tool. No prose.`;

const TOOL_SCHEMA = {
  name: "record_entry_analysis",
  description: "Return the structured analysis of the journal entry.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "2-3 sentence paraphrase in the person's own voice, warm and human.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description:
          "Snake_case tags prefixed with symptom:, mood:, trigger:, med:, or event: (e.g. symptom:headache, mood:tired, trigger:poor_sleep, med:keppra_taken, event:aura).",
      },
      extracted: {
        type: "object",
        properties: {
          symptoms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                severity: { type: "number", minimum: 1, maximum: 10 },
                note: { type: "string" },
              },
              required: ["name"],
            },
          },
          mood: {
            type: "object",
            properties: {
              valence: { type: "number", minimum: -1, maximum: 1 },
              energy: { type: "number", minimum: -1, maximum: 1 },
            },
          },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "seizure",
                    "aura",
                    "near_miss",
                    "medication",
                    "sleep",
                    "meal",
                    "stress",
                  ],
                },
                detail: { type: "string" },
              },
              required: ["type"],
            },
          },
          possible_triggers: { type: "array", items: { type: "string" } },
          needs_followup: { type: "boolean" },
        },
        required: ["needs_followup"],
      },
    },
    required: ["summary", "tags", "extracted"],
  },
};

function extOf(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    const m = p.match(/\.([a-z0-9]+)(?:$|\?)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function isAudioExt(e: string) {
  return ["mp3", "wav", "m4a", "webm", "ogg", "oga", "mp4"].includes(e);
}
function isPhotoExt(e: string) {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(e);
}
function isVideoExt(e: string) {
  return ["mov", "mp4", "webm", "mkv"].includes(e);
}
function photoMime(e: string) {
  if (e === "jpg") return "image/jpeg";
  if (e === "jpeg") return "image/jpeg";
  if (e === "png") return "image/png";
  if (e === "gif") return "image/gif";
  if (e === "webp") return "image/webp";
  return "image/jpeg";
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return btoa(binary);
}

async function transcribeAudio(url: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const bytes = await fetchBytes(url);
  const e = extOf(url) || "webm";
  const blob = new Blob([bytes], { type: `audio/${e === "m4a" ? "mp4" : e}` });
  const form = new FormData();
  form.append("file", blob, `audio.${e}`);
  form.append("model", "whisper-1");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`whisper ${r.status}: ${t}`);
  }
  const j = await r.json();
  return (j.text || "").trim();
}

async function callClaude(opts: {
  text: string;
  transcript: string;
  photos: { mime: string; b64: string }[];
}) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

  const content: any[] = [];
  const intro = [
    opts.text ? `Written entry:\n${opts.text}` : "",
    opts.transcript ? `Spoken transcript:\n${opts.transcript}` : "",
    opts.photos.length
      ? `There ${opts.photos.length === 1 ? "is 1 photo" : `are ${opts.photos.length} photos`} attached below.`
      : "",
    "Use the record_entry_analysis tool to return the structured analysis.",
  ]
    .filter(Boolean)
    .join("\n\n");

  content.push({ type: "text", text: intro });
  for (const p of opts.photos) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: p.mime, data: p.b64 },
    });
  }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "record_entry_analysis" },
      messages: [{ role: "user", content }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`anthropic ${r.status}: ${t}`);
  }
  const j = await r.json();
  const block = (j.content || []).find((b: any) => b.type === "tool_use");
  if (!block) throw new Error("anthropic: no tool_use block");
  return block.input as {
    summary: string;
    tags: string[];
    extracted: Record<string, unknown> & { needs_followup?: boolean };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let entry_id: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    entry_id = body?.entry_id;
    if (!entry_id) {
      return new Response(JSON.stringify({ error: "entry_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: entry, error: fetchErr } = await admin
      .from("journal_entries")
      .select("*")
      .eq("id", entry_id)
      .single();
    if (fetchErr || !entry) throw new Error(fetchErr?.message || "entry not found");

    const media: string[] = Array.isArray(entry.media_urls) ? entry.media_urls : [];
    const audioUrls = media.filter((u) => isAudioExt(extOf(u)) && !isVideoExt(extOf(u)) && u.includes("voice-"));
    // Fallback: treat any non-photo non-video as audio if filename hints audio
    const remaining = media.filter((u) => !audioUrls.includes(u));
    const photoUrls = remaining.filter((u) => isPhotoExt(extOf(u)));

    // 2. Transcribe audio
    let transcript = entry.voice_transcript || "";
    for (const u of audioUrls) {
      try {
        const t = await transcribeAudio(u);
        if (t) transcript = transcript ? `${transcript}\n${t}` : t;
      } catch (e) {
        console.error("transcribe failed", e);
      }
    }

    // 3. Photos -> base64
    const photos: { mime: string; b64: string }[] = [];
    for (const u of photoUrls.slice(0, 6)) {
      try {
        const bytes = await fetchBytes(u);
        photos.push({ mime: photoMime(extOf(u)), b64: toBase64(bytes) });
      } catch (e) {
        console.error("photo fetch failed", e);
      }
    }

    // 4-6. Call Claude
    const result = await callClaude({
      text: entry.text || "",
      transcript,
      photos,
    });

    const needsFollowup = Boolean(
      (result.extracted as any)?.needs_followup,
    );

    // 7. Update entry
    const { error: updErr } = await admin
      .from("journal_entries")
      .update({
        ai_summary: result.summary,
        ai_tags: result.tags ?? [],
        ai_extracted: result.extracted ?? {},
        voice_transcript: transcript || null,
        status: "processed",
      })
      .eq("id", entry_id);
    if (updErr) throw new Error(updErr.message);

    // 8. Alert if needed
    if (needsFollowup) {
      await admin.from("alerts").insert({
        user_id: entry.user_id,
        kind: "journal_followup",
        severity: "attention",
        title: "Something in your journal may need a closer look",
        body: result.summary,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journal-processor error", e);
    if (entry_id) {
      await admin
        .from("journal_entries")
        .update({ status: "failed" })
        .eq("id", entry_id);
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});