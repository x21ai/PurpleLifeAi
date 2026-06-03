import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeSuggestions, type Suggestion } from "./condition-suggestions";

export const suggestConditions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: metrics }] = await Promise.all([
      supabase
        .from("profiles")
        .select("conditions, conditions_archived, suggestions_dismissed")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("report_metrics")
        .select("metric_key, value, unit, measured_at, created_at")
        .eq("user_id", userId)
        .not("value", "is", null)
        .limit(1000),
    ]);

    const active = (profile?.conditions as string[] | null) ?? [];
    const archived = ((profile?.conditions_archived as Array<{ id?: string }> | null) ?? [])
      .map((a) => a?.id)
      .filter((x): x is string => typeof x === "string");
    const dismissed = ((profile as unknown as { suggestions_dismissed?: string[] | null })
      ?.suggestions_dismissed ?? []) as string[];

    const suggestions: Suggestion[] = computeSuggestions(
      (metrics ?? []) as Array<{
        metric_key: string;
        value: number | null;
        unit: string | null;
        measured_at: string | null;
        created_at: string;
      }>,
      [...active, ...archived],
      dismissed,
    );

    return { suggestions };
  });

const DismissInput = z.object({ conditionKey: z.string().min(1).max(80) });

export const dismissSuggestion = createServerFn({ method: "POST" })
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
    if (current.includes(data.conditionKey)) return { ok: true };
    const next = [...current, data.conditionKey];
    await supabase
      .from("profiles")
      .update({ suggestions_dismissed: next } as never)
      .eq("id", userId);
    return { ok: true };
  });

const AcceptInput = z.object({
  conditionKey: z.string().min(1).max(80),
  enableFeatureKeys: z.array(z.string().min(1).max(80)).max(20).default([]),
});

export const acceptSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AcceptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("profiles")
      .select("conditions, feature_overrides")
      .eq("id", userId)
      .maybeSingle();
    const conditions = ((row?.conditions as string[] | null) ?? []).slice();
    if (!conditions.includes(data.conditionKey)) conditions.push(data.conditionKey);
    const overrides = {
      ...((row?.feature_overrides as Record<string, boolean> | null) ?? {}),
    };
    for (const k of data.enableFeatureKeys) overrides[k] = true;
    await supabase
      .from("profiles")
      .update({ conditions, feature_overrides: overrides })
      .eq("id", userId);
    return { ok: true };
  });