import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callAIForUser, tryParseJson } from "./ai-provider.server";

const RecogSchema = z.object({
  name: z.string().min(1).max(120).nullable().optional(),
  generic_name: z.string().max(120).nullable().optional(),
  dosage_amount: z.number().positive().max(100000).nullable().optional(),
  dosage_unit: z.string().max(20).nullable().optional(),
  dosage_form: z.string().max(40).nullable().optional(),
  instructions: z.string().max(400).nullable().optional(),
  times_per_day: z.number().int().min(1).max(8).nullable().optional(),
  with_food: z.boolean().nullable().optional(),
  prescriber_name: z.string().max(120).nullable().optional(),
  pharmacy_name: z.string().max(120).nullable().optional(),
  prescription_number: z.string().max(60).nullable().optional(),
  pills_remaining: z.number().int().nonnegative().max(10000).nullable().optional(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().max(200)).max(5).optional(),
});

export type MedRecognition = z.infer<typeof RecogSchema>;

const SYSTEM = `You read a photo of a medication label, prescription bottle, or printed prescription and extract structured data so a user can review and save it in their health journal.

Rules:
- Return JSON via the provided tool only.
- "name": the brand name printed on the label (e.g. "Keppra"). Use null if unclear.
- "generic_name": the active ingredient if shown (e.g. "Levetiracetam").
- "dosage_amount" + "dosage_unit": the strength per unit (e.g. 500 + "mg"). Don't multiply by quantity.
- "dosage_form": one of pill, capsule, tablet, liquid, injection, drops, patch, inhaler, powder, gummy.
- "instructions": the directions verbatim if short (e.g. "Take 1 tablet by mouth twice daily").
- "times_per_day": parse from the instructions if obvious (twice daily = 2). Otherwise null.
- "with_food": true only if instructions explicitly say so.
- "confidence": 0.2 unsure, 0.5 reasonable, 0.85+ clearly legible.
- "warnings": short alerts you noticed (e.g. "label partially blurred", "expiration date unreadable").
- Never fabricate a name or strength. If you can't read it, return null with low confidence.`;

function parseDataUrl(dataUrl: string): { mime: string; base64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image data URL.");
  return { mime: m[1], base64: m[2] };
}

const JSON_SHAPE = `Return ONLY a JSON object of this shape (all fields nullable except confidence):
{
  "name": "string|null",
  "generic_name": "string|null",
  "dosage_amount": number|null,
  "dosage_unit": "string|null",
  "dosage_form": "string|null",
  "instructions": "string|null",
  "times_per_day": number|null,
  "with_food": boolean|null,
  "prescriber_name": "string|null",
  "pharmacy_name": "string|null",
  "prescription_number": "string|null",
  "pills_remaining": number|null,
  "confidence": number,
  "warnings": ["string"]
}`;

async function recognize(
  supabase: SupabaseClient,
  userId: string,
  prompt: string,
  media: { mime: string; base64: string } | null,
): Promise<MedRecognition> {
  const text = await callAIForUser(supabase, userId, {
    system: `${SYSTEM}\n\n${JSON_SHAPE}`,
    prompt,
    media,
    jsonMode: true,
    maxTokens: 1500,
  });
  const parsed = tryParseJson<unknown>(text);
  if (!parsed) throw new Error("AI returned no parseable result.");
  return RecogSchema.parse(parsed);
}

export function recognizeMedicationFromImage(
  supabase: SupabaseClient,
  userId: string,
  dataUrl: string,
): Promise<MedRecognition> {
  return recognize(
    supabase,
    userId,
    "Extract medication details from this label or prescription.",
    parseDataUrl(dataUrl),
  );
}

export function recognizeMedicationFromText(
  supabase: SupabaseClient,
  userId: string,
  text: string,
): Promise<MedRecognition> {
  return recognize(
    supabase,
    userId,
    `Extract medication details from this voice note: """${text.slice(0, 800)}"""`,
    null,
  );
}