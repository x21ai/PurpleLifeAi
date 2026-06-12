/**
 * Feature catalog, single source of truth for what trackers exist
 * and which conditions turn them on by default. Users can override
 * any default via profiles.feature_overrides.
 *
 * Resolution rule (read-time only, never written retroactively):
 *   enabled(key) =
 *     overrides[key] if defined
 *     else key is default-on globally
 *     else key.defaultFor intersects user's conditions
 */

import { hasTrait, labelForTrait, type ConditionTrait } from "./condition-catalog";

export type FeatureKey =
  | "hydration"
  | "aura"
  | "seizure_log"
  | "rescue_meds"
  | "bp_trend"
  | "glucose_trend"
  | "lipid_trend"
  | "oura_sync";

export type FeatureCategory =
  | "neuro"
  | "cardio_metabolic"
  | "hydration"
  | "sleep_recovery"
  | "reports";

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  category: FeatureCategory;
  /**
   * Condition *traits* for which this feature is on by default. Empty =
   * opt-in only. Trait-based so every catalog condition that maps to one
   * of these traits gets the default automatically, we don't have to
   * enumerate slugs.
   */
  defaultFor: ConditionTrait[];
  /** If true, defaults on for every user regardless of conditions. */
  defaultOnGlobally?: boolean;
  /** Requires an external device/integration. */
  requiresDevice?: boolean;
}

export const FEATURE_CATALOG: FeatureDef[] = [
  {
    key: "hydration",
    label: "Hydration",
    description: "Log water and electrolytes throughout the day.",
    category: "hydration",
    defaultFor: [],
    defaultOnGlobally: true,
  },
  {
    key: "aura",
    label: "Aura / déjà vu",
    description: "Capture seizure warning signs as they happen.",
    category: "neuro",
    defaultFor: ["seizure_prone"],
  },
  {
    key: "seizure_log",
    label: "Seizure log",
    description: "Log seizures with type, duration, and triggers.",
    category: "neuro",
    defaultFor: ["seizure_prone"],
  },
  {
    key: "rescue_meds",
    label: "Rescue medications",
    description: "Quick access to as-needed meds.",
    category: "neuro",
    defaultFor: ["seizure_prone", "headache", "respiratory"],
  },
  {
    key: "bp_trend",
    label: "Blood pressure trend",
    description: "Chart systolic/diastolic from your reports over time.",
    category: "cardio_metabolic",
    defaultFor: ["cardiovascular", "autonomic"],
  },
  {
    key: "glucose_trend",
    label: "Glucose & HbA1c trend",
    description: "Chart glucose, HbA1c, and time-in-range.",
    category: "cardio_metabolic",
    defaultFor: ["glycemic"],
  },
  {
    key: "lipid_trend",
    label: "Cholesterol panel trend",
    description: "Chart LDL, HDL, total, and triglycerides over time.",
    category: "cardio_metabolic",
    defaultFor: [],
  },
  {
    key: "oura_sync",
    label: "Oura ring sync",
    description: "Pull readiness, sleep, and recovery from Oura.",
    category: "sleep_recovery",
    defaultFor: [],
    requiresDevice: true,
  },
];

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  neuro: "Neurology",
  cardio_metabolic: "Cardio & metabolic",
  hydration: "Hydration",
  sleep_recovery: "Sleep & recovery",
  reports: "Reports",
};

export function isFeatureEnabled(
  key: FeatureKey,
  conditions: string[] | null | undefined,
  overrides: Record<string, boolean> | null | undefined,
): boolean {
  const ov = overrides?.[key];
  if (typeof ov === "boolean") return ov;
  const def = FEATURE_CATALOG.find((f) => f.key === key);
  if (!def) return false;
  if (def.defaultOnGlobally) return true;
  return def.defaultFor.some((t) => hasTrait(conditions, t));
}

export function defaultEnabledFor(
  conditions: string[] | null | undefined,
): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>;
  for (const def of FEATURE_CATALOG) {
    out[def.key] = isFeatureEnabled(def.key, conditions, null);
  }
  return out;
}

/**
 * Human-readable explanation of why a feature defaults on. Used by
 * Settings (`what-i-track-section`) to render "Default-on for …".
 */
export function defaultForLabels(def: FeatureDef): string {
  return def.defaultFor.map(labelForTrait).join(", ");
}
