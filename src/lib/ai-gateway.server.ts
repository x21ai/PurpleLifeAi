import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Lovable AI Gateway provider for the AI SDK.
 * Creates a per-request provider; read LOVABLE_API_KEY inside the route handler.
 */
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

/**
 * Map the user's selected provider (profiles.ai_provider) onto a model id the
 * Lovable AI Gateway accepts. One unified streaming code path for chat.
 */
export function modelForProvider(provider: string | null | undefined): string {
  switch ((provider || "").toLowerCase()) {
    case "claude":
      return "anthropic/claude-sonnet-4-5";
    case "openai":
      return "openai/gpt-5-mini";
    case "grok":
      return "xai/grok-4";
    case "gemini":
    case "lovable":
    case "maya":
    case "":
    default:
      return "google/gemini-3-flash-preview";
  }
}