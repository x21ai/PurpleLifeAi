/// Compact slug -> (label, category) mirror of the web `condition_catalog.ts`
/// used by My Health's "Your conditions" section.
///
/// Web `getConditions(slugs)` resolves each stored slug from
/// `profiles.conditions` to a catalog def and renders `label` + `category`.
/// This is a display-only subset (label + category) matching those fields
/// exactly; keep in lockstep with `src/lib/condition-catalog.ts`.
library;

class ConditionCatalogEntry {
  const ConditionCatalogEntry({
    required this.slug,
    required this.label,
    required this.category,
  });

  final String slug;
  final String label;
  final String category;
}

const Map<String, ConditionCatalogEntry> _catalog = {
  // Neurology
  'epilepsy': ConditionCatalogEntry(
      slug: 'epilepsy', label: 'Epilepsy / seizures', category: 'neuro'),
  'migraine':
      ConditionCatalogEntry(slug: 'migraine', label: 'Migraine', category: 'neuro'),
  'cluster_headache': ConditionCatalogEntry(
      slug: 'cluster_headache', label: 'Cluster headache', category: 'neuro'),
  'parkinsons': ConditionCatalogEntry(
      slug: 'parkinsons', label: "Parkinson's disease", category: 'neuro'),
  'multiple_sclerosis': ConditionCatalogEntry(
      slug: 'multiple_sclerosis',
      label: 'Multiple sclerosis',
      category: 'neuro'),
  'stroke_recovery': ConditionCatalogEntry(
      slug: 'stroke_recovery', label: 'Stroke recovery', category: 'neuro'),
  'neuropathy': ConditionCatalogEntry(
      slug: 'neuropathy', label: 'Peripheral neuropathy', category: 'neuro'),

  // Neurodevelopmental / cognitive
  'autism': ConditionCatalogEntry(
      slug: 'autism', label: 'Autism / ASD', category: 'neurodevelopmental'),
  'adhd': ConditionCatalogEntry(
      slug: 'adhd', label: 'ADHD', category: 'neurodevelopmental'),
  'dementia': ConditionCatalogEntry(
      slug: 'dementia',
      label: "Alzheimer's & dementia",
      category: 'neurodevelopmental'),

  // Mental health
  'depression': ConditionCatalogEntry(
      slug: 'depression', label: 'Depression', category: 'mental_health'),
  'anxiety': ConditionCatalogEntry(
      slug: 'anxiety', label: 'Anxiety', category: 'mental_health'),
  'bipolar': ConditionCatalogEntry(
      slug: 'bipolar', label: 'Bipolar disorder', category: 'mental_health'),
  'ptsd': ConditionCatalogEntry(
      slug: 'ptsd', label: 'PTSD', category: 'mental_health'),
  'ocd':
      ConditionCatalogEntry(slug: 'ocd', label: 'OCD', category: 'mental_health'),
  'eating_disorder': ConditionCatalogEntry(
      slug: 'eating_disorder',
      label: 'Eating disorder',
      category: 'mental_health'),

  // Cardio / metabolic
  'hypertension': ConditionCatalogEntry(
      slug: 'hypertension',
      label: 'High blood pressure',
      category: 'cardio_metabolic'),
  't1_diabetes': ConditionCatalogEntry(
      slug: 't1_diabetes',
      label: 'Type 1 diabetes',
      category: 'cardio_metabolic'),
  't2_diabetes': ConditionCatalogEntry(
      slug: 't2_diabetes',
      label: 'Type 2 diabetes',
      category: 'cardio_metabolic'),
  'prediabetes': ConditionCatalogEntry(
      slug: 'prediabetes',
      label: 'Pre-diabetes',
      category: 'cardio_metabolic'),
  'high_cholesterol': ConditionCatalogEntry(
      slug: 'high_cholesterol',
      label: 'High cholesterol',
      category: 'cardio_metabolic'),
  'afib': ConditionCatalogEntry(
      slug: 'afib',
      label: 'Atrial fibrillation',
      category: 'cardio_metabolic'),
  'heart_failure': ConditionCatalogEntry(
      slug: 'heart_failure',
      label: 'Heart failure',
      category: 'cardio_metabolic'),
  'ckd': ConditionCatalogEntry(
      slug: 'ckd',
      label: 'Chronic kidney disease',
      category: 'cardio_metabolic'),

  // Autoimmune
  'rheumatoid_arthritis': ConditionCatalogEntry(
      slug: 'rheumatoid_arthritis',
      label: 'Rheumatoid arthritis',
      category: 'autoimmune'),
  'lupus': ConditionCatalogEntry(
      slug: 'lupus', label: 'Lupus (SLE)', category: 'autoimmune'),
  'crohns': ConditionCatalogEntry(
      slug: 'crohns', label: "Crohn's disease", category: 'autoimmune'),
  'ulcerative_colitis': ConditionCatalogEntry(
      slug: 'ulcerative_colitis',
      label: 'Ulcerative colitis',
      category: 'autoimmune'),
  'psoriasis': ConditionCatalogEntry(
      slug: 'psoriasis', label: 'Psoriasis', category: 'autoimmune'),
  'hashimotos': ConditionCatalogEntry(
      slug: 'hashimotos',
      label: "Hashimoto's / hypothyroidism",
      category: 'autoimmune'),
  'celiac': ConditionCatalogEntry(
      slug: 'celiac', label: 'Celiac disease', category: 'autoimmune'),

  // Respiratory
  'asthma': ConditionCatalogEntry(
      slug: 'asthma', label: 'Asthma', category: 'respiratory'),
  'copd':
      ConditionCatalogEntry(slug: 'copd', label: 'COPD', category: 'respiratory'),
  'sleep_apnea': ConditionCatalogEntry(
      slug: 'sleep_apnea', label: 'Sleep apnea', category: 'respiratory'),

  // Pain / fatigue / autonomic
  'fibromyalgia': ConditionCatalogEntry(
      slug: 'fibromyalgia', label: 'Fibromyalgia', category: 'pain_fatigue'),
  'chronic_pain': ConditionCatalogEntry(
      slug: 'chronic_pain', label: 'Chronic pain', category: 'pain_fatigue'),
  'long_covid': ConditionCatalogEntry(
      slug: 'long_covid',
      label: 'Long COVID / ME-CFS',
      category: 'pain_fatigue'),
  'pots': ConditionCatalogEntry(
      slug: 'pots', label: 'POTS / dysautonomia', category: 'pain_fatigue'),
  'eds': ConditionCatalogEntry(
      slug: 'eds',
      label: 'Ehlers-Danlos (hypermobility)',
      category: 'pain_fatigue'),

  // GI / oncology
  'ibs': ConditionCatalogEntry(slug: 'ibs', label: 'IBS', category: 'gi'),
  'gerd': ConditionCatalogEntry(slug: 'gerd', label: 'GERD', category: 'gi'),
  'cancer': ConditionCatalogEntry(
      slug: 'cancer',
      label: 'Cancer (in treatment / survivorship)',
      category: 'oncology'),

  // Special
  'caregiver': ConditionCatalogEntry(
      slug: 'caregiver',
      label: 'Caregiving for someone',
      category: 'caregiver'),
  'general': ConditionCatalogEntry(
      slug: 'general', label: 'General wellness', category: 'general'),
};

/// Resolve stored condition slugs to catalog entries, mirroring web
/// `getConditions`: dedupes, preserves order, drops unknown slugs.
List<ConditionCatalogEntry> getConditions(List<String> slugs) {
  final out = <ConditionCatalogEntry>[];
  final seen = <String>{};
  for (final slug in slugs) {
    final entry = _catalog[slug];
    if (entry != null && seen.add(entry.slug)) {
      out.add(entry);
    }
  }
  return out;
}

/// Human-friendly category label (web renders `category.replace(/_/g, " ")`).
String conditionCategoryLabel(String category) => category.replaceAll('_', ' ');
