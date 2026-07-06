import '../shared/condition_prompts.dart';

/// One informational "Recommended for you" card (no SKUs or fake prices).
class RecommendedItem {
  const RecommendedItem({
    required this.id,
    required this.title,
    required this.category,
    required this.traits,
    required this.cta,
    required this.route,
    this.disclaimer,
    this.showWhen,
    this.iconName = 'spark',
  });

  final String id;
  final String title;
  final String category;
  final Map<String, int> traits;
  final String cta;
  final String route;
  final String? disclaimer;
  final bool Function(RecommendedContext ctx)? showWhen;
  final String iconName;
}

/// Context passed to [RecommendedItem.showWhen] filters.
class RecommendedContext {
  const RecommendedContext({required this.hasLabs});

  final bool hasLabs;
}

/// Static catalog mirroring preview `RECOMMENDED_CATALOG` (informational only).
final recommendedCatalog = <RecommendedItem>[
  const RecommendedItem(
    id: 'wearable_sync',
    title: 'Sync Oura + Apple Health',
    category: 'Sleep & recovery',
    traits: {'sleep_critical': 3, 'cardiovascular': 1},
    cta: 'Open in Tools',
    route: '/tools',
    iconName: 'ring',
  ),
  // showWhen closure prevents const on this entry.
  // ignore: prefer_const_constructors
  RecommendedItem(
    id: 'lab_panel',
    title: 'Upload past labs',
    category: 'Reports',
    traits: {'cardiovascular': 2, 'sleep_critical': 1},
    cta: 'Upload past labs',
    route: '/reports/new',
    iconName: 'doc',
    showWhen: (ctx) => !ctx.hasLabs,
  ),
  const RecommendedItem(
    id: 'sleep_hygiene',
    title: 'Sleep hygiene protocol',
    category: 'Protocol',
    traits: {'sleep_critical': 3, 'seizure_prone': 1},
    cta: 'Learn more',
    route: '/plan',
    disclaimer: 'Discuss with your clinician. Informational only.',
    iconName: 'moon',
  ),
  const RecommendedItem(
    id: 'hrv_monitor',
    title: 'HRV + resting HR tracking',
    category: 'Cardio & metabolic',
    traits: {'cardiovascular': 3, 'sleep_critical': 2},
    cta: 'Open in Tools',
    route: '/tools',
    iconName: 'heart',
  ),
  const RecommendedItem(
    id: 'journal_prompts',
    title: 'Seizure + sleep journal pack',
    category: 'Neurology',
    traits: {'seizure_prone': 3, 'sleep_critical': 2, 'neuro': 1},
    cta: 'Open journal',
    route: '/journal',
    iconName: 'journal',
  ),
  const RecommendedItem(
    id: 'caregiver_invite',
    title: 'Invite a caregiver',
    category: 'Care',
    traits: {'seizure_prone': 2},
    cta: 'Open in Tools',
    route: '/tools',
    iconName: 'people',
  ),
  const RecommendedItem(
    id: 'bp_trend',
    title: 'Blood pressure trend',
    category: 'Cardio & metabolic',
    traits: {'cardiovascular': 2},
    cta: 'Learn more',
    route: '/biometrics',
    iconName: 'bp',
  ),
];

int scoreRecommendedItem(RecommendedItem item, Set<String> userTraits) {
  var score = 0;
  for (final trait in userTraits) {
    score += item.traits[trait] ?? 0;
  }
  return score;
}

/// Trait-ranked recommended cards for the current user.
List<RecommendedItem> rankedRecommendedItems({
  required List<String> conditions,
  required RecommendedContext ctx,
}) {
  final traits = traitsForConditions(conditions);
  final scored = recommendedCatalog
      .where((item) => item.showWhen?.call(ctx) ?? true)
      .map((item) => (item: item, score: scoreRecommendedItem(item, traits)))
      .where((e) => e.score > 0)
      .toList()
    ..sort((a, b) => b.score.compareTo(a.score));
  return scored.map((e) => e.item).toList();
}
