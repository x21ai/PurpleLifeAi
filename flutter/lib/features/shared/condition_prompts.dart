/// Condition-aware copy ported from `src/lib/condition-prompts.ts`.
library;

/// General journal prompts when no condition-specific copy applies.
const generalPrompts = [
  'How are you, honestly?',
  'Sleep, food, movement worth noting',
  'Anything you want to remember tomorrow',
];

/// Trait-keyed prompt pools (subset of web `TRAIT_PROMPTS` for Today lede).
const _traitPrompts = <String, List<String>>{
  'seizure_prone': [
    'Any aura or warning signs today?',
    'Sleep last night and how you feel now',
    'Did you take every dose on time?',
  ],
  'headache': [
    'How does your head feel right now?',
    'Any triggers today (light, food, stress)?',
    'If pain hit, what helped?',
  ],
  'glycemic': [
    'Glucose check and how you felt at the time',
    'Meals and carbs that stood out today',
    'Any lows or highs worth noting?',
  ],
  'mood': [
    'How is your mood right now, in a few words?',
    'What helped today, even a little?',
    'Anything weighing on you tonight?',
  ],
  'sleep_critical': [
    'How did you sleep last night?',
    'Anything getting in the way of rest?',
    'Wind-down plan for tonight?',
  ],
  'pain': [
    'Pain level and where, in a few words',
    'What helped today, what did not',
    'Anything that set it off?',
  ],
};

/// Condition slug -> traits, from `src/lib/condition-catalog.ts` (salient subset).
const _conditionTraits = <String, List<String>>{
  'epilepsy': ['seizure_prone', 'neuro', 'sleep_critical'],
  'migraine': ['headache', 'neuro', 'sleep_critical'],
  'cluster_headache': ['headache', 'pain'],
  't1_diabetes': ['glycemic'],
  't2_diabetes': ['glycemic'],
  'prediabetes': ['glycemic'],
  'depression': ['mood'],
  'anxiety': ['mood'],
  'bipolar': ['mood'],
  'fibromyalgia': ['pain', 'inflammatory'],
  'chronic_pain': ['pain'],
  'sleep_apnea': ['sleep_critical', 'respiratory'],
  'caregiver': ['caregiver'],
};

Set<String> _traitsForConditions(List<String> conditions) {
  final traits = <String>{};
  for (final slug in conditions) {
    final list = _conditionTraits[slug.toLowerCase()];
    if (list != null) traits.addAll(list);
  }
  return traits;
}

/// Rotating journal-style prompt for Today lede when no AI narrative exists.
String promptForConditions(List<String> conditions, {DateTime? onDate}) {
  final day = (onDate ?? DateTime.now()).millisecondsSinceEpoch ~/
      Duration.millisecondsPerDay;
  final traits = _traitsForConditions(conditions);
  if (traits.isEmpty) {
    return generalPrompts[day % generalPrompts.length];
  }
  final pool = <String>[];
  for (final trait in traits) {
    final list = _traitPrompts[trait];
    if (list != null) pool.addAll(list);
  }
  if (pool.isEmpty) {
    return generalPrompts[day % generalPrompts.length];
  }
  return pool[day % pool.length];
}

/// Web `showsSeizureFeatures`: epilepsy slug or free-text seizure mention.
bool showsSeizureFeatures(List<String> conditions) {
  return conditions.any((c) {
    final lower = c.toLowerCase();
    return lower == 'epilepsy' ||
        lower.contains('epilep') ||
        lower.contains('seizure') ||
        lower.contains('convulsion');
  });
}
