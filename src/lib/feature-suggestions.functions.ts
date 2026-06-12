import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FEATURE_CATALOG, isFeatureEnabled, type FeatureKey } from "./feature-catalog";

/**
 * Usage-based feature suggestions.
 *
 * Looks at the user's last 30 days of journal tags + report_metrics keys and
 * proposes turning on a tracker that is currently off but clearly relevant
 * to what they are already writing about. Returns at most one suggestion
 * per call to keep the surface quiet.
 */

export type FeatureSuggestion = {
  feature: FeatureKey;
  label: string;
  description: string;
  reason: string;
};

const TAG_TO_FEATURE: Array<{
  feature: FeatureKey;
  match: RegExp;
  reason: (count: number) => string;
}> = [
  {
    feature: "hydration",
    match: /(water|hydrat|thirst|dehydrat|electrolyt)/i,
    reason: (n) => `You mentioned hydration in ${n} journal entries this month.`,
  },
  {
    feature: "aura",
    match: /(aura|déjà|deja vu|warning|prodrom)/i,
    reason: (n) => `You logged aura-like cues ${n} times recently.`,
  },
  {
    feature: "seizure_log",
    match: /(seizure|convuls|tonic|focal|absence)/i,
    reason: (n) => `Seizure-related notes came up in ${n} entries this month.`,
  },
  {
    feature: "rescue_meds",
    match: /(rescue|abortive|emergency med|prn)/i,
    reason: (n) => `Rescue-med language showed up ${n} times in your journal.`,
  },
  {
    feature: "glucose_trend",
    match: /(glucose|sugar|hba1c|a1c|insulin|hypo|hyper)/i,
    reason: (n) => `Glucose comes up often (${n} mentions in 30 days).`,
  },
  {
    feature: "bp_trend",
    match: /(blood pressure|bp|systolic|diastolic|dizzy|lighthead)/i,
    reason: (n) => `Blood-pressure cues appeared in ${n} entries this month.`,
  },
  {
    feature: "lipid_trend",
    match: /(cholesterol|ldl|hdl|triglyc|lipid)/i,
    reason: (n) => `Cholesterol shows up in ${n} recent notes or reports.`,
  },
];

const REPORT_METRIC_TO_FEATURE: Array<{ feature: FeatureKey; keys: string[] }> = [
  { feature: "glucose_trend", keys: ["hba1c", "a1c", "fasting_glucose", "glucose_fasting"] },
  { feature: "lipid_trend", keys: ["ldl", "ldl_cholesterol", "hdl", "triglycerides"] },
  { feature: "bp_trend", keys: ["systolic", "diastolic", "blood_pressure"] },
];

const DISMISS_KEY = "feature_suggestions_dismissed";

function labelFor(key: FeatureKey): { label: string; description: string } {
  const def = FEATURE_CATALOG.find((f) => f.key === key);
  return { label: def?.label ?? key, description: def?.description ?? "" };
}

export const suggestFeatures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ suggestions: FeatureSuggestion[] }> => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [{ data: profile }, { data: journal }, { data: metrics }] = await Promise.all([
      supabase
        .from("profiles")
        .select("conditions, feature_overrides, suggestions_dismissed")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("journal_entries")
        .select("text, voice_transcript, ai_tags, captured_at")
        .eq("user_id", userId)
        .gte("captured_at", since)
        .limit(500),
      supabase.from("report_metrics").select("metric_key").eq("user_id", userId).limit(500),
    ]);

    const conditions = (profile?.conditions as string[] | null) ?? [];
    const overrides = (profile?.feature_overrides as Record<string, boolean> | null) ?? {};
    const dismissed = new Set(
      (
        ((profile as unknown as { suggestions_dismissed?: string[] | null })
          ?.suggestions_dismissed ?? []) as string[]
      )
        .filter((s) => s.startsWith(`${DISMISS_KEY}:`))
        .map((s) => s.slice(DISMISS_KEY.length + 1)),
    );

    type Row = { text: string | null; voice_transcript: string | null; ai_tags: string[] | null };
    const rows = (journal ?? []) as Row[];
    const corpus = rows
      .map((r) => [r.text ?? "", r.voice_transcript ?? "", ...(r.ai_tags ?? [])].join(" "))
      .join("\n");

    const counts = new Map<FeatureKey, number>();
    for (const { feature, match } of TAG_TO_FEATURE) {
      const found = corpus.match(
        new RegExp(match.source, match.flags + (match.flags.includes("g") ? "" : "g")),
      );
      if (found && found.length >= 3) counts.set(feature, found.length);
    }

    const metricKeys = new Set(
      ((metrics ?? []) as Array<{ metric_key: string }>).map((m) => m.metric_key),
    );
    for (const { feature, keys } of REPORT_METRIC_TO_FEATURE) {
      if (keys.some((k) => metricKeys.has(k))) {
        counts.set(feature, Math.max(counts.get(feature) ?? 0, 5));
      }
    }

    const suggestions: FeatureSuggestion[] = [];
    for (const [feature, n] of counts.entries()) {
      if (dismissed.has(feature)) continue;
      if (isFeatureEnabled(feature, conditions, overrides)) continue;
      const meta = labelFor(feature);
      const rule = TAG_TO_FEATURE.find((r) => r.feature === feature);
      const reason = rule?.reason(n) ?? `Comes up often in what you log (${n} mentions).`;
      suggestions.push({ feature, ...meta, reason });
    }

    // Cap to a single, calmest surface.
    suggestions.sort((a, b) => (counts.get(b.feature) ?? 0) - (counts.get(a.feature) ?? 0));
    return { suggestions: suggestions.slice(0, 1) };
  });

const AcceptInput = z.object({ feature: z.string().min(1).max(40) });

export const acceptFeatureSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AcceptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("profiles")
      .select("feature_overrides")
      .eq("id", userId)
      .maybeSingle();
    const overrides = (row?.feature_overrides as Record<string, boolean> | null) ?? {};
    overrides[data.feature] = true;
    const { error } = await supabase
      .from("profiles")
      .update({ feature_overrides: overrides })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DismissInput = z.object({ feature: z.string().min(1).max(40) });

export const dismissFeatureSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DismissInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("profiles")
      .select("suggestions_dismissed")
      .eq("id", userId)
      .maybeSingle();
    const current = ((row as unknown as { suggestions_dismissed?: string[] | null })
      ?.suggestions_dismissed ?? []) as string[];
    const tag = `${DISMISS_KEY}:${data.feature}`;
    if (current.includes(tag)) return { ok: true };
    const next = [...current, tag];
    const { error } = await supabase
      .from("profiles")
      .update({ suggestions_dismissed: next as unknown as never })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
