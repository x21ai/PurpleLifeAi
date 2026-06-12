/**
 * Multi-provider AI dispatcher.
 *
 * Reads the user's chosen provider from profiles.ai_provider (default: 'claude')
 * and forwards a text + optional media (image / PDF data URL) prompt to that
 * provider's API. Returns plain text or parsed JSON.
 *
 * All call sites in the app should go through `callAI()` so users keep one
 * setting that controls every AI feature.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AiProvider = "claude" | "openai" | "gemini" | "grok" | "maya";

const ALLOWED: AiProvider[] = ["claude", "openai", "gemini", "grok", "maya"];

export type AiMedia = {
  /** raw base64 (no data: prefix) */
  base64: string;
  mime: string;
};

export type AiCallOpts = {
  provider: AiProvider;
  system: string;
  prompt: string;
  media?: AiMedia | null;
  jsonMode?: boolean;
  maxTokens?: number;
};

export type AiError = Error & { code?: string };

function mkErr(message: string, code?: string): AiError {
  const e = new Error(message) as AiError;
  if (code) e.code = code;
  return e;
}

export async function getUserProvider(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiProvider> {
  const { data } = await supabase
    .from("profiles")
    .select("ai_provider")
    .eq("id", userId)
    .maybeSingle();
  const p = (data?.ai_provider as string | null) ?? "claude";
  return (ALLOWED.includes(p as AiProvider) ? p : "claude") as AiProvider;
}

function defaultModel(provider: AiProvider): string {
  switch (provider) {
    case "claude":
      return "claude-sonnet-4-5";
    case "openai":
      return "gpt-5-mini";
    case "gemini":
      return "gemini-2.5-pro";
    case "grok":
      return "grok-4";
    case "maya":
      return "maya-default";
  }
}

function handleStatus(provider: string, status: number, body: string): never {
  if (status === 402) throw mkErr(`${provider} credits exhausted.`, "ai_credits_exhausted");
  if (status === 429)
    throw mkErr(`${provider} is rate-limited. Try again shortly.`, "ai_rate_limited");
  if (status === 401 || status === 403) {
    throw mkErr(`${provider} API key is missing or invalid.`, "ai_key_invalid");
  }
  throw mkErr(`${provider} request failed (${status}): ${body.slice(0, 200)}`);
}

/* ---------- Anthropic ---------- */
async function callClaude(opts: AiCallOpts): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw mkErr("ANTHROPIC_API_KEY not configured", "ai_key_invalid");
  const content: unknown[] = [];
  if (opts.media) {
    if (opts.media.mime === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: opts.media.base64 },
      });
    } else {
      content.push({
        type: "image",
        source: { type: "base64", media_type: opts.media.mime, data: opts.media.base64 },
      });
    }
  }
  const system = opts.jsonMode
    ? `${opts.system}\n\nRespond ONLY with a single valid JSON object. No prose, no markdown fences.`
    : opts.system;
  content.push({ type: "text", text: opts.prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: defaultModel("claude"),
      max_tokens: opts.maxTokens ?? 4096,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) handleStatus("Claude", res.status, await res.text());
  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  return (json.content ?? []).map((b) => (b.type === "text" ? (b.text ?? "") : "")).join("");
}

/* ---------- OpenAI-compatible (OpenAI + Grok) ---------- */
async function callOpenAICompat(
  label: string,
  baseUrl: string,
  apiKey: string,
  model: string,
  opts: AiCallOpts,
): Promise<string> {
  const userContent: unknown[] = [{ type: "text", text: opts.prompt }];
  if (opts.media) {
    if (opts.media.mime === "application/pdf") {
      throw mkErr(
        `${label} can't read PDFs in this app yet. Pick Claude or Gemini in Settings, or upload an image instead.`,
        "ai_pdf_unsupported",
      );
    }
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${opts.media.mime};base64,${opts.media.base64}` },
    });
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: userContent },
      ],
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
  });
  if (!res.ok) handleStatus(label, res.status, await res.text());
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(opts: AiCallOpts) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw mkErr("OPENAI_API_KEY not configured", "ai_key_invalid");
  return callOpenAICompat("OpenAI", "https://api.openai.com/v1", key, defaultModel("openai"), opts);
}

async function callGrok(opts: AiCallOpts) {
  const key = process.env.GROK_API_KEY;
  if (!key) throw mkErr("GROK_API_KEY not configured", "ai_key_invalid");
  return callOpenAICompat("Grok", "https://api.x.ai/v1", key, defaultModel("grok"), opts);
}

/* ---------- Gemini (direct) ---------- */
async function callGeminiDirect(opts: AiCallOpts): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw mkErr("GEMINI_API_KEY not configured", "ai_key_invalid");
  const parts: unknown[] = [{ text: opts.prompt }];
  if (opts.media) {
    parts.push({
      inline_data: { mime_type: opts.media.mime, data: opts.media.base64 },
    });
  }
  const model = defaultModel("gemini");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        ...(opts.jsonMode ? { response_mime_type: "application/json" } : {}),
        ...(opts.maxTokens ? { maxOutputTokens: opts.maxTokens } : {}),
      },
    }),
  });
  if (!res.ok) handleStatus("Gemini", res.status, await res.text());
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

/* ---------- Dispatch ---------- */
export async function callAI(opts: AiCallOpts): Promise<string> {
  switch (opts.provider) {
    case "claude":
      return callClaude(opts);
    case "openai":
      return callOpenAI(opts);
    case "gemini":
      return callGeminiDirect(opts);
    case "grok":
      return callGrok(opts);
    case "maya":
      throw mkErr(
        "Maya isn't configured yet. Pick a different provider in Settings → AI.",
        "ai_provider_not_configured",
      );
  }
}

export async function callAIForUser(
  supabase: SupabaseClient,
  userId: string,
  opts: Omit<AiCallOpts, "provider">,
): Promise<string> {
  const provider = await getUserProvider(supabase, userId);
  return callAI({ ...opts, provider });
}

export function tryParseJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // try to extract first {...} block (some models wrap in markdown)
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}
