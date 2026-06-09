/**
 * Static client-side mirror of the `condition_catalog` table.
 *
 * Why duplicate the DB seed here?
 *   - The onboarding picker, settings, and Today greeting need the list
 *     synchronously, with no network roundtrip.
 *   - This file is the source of truth for the *experience* (labels,
 *     synonyms, traits, red flags). The DB row is the source of truth for
 *     anything that needs to be joinable from server code.
 *   - Keep this list in lockstep with the seed migration. Adding a new
 *     condition = add a row here AND a row in a migration.
 */

export type ConditionCategory =
  | "neuro"
  | "neurodevelopmental"
  | "mental_health"
  | "cardio_metabolic"
  | "autoimmune"
  | "respiratory"
  | "pain_fatigue"
  | "gi"
  | "oncology"
  | "caregiver"
  | "general";

export type ConditionTrait =
  | "seizure_prone"
  | "headache"
  | "glycemic"
  | "cardiovascular"
  | "autonomic"
  | "inflammatory"
  | "respiratory"
  | "mood"
  | "cognitive_load"
  | "neurodevelopmental"
  | "neuro"
  | "motor"
  | "pacing_required"
  | "gi"
  | "pain"
  | "sleep_critical"
  | "sensory"
  | "routine_sensitive"
  | "nutritional"
  | "autoimmune"
  | "caregiver"
  | "caregiver_helpful";

export type DisclaimerTier = "general" | "sensitive";

export interface ConditionDef {
  slug: string;
  label: string;
  shortLabel: string;
  aka: string[];
  category: ConditionCategory;
  traits: ConditionTrait[];
  commonSymptoms: string[];
  commonMeds: string[];
  keyMetrics: string[];
  monitoringCadence: "daily" | "weekly" | "asneeded";
  redFlags: string[];
  disclaimerTier: DisclaimerTier;
  sortOrder: number;
}

export const CONDITION_CATALOG: ConditionDef[] = [
  // Neurology
  { slug: "epilepsy", label: "Epilepsy / seizures", shortLabel: "Epilepsy", aka: ["seizures", "convulsions"], category: "neuro", traits: ["seizure_prone", "neuro", "sleep_critical"], commonSymptoms: ["aura", "seizure", "postictal fatigue", "memory gaps"], commonMeds: ["levetiracetam", "lamotrigine", "valproate", "clobazam"], keyMetrics: ["seizure_count", "aura_count", "sleep_hours", "med_adherence"], monitoringCadence: "daily", redFlags: ["status epilepticus", "seizure longer than 5 minutes", "injury during seizure", "first ever seizure"], disclaimerTier: "general", sortOrder: 10 },
  { slug: "migraine", label: "Migraine", shortLabel: "Migraine", aka: ["headache"], category: "neuro", traits: ["headache", "sensory", "autonomic"], commonSymptoms: ["head pain", "aura", "nausea", "photophobia"], commonMeds: ["sumatriptan", "rizatriptan", "propranolol", "topiramate"], keyMetrics: ["attack_count", "attack_duration", "abortive_uses"], monitoringCadence: "daily", redFlags: ["thunderclap headache", "worst headache of life", "headache with weakness or vision loss", "fever and stiff neck"], disclaimerTier: "general", sortOrder: 20 },
  { slug: "cluster_headache", label: "Cluster headache", shortLabel: "Cluster", aka: ["suicide headache"], category: "neuro", traits: ["headache", "autonomic"], commonSymptoms: ["severe one-sided pain", "tearing", "restlessness"], commonMeds: ["oxygen", "sumatriptan injection", "verapamil"], keyMetrics: ["attack_count", "bout_length"], monitoringCadence: "daily", redFlags: ["neurological deficits", "first ever severe headache"], disclaimerTier: "general", sortOrder: 30 },
  { slug: "parkinsons", label: "Parkinson's disease", shortLabel: "Parkinson's", aka: ["PD"], category: "neuro", traits: ["neuro", "motor", "cognitive_load"], commonSymptoms: ["tremor", "rigidity", "slowness", "off periods", "freezing"], commonMeds: ["carbidopa-levodopa", "ropinirole", "rasagiline"], keyMetrics: ["on_off_log", "med_adherence", "falls"], monitoringCadence: "daily", redFlags: ["fall with injury", "severe confusion", "swallowing trouble"], disclaimerTier: "general", sortOrder: 40 },
  { slug: "multiple_sclerosis", label: "Multiple sclerosis", shortLabel: "MS", aka: ["MS"], category: "neuro", traits: ["neuro", "inflammatory", "pacing_required", "sensory"], commonSymptoms: ["fatigue", "numbness", "vision change", "spasticity", "heat sensitivity"], commonMeds: ["ocrelizumab", "natalizumab", "glatiramer", "interferon beta"], keyMetrics: ["fatigue_level", "flare_count", "mobility"], monitoringCadence: "weekly", redFlags: ["sudden vision loss", "new severe weakness", "loss of bladder control"], disclaimerTier: "general", sortOrder: 50 },
  { slug: "stroke_recovery", label: "Stroke recovery", shortLabel: "Stroke", aka: ["post-stroke", "TIA recovery"], category: "neuro", traits: ["neuro", "cardiovascular", "cognitive_load", "pacing_required"], commonSymptoms: ["weakness", "aphasia", "fatigue", "vision changes"], commonMeds: ["aspirin", "clopidogrel", "atorvastatin", "antihypertensives"], keyMetrics: ["bp", "adherence", "therapy_sessions"], monitoringCadence: "daily", redFlags: ["FAST symptoms returning", "sudden severe headache", "new weakness or numbness"], disclaimerTier: "general", sortOrder: 60 },
  { slug: "neuropathy", label: "Peripheral neuropathy", shortLabel: "Neuropathy", aka: ["nerve pain"], category: "neuro", traits: ["pain", "neuro", "sensory"], commonSymptoms: ["burning", "tingling", "numbness", "balance trouble"], commonMeds: ["gabapentin", "pregabalin", "duloxetine"], keyMetrics: ["pain_level", "sleep_disruption"], monitoringCadence: "weekly", redFlags: ["sudden new weakness", "foot ulcer", "loss of bowel/bladder control"], disclaimerTier: "general", sortOrder: 70 },

  // Neurodevelopmental / cognitive
  { slug: "autism", label: "Autism / ASD", shortLabel: "Autism", aka: ["ASD", "autism spectrum", "autistic"], category: "neurodevelopmental", traits: ["neurodevelopmental", "sensory", "routine_sensitive", "cognitive_load"], commonSymptoms: ["sensory overload", "meltdown", "shutdown", "burnout", "social fatigue"], commonMeds: [], keyMetrics: ["sensory_load", "energy_level", "routine_disruption", "sleep_quality"], monitoringCadence: "daily", redFlags: ["severe shutdown lasting days", "self-injury", "suicidal thoughts"], disclaimerTier: "sensitive", sortOrder: 80 },
  { slug: "adhd", label: "ADHD", shortLabel: "ADHD", aka: ["attention deficit", "ADD"], category: "neurodevelopmental", traits: ["neurodevelopmental", "cognitive_load", "mood"], commonSymptoms: ["focus difficulty", "executive function", "restlessness", "rejection sensitivity"], commonMeds: ["methylphenidate", "lisdexamfetamine", "atomoxetine"], keyMetrics: ["focus_rating", "sleep_hours", "med_adherence"], monitoringCadence: "daily", redFlags: ["severe mood crash", "stimulant side effects (chest pain, racing heart)", "suicidal thoughts"], disclaimerTier: "sensitive", sortOrder: 90 },
  { slug: "dementia", label: "Alzheimer's & dementia", shortLabel: "Dementia", aka: ["Alzheimer's", "memory loss"], category: "neurodevelopmental", traits: ["cognitive_load", "neuro", "caregiver_helpful"], commonSymptoms: ["memory loss", "confusion", "wandering", "sundowning"], commonMeds: ["donepezil", "memantine", "rivastigmine"], keyMetrics: ["orientation", "behavioral_episodes", "sleep"], monitoringCadence: "daily", redFlags: ["sudden severe confusion", "falls", "wandering at night"], disclaimerTier: "sensitive", sortOrder: 100 },

  // Mental health
  { slug: "depression", label: "Depression", shortLabel: "Depression", aka: ["major depressive disorder", "MDD"], category: "mental_health", traits: ["mood", "sleep_critical", "pacing_required"], commonSymptoms: ["low mood", "anhedonia", "fatigue", "sleep changes", "appetite changes"], commonMeds: ["sertraline", "escitalopram", "bupropion", "fluoxetine"], keyMetrics: ["mood_rating", "sleep_hours", "energy_level"], monitoringCadence: "daily", redFlags: ["suicidal thoughts", "plan or means to harm self", "psychosis"], disclaimerTier: "sensitive", sortOrder: 110 },
  { slug: "anxiety", label: "Anxiety", shortLabel: "Anxiety", aka: ["generalized anxiety", "GAD", "panic"], category: "mental_health", traits: ["mood", "autonomic", "sleep_critical"], commonSymptoms: ["worry", "racing thoughts", "panic", "restlessness", "muscle tension"], commonMeds: ["sertraline", "escitalopram", "buspirone", "propranolol prn"], keyMetrics: ["anxiety_rating", "panic_count", "sleep"], monitoringCadence: "daily", redFlags: ["panic with chest pain not relieved", "suicidal thoughts", "can't function"], disclaimerTier: "sensitive", sortOrder: 120 },
  { slug: "bipolar", label: "Bipolar disorder", shortLabel: "Bipolar", aka: ["manic depression"], category: "mental_health", traits: ["mood", "sleep_critical"], commonSymptoms: ["mood swings", "elevated energy", "reduced sleep need", "depressive episodes"], commonMeds: ["lithium", "lamotrigine", "quetiapine", "valproate"], keyMetrics: ["mood_rating", "sleep_hours", "med_adherence"], monitoringCadence: "daily", redFlags: ["suicidal thoughts", "psychosis", "dangerous impulsivity", "severe mania"], disclaimerTier: "sensitive", sortOrder: 130 },
  { slug: "ptsd", label: "PTSD", shortLabel: "PTSD", aka: ["post traumatic stress"], category: "mental_health", traits: ["mood", "autonomic", "sleep_critical"], commonSymptoms: ["flashbacks", "nightmares", "hypervigilance", "dissociation"], commonMeds: ["sertraline", "paroxetine", "prazosin"], keyMetrics: ["mood_rating", "sleep_quality", "trigger_log"], monitoringCadence: "daily", redFlags: ["suicidal thoughts", "severe dissociation", "self-harm urges"], disclaimerTier: "sensitive", sortOrder: 140 },
  { slug: "ocd", label: "OCD", shortLabel: "OCD", aka: ["obsessive compulsive"], category: "mental_health", traits: ["mood", "cognitive_load"], commonSymptoms: ["intrusive thoughts", "compulsions", "ritualizing"], commonMeds: ["fluoxetine", "sertraline", "clomipramine"], keyMetrics: ["compulsion_time", "distress_rating"], monitoringCadence: "daily", redFlags: ["suicidal thoughts", "self-harm", "severe functional impairment"], disclaimerTier: "sensitive", sortOrder: 150 },
  { slug: "eating_disorder", label: "Eating disorder", shortLabel: "Eating", aka: ["anorexia", "bulimia", "BED", "ARFID"], category: "mental_health", traits: ["mood", "nutritional", "sensory"], commonSymptoms: ["restriction", "bingeing", "purging", "body image distress"], commonMeds: [], keyMetrics: ["meals_logged", "distress_rating", "behaviors"], monitoringCadence: "daily", redFlags: ["fainting", "chest pain", "severe electrolyte symptoms", "suicidal thoughts", "rapid weight loss"], disclaimerTier: "sensitive", sortOrder: 160 },

  // Cardio / metabolic
  { slug: "hypertension", label: "High blood pressure", shortLabel: "Hypertension", aka: ["HTN", "high BP"], category: "cardio_metabolic", traits: ["cardiovascular"], commonSymptoms: ["headaches", "dizziness", "often silent"], commonMeds: ["lisinopril", "amlodipine", "losartan", "hydrochlorothiazide"], keyMetrics: ["bp_systolic", "bp_diastolic", "heart_rate"], monitoringCadence: "daily", redFlags: ["BP above 180/120", "chest pain", "severe headache", "vision changes"], disclaimerTier: "general", sortOrder: 170 },
  { slug: "t1_diabetes", label: "Type 1 diabetes", shortLabel: "T1D", aka: ["type 1", "insulin dependent"], category: "cardio_metabolic", traits: ["glycemic", "autoimmune"], commonSymptoms: ["highs", "lows", "ketones", "fatigue"], commonMeds: ["insulin"], keyMetrics: ["glucose", "hba1c", "time_in_range", "insulin_dose"], monitoringCadence: "daily", redFlags: ["DKA symptoms (nausea, fruity breath)", "severe hypoglycemia", "glucose unmeasurable"], disclaimerTier: "general", sortOrder: 180 },
  { slug: "t2_diabetes", label: "Type 2 diabetes", shortLabel: "T2D", aka: ["type 2", "adult onset"], category: "cardio_metabolic", traits: ["glycemic"], commonSymptoms: ["highs", "fatigue", "increased thirst"], commonMeds: ["metformin", "semaglutide", "empagliflozin", "insulin"], keyMetrics: ["glucose", "hba1c", "weight", "bp"], monitoringCadence: "daily", redFlags: ["glucose > 300 with symptoms", "foot ulcer", "vision change"], disclaimerTier: "general", sortOrder: 190 },
  { slug: "prediabetes", label: "Pre-diabetes", shortLabel: "Pre-diabetes", aka: [], category: "cardio_metabolic", traits: ["glycemic"], commonSymptoms: ["elevated fasting glucose", "elevated A1c"], commonMeds: [], keyMetrics: ["fasting_glucose", "hba1c", "weight"], monitoringCadence: "weekly", redFlags: [], disclaimerTier: "general", sortOrder: 200 },
  { slug: "high_cholesterol", label: "High cholesterol", shortLabel: "Cholesterol", aka: ["hyperlipidemia", "dyslipidemia"], category: "cardio_metabolic", traits: ["cardiovascular"], commonSymptoms: ["often silent"], commonMeds: ["atorvastatin", "rosuvastatin", "ezetimibe"], keyMetrics: ["ldl", "hdl", "triglycerides", "total_cholesterol"], monitoringCadence: "asneeded", redFlags: ["chest pain", "muscle pain on statin"], disclaimerTier: "general", sortOrder: 210 },
  { slug: "afib", label: "Atrial fibrillation", shortLabel: "AFib", aka: ["AFib", "atrial fib"], category: "cardio_metabolic", traits: ["cardiovascular", "autonomic"], commonSymptoms: ["palpitations", "fatigue", "breathlessness", "dizziness"], commonMeds: ["apixaban", "metoprolol", "diltiazem", "flecainide"], keyMetrics: ["heart_rate", "rhythm_episodes", "bp"], monitoringCadence: "daily", redFlags: ["chest pain", "stroke symptoms (FAST)", "fainting"], disclaimerTier: "general", sortOrder: 220 },
  { slug: "heart_failure", label: "Heart failure", shortLabel: "Heart failure", aka: ["CHF", "HFrEF", "HFpEF"], category: "cardio_metabolic", traits: ["cardiovascular", "pacing_required"], commonSymptoms: ["shortness of breath", "swelling", "fatigue", "weight gain"], commonMeds: ["furosemide", "sacubitril-valsartan", "metoprolol", "spironolactone"], keyMetrics: ["weight", "bp", "swelling", "breathlessness"], monitoringCadence: "daily", redFlags: ["weight up >2lb/day or 5lb/week", "severe breathlessness", "chest pain"], disclaimerTier: "general", sortOrder: 230 },

  // Autoimmune
  { slug: "rheumatoid_arthritis", label: "Rheumatoid arthritis", shortLabel: "RA", aka: ["RA"], category: "autoimmune", traits: ["autoimmune", "inflammatory", "pain", "pacing_required"], commonSymptoms: ["joint pain", "morning stiffness", "swelling", "fatigue"], commonMeds: ["methotrexate", "adalimumab", "etanercept", "prednisone"], keyMetrics: ["joint_pain", "stiffness_minutes", "flare_count"], monitoringCadence: "daily", redFlags: ["high fever on biologic", "severe new joint redness", "infection signs"], disclaimerTier: "general", sortOrder: 240 },
  { slug: "lupus", label: "Lupus (SLE)", shortLabel: "Lupus", aka: ["SLE"], category: "autoimmune", traits: ["autoimmune", "inflammatory", "pacing_required"], commonSymptoms: ["fatigue", "joint pain", "rash", "sun sensitivity", "flares"], commonMeds: ["hydroxychloroquine", "prednisone", "mycophenolate"], keyMetrics: ["fatigue_level", "flare_count", "rash"], monitoringCadence: "daily", redFlags: ["chest pain", "severe headache", "high fever", "new neurologic symptoms"], disclaimerTier: "general", sortOrder: 250 },
  { slug: "crohns", label: "Crohn's disease", shortLabel: "Crohn's", aka: ["IBD"], category: "autoimmune", traits: ["autoimmune", "inflammatory", "gi", "pacing_required"], commonSymptoms: ["abdominal pain", "diarrhea", "weight loss", "fatigue"], commonMeds: ["infliximab", "adalimumab", "azathioprine", "budesonide"], keyMetrics: ["bowel_movements", "pain_level", "flare_count", "weight"], monitoringCadence: "daily", redFlags: ["blood in stool with weakness", "severe abdominal pain", "high fever", "dehydration"], disclaimerTier: "general", sortOrder: 260 },
  { slug: "ulcerative_colitis", label: "Ulcerative colitis", shortLabel: "UC", aka: ["IBD", "colitis"], category: "autoimmune", traits: ["autoimmune", "inflammatory", "gi"], commonSymptoms: ["bloody diarrhea", "urgency", "abdominal pain"], commonMeds: ["mesalamine", "infliximab", "prednisone"], keyMetrics: ["bowel_movements", "blood", "flare_count"], monitoringCadence: "daily", redFlags: ["heavy bleeding", "severe abdominal distension", "high fever"], disclaimerTier: "general", sortOrder: 270 },
  { slug: "psoriasis", label: "Psoriasis", shortLabel: "Psoriasis", aka: [], category: "autoimmune", traits: ["autoimmune", "inflammatory", "sensory"], commonSymptoms: ["plaques", "itching", "joint pain"], commonMeds: ["adalimumab", "secukinumab", "methotrexate", "topical steroids"], keyMetrics: ["flare_area", "itch_level", "joint_pain"], monitoringCadence: "weekly", redFlags: ["widespread red skin", "signs of infection in lesions"], disclaimerTier: "general", sortOrder: 280 },
  { slug: "hashimotos", label: "Hashimoto's / hypothyroidism", shortLabel: "Hashimoto's", aka: ["hypothyroid", "underactive thyroid"], category: "autoimmune", traits: ["autoimmune", "mood", "pacing_required"], commonSymptoms: ["fatigue", "cold intolerance", "weight gain", "brain fog"], commonMeds: ["levothyroxine"], keyMetrics: ["tsh", "energy_level", "weight"], monitoringCadence: "asneeded", redFlags: ["severe fatigue with cold", "myxedema symptoms"], disclaimerTier: "general", sortOrder: 290 },
  { slug: "celiac", label: "Celiac disease", shortLabel: "Celiac", aka: ["gluten intolerance (celiac)"], category: "autoimmune", traits: ["autoimmune", "gi", "nutritional"], commonSymptoms: ["diarrhea", "bloating", "fatigue after gluten", "skin rash"], commonMeds: [], keyMetrics: ["gluten_exposures", "symptom_score"], monitoringCadence: "daily", redFlags: ["severe dehydration", "chronic weight loss"], disclaimerTier: "general", sortOrder: 300 },

  // Respiratory
  { slug: "asthma", label: "Asthma", shortLabel: "Asthma", aka: [], category: "respiratory", traits: ["respiratory", "autonomic"], commonSymptoms: ["wheezing", "shortness of breath", "cough", "chest tightness"], commonMeds: ["albuterol", "fluticasone", "montelukast", "budesonide-formoterol"], keyMetrics: ["peak_flow", "rescue_uses", "attacks"], monitoringCadence: "daily", redFlags: ["rescue inhaler not working", "can't speak full sentence", "lips bluish"], disclaimerTier: "general", sortOrder: 310 },
  { slug: "copd", label: "COPD", shortLabel: "COPD", aka: ["emphysema", "chronic bronchitis"], category: "respiratory", traits: ["respiratory", "pacing_required"], commonSymptoms: ["breathlessness", "chronic cough", "sputum", "fatigue"], commonMeds: ["tiotropium", "salbutamol", "fluticasone-salmeterol", "prednisone bursts"], keyMetrics: ["breathlessness", "rescue_uses", "sputum_color"], monitoringCadence: "daily", redFlags: ["severe breathlessness", "color change in sputum with fever", "confusion"], disclaimerTier: "general", sortOrder: 320 },
  { slug: "sleep_apnea", label: "Sleep apnea", shortLabel: "Sleep apnea", aka: ["OSA", "obstructive sleep apnea"], category: "respiratory", traits: ["respiratory", "sleep_critical"], commonSymptoms: ["daytime sleepiness", "snoring", "witnessed apneas", "morning headache"], commonMeds: [], keyMetrics: ["cpap_hours", "ahi", "sleep_quality"], monitoringCadence: "daily", redFlags: ["falling asleep while driving", "severe morning headaches"], disclaimerTier: "general", sortOrder: 330 },

  // Pain / fatigue / autonomic
  { slug: "fibromyalgia", label: "Fibromyalgia", shortLabel: "Fibro", aka: ["fibro"], category: "pain_fatigue", traits: ["pain", "pacing_required", "sleep_critical"], commonSymptoms: ["widespread pain", "fatigue", "brain fog", "tender points", "poor sleep"], commonMeds: ["duloxetine", "pregabalin", "amitriptyline"], keyMetrics: ["pain_level", "fatigue_level", "sleep_quality"], monitoringCadence: "daily", redFlags: ["new severe localized pain", "fever with widespread pain"], disclaimerTier: "general", sortOrder: 340 },
  { slug: "chronic_pain", label: "Chronic pain", shortLabel: "Chronic pain", aka: [], category: "pain_fatigue", traits: ["pain", "pacing_required"], commonSymptoms: ["persistent pain", "fatigue", "mood impact", "sleep disruption"], commonMeds: ["gabapentin", "duloxetine", "NSAIDs"], keyMetrics: ["pain_level", "flare_count", "mood_rating"], monitoringCadence: "daily", redFlags: ["sudden severe new pain", "loss of bowel/bladder control", "weakness"], disclaimerTier: "general", sortOrder: 350 },
  { slug: "long_covid", label: "Long COVID / ME-CFS", shortLabel: "Long COVID", aka: ["ME/CFS", "chronic fatigue syndrome", "post viral"], category: "pain_fatigue", traits: ["pacing_required", "autonomic", "cognitive_load"], commonSymptoms: ["fatigue", "PEM", "brain fog", "orthostatic intolerance"], commonMeds: ["low-dose naltrexone", "beta blockers prn"], keyMetrics: ["energy_level", "pem_events", "activity_load"], monitoringCadence: "daily", redFlags: ["chest pain", "fainting", "severe new weakness"], disclaimerTier: "general", sortOrder: 360 },
  { slug: "pots", label: "POTS / dysautonomia", shortLabel: "POTS", aka: ["postural tachycardia", "dysautonomia"], category: "pain_fatigue", traits: ["autonomic", "cardiovascular", "pacing_required"], commonSymptoms: ["lightheadedness on standing", "tachycardia", "fatigue", "brain fog"], commonMeds: ["midodrine", "fludrocortisone", "beta blockers", "salt tablets"], keyMetrics: ["standing_heart_rate", "fluids", "salt", "dizzy_episodes"], monitoringCadence: "daily", redFlags: ["fainting with injury", "chest pain", "severe palpitations"], disclaimerTier: "general", sortOrder: 370 },
  { slug: "eds", label: "Ehlers-Danlos (hypermobility)", shortLabel: "EDS", aka: ["hEDS", "HSD", "hypermobility"], category: "pain_fatigue", traits: ["pain", "autonomic", "pacing_required"], commonSymptoms: ["joint pain", "subluxations", "fatigue", "GI issues", "dizziness"], commonMeds: ["gabapentin", "PT"], keyMetrics: ["pain_level", "subluxations", "fatigue_level"], monitoringCadence: "daily", redFlags: ["joint dislocation needing reduction", "chest pain", "severe GI symptoms"], disclaimerTier: "general", sortOrder: 380 },

  // GI / renal / oncology
  { slug: "ibs", label: "IBS", shortLabel: "IBS", aka: ["irritable bowel"], category: "gi", traits: ["gi", "autonomic"], commonSymptoms: ["abdominal pain", "bloating", "diarrhea", "constipation"], commonMeds: ["hyoscine", "loperamide", "linaclotide", "peppermint oil"], keyMetrics: ["bowel_movements", "pain_level", "triggers"], monitoringCadence: "daily", redFlags: ["blood in stool", "unexplained weight loss", "nighttime symptoms"], disclaimerTier: "general", sortOrder: 390 },
  { slug: "gerd", label: "GERD", shortLabel: "GERD", aka: ["reflux", "heartburn"], category: "gi", traits: ["gi"], commonSymptoms: ["heartburn", "regurgitation", "cough", "sleep disruption"], commonMeds: ["omeprazole", "famotidine", "pantoprazole"], keyMetrics: ["reflux_episodes", "triggers"], monitoringCadence: "asneeded", redFlags: ["trouble swallowing", "blood in vomit", "chest pain"], disclaimerTier: "general", sortOrder: 400 },
  { slug: "ckd", label: "Chronic kidney disease", shortLabel: "CKD", aka: ["kidney disease"], category: "cardio_metabolic", traits: ["cardiovascular", "pacing_required", "nutritional"], commonSymptoms: ["fatigue", "swelling", "reduced urine", "itch"], commonMeds: ["lisinopril", "furosemide", "sevelamer", "epoetin"], keyMetrics: ["weight", "bp", "urine_output", "potassium"], monitoringCadence: "daily", redFlags: ["little or no urine", "severe shortness of breath", "confusion"], disclaimerTier: "general", sortOrder: 410 },
  { slug: "cancer", label: "Cancer (in treatment / survivorship)", shortLabel: "Cancer", aka: ["oncology", "chemo", "radiation"], category: "oncology", traits: ["pacing_required", "mood", "pain", "nutritional"], commonSymptoms: ["fatigue", "pain", "nausea", "neuropathy", "sleep disruption"], commonMeds: [], keyMetrics: ["fatigue_level", "pain_level", "treatment_side_effects"], monitoringCadence: "daily", redFlags: ["fever during chemo", "uncontrolled bleeding", "severe new pain"], disclaimerTier: "sensitive", sortOrder: 420 },

  // Special
  { slug: "caregiver", label: "Caregiving for someone", shortLabel: "Caregiver", aka: ["carer", "family caregiver"], category: "caregiver", traits: ["caregiver", "mood", "pacing_required"], commonSymptoms: ["caregiver fatigue", "sleep loss", "overwhelm"], commonMeds: [], keyMetrics: ["hours_caring", "self_care", "sleep"], monitoringCadence: "daily", redFlags: ["caregiver burnout", "suicidal thoughts"], disclaimerTier: "sensitive", sortOrder: 900 },
  { slug: "general", label: "General wellness", shortLabel: "General", aka: [], category: "general", traits: ["mood", "pacing_required"], commonSymptoms: ["stress", "sleep", "habits"], commonMeds: [], keyMetrics: ["sleep_hours", "mood_rating", "energy_level"], monitoringCadence: "asneeded", redFlags: [], disclaimerTier: "general", sortOrder: 999 },
];

const BY_SLUG = new Map(CONDITION_CATALOG.map((c) => [c.slug, c]));

export function getCondition(slug: string | null | undefined): ConditionDef | undefined {
  if (!slug) return undefined;
  return BY_SLUG.get(slug);
}

export function getConditions(slugs: string[] | null | undefined): ConditionDef[] {
  if (!slugs || slugs.length === 0) return [];
  const out: ConditionDef[] = [];
  const seen = new Set<string>();
  for (const s of slugs) {
    const def = BY_SLUG.get(s);
    if (def && !seen.has(def.slug)) {
      seen.add(def.slug);
      out.push(def);
    }
  }
  return out;
}

export function traitsForConditions(slugs: string[] | null | undefined): Set<ConditionTrait> {
  const out = new Set<ConditionTrait>();
  for (const def of getConditions(slugs)) {
    for (const t of def.traits) out.add(t);
  }
  return out;
}

export function hasTrait(slugs: string[] | null | undefined, trait: ConditionTrait): boolean {
  return traitsForConditions(slugs).has(trait);
}

export function disclaimerTierFor(slugs: string[] | null | undefined): DisclaimerTier {
  for (const def of getConditions(slugs)) {
    if (def.disclaimerTier === "sensitive") return "sensitive";
  }
  return "general";
}

/**
 * Lightweight search over label + aka (synonyms). Used by the onboarding
 * search-first picker so typing "ASD" surfaces "Autism / ASD".
 */
export function searchConditions(query: string): ConditionDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...CONDITION_CATALOG].sort((a, b) => a.sortOrder - b.sortOrder);
  return CONDITION_CATALOG
    .filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      if (c.shortLabel.toLowerCase().includes(q)) return true;
      return c.aka.some((a) => a.toLowerCase().includes(q));
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}