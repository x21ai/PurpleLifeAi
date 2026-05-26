// Common medications, supplements, and rescue meds for autocomplete.
// Tuned for epilepsy first; aliases include common brand names.

import type { MedKind } from "@/components/meds/medication-form-sheet";

export type MedDictEntry = {
  label: string; // canonical display name
  aliases: string[]; // case-insensitive substrings to match
  kind: MedKind;
};

export const MED_DICTIONARY: MedDictEntry[] = [
  // ===== AEDs (anti-epileptic drugs) =====
  { label: "Levetiracetam (Keppra)", aliases: ["levetiracetam", "keppra"], kind: "medication" },
  { label: "Levetiracetam Extended Release (Keppra XR)", aliases: ["keppra xr", "keppra extended release", "keppra er", "levetiracetam xr", "levetiracetam er", "levetiracetam extended"], kind: "medication" },
  { label: "Lamotrigine (Lamictal)", aliases: ["lamotrigine", "lamictal"], kind: "medication" },
  { label: "Lamotrigine Extended Release (Lamictal XR)", aliases: ["lamictal xr", "lamotrigine xr", "lamotrigine er", "lamictal extended"], kind: "medication" },
  { label: "Valproate (Depakote)", aliases: ["valproate", "valproic", "depakote", "depakene"], kind: "medication" },
  { label: "Divalproex Extended Release (Depakote ER)", aliases: ["depakote er", "divalproex er", "divalproex xr", "depakote extended"], kind: "medication" },
  { label: "Carbamazepine (Tegretol)", aliases: ["carbamazepine", "tegretol"], kind: "medication" },
  { label: "Carbamazepine Extended Release (Tegretol XR)", aliases: ["tegretol xr", "carbamazepine xr", "carbamazepine er", "carbatrol", "equetro"], kind: "medication" },
  { label: "Oxcarbazepine (Trileptal)", aliases: ["oxcarbazepine", "trileptal"], kind: "medication" },
  { label: "Oxcarbazepine Extended Release (Oxtellar XR)", aliases: ["oxtellar", "oxtellar xr", "oxcarbazepine xr", "oxcarbazepine er"], kind: "medication" },
  { label: "Clobazam (Onfi)", aliases: ["clobazam", "onfi"], kind: "medication" },
  { label: "Lacosamide (Vimpat)", aliases: ["lacosamide", "vimpat"], kind: "medication" },
  { label: "Topiramate (Topamax)", aliases: ["topiramate", "topamax"], kind: "medication" },
  { label: "Topiramate Extended Release (Trokendi XR / Qudexy XR)", aliases: ["trokendi", "trokendi xr", "qudexy", "qudexy xr", "topiramate xr", "topiramate er"], kind: "medication" },
  { label: "Phenytoin (Dilantin)", aliases: ["phenytoin", "dilantin"], kind: "medication" },
  { label: "Zonisamide (Zonegran)", aliases: ["zonisamide", "zonegran"], kind: "medication" },
  { label: "Gabapentin (Neurontin)", aliases: ["gabapentin", "neurontin"], kind: "medication" },
  { label: "Pregabalin (Lyrica)", aliases: ["pregabalin", "lyrica"], kind: "medication" },
  { label: "Brivaracetam (Briviact)", aliases: ["brivaracetam", "briviact"], kind: "medication" },
  { label: "Cannabidiol (Epidiolex)", aliases: ["cannabidiol", "cbd", "epidiolex"], kind: "medication" },
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

  // ===== Common non-AED medications =====
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
  { label: "Levothyroxine (Synthroid)", aliases: ["levothyroxine", "synthroid"], kind: "medication" },
  { label: "Omeprazole (Prilosec)", aliases: ["omeprazole", "prilosec"], kind: "medication" },
  { label: "Pantoprazole (Protonix)", aliases: ["pantoprazole", "protonix"], kind: "medication" },
  { label: "Loratadine (Claritin)", aliases: ["loratadine", "claritin"], kind: "medication" },
  { label: "Cetirizine (Zyrtec)", aliases: ["cetirizine", "zyrtec"], kind: "medication" },
  { label: "Albuterol (Ventolin)", aliases: ["albuterol", "ventolin", "salbutamol"], kind: "medication" },
  { label: "Montelukast (Singulair)", aliases: ["montelukast", "singulair"], kind: "medication" },
  { label: "Acetaminophen (Tylenol)", aliases: ["acetaminophen", "tylenol", "paracetamol"], kind: "medication" },
  { label: "Ibuprofen (Advil)", aliases: ["ibuprofen", "advil", "motrin"], kind: "medication" },
  { label: "Naproxen (Aleve)", aliases: ["naproxen", "aleve"], kind: "medication" },
  { label: "Amoxicillin", aliases: ["amoxicillin"], kind: "medication" },
  { label: "Azithromycin (Zithromax)", aliases: ["azithromycin", "zithromax", "z-pak"], kind: "medication" },
  { label: "Methylphenidate (Ritalin)", aliases: ["methylphenidate", "ritalin", "concerta"], kind: "medication" },
  { label: "Adderall (Amphetamine/Dextroamphetamine)", aliases: ["adderall", "amphetamine", "dextroamphetamine"], kind: "medication" },
  { label: "Modafinil (Provigil)", aliases: ["modafinil", "provigil"], kind: "medication" },
  { label: "Quetiapine (Seroquel)", aliases: ["quetiapine", "seroquel"], kind: "medication" },
  { label: "Aripiprazole (Abilify)", aliases: ["aripiprazole", "abilify"], kind: "medication" },
  { label: "Risperidone (Risperdal)", aliases: ["risperidone", "risperdal"], kind: "medication" },

  // ===== Supplements =====
  { label: "Magnesium", aliases: ["magnesium"], kind: "supplement" },
  { label: "Magnesium Glycinate", aliases: ["magnesium glycinate"], kind: "supplement" },
  { label: "Melatonin", aliases: ["melatonin"], kind: "supplement" },
  { label: "Omega-3 (Fish Oil)", aliases: ["omega-3", "omega 3", "fish oil", "epa", "dha"], kind: "supplement" },
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

  // ===== Vitamins =====
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

  // ===== Herbal =====
  { label: "Chamomile", aliases: ["chamomile"], kind: "herbal" },
  { label: "Valerian Root", aliases: ["valerian"], kind: "herbal" },
  { label: "Passionflower", aliases: ["passionflower", "passion flower"], kind: "herbal" },
  { label: "Lemon Balm", aliases: ["lemon balm", "melissa"], kind: "herbal" },
  { label: "Lavender", aliases: ["lavender"], kind: "herbal" },
  { label: "Holy Basil (Tulsi)", aliases: ["holy basil", "tulsi"], kind: "herbal" },
  { label: "Reishi", aliases: ["reishi"], kind: "herbal" },
  { label: "Lion's Mane", aliases: ["lions mane", "lion's mane"], kind: "herbal" },

  // ===== Rescue meds =====
  { label: "Diazepam (Valium)", aliases: ["diazepam", "valium"], kind: "rescue" },
  { label: "Midazolam (Versed) nasal", aliases: ["midazolam", "versed", "nayzilam"], kind: "rescue" },
  { label: "Lorazepam (Ativan)", aliases: ["lorazepam", "ativan"], kind: "rescue" },
  { label: "Clonazepam (Klonopin)", aliases: ["clonazepam", "klonopin"], kind: "rescue" },
  { label: "Diastat (Diazepam rectal)", aliases: ["diastat", "diazepam rectal"], kind: "rescue" },
  { label: "Valtoco (Diazepam nasal)", aliases: ["valtoco", "diazepam nasal"], kind: "rescue" },
];

export function searchMedDictionary(query: string, limit = 8): MedDictEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: MedDictEntry[] = [];
  for (const entry of MED_DICTIONARY) {
    if (
      entry.label.toLowerCase().includes(q) ||
      entry.aliases.some((a) => a.toLowerCase().includes(q))
    ) {
      out.push(entry);
      if (out.length >= limit) break;
    }
  }
  return out;
}