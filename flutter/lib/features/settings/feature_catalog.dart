import 'condition_traits.dart';

typedef FeatureKey = String;
typedef FeatureCategory = String;

class FeatureDef {
  const FeatureDef({
    required this.key,
    required this.label,
    required this.description,
    required this.category,
    required this.defaultFor,
    this.defaultOnGlobally = false,
    this.requiresDevice = false,
  });

  final FeatureKey key;
  final String label;
  final String description;
  final FeatureCategory category;
  final List<String> defaultFor;
  final bool defaultOnGlobally;
  final bool requiresDevice;
}

const featureCatalog = <FeatureDef>[
  FeatureDef(
    key: 'hydration',
    label: 'Hydration',
    description: 'Log water and electrolytes throughout the day.',
    category: 'hydration',
    defaultFor: [],
    defaultOnGlobally: true,
  ),
  FeatureDef(
    key: 'aura',
    label: 'Aura / déjà vu',
    description: 'Capture seizure warning signs as they happen.',
    category: 'neuro',
    defaultFor: ['seizure_prone'],
  ),
  FeatureDef(
    key: 'seizure_log',
    label: 'Seizure log',
    description: 'Log seizures with type, duration, and triggers.',
    category: 'neuro',
    defaultFor: ['seizure_prone'],
  ),
  FeatureDef(
    key: 'rescue_meds',
    label: 'Rescue medications',
    description: 'Quick access to as-needed meds.',
    category: 'neuro',
    defaultFor: ['seizure_prone', 'headache', 'respiratory'],
  ),
  FeatureDef(
    key: 'bp_trend',
    label: 'Blood pressure trend',
    description: 'Chart systolic/diastolic from your reports over time.',
    category: 'cardio_metabolic',
    defaultFor: ['cardiovascular', 'autonomic'],
  ),
  FeatureDef(
    key: 'glucose_trend',
    label: 'Glucose & HbA1c trend',
    description: 'Chart glucose, HbA1c, and time-in-range.',
    category: 'cardio_metabolic',
    defaultFor: ['glycemic'],
  ),
  FeatureDef(
    key: 'lipid_trend',
    label: 'Cholesterol panel trend',
    description: 'Chart LDL, HDL, total, and triglycerides over time.',
    category: 'cardio_metabolic',
    defaultFor: [],
  ),
  FeatureDef(
    key: 'oura_sync',
    label: 'Oura ring sync',
    description: 'Pull readiness, sleep, and recovery from Oura.',
    category: 'sleep_recovery',
    defaultFor: [],
    requiresDevice: true,
  ),
];

const categoryLabels = <FeatureCategory, String>{
  'neuro': 'Neurology',
  'cardio_metabolic': 'Cardio & metabolic',
  'hydration': 'Hydration',
  'sleep_recovery': 'Sleep & recovery',
  'reports': 'Reports',
};

FeatureDef? findFeature(FeatureKey key) {
  for (final def in featureCatalog) {
    if (def.key == key) return def;
  }
  return null;
}

bool isFeatureEnabled(
  FeatureKey key,
  List<String>? conditions,
  Map<String, bool>? overrides,
) {
  final override = overrides?[key];
  if (override != null) return override;
  final def = findFeature(key);
  if (def == null) return false;
  if (def.defaultOnGlobally) return true;
  return def.defaultFor.any((t) => hasTrait(conditions, t));
}

String featureDefaultReason(FeatureDef def, List<String> conditions) {
  if (def.defaultOnGlobally) return 'On for everyone by default';
  if (def.defaultFor.isEmpty) return 'Off by default, opt in if useful';
  return 'Default-on for ${defaultForLabels(def.defaultFor).toLowerCase()}';
}

List<MapEntry<FeatureCategory, List<FeatureDef>>> groupedFeatures() {
  final map = <FeatureCategory, List<FeatureDef>>{};
  for (final def in featureCatalog) {
    map.putIfAbsent(def.category, () => []).add(def);
  }
  return map.entries.toList();
}
