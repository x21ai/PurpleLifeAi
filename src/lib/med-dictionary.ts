// Common medications, supplements, and rescue meds for autocomplete.
// Tuned for epilepsy first; aliases include common brand names.

import type { MedKind } from "@/components/meds/medication-form-sheet";

export type MedDictEntry = {
  label: string;
  aliases: string[];
  kind: MedKind;
  defaultForm?: string;
  defaultUnit?: string;
  commonStrengths?: string[];
};

type MedDefaults = Pick<MedDictEntry, "defaultForm" | "defaultUnit" | "commonStrengths">;

const WITH_DEFAULTS: Record<string, MedDefaults> = {
  "Levetiracetam (Keppra)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["250", "500", "750", "1000"],
  },
  "Lamotrigine (Lamictal)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100", "200"],
  },
  "Valproate (Depakote)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["125", "250", "500"],
  },
  "Carbamazepine (Tegretol)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["100", "200", "400"],
  },
  "Oxcarbazepine (Trileptal)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["150", "300", "600"],
  },
  "Clobazam (Onfi)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["5", "10", "20"],
  },
  "Lacosamide (Vimpat)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["50", "100", "150", "200"],
  },
  "Topiramate (Topamax)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100", "200"],
  },
  "Phenytoin (Dilantin)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["30", "100", "300"],
  },
  "Zonisamide (Zonegran)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100"],
  },
  "Gabapentin (Neurontin)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["100", "300", "400", "600", "800"],
  },
  "Pregabalin (Lyrica)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "75", "100", "150", "200", "300"],
  },
  "Brivaracetam (Briviact)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["10", "25", "50", "75", "100"],
  },
  "Perampanel (Fycompa)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["2", "4", "6", "8", "10", "12"],
  },
  "Sertraline (Zoloft)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100", "200"],
  },
  "Escitalopram (Lexapro)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["5", "10", "20"],
  },
  "Fluoxetine (Prozac)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["10", "20", "40"],
  },
  "Bupropion (Wellbutrin)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["75", "100", "150", "200", "300"],
  },
  "Propranolol (Inderal)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["10", "20", "40", "60", "80"],
  },
  "Atorvastatin (Lipitor)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["10", "20", "40", "80"],
  },
  "Rosuvastatin (Crestor)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["5", "10", "20", "40"],
  },
  Lisinopril: {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["2.5", "5", "10", "20", "40"],
  },
  "Losartan (Cozaar)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100"],
  },
  "Metformin (Glucophage)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["500", "850", "1000"],
  },
  "Levothyroxine (Synthroid)": {
    defaultForm: "tablet",
    defaultUnit: "mcg",
    commonStrengths: ["25", "50", "75", "88", "100", "112", "125", "150"],
  },
  "Omeprazole (Prilosec)": {
    defaultForm: "capsule",
    defaultUnit: "mg",
    commonStrengths: ["10", "20", "40"],
  },
  "Albuterol (Ventolin)": {
    defaultForm: "inhaler",
    defaultUnit: "sprays",
    commonStrengths: ["1", "2"],
  },
  "Acetaminophen (Tylenol)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["325", "500", "650"],
  },
  "Ibuprofen (Advil)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["200", "400", "600", "800"],
  },
  "Methylphenidate (Ritalin)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["5", "10", "20"],
  },
  "Quetiapine (Seroquel)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["25", "50", "100", "200", "300", "400"],
  },
  "Diazepam (Valium)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["2", "5", "10"],
  },
  "Lorazepam (Ativan)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["0.5", "1", "2"],
  },
  "Clonazepam (Klonopin)": {
    defaultForm: "tablet",
    defaultUnit: "mg",
    commonStrengths: ["0.25", "0.5", "1", "2"],
  },
  Magnesium: { defaultForm: "capsule", defaultUnit: "mg", commonStrengths: ["200", "250", "400"] },
  Melatonin: { defaultForm: "tablet", defaultUnit: "mg", commonStrengths: ["1", "3", "5", "10"] },
  "Vitamin D3": {
    defaultForm: "capsule",
    defaultUnit: "IU",
    commonStrengths: ["1000", "2000", "5000"],
  },
  "Vitamin B12": {
    defaultForm: "tablet",
    defaultUnit: "mcg",
    commonStrengths: ["500", "1000", "2500", "5000"],
  },
};

function withDefaults(entry: MedDictEntry): MedDictEntry {
  const d = WITH_DEFAULTS[entry.label];
  return d ? { ...entry, ...d } : entry;
}

const RAW_DICTIONARY: MedDictEntry[] = [
  { label: "Levetiracetam (Keppra)", aliases: ["levetiracetam", "keppra"], kind: "medication" },
  {
    label: "Levetiracetam Extended Release (Keppra XR)",
    aliases: [
      "keppra xr",
      "keppra extended release",
      "keppra er",
      "levetiracetam xr",
      "levetiracetam er",
      "levetiracetam extended",
    ],
    kind: "medication",
  },
  { label: "Lamotrigine (Lamictal)", aliases: ["lamotrigine", "lamictal"], kind: "medication" },
  {
    label: "Lamotrigine Extended Release (Lamictal XR)",
    aliases: ["lamictal xr", "lamotrigine xr", "lamotrigine er", "lamictal extended"],
    kind: "medication",
  },
  {
    label: "Valproate (Depakote)",
    aliases: ["valproate", "valproic", "depakote", "depakene"],
    kind: "medication",
  },
  {
    label: "Divalproex Extended Release (Depakote ER)",
    aliases: ["depakote er", "divalproex er", "divalproex xr", "depakote extended"],
    kind: "medication",
  },
  { label: "Carbamazepine (Tegretol)", aliases: ["carbamazepine", "tegretol"], kind: "medication" },
  {
    label: "Carbamazepine Extended Release (Tegretol XR)",
    aliases: ["tegretol xr", "carbamazepine xr", "carbamazepine er", "carbatrol", "equetro"],
    kind: "medication",
  },
  {
    label: "Oxcarbazepine (Trileptal)",
    aliases: ["oxcarbazepine", "trileptal"],
    kind: "medication",
  },
  {
    label: "Oxcarbazepine Extended Release (Oxtellar XR)",
    aliases: ["oxtellar", "oxtellar xr", "oxcarbazepine xr", "oxcarbazepine er"],
    kind: "medication",
  },
  { label: "Clobazam (Onfi)", aliases: ["clobazam", "onfi"], kind: "medication" },
  { label: "Lacosamide (Vimpat)", aliases: ["lacosamide", "vimpat"], kind: "medication" },
  { label: "Topiramate (Topamax)", aliases: ["topiramate", "topamax"], kind: "medication" },
  {
    label: "Topiramate Extended Release (Trokendi XR / Qudexy XR)",
    aliases: ["trokendi", "trokendi xr", "qudexy", "qudexy xr", "topiramate xr", "topiramate er"],
    kind: "medication",
  },
  { label: "Phenytoin (Dilantin)", aliases: ["phenytoin", "dilantin"], kind: "medication" },
  { label: "Zonisamide (Zonegran)", aliases: ["zonisamide", "zonegran"], kind: "medication" },
  { label: "Gabapentin (Neurontin)", aliases: ["gabapentin", "neurontin"], kind: "medication" },
  { label: "Pregabalin (Lyrica)", aliases: ["pregabalin", "lyrica"], kind: "medication" },
  { label: "Brivaracetam (Briviact)", aliases: ["brivaracetam", "briviact"], kind: "medication" },
  {
    label: "Cannabidiol (Epidiolex)",
    aliases: ["cannabidiol", "cbd", "epidiolex"],
    kind: "medication",
  },
  { label: "Phenobarbital", aliases: ["phenobarbital", "phenobarb"], kind: "medication" },
  { label: "Primidone (Mysoline)", aliases: ["primidone", "mysoline"], kind: "medication" },
  { label: "Ethosuximide (Zarontin)", aliases: ["ethosuximide", "zarontin"], kind: "medication" },
  { label: "Felbamate (Felbatol)", aliases: ["felbamate", "felbatol"], kind: "medication" },
  { label: "Tiagabine (Gabitril)", aliases: ["tiagabine", "gabitril"], kind: "medication" },
  { label: "Vigabatrin (Sabril)", aliases: ["vigabatrin", "sabril"], kind: "medication" },
  { label: "Perampanel (Fycompa)", aliases: ["perampanel", "fycompa"], kind: "medication" },
  { label: "Rufinamide (Banzel)", aliases: ["rufinamide", "banzel"], kind: "medication" },
  { label: "Eslicarbazepine (Aptiom)", aliases: ["eslicarbazepine", "aptiom"], kind: "medication" },
  { label: "Cenobamate (Xcopri)", aliases: ["cenobamate", "xcopri"], kind: "medication" },
  { label: "Stiripentol (Diacomit)", aliases: ["stiripentol", "diacomit"], kind: "medication" },
  { label: "Fenfluramine (Fintepla)", aliases: ["fenfluramine", "fintepla"], kind: "medication" },
  { label: "Sertraline (Zoloft)", aliases: ["sertraline", "zoloft"], kind: "medication" },
  { label: "Escitalopram (Lexapro)", aliases: ["escitalopram", "lexapro"], kind: "medication" },
  { label: "Fluoxetine (Prozac)", aliases: ["fluoxetine", "prozac"], kind: "medication" },
  { label: "Citalopram (Celexa)", aliases: ["citalopram", "celexa"], kind: "medication" },
  { label: "Bupropion (Wellbutrin)", aliases: ["bupropion", "wellbutrin"], kind: "medication" },
  { label: "Venlafaxine (Effexor)", aliases: ["venlafaxine", "effexor"], kind: "medication" },
  { label: "Duloxetine (Cymbalta)", aliases: ["duloxetine", "cymbalta"], kind: "medication" },
  { label: "Trazodone", aliases: ["trazodone"], kind: "medication" },
  { label: "Mirtazapine (Remeron)", aliases: ["mirtazapine", "remeron"], kind: "medication" },
  { label: "Buspirone (Buspar)", aliases: ["buspirone", "buspar"], kind: "medication" },
  { label: "Propranolol (Inderal)", aliases: ["propranolol", "inderal"], kind: "medication" },
  { label: "Metoprolol", aliases: ["metoprolol", "lopressor", "toprol"], kind: "medication" },
  { label: "Atorvastatin (Lipitor)", aliases: ["atorvastatin", "lipitor"], kind: "medication" },
  { label: "Rosuvastatin (Crestor)", aliases: ["rosuvastatin", "crestor"], kind: "medication" },
  { label: "Lisinopril", aliases: ["lisinopril"], kind: "medication" },
  { label: "Losartan (Cozaar)", aliases: ["losartan", "cozaar"], kind: "medication" },
  { label: "Metformin (Glucophage)", aliases: ["metformin", "glucophage"], kind: "medication" },
  {
    label: "Levothyroxine (Synthroid)",
    aliases: ["levothyroxine", "synthroid"],
    kind: "medication",
  },
  { label: "Omeprazole (Prilosec)", aliases: ["omeprazole", "prilosec"], kind: "medication" },
  { label: "Pantoprazole (Protonix)", aliases: ["pantoprazole", "protonix"], kind: "medication" },
  { label: "Loratadine (Claritin)", aliases: ["loratadine", "claritin"], kind: "medication" },
  { label: "Cetirizine (Zyrtec)", aliases: ["cetirizine", "zyrtec"], kind: "medication" },
  {
    label: "Albuterol (Ventolin)",
    aliases: ["albuterol", "ventolin", "salbutamol"],
    kind: "medication",
  },
  { label: "Montelukast (Singulair)", aliases: ["montelukast", "singulair"], kind: "medication" },
  {
    label: "Acetaminophen (Tylenol)",
    aliases: ["acetaminophen", "tylenol", "paracetamol"],
    kind: "medication",
  },
  { label: "Ibuprofen (Advil)", aliases: ["ibuprofen", "advil", "motrin"], kind: "medication" },
  { label: "Naproxen (Aleve)", aliases: ["naproxen", "aleve"], kind: "medication" },
  { label: "Amoxicillin", aliases: ["amoxicillin"], kind: "medication" },
  {
    label: "Azithromycin (Zithromax)",
    aliases: ["azithromycin", "zithromax", "z-pak"],
    kind: "medication",
  },
  {
    label: "Methylphenidate (Ritalin)",
    aliases: ["methylphenidate", "ritalin", "concerta"],
    kind: "medication",
  },
  {
    label: "Adderall (Amphetamine/Dextroamphetamine)",
    aliases: ["adderall", "amphetamine", "dextroamphetamine"],
    kind: "medication",
  },
  { label: "Modafinil (Provigil)", aliases: ["modafinil", "provigil"], kind: "medication" },
  { label: "Quetiapine (Seroquel)", aliases: ["quetiapine", "seroquel"], kind: "medication" },
  { label: "Aripiprazole (Abilify)", aliases: ["aripiprazole", "abilify"], kind: "medication" },
  { label: "Risperidone (Risperdal)", aliases: ["risperidone", "risperdal"], kind: "medication" },
  { label: "Magnesium", aliases: ["magnesium"], kind: "supplement" },
  { label: "Magnesium Glycinate", aliases: ["magnesium glycinate"], kind: "supplement" },
  { label: "Melatonin", aliases: ["melatonin"], kind: "supplement" },
  {
    label: "Omega-3 (Fish Oil)",
    aliases: ["omega-3", "omega 3", "fish oil", "epa", "dha"],
    kind: "supplement",
  },
  { label: "Ashwagandha", aliases: ["ashwagandha"], kind: "supplement" },
  { label: "L-theanine", aliases: ["l-theanine", "theanine"], kind: "supplement" },
  { label: "Zinc", aliases: ["zinc"], kind: "supplement" },
  { label: "Iron", aliases: ["iron", "ferrous"], kind: "supplement" },
  { label: "Folate", aliases: ["folate", "folic acid"], kind: "supplement" },
  { label: "CoQ10", aliases: ["coq10", "coenzyme q10", "ubiquinol"], kind: "supplement" },
  { label: "Curcumin (Turmeric)", aliases: ["curcumin", "turmeric"], kind: "supplement" },
  { label: "Ginkgo Biloba", aliases: ["ginkgo", "ginkgo biloba"], kind: "supplement" },
  { label: "Probiotic", aliases: ["probiotic"], kind: "supplement" },
  { label: "Creatine", aliases: ["creatine"], kind: "supplement" },
  { label: "Collagen", aliases: ["collagen"], kind: "supplement" },
  { label: "Glutamine", aliases: ["glutamine", "l-glutamine"], kind: "supplement" },
  { label: "5-HTP", aliases: ["5-htp", "5htp"], kind: "supplement" },
  { label: "GABA", aliases: ["gaba"], kind: "supplement" },
  { label: "NAC (N-Acetylcysteine)", aliases: ["nac", "n-acetylcysteine"], kind: "supplement" },
  { label: "Rhodiola", aliases: ["rhodiola"], kind: "supplement" },
  { label: "Vitamin D3", aliases: ["vitamin d", "vitamin d3", "cholecalciferol"], kind: "vitamin" },
  { label: "Vitamin B12", aliases: ["b12", "vitamin b12", "cobalamin"], kind: "vitamin" },
  { label: "B-Complex", aliases: ["b-complex", "b complex", "vitamin b"], kind: "vitamin" },
  { label: "Vitamin C", aliases: ["vitamin c", "ascorbic acid"], kind: "vitamin" },
  { label: "Vitamin E", aliases: ["vitamin e", "tocopherol"], kind: "vitamin" },
  { label: "Vitamin K2", aliases: ["vitamin k", "vitamin k2", "menaquinone"], kind: "vitamin" },
  { label: "Vitamin A", aliases: ["vitamin a", "retinol"], kind: "vitamin" },
  { label: "Biotin", aliases: ["biotin", "vitamin b7"], kind: "vitamin" },
  { label: "Multivitamin", aliases: ["multivitamin", "multi"], kind: "vitamin" },
  { label: "Prenatal Vitamin", aliases: ["prenatal"], kind: "vitamin" },
  { label: "Chamomile", aliases: ["chamomile"], kind: "herbal" },
  { label: "Valerian Root", aliases: ["valerian"], kind: "herbal" },
  { label: "Passionflower", aliases: ["passionflower", "passion flower"], kind: "herbal" },
  { label: "Lemon Balm", aliases: ["lemon balm", "melissa"], kind: "herbal" },
  { label: "Lavender", aliases: ["lavender"], kind: "herbal" },
  { label: "Holy Basil (Tulsi)", aliases: ["holy basil", "tulsi"], kind: "herbal" },
  { label: "Reishi", aliases: ["reishi"], kind: "herbal" },
  { label: "Lion's Mane", aliases: ["lions mane", "lion's mane"], kind: "herbal" },
  { label: "Diazepam (Valium)", aliases: ["diazepam", "valium"], kind: "rescue" },
  {
    label: "Midazolam (Versed) nasal",
    aliases: ["midazolam", "versed", "nayzilam"],
    kind: "rescue",
  },
  { label: "Lorazepam (Ativan)", aliases: ["lorazepam", "ativan"], kind: "rescue" },
  { label: "Clonazepam (Klonopin)", aliases: ["clonazepam", "klonopin"], kind: "rescue" },
  { label: "Diastat (Diazepam rectal)", aliases: ["diastat", "diazepam rectal"], kind: "rescue" },
  { label: "Valtoco (Diazepam nasal)", aliases: ["valtoco", "diazepam nasal"], kind: "rescue" },
];

export const MED_DICTIONARY: MedDictEntry[] = RAW_DICTIONARY.map(withDefaults);

function matchScore(entry: MedDictEntry, q: string): number {
  const ql = q.toLowerCase();
  const label = entry.label.toLowerCase();
  if (entry.aliases.some((a) => a.toLowerCase() === ql)) return 100;
  if (label === ql) return 95;
  if (entry.aliases.some((a) => a.toLowerCase().startsWith(ql))) return 85;
  if (label.startsWith(ql)) return 80;
  if (entry.aliases.some((a) => a.toLowerCase().includes(ql))) return 60;
  if (label.includes(ql)) return 50;
  return 0;
}

export function searchMedDictionary(query: string, limit = 8): MedDictEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = MED_DICTIONARY.map((entry) => ({ entry, score: matchScore(entry, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label));
  return scored.slice(0, limit).map((x) => x.entry);
}

export function searchUserMedNames(names: string[], query: string, limit = 4): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return names.filter((n) => n.toLowerCase().includes(q)).slice(0, limit);
}
