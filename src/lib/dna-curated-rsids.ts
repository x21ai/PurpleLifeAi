/**
 * Curated allow-list of RSIDs Purple looks at. Kept intentionally small
 * (~50) and tied to traits we already model elsewhere. Whole-genome
 * ingestion is out of scope.
 *
 * Each entry has plain-language framing so the UI never speaks in
 * clinical jargon. `sensitive: true` gates the row behind an extra
 * "Show sensitive results" toggle (defaults off).
 */

export interface CuratedRsid {
  rsid: string;
  gene: string;
  trait: string;
  conditionSlugs?: string[];
  plainLanguage: string;
  /** How to read the genotype, in plain language. Map by genotype string. */
  genotypeNotes: Record<string, string>;
  sensitive?: boolean;
  evidenceRef?: string;
}

export const CURATED_RSIDS: readonly CuratedRsid[] = [
  // APOE, gated, sensitive
  {
    rsid: "rs429358",
    gene: "APOE",
    trait: "Long-term brain & heart load",
    plainLanguage:
      "Two spots in the APOE gene together describe the ε2 / ε3 / ε4 pattern. Sleep, movement, and blood-pressure habits tend to matter more for people with an ε4 copy.",
    genotypeNotes: {
      TT: "ε3 / ε3 pattern at this spot (most common).",
      CT: "One ε4 copy at this spot.",
      TC: "One ε4 copy at this spot.",
      CC: "Two ε4 copies at this spot.",
    },
    sensitive: true,
    evidenceRef: "Liu et al., Nat Rev Neurol 2013",
  },
  {
    rsid: "rs7412",
    gene: "APOE",
    trait: "Long-term brain & heart load",
    plainLanguage:
      "Pairs with rs429358 to read the APOE ε pattern. We never show a risk score, just a calm note.",
    genotypeNotes: {
      CC: "No ε2 copy at this spot.",
      CT: "One ε2 copy at this spot.",
      TC: "One ε2 copy at this spot.",
      TT: "Two ε2 copies at this spot.",
    },
    sensitive: true,
  },
  // MTHFR
  {
    rsid: "rs1801133",
    gene: "MTHFR",
    trait: "B-vitamin processing",
    plainLanguage:
      "Affects how your body handles folate and B12. Mostly a nutrition note, a varied diet covers it.",
    genotypeNotes: {
      GG: "Typical pattern.",
      AG: "One variant copy, slightly slower processing.",
      GA: "One variant copy, slightly slower processing.",
      AA: "Two variant copies, slower processing; food-form folate often suits people best.",
    },
  },
  {
    rsid: "rs1801131",
    gene: "MTHFR",
    trait: "B-vitamin processing",
    plainLanguage: "A second MTHFR spot. Same theme: gentle nutrition note, not a diagnosis.",
    genotypeNotes: {
      TT: "Typical pattern.",
      GT: "One variant copy.",
      TG: "One variant copy.",
      GG: "Two variant copies.",
    },
  },
  // HLA-B27, autoimmune
  {
    rsid: "rs4349859",
    gene: "HLA-B",
    trait: "Autoimmune sensitivity",
    conditionSlugs: ["ankylosing-spondylitis", "psoriatic-arthritis"],
    plainLanguage:
      "A common proxy for HLA-B27. Worth mentioning to a rheumatologist if you have unexplained joint or back inflammation.",
    genotypeNotes: {
      GG: "Typical pattern.",
      AG: "Carrier signal worth noting to a clinician.",
      GA: "Carrier signal worth noting to a clinician.",
      AA: "Stronger signal worth noting to a clinician.",
    },
  },
  // Factor V Leiden, clotting
  {
    rsid: "rs6025",
    gene: "F5",
    trait: "Clotting tendency",
    plainLanguage:
      "Factor V Leiden. Worth knowing before long flights or hormonal medications, mention it to your doctor.",
    genotypeNotes: {
      CC: "Typical pattern.",
      CT: "One Leiden copy, mention to your doctor.",
      TC: "One Leiden copy, mention to your doctor.",
      TT: "Two Leiden copies, please discuss with your doctor.",
    },
    sensitive: true,
  },
  // Prothrombin
  {
    rsid: "rs1799963",
    gene: "F2",
    trait: "Clotting tendency",
    plainLanguage:
      "Prothrombin G20210A. Like F5, mostly a flag for your medical team around clotting risk.",
    genotypeNotes: {
      GG: "Typical pattern.",
      AG: "One variant copy, mention to your doctor.",
      GA: "One variant copy, mention to your doctor.",
      AA: "Two variant copies, please discuss with your doctor.",
    },
    sensitive: true,
  },
  // CYP2D6 / CYP2C19, med metabolism
  {
    rsid: "rs3892097",
    gene: "CYP2D6",
    trait: "Medication metabolism",
    plainLanguage:
      "Affects how some common medications (certain antidepressants, codeine, beta-blockers) are processed. A pharmacist can use this, we don't recommend doses.",
    genotypeNotes: {
      CC: "Typical processing.",
      CT: "Slower processing, worth mentioning at pharmacy.",
      TC: "Slower processing, worth mentioning at pharmacy.",
      TT: "Much slower processing, please mention.",
    },
  },
  {
    rsid: "rs4244285",
    gene: "CYP2C19",
    trait: "Medication metabolism",
    plainLanguage:
      "Affects how acid-reducers (e.g. omeprazole) and clopidogrel are processed. A pharmacy or clinician can use this.",
    genotypeNotes: {
      GG: "Typical processing.",
      AG: "Slower processing.",
      GA: "Slower processing.",
      AA: "Much slower processing.",
    },
  },
  // Caffeine metabolism
  {
    rsid: "rs762551",
    gene: "CYP1A2",
    trait: "Caffeine metabolism",
    plainLanguage:
      "Affects how quickly you clear caffeine. Slow metabolizers often sleep better with an earlier caffeine cut-off.",
    genotypeNotes: {
      AA: "Fast caffeine clearance.",
      AC: "Slower clearance.",
      CA: "Slower clearance.",
      CC: "Slow clearance, caffeine lingers.",
    },
  },
  // Lactose persistence
  {
    rsid: "rs4988235",
    gene: "MCM6 / LCT",
    trait: "Lactose tolerance",
    plainLanguage:
      "Affects whether your body keeps making lactase as an adult. A nutrition note, not a diagnosis.",
    genotypeNotes: {
      GG: "Likely lactose intolerant in adulthood.",
      AG: "Lactose tolerance usually persists.",
      GA: "Lactose tolerance usually persists.",
      AA: "Lactose tolerance usually persists.",
    },
  },
  // Vitamin D
  {
    rsid: "rs2282679",
    gene: "GC",
    trait: "Vitamin D handling",
    plainLanguage:
      "Affects circulating vitamin D levels. If you spend a lot of time indoors, a level check via your doctor can be useful.",
    genotypeNotes: {
      TT: "Typical levels.",
      GT: "Slightly lower levels.",
      TG: "Slightly lower levels.",
      GG: "Often lower levels, ask about a vitamin D test.",
    },
  },
  // Migraine
  {
    rsid: "rs1835740",
    gene: "MTDH",
    trait: "Migraine susceptibility",
    conditionSlugs: ["migraine"],
    plainLanguage:
      "Associated with migraine susceptibility. If you already track migraines, this is mostly context, not new information.",
    genotypeNotes: {
      CC: "Typical pattern.",
      CT: "Slightly elevated background risk.",
      TC: "Slightly elevated background risk.",
      TT: "Higher background risk.",
    },
  },
  // Sleep / chronotype
  {
    rsid: "rs1801260",
    gene: "CLOCK",
    trait: "Sleep chronotype",
    plainLanguage:
      "Linked to morning vs evening preference. Useful if your wake time feels chronically misaligned.",
    genotypeNotes: {
      AA: "Tends earlier (morning-leaning).",
      AG: "Mixed.",
      GA: "Mixed.",
      GG: "Tends later (evening-leaning).",
    },
  },
] as const;

export const CURATED_RSID_SET: ReadonlySet<string> = new Set(
  CURATED_RSIDS.map((r) => r.rsid),
);

export function getCuratedRsid(rsid: string): CuratedRsid | undefined {
  return CURATED_RSIDS.find((r) => r.rsid === rsid);
}

export type DnaProvider = "23andme" | "ancestry" | "myheritage" | "vcf" | "unknown";

export function detectProvider(headerSample: string): DnaProvider {
  const head = headerSample.toLowerCase();
  if (head.includes("23andme")) return "23andme";
  if (head.includes("ancestrydna") || head.includes("ancestry")) return "ancestry";
  if (head.includes("myheritage")) return "myheritage";
  if (head.startsWith("##fileformat=vcf") || head.includes("#chrom\tpos")) return "vcf";
  return "unknown";
}