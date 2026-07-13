/// Electrolyte brand presets aligned with web `electrolyte-presets.ts`.
class ElectrolytePreset {
  const ElectrolytePreset({
    required this.brand,
    required this.sodiumMg,
    required this.defaultVolumeMl,
  });

  final String brand;
  final int sodiumMg;
  final int defaultVolumeMl;
}

const List<ElectrolytePreset> kElectrolytePresets = [
  ElectrolytePreset(brand: 'LMNT', sodiumMg: 1000, defaultVolumeMl: 500),
  ElectrolytePreset(brand: 'Liquid I.V.', sodiumMg: 500, defaultVolumeMl: 500),
  ElectrolytePreset(brand: 'Pedialyte', sodiumMg: 245, defaultVolumeMl: 240),
  ElectrolytePreset(brand: 'Nuun', sodiumMg: 300, defaultVolumeMl: 500),
  ElectrolytePreset(brand: 'Gatorade', sodiumMg: 270, defaultVolumeMl: 500),
  ElectrolytePreset(brand: 'Coconut water', sodiumMg: 60, defaultVolumeMl: 330),
  ElectrolytePreset(brand: 'Pinch of salt', sodiumMg: 400, defaultVolumeMl: 250),
];

/// Quick water amounts shown in the custom-water dialog (web QUICK_AMOUNTS).
const List<int> kQuickWaterAmountsMl = [200, 250, 330, 500, 750];
