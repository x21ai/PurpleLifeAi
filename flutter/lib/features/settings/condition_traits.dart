import '../shared/condition_prompts.dart' show showsSeizureFeatures;

/// Trait slugs mirrored from web `src/lib/condition-catalog.ts`.
const traitLabels = <String, String>{
  'seizure_prone': 'Seizure-prone',
  'headache': 'Headache',
  'glycemic': 'Blood sugar',
  'cardiovascular': 'Cardiovascular',
  'autonomic': 'Autonomic',
  'inflammatory': 'Inflammatory',
  'respiratory': 'Breathing',
  'mood': 'Mood',
  'cognitive_load': 'Cognitive load',
  'neurodevelopmental': 'Neurodevelopmental',
  'neuro': 'Neurological',
  'motor': 'Motor',
  'pacing_required': 'Pacing',
  'gi': 'Digestive',
  'pain': 'Pain',
  'sleep_critical': 'Sleep-sensitive',
  'sensory': 'Sensory',
  'routine_sensitive': 'Routine',
  'nutritional': 'Nutritional',
  'autoimmune': 'Autoimmune',
  'caregiver': 'Caregiving',
  'caregiver_helpful': 'Caregiver-aware',
};

/// Slug -> traits from the static condition catalog seed.
const conditionTraitMap = <String, List<String>>{
  'epilepsy': ['seizure_prone', 'neuro', 'sleep_critical'],
  'migraine': ['headache', 'sensory', 'autonomic'],
  'cluster_headache': ['headache', 'autonomic'],
  'parkinsons': ['neuro', 'motor', 'cognitive_load'],
  'multiple_sclerosis': ['neuro', 'inflammatory', 'pacing_required', 'sensory'],
  'stroke_recovery': ['neuro', 'cardiovascular', 'cognitive_load', 'pacing_required'],
  'neuropathy': ['pain', 'neuro', 'sensory'],
  'autism': ['neurodevelopmental', 'sensory', 'routine_sensitive', 'cognitive_load'],
  'adhd': ['neurodevelopmental', 'cognitive_load', 'mood'],
  'dementia': ['cognitive_load', 'neuro', 'caregiver_helpful'],
  'depression': ['mood', 'sleep_critical', 'pacing_required'],
  'anxiety': ['mood', 'autonomic', 'sleep_critical'],
  'bipolar': ['mood', 'sleep_critical'],
  'ptsd': ['mood', 'autonomic', 'sleep_critical'],
  'ocd': ['mood', 'cognitive_load'],
  'eating_disorder': ['mood', 'nutritional', 'sensory'],
  'hypertension': ['cardiovascular'],
  't1_diabetes': ['glycemic', 'autoimmune'],
  't2_diabetes': ['glycemic'],
  'prediabetes': ['glycemic'],
  'high_cholesterol': ['cardiovascular'],
  'afib': ['cardiovascular', 'autonomic'],
  'heart_failure': ['cardiovascular', 'pacing_required'],
  'rheumatoid_arthritis': ['autoimmune', 'inflammatory', 'pain', 'pacing_required'],
  'lupus': ['autoimmune', 'inflammatory', 'pacing_required'],
  'crohns': ['autoimmune', 'inflammatory', 'gi', 'pacing_required'],
  'ulcerative_colitis': ['autoimmune', 'inflammatory', 'gi'],
  'psoriasis': ['autoimmune', 'inflammatory', 'sensory'],
  'hashimotos': ['autoimmune', 'mood', 'pacing_required'],
  'celiac': ['autoimmune', 'gi', 'nutritional'],
  'asthma': ['respiratory', 'autonomic'],
  'copd': ['respiratory', 'pacing_required'],
  'sleep_apnea': ['respiratory', 'sleep_critical'],
  'fibromyalgia': ['pain', 'pacing_required', 'sleep_critical'],
  'chronic_pain': ['pain', 'pacing_required'],
  'long_covid': ['pacing_required', 'autonomic', 'cognitive_load'],
  'pots': ['autonomic', 'cardiovascular', 'pacing_required'],
  'eds': ['pain', 'autonomic', 'pacing_required'],
  'ibs': ['gi', 'autonomic'],
  'gerd': ['gi'],
  'ckd': ['cardiovascular', 'pacing_required', 'nutritional'],
  'cancer': ['pacing_required', 'mood', 'pain', 'nutritional'],
  'caregiver': ['caregiver', 'mood', 'pacing_required'],
  'general': ['mood', 'pacing_required'],
};

String labelForTrait(String trait) => traitLabels[trait] ?? trait;

bool hasTrait(List<String>? slugs, String trait) {
  if (slugs == null || slugs.isEmpty) return false;
  for (final slug in slugs) {
    final mapped = conditionTraitMap[slug];
    if (mapped?.contains(trait) == true) return true;
    if (trait == 'seizure_prone' && showsSeizureFeatures([slug])) return true;
  }
  return false;
}

String defaultForLabels(List<String> defaultFor) {
  return defaultFor.map(labelForTrait).join(', ');
}
