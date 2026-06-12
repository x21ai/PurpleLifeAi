import {
  FlaskConical,
  Dna,
  Brain,
  ScanLine,
  Bone,
  Activity,
  HeartPulse,
  Microscope,
  FileText,
  Folder,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the Health Records hub.
 * Used by the auto-categorizer, the insights hub tiles, and the
 * reports list filter chips + row icons.
 */
export type ReportCategorySlug =
  | "blood"
  | "dna"
  | "mri"
  | "ct"
  | "xray"
  | "ultrasound"
  | "cardiology"
  | "pathology"
  | "notes"
  | "other";

export type ReportCategoryMeta = {
  slug: ReportCategorySlug;
  label: string;
  short: string;
  icon: LucideIcon;
  /** Tailwind text/bg color tokens for the round icon chip. */
  tone: string;
  /** Filename / title keywords used by the auto-categorizer. */
  keywords: string[];
};

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    slug: "blood",
    label: "Blood work",
    short: "Blood",
    icon: FlaskConical,
    tone: "bg-rose-500/15 text-rose-400",
    keywords: [
      "blood",
      "cbc",
      "lipid",
      "panel",
      "glucose",
      "iron",
      "vitamin",
      "thyroid",
      "tsh",
      "metabolic",
      "hormone",
      "ferritin",
      "a1c",
    ],
  },
  {
    slug: "dna",
    label: "DNA / Genetics",
    short: "DNA",
    icon: Dna,
    tone: "bg-violet-500/15 text-violet-400",
    keywords: ["dna", "genome", "vcf", "23andme", "ancestry", "genotype", "snp"],
  },
  {
    slug: "mri",
    label: "MRI",
    short: "MRI",
    icon: Brain,
    tone: "bg-sky-500/15 text-sky-400",
    keywords: ["mri", "magnetic resonance"],
  },
  {
    slug: "ct",
    label: "CT Scan",
    short: "CT",
    icon: ScanLine,
    tone: "bg-cyan-500/15 text-cyan-400",
    keywords: ["ct ", "cat scan", "computed tomography"],
  },
  {
    slug: "xray",
    label: "X-Ray",
    short: "X-Ray",
    icon: Bone,
    tone: "bg-amber-500/15 text-amber-400",
    keywords: ["x-ray", "xray", "radiograph"],
  },
  {
    slug: "ultrasound",
    label: "Ultrasound",
    short: "Ultrasound",
    icon: Activity,
    tone: "bg-teal-500/15 text-teal-400",
    keywords: ["ultrasound", "sonogram"],
  },
  {
    slug: "cardiology",
    label: "Cardiology",
    short: "Heart",
    icon: HeartPulse,
    tone: "bg-pink-500/15 text-pink-400",
    keywords: ["ecg", "ekg", "echo", "holter", "cardiac", "stress test"],
  },
  {
    slug: "pathology",
    label: "Pathology",
    short: "Pathology",
    icon: Microscope,
    tone: "bg-emerald-500/15 text-emerald-400",
    keywords: ["biopsy", "pathology", "cytology", "histology"],
  },
  {
    slug: "notes",
    label: "Clinical notes",
    short: "Notes",
    icon: FileText,
    tone: "bg-indigo-500/15 text-indigo-400",
    keywords: ["prescription", "discharge", "referral", "consult", "note"],
  },
  {
    slug: "other",
    label: "Other",
    short: "Other",
    icon: Folder,
    tone: "bg-slate-500/15 text-slate-400",
    keywords: [],
  },
];

export const REPORT_CATEGORY_BY_SLUG: Record<ReportCategorySlug, ReportCategoryMeta> =
  Object.fromEntries(REPORT_CATEGORIES.map((c) => [c.slug, c])) as Record<
    ReportCategorySlug,
    ReportCategoryMeta
  >;

export function getReportCategoryMeta(slug: string | null | undefined): ReportCategoryMeta {
  if (!slug) return REPORT_CATEGORY_BY_SLUG.other;
  return REPORT_CATEGORY_BY_SLUG[slug as ReportCategorySlug] ?? REPORT_CATEGORY_BY_SLUG.other;
}

/**
 * Best-effort guess of a category from a filename, report title, and the
 * AI-derived report_type. Used at upload time (before AI extraction) and as
 * the backfill for old rows. Conservative: returns "other" when unsure.
 */
export function guessReportCategory(input: {
  title?: string | null;
  filename?: string | null;
  reportType?: string | null;
}): ReportCategorySlug {
  const t = (input.reportType ?? "").toLowerCase();
  if (t === "imaging_mri") return "mri";
  if (t === "imaging_ct") return "ct";
  if (t === "imaging_xray") return "xray";
  if (t === "imaging_ultrasound") return "ultrasound";
  if (
    t === "blood_panel" ||
    t === "lipid_panel" ||
    t === "thyroid_panel" ||
    t === "metabolic_panel" ||
    t === "vitamin_panel" ||
    t === "hormone_panel"
  )
    return "blood";

  const hay = `${input.title ?? ""} ${input.filename ?? ""}`.toLowerCase();
  for (const cat of REPORT_CATEGORIES) {
    if (cat.slug === "other") continue;
    if (cat.keywords.some((k) => hay.includes(k))) return cat.slug;
  }
  return "other";
}
