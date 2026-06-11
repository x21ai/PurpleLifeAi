import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Platform AI gateway: resolves the model used for platform-paid AI features
 * (Ask Purple chat, insight cards, care profiles).
 *
 * Anthropic is the platform default. When the user picked a different provider
 * in Settings and the matching platform key exists, that provider is used
 * directly. The legacy Lovable gateway remains only as a last-resort fallback
 * so Lovable preview environments (which inject LOVABLE_API_KEY) keep working
 * without Anthropic credentials.
 */
export function resolvePlatformModel(provider?: string | null): LanguageModel | null {
  const p = (provider || "").toLowerCase();

  if (p === "openai" && process.env.OPENAI_API_KEY) {
    const openai = createOpenAICompatible({
      name: "openai",
      baseURL: "https://api.openai.com/v1",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    return openai("gpt-5-mini");
  }

  if (p === "grok" && process.env.GROK_API_KEY) {
    const grok = createOpenAICompatible({
      name: "grok",
      baseURL: "https://api.x.ai/v1",
      headers: { Authorization: `Bearer ${process.env.GROK_API_KEY}` },
    });
    return grok("grok-4");
  }

  if (p === "gemini" && process.env.GEMINI_API_KEY) {
    // Google's OpenAI-compatible endpoint for the Gemini API.
    const gemini = createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
    });
    return gemini("gemini-2.5-pro");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic("claude-sonnet-4-5");
  }

  if (process.env.LOVABLE_API_KEY) {
    const legacyGateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": process.env.LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    return legacyGateway("anthropic/claude-sonnet-4-5");
  }

  return null;
}
