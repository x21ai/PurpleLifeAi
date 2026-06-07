import { z } from "zod";

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

const tool = {
  type: "function" as const,
  function: {
    name: "log_medication",
    description: "Extract structured medication info from a label or prescription.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        generic_name: { type: "string" },
        dosage_amount: { type: "number" },
        dosage_unit: { type: "string" },
        dosage_form: { type: "string" },
        instructions: { type: "string" },
        times_per_day: { type: "number" },
        with_food: { type: "boolean" },
        prescriber_name: { type: "string" },
        pharmacy_name: { type: "string" },
        prescription_number: { type: "string" },
        pills_remaining: { type: "number" },
        confidence: { type: "number" },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: ["confidence"],
      additionalProperties: false,
    },
  },
};

export async function recognizeMedicationFromImage(dataUrl: string): Promise<MedRecognition> {
  return callGateway([
    {
      role: "user",
      content: [
        { type: "text", text: "Extract medication details from this label or prescription." },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ]);
}

export async function recognizeMedicationFromText(text: string): Promise<MedRecognition> {
  return callGateway([
    {
      role: "user",
      content: `Extract medication details from this voice note: """${text.slice(0, 800)}"""`,
    },
  ]);
}

async function callGateway(messages: any[]): Promise<MedRecognition> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI gateway is not configured.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM }, ...messages],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "log_medication" } },
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
  return RecogSchema.parse(JSON.parse(call.function.arguments));
}