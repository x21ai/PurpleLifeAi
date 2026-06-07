import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider, modelForProvider } from "@/lib/ai-gateway.server";
import { buildSystemPrompt } from "@/lib/purple-chat-prompt.server";
import { buildPurpleTools } from "@/lib/purple-chat-tools.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const lovableKey = process.env.LOVABLE_API_KEY;
          if (!lovableKey) {
            return new Response("LOVABLE_API_KEY not configured", { status: 500 });
          }

          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            return new Response("Supabase not configured", { status: 500 });
          }

          const authHeader = request.headers.get("authorization") ?? "";
          if (!authHeader.toLowerCase().startsWith("bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: authHeader } },
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData, error: userErr } = await userClient.auth.getUser();
          if (userErr || !userData?.user) {
            return new Response("Unauthorized", { status: 401 });
          }
          const userId = userData.user.id;

          const body = (await request.json()) as { messages?: UIMessage[] };
          const messages = body?.messages;
          if (!Array.isArray(messages)) {
            return new Response("Messages required", { status: 400 });
          }

          const { data: profile } = await userClient
            .from("profiles")
            .select("ai_provider, ai_model_preference, conditions, conditions_note")
            .eq("id", userId)
            .maybeSingle();

          const provider =
            (profile?.ai_provider as string | null) ??
            (profile?.ai_model_preference as string | null) ??
            "gemini";
          const system = buildSystemPrompt(
            profile?.conditions as string[] | null,
            profile?.conditions_note as string | null,
          );

          const gateway = createLovableAiGatewayProvider(lovableKey);
          const model = gateway(modelForProvider(provider));

          const result = streamText({
            model,
            system,
            messages: convertToModelMessages(messages),
            tools: buildPurpleTools(userId),
            stopWhen: stepCountIs(50),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (error) => {
              const msg = error instanceof Error ? error.message : String(error);
              if (msg.includes("429")) {
                return "Purple is getting a lot of questions right now. Try again in a moment.";
              }
              if (msg.includes("402")) {
                return "Your AI credits have run out. Add credits in Settings → Workspace → Usage.";
              }
              console.error("[/api/chat] stream error", msg);
              return "I couldn't put together an answer just now. Try again in a moment.";
            },
          });
        } catch (e) {
          console.error("[/api/chat] error", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});