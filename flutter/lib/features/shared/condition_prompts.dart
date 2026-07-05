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

const _generalQuestions = [
  'How am I sleeping?',
  'Show last week\'s events',
  'What patterns do you see in my journal?',
];

const _traitQuestions = <String, List<String>>{
  'seizure_prone': [
    'Show my seizures from the last 30 days',
    'Any patterns before my recent episodes?',
    'Have I been taking every dose on time?',
  ],
  'headache': [
    'When did my last bad headache hit and what helped?',
    'Which triggers show up most often in my journal?',
    'How often am I using abortive meds this month?',
  ],
  'glycemic': [
    'Show my recent highs and lows',
    'Which meals seemed to push my glucose up?',
    'How is my time-in-range trending?',
  ],
  'mood': [
    'How has my mood trended this week?',
    'What seemed to help on harder days?',
    'Any patterns around sleep and mood?',
  ],
  'sleep_critical': [
    'How is my sleep duration trending?',
    'Any link between poor sleep and symptoms?',
    'What changed in the last two weeks?',
  ],
  'pain': [
    'How has my pain trended this week?',
    'What helped most on flare days?',
    'Any triggers worth noting recently?',
  ],
  'caregiver': [
    'Summarize this week for me',
    'Any episodes or missed doses this week?',
    'What changed compared to last week?',
  ],
};

/// Ask Purple starter chips (mirrors web `getSuggestedQuestions`).
List<String> getSuggestedQuestions(List<String> conditions, {int cap = 5}) {
  final traits = _traitsForConditions(conditions);
  final pool = <String>[];
  for (final trait in traits) {
    final list = _traitQuestions[trait];
    if (list != null) pool.addAll(list);
  }
  if (pool.isEmpty) {
    return _generalQuestions.take(cap).toList();
  }
  final seen = <String>{};
  final out = <String>[];
  for (final item in pool) {
    if (seen.add(item)) out.add(item);
    if (out.length >= cap) break;
  }
  return out;
}

/// Follow-up chip suggestions under an assistant reply (mirrors web
/// `getFollowUps`): up to 3 items combining topic hints keyed on the user's
/// last message with condition-flavored starters.
List<String> getFollowUps(List<String> conditions, String lastUserMessage) {
  final base = getSuggestedQuestions(conditions);
  final msg = lastUserMessage.toLowerCase();
  final topical = <String>[];
  if (RegExp(r'sleep|slept|rest').hasMatch(msg)) {
    topical.add('How is sleep trending this month?');
  }
  if (RegExp(r'pain|ache|hurt').hasMatch(msg)) {
    topical.add('What helped most on flare days?');
  }
  if (RegExp(r'mood|anxious|down|sad').hasMatch(msg)) {
    topical.add('What seems to help on harder days?');
  }
  if (RegExp(r'med|dose|pill').hasMatch(msg)) {
    topical.add('Have I been taking every dose on time?');
  }
  if (RegExp(r'trigger|caused|why').hasMatch(msg)) {
    topical.add('What patterns do you see in my journal?');
  }
  final out = <String>[];
  final seen = <String>{};
  for (final s in [...topical, ...base]) {
    if (seen.add(s)) out.add(s);
    if (out.length >= 3) break;
  }
  return out;
}
