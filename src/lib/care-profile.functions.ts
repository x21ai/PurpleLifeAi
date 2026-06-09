import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  CONDITION_CATALOG,
  disclaimerTierFor,
  getCondition,
  getConditions,
  traitsForConditions,
} from "./condition-catalog";

/**
 * AI Care Profile.
 *
 * One personalized "experience layer" generated from the user's conditions +
 * note, used to colour Today, Journal, Ask Purple, and the per-condition deep
 * page. Re-generates when:
 *   - the conditions list changes (hash mismatch), or
 *   - it's older than 30 days
 *
 * Falls back to trait-derived defaults if the AI call fails — never blocks UX.
 */

const STALE_MS = 30 * 24 * 3600 * 1000;

const CareProfileSchema = z.object({
  todayGreeting: z.string().min(4).max(140),
  journalPrompts: z.array(z.string().min(4).max(160)).min(2).max(6),
  askPurpleStarters: z.array(z.string().min(4).max(140)).min(2).max(6),
  dailyTipPool: z
    .array(
      z.object({
        id: z.string().min(2).max(40),
        body: z.string().min(8).max(280),
      }),
    )
    .min(2)
    .max(8),
  watchFor: z.array(z.string().min(4).max(160)).max(8),
  toneNotes: z.string().max(280).optional().default(""),
});

export type CareProfile = z.infer<typeof CareProfileSchema>;

function hashConditions(slugs: string[]): string {
  return [...slugs].map((s) => s.trim().toLowerCase()).sort().join("|");
}

function profileSummary(slugs: string[], note: string | null): string {
  const defs = getConditions(slugs);
  if (defs.length === 0) return "No specific conditions selected; general wellness.";
  const lines = defs.map((d) => {
    const sx = d.commonSymptoms.slice(0, 4).join(", ");
    const traits = d.traits.join(", ");
    return `- ${d.label} (traits: ${traits}; common: ${sx})`;
  });
  if (note?.trim()) lines.push(`User's own note: ${note.trim().slice(0, 400)}`);
  return lines.join("\n");
}

/**
 * Quick deterministic fallback so the UI is never blank when the AI call
 * fails (rate limit, credits, transient error).
 */
function fallbackProfile(slugs: string[]): CareProfile {
  const defs = getConditions(slugs);
  const traits = [...traitsForConditions(slugs)];
  const labels = defs.map((d) => d.shortLabel).slice(0, 3).join(", ");
  const greeting = labels
    ? `How are you and your ${labels.toLowerCase()} today?`
    : "How are you, honestly, today?";
  return {
    todayGreeting: greeting,
    journalPrompts: [
      "What's loudest in your body right now?",
      "What helped today, even a little?",
      "Anything you want tomorrow-you to remember?",
    ],
    askPurpleStarters: [
      "What patterns do you see in my journal?",
      "How is sleep trending this week?",
      "Anything unusual recently?",
    ],
    dailyTipPool: [
      { id: "fb-pace", body: "Small, kind logs beat heroic ones. One sentence is enough." },
      { id: "fb-sleep", body: "A steady wake time anchors the rest of the day." },
    ],
    watchFor: defs.flatMap((d) => d.redFlags).slice(0, 6),
    toneNotes: traits.includes("sensory") || traits.includes("neurodevelopmental")
      ? "Quiet, literal, no surprises."
      : "Calm, plain language. Never preachy.",
  };
}

async function callAi(
  slugs: string[],
  note: string | null,
): Promise<CareProfile> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const tier = disclaimerTierFor(slugs);
  const system = `You are Purple, a quiet, respectful health journal companion.
You write copy for one user's personalized experience layer. Output strict JSON.

Rules:
- Plain, calm, second-person ("you"). No clinical jargon. No emojis.
- Never give medical advice or dosing. Never diagnose. Never moralize.
- Be respectful of low-energy users (chronic illness, pacing).
${tier === "sensitive" ? "- Sensitive topic mode: extra gentle. Avoid trigger phrases. Never imply blame." : ""}
- "watchFor" = short red-flag prompts to bring to a clinician — observational, not diagnostic.
- Keep each string short: greetings <120 chars, prompts <140 chars, tips <240 chars.`;

  const prompt = `User's conditions / context:\n${profileSummary(slugs, note)}\n\nGenerate the personalized care profile JSON now.`;

  const gateway = createLovableAiGatewayProvider(apiKey);
  const { experimental_output } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system,
    prompt,
    experimental_output: Output.object({ schema: CareProfileSchema }),
  });
  return experimental_output as CareProfile;
}

/* ----------------------------------------------------------------- */
/* Server functions                                                   */
/* ----------------------------------------------------------------- */

export const getCareProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "conditions, conditions_note, ai_care_profile, care_profile_generated_at, care_profile_conditions_hash",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const slugs = (data?.conditions ?? []) as string[];
    const hash = hashConditions(slugs);
    const generatedAt = data?.care_profile_generated_at
      ? Date.parse(data.care_profile_generated_at)
      : 0;
    const fresh =
      data?.ai_care_profile &&
      data.care_profile_conditions_hash === hash &&
      Date.now() - generatedAt < STALE_MS;
    return {
      profile: (data?.ai_care_profile ?? null) as CareProfile | null,
      conditions: slugs,
      hash,
      fresh: Boolean(fresh),
      generatedAt: data?.care_profile_generated_at ?? null,
    };
  });

const GenerateInput = z.object({ force: z.boolean().optional().default(false) });

export const generateCareProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .select(
        "conditions, conditions_note, ai_care_profile, care_profile_generated_at, care_profile_conditions_hash",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const slugs = (row?.conditions ?? []) as string[];
    const note = (row?.conditions_note as string | null) ?? null;
    const hash = hashConditions(slugs);
    const generatedAt = row?.care_profile_generated_at
      ? Date.parse(row.care_profile_generated_at)
      : 0;
    const fresh =
      row?.ai_care_profile &&
      row.care_profile_conditions_hash === hash &&
      Date.now() - generatedAt < STALE_MS;
    if (!data.force && fresh) {
      return {
        profile: row.ai_care_profile as CareProfile,
        cached: true as const,
      };
    }

    let profile: CareProfile;
    let usedFallback = false;
    try {
      profile = await callAi(slugs, note);
    } catch (err) {
      console.warn("[care-profile] AI generation failed, using fallback", err);
      profile = fallbackProfile(slugs);
      usedFallback = true;
    }

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        ai_care_profile: profile as never,
        care_profile_generated_at: new Date().toISOString(),
        care_profile_conditions_hash: hash,
      })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    return { profile, cached: false as const, usedFallback };
  });

/**
 * Read just the per-condition deep-page slice. Pulls catalog data + the
 * matching slice of the AI care profile (if present). Safe to call from a
 * loader — does NOT trigger an AI call.
 */
const ReadConditionInput = z.object({ slug: z.string().min(1).max(60) });

export const readConditionPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReadConditionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const def = getCondition(data.slug);
    if (!def) {
      // Unknown slug — keep API stable and let UI render a "not in catalog" state.
      return { def: null as const, hasIt: false, profile: null as CareProfile | null };
    }
    const { data: row } = await supabase
      .from("profiles")
      .select("conditions, ai_care_profile")
      .eq("id", userId)
      .maybeSingle();
    const slugs = (row?.conditions ?? []) as string[];
    return {
      def,
      hasIt: slugs.includes(def.slug),
      profile: (row?.ai_care_profile ?? null) as CareProfile | null,
    };
  });

/** Static list of catalog slugs — used by clients to validate route params. */
export const KNOWN_CONDITION_SLUGS: ReadonlySet<string> = new Set(
  CONDITION_CATALOG.map((c) => c.slug),
);