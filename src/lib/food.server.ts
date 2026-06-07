import { z } from "zod";

const ItemSchema = z.object({
  name: z.string().min(1).max(120),
  portion: z.string().max(120).nullable().optional(),
  calories_kcal: z.number().nonnegative().nullable().optional(),
  protein_g: z.number().nonnegative().nullable().optional(),
  carbs_g: z.number().nonnegative().nullable().optional(),
  fat_g: z.number().nonnegative().nullable().optional(),
  volume_ml: z.number().nonnegative().nullable().optional(),
});

const RecognitionSchema = z.object({
  kind: z.enum(["water", "drink", "food", "unknown"]),
  items: z.array(ItemSchema).max(8),
  confidence: z.number().min(0).max(1),
  notes: z.string().max(400).nullable().optional(),
});

export type IntakeRecognition = z.infer<typeof RecognitionSchema>;

const SYSTEM = `You analyze a photo (or short text) and identify what someone is eating or drinking, so they can log it in a health journal.

Return JSON only via the provided tool. Rules:
- "kind": "water" if plain water, "drink" for any non-water beverage (coffee, tea, juice, soda, sports drinks, smoothies, alcohol), "food" for any solid food or meal, "unknown" if you genuinely can't tell.
- "items": one entry per distinct item visible. For a single drink, one item. For a plate, list each component (e.g. "grilled chicken", "rice", "salad").
- Provide best-effort estimates for portion, calories_kcal, and macros. If you cannot estimate something, leave it null. For drinks, include "volume_ml".
- "confidence": 0.2 if very unsure, 0.5 if reasonable, 0.85+ only if clearly identifiable.
- Keep names short and human (e.g. "Latte with oat milk", not "Coffee beverage prepared with...").
- Never invent specific brand names you can't see. Generic descriptions are fine.`;

const tool = {
  type: "function" as const,
  function: {
    name: "log_intake",
    description: "Return a structured intake recognition.",
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["water", "drink", "food", "unknown"] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              portion: { type: "string" },
              calories_kcal: { type: "number" },
              protein_g: { type: "number" },
              carbs_g: { type: "number" },
              fat_g: { type: "number" },
              volume_ml: { type: "number" },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
        confidence: { type: "number" },
        notes: { type: "string" },
      },
      required: ["kind", "items", "confidence"],
      additionalProperties: false,
    },
  },
};

async function callGateway(messages: any[]): Promise<IntakeRecognition> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway is not configured.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM }, ...messages],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "log_intake" } },
    }),
  });

  if (res.status === 429) throw new Error("Too many requests right now. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    throw new Error("Couldn't reach the AI service.");
  }

  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) throw new Error("AI returned no result.");
  const parsed = RecognitionSchema.parse(JSON.parse(call.function.arguments));
  return parsed;
}

export function recognizeFromImageBase64(dataUrl: string): Promise<IntakeRecognition> {
  return callGateway([
    {
      role: "user",
      content: [
        { type: "text", text: "Identify what's in this photo for an intake log." },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ]);
}

export function recognizeFromText(text: string): Promise<IntakeRecognition> {
  return callGateway([
    {
      role: "user",
      content: `Identify what I had: """${text.slice(0, 800)}"""`,
    },
  ]);
}