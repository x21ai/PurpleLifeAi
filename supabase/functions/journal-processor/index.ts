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
          "Snake_case tags. Use ONE of these prefixes: symptom: (headache, nausea), mood: (tired, anxious), trigger: (alcohol, poor_sleep), med: (keppra_taken), event: (seizure, aura, fall — DISCRETE events only), or context: (sleep, work, exercise — ongoing states or settings). NEVER tag 'sleep', 'awake', 'bedtime', or 'morning' as event:. Those are context:.",
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
  if (!isAllowedStorageUrl(url)) {
    throw new Error("disallowed media url");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 50 * 1024 * 1024) {
      throw new Error("media too large");
    }
    return new Uint8Array(buf);
  } finally {
    clearTimeout(timeout);
  }
}

function isAllowedStorageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    let supabaseHost: string | null = null;
    try {
      supabaseHost = new URL(SUPABASE_URL).hostname;
    } catch {
      supabaseHost = null;
    }
    const hostOk =
      (supabaseHost && u.hostname === supabaseHost) ||
      u.hostname.endsWith(".supabase.co") ||
      u.hostname.endsWith(".supabase.in");
    return hostOk && u.pathname.includes("/storage/v1/");
  } catch {
    return false;
  }
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

async function embedText(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY || !text.trim()) return null;
  try {
    const r = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });
    if (!r.ok) {
      console.error("embed error", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("embed exception", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let entry_id: string | undefined;
  try {
    // AuthN: require either service-role token OR a valid user JWT whose
    // user id matches the journal entry's user_id. Prevents unauthenticated
    // callers from reading or re-processing arbitrary journal entries.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let callerUserId: string | null = null;
    const isServiceRole = token === SERVICE_ROLE;
    if (!isServiceRole) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerUserId = userData.user.id;
    }

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

    if (!isServiceRole && entry.user_id !== callerUserId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Guard: if the entry had no actual content (no text, no transcript, no photos)
    // the model often replies with a meta "I don't see a journal entry…" message.
    // That isn't a summary — drop it so the journal list doesn't show AI scaffolding.
    const hadContent = Boolean((entry.text ?? "").trim() || transcript.trim() || photos.length > 0);
    const summaryLower = (result.summary ?? "").toLowerCase();
    const looksLikeMetaReply =
      summaryLower.includes("i don't see a journal") ||
      summaryLower.includes("i do not see a journal") ||
      summaryLower.includes("no journal entry") ||
      summaryLower.startsWith("please provide") ||
      summaryLower.startsWith("i'm ready to help") ||
      summaryLower.startsWith("i am ready to help");
    const cleanSummary = hadContent && !looksLikeMetaReply ? result.summary : null;

    // 7. Update entry
    const { error: updErr } = await admin
      .from("journal_entries")
      .update({
        ai_summary: cleanSummary,
        ai_tags: result.tags ?? [],
        ai_extracted: result.extracted ?? {},
        voice_transcript: transcript || null,
        status: "processed",
      })
      .eq("id", entry_id);
    if (updErr) throw new Error(updErr.message);

    // Embed into ai_memory for semantic search
    const memoryContent = [
      entry.text || "",
      transcript || "",
      result.summary || "",
      (result.tags || []).join(" "),
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();
    if (memoryContent) {
      const embedding = await embedText(memoryContent);
      if (embedding) {
        await admin
          .from("ai_memory")
          .upsert(
            {
              user_id: entry.user_id,
              source_table: "journal_entries",
              source_id: entry_id,
              recorded_at: entry.captured_at || new Date().toISOString(),
              content: memoryContent,
              embedding: embedding as unknown as string,
            },
            { onConflict: "source_table,source_id" },
          );
      }
    }

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

    // 9. Auto-create a seizure_event when the entry describes one.
    // Source of truth stays the seizure_events table so Timeline, Patterns,
    // Care alerts and Caregiver mirror all see it. Dedupe within ±10 min so
    // we don't double-count a journal entry written right after a manual log.
    try {
      const events = ((result.extracted as any)?.events ?? []) as Array<{
        type?: string; detail?: string;
      }>;
      const tags = result.tags ?? [];
      const mentionsSeizure =
        events.some((e) => e?.type === "seizure") ||
        tags.includes("event:seizure");
      if (mentionsSeizure && !entry.linked_seizure_id) {
        const startedAt = entry.captured_at || new Date().toISOString();
        const winStart = new Date(new Date(startedAt).getTime() - 10 * 60 * 1000).toISOString();
        const winEnd = new Date(new Date(startedAt).getTime() + 10 * 60 * 1000).toISOString();
        const { data: dupe } = await admin
          .from("seizure_events")
          .select("id")
          .eq("user_id", entry.user_id)
          .gte("started_at", winStart)
          .lte("started_at", winEnd)
          .limit(1)
          .maybeSingle();
        let seizureId = dupe?.id as string | undefined;
        if (!seizureId) {
          const detail = events.find((e) => e?.type === "seizure")?.detail ?? null;
          const { data: ins } = await admin
            .from("seizure_events")
            .insert({
              user_id: entry.user_id,
              started_at: startedAt,
              notes: detail,
              auto_detected: true,
              detection_source: "journal",
              created_by_kind: "self",
            })
            .select("id")
            .single();
          seizureId = ins?.id;
        }
        if (seizureId) {
          await admin
            .from("journal_entries")
            .update({ linked_seizure_id: seizureId })
            .eq("id", entry_id);
        }
      }
    } catch (e) {
      console.error("seizure auto-link failed", e);
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
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});