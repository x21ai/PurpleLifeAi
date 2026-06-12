import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callAIForUser, tryParseJson } from "./ai-provider.server";

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

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL.");
  return { mime: m[1], base64: m[2] };
}

const JSON_SHAPE = `Return ONLY a JSON object of this shape:
{
  "kind": "water" | "drink" | "food" | "unknown",
  "items": [
    { "name": "string", "portion": "string|null", "calories_kcal": number|null,
      "protein_g": number|null, "carbs_g": number|null, "fat_g": number|null,
      "volume_ml": number|null }
  ],
  "confidence": number,
  "notes": "string|null"
}`;

async function recognize(
  supabase: SupabaseClient,
  userId: string,
  prompt: string,
  media: { mime: string; base64: string } | null,
): Promise<IntakeRecognition> {
  const text = await callAIForUser(supabase, userId, {
    system: `${SYSTEM}\n\n${JSON_SHAPE}`,
    prompt,
    media,
    jsonMode: true,
    maxTokens: 1500,
  });
  const parsed = tryParseJson<unknown>(text);
  if (!parsed) throw new Error("AI returned no parseable result.");
  return RecognitionSchema.parse(parsed);
}

export function recognizeFromImageBase64(
  supabase: SupabaseClient,
  userId: string,
  dataUrl: string,
): Promise<IntakeRecognition> {
  return recognize(
    supabase,
    userId,
    "Identify what's in this photo for an intake log.",
    parseDataUrl(dataUrl),
  );
}

export function recognizeFromText(
  supabase: SupabaseClient,
  userId: string,
  text: string,
): Promise<IntakeRecognition> {
  return recognize(supabase, userId, `Identify what I had: """${text.slice(0, 800)}"""`, null);
}
