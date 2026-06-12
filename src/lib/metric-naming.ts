/**
 * Canonical display names for lab/biomarker metrics.
 *
 * Rule (project memory): every chart/card shows the canonical human name as
 * the primary label. The PDF's exact wording is preserved underneath as
 * "as printed: …", UNLESS the PDF wording already means the same as the
 * canonical name (case-insensitive match after normalization), in which case
 * the "as printed" line is hidden to avoid duplication.
 */

export type CanonicalEntry = {
  /** Human-friendly name shown as the primary label. */
  canonical: string;
  /** Optional short suffix shown after the name (e.g. unit context). */
  hint?: string;
  /** Body-system category used to group metrics on the Trends page. */
  category?: MetricCategory;
};

export type MetricCategory =
  | "Lipids"
  | "CBC"
  | "Metabolic"
  | "Kidney"
  | "Liver"
  | "Thyroid"
  | "Iron"
  | "Vitamins"
  | "Hormones"
  | "Inflammation"
  | "Electrolytes"
  | "Other";

/** Ordered for display on the Trends page. "Other" is always last. */
export const METRIC_CATEGORY_ORDER: MetricCategory[] = [
  "Lipids",
  "Metabolic",
  "CBC",
  "Iron",
  "Liver",
  "Kidney",
  "Thyroid",
  "Hormones",
  "Inflammation",
  "Vitamins",
  "Electrolytes",
  "Other",
];

/** metric_key → canonical name. Keys are the same snake_case keys
 *  stored in report_metrics.metric_key. Add new mappings here as more
 *  reports come in. Unknown keys fall back to humanized metric_key. */
export const METRIC_CANONICAL: Record<string, CanonicalEntry> = {
  // Iron panel
  iron_saturation: { canonical: "Iron Saturation", category: "Iron" },
  transferrin_saturation: { canonical: "Iron Saturation", category: "Iron" },
  saturation: { canonical: "Iron Saturation", category: "Iron" },
  pct_saturation: { canonical: "Iron Saturation", category: "Iron" },
  ferritin: { canonical: "Ferritin", category: "Iron" },
  iron: { canonical: "Iron", category: "Iron" },
  tibc: { canonical: "TIBC (Total Iron Binding Capacity)", category: "Iron" },
  uibc: { canonical: "UIBC (Unsaturated Iron Binding Capacity)", category: "Iron" },
  transferrin: { canonical: "Transferrin", category: "Iron" },

  // Hormones
  psa_total: { canonical: "PSA, Total", category: "Hormones" },
  psa: { canonical: "PSA, Total", category: "Hormones" },
  testosterone_total: { canonical: "Testosterone, Total", category: "Hormones" },
  testosterone_free: { canonical: "Testosterone, Free", category: "Hormones" },
  testosterone_bioavailable: { canonical: "Testosterone, Bioavailable", category: "Hormones" },
  shbg: { canonical: "SHBG (Sex Hormone Binding Globulin)", category: "Hormones" },
  cortisol_total: { canonical: "Cortisol, Total", category: "Hormones" },
  cortisol: { canonical: "Cortisol", category: "Hormones" },
  insulin: { canonical: "Insulin", category: "Hormones" },

  // CBC
  mcv: { canonical: "MCV (Mean Corpuscular Volume)", category: "CBC" },
  mch: { canonical: "MCH (Mean Corpuscular Hemoglobin)", category: "CBC" },
  mchc: { canonical: "MCHC (Mean Corpuscular Hemoglobin Concentration)", category: "CBC" },
  rdw: { canonical: "RDW (Red Cell Distribution Width)", category: "CBC" },
  mpv: { canonical: "MPV (Mean Platelet Volume)", category: "CBC" },
  hemoglobin: { canonical: "Hemoglobin", category: "CBC" },
  hematocrit: { canonical: "Hematocrit", category: "CBC" },
  rbc: { canonical: "Red Blood Cell Count", category: "CBC" },
  red_blood_cell_count: { canonical: "Red Blood Cell Count", category: "CBC" },
  wbc: { canonical: "White Blood Cell Count", category: "CBC" },
  white_blood_cell_count: { canonical: "White Blood Cell Count", category: "CBC" },
  platelets: { canonical: "Platelet Count", category: "CBC" },
  platelet_count: { canonical: "Platelet Count", category: "CBC" },
  absolute_neutrophils: { canonical: "Absolute Neutrophils", category: "CBC" },
  absolute_lymphocytes: { canonical: "Absolute Lymphocytes", category: "CBC" },
  absolute_monocytes: { canonical: "Absolute Monocytes", category: "CBC" },
  absolute_eosinophils: { canonical: "Absolute Eosinophils", category: "CBC" },
  absolute_basophils: { canonical: "Absolute Basophils", category: "CBC" },

  // Inflammation
  hs_crp: { canonical: "hs-CRP (High-Sensitivity C-Reactive Protein)", category: "Inflammation" },
  crp: { canonical: "CRP (C-Reactive Protein)", category: "Inflammation" },

  // Metabolic
  hba1c: { canonical: "HbA1c", category: "Metabolic" },
  a1c: { canonical: "HbA1c", category: "Metabolic" },
  glucose: { canonical: "Glucose", category: "Metabolic" },

  // Liver
  alt: { canonical: "ALT (Alanine Aminotransferase)", category: "Liver" },
  ast: { canonical: "AST (Aspartate Aminotransferase)", category: "Liver" },
  alp: { canonical: "ALP (Alkaline Phosphatase)", category: "Liver" },
  ggt: { canonical: "GGT (Gamma-Glutamyl Transferase)", category: "Liver" },
  albumin: { canonical: "Albumin", category: "Liver" },
  globulin: { canonical: "Globulin", category: "Liver" },
  albumin_globulin_ratio: { canonical: "Albumin/Globulin Ratio", category: "Liver" },
  a_globulin_ratio: { canonical: "Albumin/Globulin Ratio", category: "Liver" },
  protein_total: { canonical: "Total Protein", category: "Liver" },
  bilirubin_total: { canonical: "Bilirubin, Total", category: "Liver" },
  bilirubin_direct: { canonical: "Bilirubin, Direct", category: "Liver" },
  bilirubin_indirect: { canonical: "Bilirubin, Indirect", category: "Liver" },

  // Lipids
  ldl: { canonical: "LDL Cholesterol", category: "Lipids" },
  ldl_cholesterol: { canonical: "LDL Cholesterol", category: "Lipids" },
  hdl: { canonical: "HDL Cholesterol", category: "Lipids" },
  hdl_cholesterol: { canonical: "HDL Cholesterol", category: "Lipids" },
  non_hdl: { canonical: "Non-HDL Cholesterol", category: "Lipids" },
  non_hdl_cholesterol: { canonical: "Non-HDL Cholesterol", category: "Lipids" },
  cholesterol_total: { canonical: "Total Cholesterol", category: "Lipids" },
  total_cholesterol: { canonical: "Total Cholesterol", category: "Lipids" },
  triglycerides: { canonical: "Triglycerides", category: "Lipids" },
  ldl_hdl_ratio: { canonical: "LDL/HDL Ratio", category: "Lipids" },

  // Thyroid
  tsh: { canonical: "TSH (Thyroid Stimulating Hormone)", category: "Thyroid" },
  free_t3: { canonical: "Free T3", category: "Thyroid" },
  free_t4: { canonical: "Free T4", category: "Thyroid" },

  // Vitamins
  vitamin_d: { canonical: "Vitamin D, 25-Hydroxy", category: "Vitamins" },
  vitamin_d_25_hydroxy: { canonical: "Vitamin D, 25-Hydroxy", category: "Vitamins" },
  vitamin_b12: { canonical: "Vitamin B12", category: "Vitamins" },
  folate: { canonical: "Folate", category: "Vitamins" },

  // Kidney
  bun: { canonical: "BUN (Blood Urea Nitrogen)", category: "Kidney" },
  creatinine: { canonical: "Creatinine", category: "Kidney" },
  bun_creatinine_ratio: { canonical: "BUN/Creatinine Ratio", category: "Kidney" },
  egfr: { canonical: "eGFR", category: "Kidney" },

  // Electrolytes
  sodium: { canonical: "Sodium", category: "Electrolytes" },
  potassium: { canonical: "Potassium", category: "Electrolytes" },
  chloride: { canonical: "Chloride", category: "Electrolytes" },
  carbon_dioxide: { canonical: "Carbon Dioxide (CO₂)", category: "Electrolytes" },
  calcium: { canonical: "Calcium", category: "Electrolytes" },
  magnesium: { canonical: "Magnesium", category: "Electrolytes" },
  phosphorus: { canonical: "Phosphorus", category: "Electrolytes" },
};

/** Resolve a metric_key to its category, falling back to "Other". */
export function getMetricCategory(metricKey: string): MetricCategory {
  const key = (metricKey ?? "").toLowerCase();
  const cat = METRIC_CANONICAL[key]?.category;
  if (cat) return cat;
  // Loose heuristics for unknown keys so user reports still group sensibly.
  if (/cholesterol|triglycer|lipid|hdl|ldl/.test(key)) return "Lipids";
  if (/glucose|insulin|hba1c|a1c/.test(key)) return "Metabolic";
  if (/lymph|neutro|mono|baso|eosino|hemoglo|hematocrit|wbc|rbc|platelet|mcv|mch|rdw|mpv/.test(key))
    return "CBC";
  if (/iron|ferritin|transferrin|tibc|uibc/.test(key)) return "Iron";
  if (/alt|ast|alp|ggt|bilirubin|albumin|globulin|protein/.test(key)) return "Liver";
  if (/bun|creatinine|egfr|urea/.test(key)) return "Kidney";
  if (/tsh|t3|t4|thyroid/.test(key)) return "Thyroid";
  if (/cortisol|testosterone|shbg|estradiol|progesterone|psa|prolactin|fsh|lh\b/.test(key))
    return "Hormones";
  if (/crp|esr|sed_rate|ferritin/.test(key)) return "Inflammation";
  if (/vitamin|folate|b12|d_25/.test(key)) return "Vitamins";
  if (/sodium|potassium|chloride|calcium|magnesium|phosph|co2|carbon/.test(key))
    return "Electrolytes";
  return "Other";
}

/** Humanize a metric_key fallback. */
function humanizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (_m, c) => (c as string).toUpperCase());
}

/** Normalize for comparison: lowercase, collapse non-alphanumerics. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Resolve the canonical label for a metric.
 *
 * - `primary` is what we render large.
 * - `asPrinted` is what the PDF actually said. Returned as `null` when the
 *   PDF wording already matches the canonical (so the UI hides it).
 */
export function resolveMetricLabel(
  metricKey: string,
  pdfWording: string | null | undefined,
): { primary: string; asPrinted: string | null } {
  const key = metricKey.toLowerCase();
  const mapped = METRIC_CANONICAL[key]?.canonical;
  const primary = mapped ?? humanizeKey(metricKey);
  const raw = (pdfWording ?? "").trim();
  if (!raw) return { primary, asPrinted: null };
  // Hide "as printed" when PDF wording means the same as canonical.
  if (normalize(raw) === normalize(primary)) return { primary, asPrinted: null };
  // Hide "as printed" when wording is pure symbol/percentage/very short: it
  // would add noise rather than provenance.
  if (raw.length < 2) return { primary, asPrinted: null };
  return { primary, asPrinted: raw };
}
