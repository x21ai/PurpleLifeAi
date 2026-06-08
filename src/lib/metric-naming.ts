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
};

/** metric_key → canonical name. Keys are the same snake_case keys
 *  stored in report_metrics.metric_key. Add new mappings here as more
 *  reports come in. Unknown keys fall back to humanized metric_key. */
export const METRIC_CANONICAL: Record<string, CanonicalEntry> = {
  iron_saturation: { canonical: "Iron Saturation" },
  transferrin_saturation: { canonical: "Iron Saturation" },
  saturation: { canonical: "Iron Saturation" },
  pct_saturation: { canonical: "Iron Saturation" },
  psa_total: { canonical: "PSA, Total" },
  psa: { canonical: "PSA, Total" },
  testosterone_total: { canonical: "Testosterone, Total" },
  testosterone_free: { canonical: "Testosterone, Free" },
  testosterone_bioavailable: { canonical: "Testosterone, Bioavailable" },
  shbg: { canonical: "SHBG (Sex Hormone Binding Globulin)" },
  mcv: { canonical: "MCV (Mean Corpuscular Volume)" },
  mch: { canonical: "MCH (Mean Corpuscular Hemoglobin)" },
  mchc: { canonical: "MCHC (Mean Corpuscular Hemoglobin Concentration)" },
  rdw: { canonical: "RDW (Red Cell Distribution Width)" },
  mpv: { canonical: "MPV (Mean Platelet Volume)" },
  hs_crp: { canonical: "hs-CRP (High-Sensitivity C-Reactive Protein)" },
  crp: { canonical: "CRP (C-Reactive Protein)" },
  hba1c: { canonical: "HbA1c" },
  a1c: { canonical: "HbA1c" },
  alt: { canonical: "ALT (Alanine Aminotransferase)" },
  ast: { canonical: "AST (Aspartate Aminotransferase)" },
  alp: { canonical: "ALP (Alkaline Phosphatase)" },
  ggt: { canonical: "GGT (Gamma-Glutamyl Transferase)" },
  ldl: { canonical: "LDL Cholesterol" },
  ldl_cholesterol: { canonical: "LDL Cholesterol" },
  hdl: { canonical: "HDL Cholesterol" },
  hdl_cholesterol: { canonical: "HDL Cholesterol" },
  non_hdl: { canonical: "Non-HDL Cholesterol" },
  non_hdl_cholesterol: { canonical: "Non-HDL Cholesterol" },
  cholesterol_total: { canonical: "Total Cholesterol" },
  total_cholesterol: { canonical: "Total Cholesterol" },
  triglycerides: { canonical: "Triglycerides" },
  ldl_hdl_ratio: { canonical: "LDL/HDL Ratio" },
  tsh: { canonical: "TSH (Thyroid Stimulating Hormone)" },
  free_t3: { canonical: "Free T3" },
  free_t4: { canonical: "Free T4" },
  vitamin_d: { canonical: "Vitamin D, 25-Hydroxy" },
  vitamin_d_25_hydroxy: { canonical: "Vitamin D, 25-Hydroxy" },
  vitamin_b12: { canonical: "Vitamin B12" },
  folate: { canonical: "Folate" },
  cortisol_total: { canonical: "Cortisol, Total" },
  cortisol: { canonical: "Cortisol" },
  insulin: { canonical: "Insulin" },
  glucose: { canonical: "Glucose" },
  bun: { canonical: "BUN (Blood Urea Nitrogen)" },
  creatinine: { canonical: "Creatinine" },
  bun_creatinine_ratio: { canonical: "BUN/Creatinine Ratio" },
  egfr: { canonical: "eGFR" },
  sodium: { canonical: "Sodium" },
  potassium: { canonical: "Potassium" },
  chloride: { canonical: "Chloride" },
  carbon_dioxide: { canonical: "Carbon Dioxide (CO₂)" },
  calcium: { canonical: "Calcium" },
  magnesium: { canonical: "Magnesium" },
  phosphorus: { canonical: "Phosphorus" },
  albumin: { canonical: "Albumin" },
  globulin: { canonical: "Globulin" },
  albumin_globulin_ratio: { canonical: "Albumin/Globulin Ratio" },
  a_globulin_ratio: { canonical: "Albumin/Globulin Ratio" },
  protein_total: { canonical: "Total Protein" },
  bilirubin_total: { canonical: "Bilirubin, Total" },
  bilirubin_direct: { canonical: "Bilirubin, Direct" },
  bilirubin_indirect: { canonical: "Bilirubin, Indirect" },
  hemoglobin: { canonical: "Hemoglobin" },
  hematocrit: { canonical: "Hematocrit" },
  rbc: { canonical: "Red Blood Cell Count" },
  red_blood_cell_count: { canonical: "Red Blood Cell Count" },
  wbc: { canonical: "White Blood Cell Count" },
  white_blood_cell_count: { canonical: "White Blood Cell Count" },
  platelets: { canonical: "Platelet Count" },
  platelet_count: { canonical: "Platelet Count" },
  absolute_neutrophils: { canonical: "Absolute Neutrophils" },
  absolute_lymphocytes: { canonical: "Absolute Lymphocytes" },
  absolute_monocytes: { canonical: "Absolute Monocytes" },
  absolute_eosinophils: { canonical: "Absolute Eosinophils" },
  absolute_basophils: { canonical: "Absolute Basophils" },
  ferritin: { canonical: "Ferritin" },
  iron: { canonical: "Iron" },
  tibc: { canonical: "TIBC (Total Iron Binding Capacity)" },
  uibc: { canonical: "UIBC (Unsaturated Iron Binding Capacity)" },
  transferrin: { canonical: "Transferrin" },
};

/** Humanize a metric_key fallback. */
function humanizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b([a-z])/g, (_m, c) => (c as string).toUpperCase());
}

/** Normalize for comparison: lowercase, collapse non-alphanumerics. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
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
