/**
 * Rule-based condition suggester (no LLM).
 * Looks at report_metrics values and proposes adding common chronic
 * conditions when thresholds are crossed in ≥2 reports.
 *
 * Suggestions are never auto-written — users opt in from the UI.
 */

import type { FeatureKey } from "./feature-catalog";

export type SuggestionRule = {
  /** Stable key — also used as the value stored in profiles.conditions */
  conditionKey: string;
  /** Display label for the suggestion card */
  label: string;
  /** metric_key values in report_metrics that count toward this rule */
  metricKeys: string[];
  /** value comparator */
  compare: "gte" | "lte";
  threshold: number;
  /** Plain-English reason shown to the user */
  reasonTemplate: (sample: { value: number; unit: string | null; date: string | null }) => string;
  /** Feature keys to suggest enabling when the user accepts */
  enableFeatures: FeatureKey[];
};

export const SUGGESTION_RULES: SuggestionRule[] = [
  {
    conditionKey: "diabetes",
    label: "Diabetes",
    metricKeys: ["hba1c", "a1c"],
    compare: "gte",
    threshold: 6.5,
    reasonTemplate: (s) =>
      `HbA1c of ${s.value}${s.unit ? " " + s.unit : "%"} is at or above the 6.5% diabetes threshold.`,
    enableFeatures: ["glucose_trend"],
  },
  {
    conditionKey: "diabetes",
    label: "Diabetes",
    metricKeys: ["fasting_glucose", "glucose_fasting"],
    compare: "gte",
    threshold: 126,
    reasonTemplate: (s) =>
      `Fasting glucose of ${s.value}${s.unit ? " " + s.unit : " mg/dL"} is at or above 126 mg/dL.`,
    enableFeatures: ["glucose_trend"],
  },
  {
    conditionKey: "high_cholesterol",
    label: "High cholesterol",
    metricKeys: ["ldl", "ldl_cholesterol"],
    compare: "gte",
    threshold: 160,
    reasonTemplate: (s) =>
      `LDL of ${s.value}${s.unit ? " " + s.unit : " mg/dL"} is in the high range (≥160).`,
    enableFeatures: ["lipid_trend"],
  },
];

export type Suggestion = {
  conditionKey: string;
  label: string;
  reason: string;
  enableFeatures: FeatureKey[];
};

type MetricRow = {
  metric_key: string;
  value: number | null;
  unit: string | null;
  measured_at: string | null;
  created_at: string;
};

/**
 * Pure: applies rules to a flat metric list and returns deduped suggestions
 * for conditions the user doesn't already have (active or archived) and
 * hasn't dismissed.
 */
export function computeSuggestions(
  metrics: MetricRow[],
  knownConditions: string[],
  dismissed: string[],
): Suggestion[] {
  const known = new Set(knownConditions);
  const skip = new Set(dismissed);
  const out = new Map<string, Suggestion>();

  for (const rule of SUGGESTION_RULES) {
    if (known.has(rule.conditionKey) || skip.has(rule.conditionKey)) continue;
    if (out.has(rule.conditionKey)) continue;

    const hits = metrics.filter(
      (m) =>
        rule.metricKeys.includes(m.metric_key) &&
        m.value != null &&
        (rule.compare === "gte" ? m.value >= rule.threshold : m.value <= rule.threshold),
    );
    if (hits.length < 2) continue;

    const newest = hits.sort((a, b) =>
      (b.measured_at ?? b.created_at).localeCompare(a.measured_at ?? a.created_at),
    )[0];

    out.set(rule.conditionKey, {
      conditionKey: rule.conditionKey,
      label: rule.label,
      reason: rule.reasonTemplate({
        value: newest.value!,
        unit: newest.unit,
        date: newest.measured_at,
      }),
      enableFeatures: rule.enableFeatures,
    });
  }

  return Array.from(out.values());
}