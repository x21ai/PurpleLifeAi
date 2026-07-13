/// Pure biometric metric metadata + classification logic, ported verbatim from
/// web `src/lib/biometric-metrics.ts`. No I/O, no Supabase, no widgets state.
///
/// This is the single source of truth for the 18 metrics surfaced on the
/// Biometrics hub and detail screens. All copy strings are verbatim from web.
library;

import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

/// Direction of "better" for a metric.
enum MetricDirection { higherBetter, lowerBetter, neutral }

/// Metric grouping category.
enum MetricCategory { recovery, sleep, cardio, movement, stress }

/// Derived status of a value against the user's own baseline.
enum MetricStatus { inRange, low, high, unknown }

/// Visual tone for a status badge.
enum StatusTone {
  /// Neutral / muted (unknown, or a benign out-of-range).
  neutral,

  /// In range.
  good,

  /// Attention-worthy out-of-range (warning tint).
  warn,
}

/// Wearable data source key.
enum SourceKey { oura, whoop, appleHealth, healthConnect, manual }

// ---------------------------------------------------------------------------
// Order + category tables (§1, §2)
// ---------------------------------------------------------------------------

/// Exact display order of all 18 metrics (§1).
const List<String> metricOrder = <String>[
  'readiness',
  'whoop_recovery',
  'sleep_score',
  'whoop_sleep_performance',
  'sleep_total',
  'hrv',
  'resting_hr',
  'temp_deviation',
  'sleep_deep',
  'sleep_rem',
  'sleep_efficiency',
  'respiratory_rate',
  'spo2',
  'stress',
  'resilience',
  'activity_score',
  'whoop_strain',
  'steps',
];

/// Category render order (§2).
const List<MetricCategory> categoryOrder = <MetricCategory>[
  MetricCategory.recovery,
  MetricCategory.sleep,
  MetricCategory.cardio,
  MetricCategory.movement,
  MetricCategory.stress,
];

/// Category display labels (§2).
const Map<MetricCategory, String> categoryLabel = <MetricCategory, String>{
  MetricCategory.recovery: 'Recovery',
  MetricCategory.sleep: 'Sleep',
  MetricCategory.cardio: 'Cardio',
  MetricCategory.movement: 'Movement',
  MetricCategory.stress: 'Stress & body',
};

/// Metric key → category (§2).
const Map<String, MetricCategory> metricCategory = <String, MetricCategory>{
  'readiness': MetricCategory.recovery,
  'whoop_recovery': MetricCategory.recovery,
  'sleep_score': MetricCategory.sleep,
  'whoop_sleep_performance': MetricCategory.sleep,
  'sleep_total': MetricCategory.sleep,
  'sleep_deep': MetricCategory.sleep,
  'sleep_rem': MetricCategory.sleep,
  'sleep_efficiency': MetricCategory.sleep,
  'hrv': MetricCategory.cardio,
  'resting_hr': MetricCategory.cardio,
  'respiratory_rate': MetricCategory.cardio,
  'spo2': MetricCategory.cardio,
  'activity_score': MetricCategory.movement,
  'steps': MetricCategory.movement,
  'whoop_strain': MetricCategory.movement,
  'stress': MetricCategory.stress,
  'resilience': MetricCategory.stress,
  'temp_deviation': MetricCategory.stress,
};

// ---------------------------------------------------------------------------
// Format helpers (§3)
// ---------------------------------------------------------------------------

final NumberFormat _thousands = NumberFormat.decimalPattern('en_US');

/// `num(v, suffix)` → "–" if null else `round(v)+suffix`.
String _num(double? v, [String suffix = '']) {
  if (v == null) return '–';
  return '${v.round()}$suffix';
}

/// `dec(v, dp, suffix)` → "–" if null else `v.toFixed(dp)+suffix`.
String _dec(double? v, [int dp = 1, String suffix = '']) {
  if (v == null) return '–';
  return '${v.toStringAsFixed(dp)}$suffix';
}

/// `hm(v)` → "–" if null; else h:m from minutes.
String _hm(double? v) {
  if (v == null) return '–';
  final h = (v / 60).floor();
  final m = (v % 60).round();
  return m == 0 ? '${h}h' : '${h}h ${m}m';
}

/// temp_deviation special format (§3).
String _tempDev(double? v) {
  if (v == null) return '–';
  final sign = v > 0 ? '+' : '';
  return '$sign${v.toStringAsFixed(1)}°C';
}

/// steps: thousands separator, "–" if null.
String _steps(double? v) {
  if (v == null) return '–';
  return _thousands.format(v.round());
}

// ---------------------------------------------------------------------------
// Metric metadata (§3)
// ---------------------------------------------------------------------------

/// Full metadata for one biometric metric.
class BiometricMetricMeta {
  const BiometricMetricMeta({
    required this.key,
    required this.label,
    required this.short,
    required this.unit,
    required this.column,
    required this.direction,
    required this.meaning,
    required this.baselineHint,
    required this.format,
  });

  final String key;
  final String label;
  final String short;

  /// Display unit, or null when the metric has no unit suffix.
  final String? unit;

  /// Supabase `biometrics` column name.
  final String column;
  final MetricDirection direction;

  /// "What this means for you" copy.
  final String meaning;

  /// Baseline hint copy.
  final String baselineHint;

  /// Value formatter for the latest reading (operates on raw column value;
  /// for sleep_total/rem/deep the column stores minutes).
  final String Function(double?) format;

  MetricCategory get category =>
      metricCategory[key] ?? MetricCategory.recovery;
}

/// All 18 metrics keyed by MetricKey (§3). Copy verbatim from web.
final Map<String, BiometricMetricMeta> biometricMetrics =
    <String, BiometricMetricMeta>{
  'sleep_total': const BiometricMetricMeta(
    key: 'sleep_total',
    label: 'Total sleep',
    short: 'Sleep',
    unit: 'h:m',
    column: 'sleep_total_min',
    direction: MetricDirection.higherBetter,
    meaning:
        'How long you actually slept last night. Sleep loss is one of the most consistent triggers for seizures and mood dips, most adults do best between 7 and 9 hours.',
    baselineHint:
        'Lower than your usual by 60+ minutes is worth noticing.',
    format: _hm,
  ),
  'sleep_score': BiometricMetricMeta(
    key: 'sleep_score',
    label: 'Sleep score',
    short: 'Sleep score',
    unit: '/100',
    column: 'sleep_score',
    direction: MetricDirection.higherBetter,
    meaning:
        "Oura's overall read on your sleep quality, combining duration, efficiency, latency, and timing. Above 80 is restorative; under 65 means your body didn't fully recover.",
    baselineHint: 'Below 65 for two nights in a row is the soft alarm.',
    format: (v) => _num(v),
  ),
  'sleep_efficiency': BiometricMetricMeta(
    key: 'sleep_efficiency',
    label: 'Sleep efficiency',
    short: 'Efficiency',
    unit: '%',
    column: 'sleep_efficiency_pct',
    direction: MetricDirection.higherBetter,
    meaning:
        'The share of time in bed you actually spent sleeping. Healthy sleep is usually 85% or above.',
    baselineHint: 'Below 80% suggests fragmented or restless sleep.',
    format: (v) => _num(v, '%'),
  ),
  'sleep_rem': const BiometricMetricMeta(
    key: 'sleep_rem',
    label: 'REM sleep',
    short: 'REM',
    unit: 'min',
    column: 'sleep_rem_min',
    direction: MetricDirection.higherBetter,
    meaning:
        "REM is when your brain consolidates memory and emotion. It's also the stage some people are most seizure-prone in. Most adults get 60–110 minutes per night.",
    baselineHint: 'A big REM dip can show up before a tough day.',
    format: _hm,
  ),
  'sleep_deep': const BiometricMetricMeta(
    key: 'sleep_deep',
    label: 'Deep sleep',
    short: 'Deep',
    unit: 'min',
    column: 'sleep_deep_min',
    direction: MetricDirection.higherBetter,
    meaning:
        'Deep sleep is when your body physically restores. Most adults get 60–110 minutes; less than 40 several nights running tends to feel like brain fog.',
    baselineHint: 'Less than 40 minutes is on the low side for adults.',
    format: _hm,
  ),
  'hrv': BiometricMetricMeta(
    key: 'hrv',
    label: 'Heart rate variability',
    short: 'HRV',
    unit: 'ms',
    column: 'hrv_rmssd_ms',
    direction: MetricDirection.higherBetter,
    meaning:
        'HRV measures the small beat-to-beat variation in your heart. Higher means your nervous system is well-rested. A sharp drop is one of the earliest signals of stress, illness, or overreach.',
    baselineHint:
        'Sustained 15%+ below your baseline is the soft alarm.',
    format: (v) => _num(v, ' ms'),
  ),
  'resting_hr': BiometricMetricMeta(
    key: 'resting_hr',
    label: 'Resting heart rate',
    short: 'RHR',
    unit: 'bpm',
    column: 'resting_hr_bpm',
    direction: MetricDirection.lowerBetter,
    meaning:
        'Your overnight low. A sudden rise of 7+ bpm above your usual often shows up before you feel a cold coming on, after a hard workout, or when stress is high.',
    baselineHint:
        '+7 bpm above your usual baseline is worth a beat of attention.',
    format: (v) => _num(v, ' bpm'),
  ),
  'respiratory_rate': BiometricMetricMeta(
    key: 'respiratory_rate',
    label: 'Respiratory rate',
    short: 'Resp rate',
    unit: '/min',
    column: 'respiratory_rate_bpm',
    direction: MetricDirection.neutral,
    meaning:
        'Breaths per minute while you sleep. Steady around your baseline is good. A jump of 1.5+ breaths/min often appears the night before you feel sick.',
    baselineHint: 'Most adults sit between 12 and 20 while asleep.',
    format: (v) => _dec(v, 1, ' /min'),
  ),
  'spo2': BiometricMetricMeta(
    key: 'spo2',
    label: 'Blood oxygen',
    short: 'SpO₂',
    unit: '%',
    column: 'spo2_pct',
    direction: MetricDirection.higherBetter,
    meaning:
        'Average overnight blood oxygen. Healthy nights sit at 95% or higher. Lower or more variable readings can hint at breathing disruptions during sleep.',
    baselineHint:
        'Consistently below 94% is worth flagging to your care team.',
    format: (v) => _dec(v, 1, '%'),
  ),
  'temp_deviation': const BiometricMetricMeta(
    key: 'temp_deviation',
    label: 'Skin temperature',
    short: 'Temp Δ',
    unit: '°C',
    column: 'body_temp_deviation_c',
    direction: MetricDirection.neutral,
    meaning:
        'How far your overnight skin temperature drifted from your personal baseline. Bigger swings (positive or negative) often line up with illness, hormonal shifts, or poor recovery.',
    baselineHint: 'More than ±0.4°C from your baseline is a notable shift.',
    format: _tempDev,
  ),
  'readiness': BiometricMetricMeta(
    key: 'readiness',
    label: 'Readiness',
    short: 'Readiness',
    unit: '/100',
    column: 'oura_readiness_score',
    direction: MetricDirection.higherBetter,
    meaning:
        "Oura's read on how well-recovered you are. Above 85 means take on the day; under 65 means your body is asking you to slow down.",
    baselineHint:
        'Below 65 for two days in a row is a clear ask to slow down.',
    format: (v) => _num(v),
  ),
  'stress': BiometricMetricMeta(
    key: 'stress',
    label: 'Stress',
    short: 'Stress',
    unit: null,
    column: 'oura_stress_score',
    direction: MetricDirection.lowerBetter,
    meaning:
        "Oura's daytime stress reading. Brief spikes are normal, the thing to watch is many high-stress hours stacking across the week.",
    baselineHint:
        '25%+ above your baseline for several days is the signal.',
    format: (v) => v == null ? '–' : v.toStringAsFixed(0),
  ),
  'resilience': BiometricMetricMeta(
    key: 'resilience',
    label: 'Resilience',
    short: 'Resilience',
    unit: null,
    column: 'oura_resilience_level',
    direction: MetricDirection.higherBetter,
    meaning:
        'How well your body is absorbing daily stress over the long term. This one moves slowly, pay attention to multi-week trends rather than day-to-day.',
    baselineHint: 'Stays stable; watch the multi-week trend.',
    format: (v) => v == null ? '–' : v.toStringAsFixed(0),
  ),
  'activity_score': BiometricMetricMeta(
    key: 'activity_score',
    label: 'Activity score',
    short: 'Activity',
    unit: '/100',
    column: 'oura_activity_score',
    direction: MetricDirection.higherBetter,
    meaning:
        'Your overall movement for the day. Consistency matters more than peaks, most people feel best when this stays between 70 and 90.',
    baselineHint:
        'Big swings either way can ripple into sleep and HRV.',
    format: (v) => _num(v),
  ),
  'steps': const BiometricMetricMeta(
    key: 'steps',
    label: 'Steps',
    short: 'Steps',
    unit: null,
    column: 'steps',
    direction: MetricDirection.neutral,
    meaning:
        'Total steps for the day. Useful as a movement baseline rather than a target, sudden drops can hint at fatigue or a brewing bad day.',
    baselineHint: 'A 50%+ drop from your usual is worth noticing.',
    format: _steps,
  ),
  'whoop_recovery': BiometricMetricMeta(
    key: 'whoop_recovery',
    label: 'Recovery',
    short: 'Recovery',
    unit: '%',
    column: 'whoop_recovery_pct',
    direction: MetricDirection.higherBetter,
    meaning:
        "Whoop's read on how well your body has recovered overnight. Green (67%+) means take on the day; under 34% is the body asking for a lighter load.",
    baselineHint:
        'Two days under 34% in a row is a clear ask to slow down.',
    format: (v) => _num(v, '%'),
  ),
  'whoop_strain': BiometricMetricMeta(
    key: 'whoop_strain',
    label: 'Strain',
    short: 'Strain',
    unit: null,
    column: 'whoop_strain',
    direction: MetricDirection.neutral,
    meaning:
        "Whoop's 0–21 measure of cardiovascular load across the day. Light days sit under 10; high strain stretches past 14. Pair it with recovery, not in isolation.",
    baselineHint:
        'Several high-strain days without recovery is the soft alarm.',
    format: (v) => _dec(v, 1),
  ),
  'whoop_sleep_performance': BiometricMetricMeta(
    key: 'whoop_sleep_performance',
    label: 'Sleep performance',
    short: 'Sleep perf',
    unit: '%',
    column: 'whoop_sleep_performance_pct',
    direction: MetricDirection.higherBetter,
    meaning:
        "How much of the sleep Whoop thinks you needed you actually got. Above 85% is restorative; sustained 70% and below means a deepening sleep debt.",
    baselineHint: 'Two nights below 70% in a row is worth noticing.',
    format: (v) => _num(v, '%'),
  ),
};

/// Lookup a metric's metadata by key (null if not one of the 18).
BiometricMetricMeta? biometricMetricForKey(String key) => biometricMetrics[key];

/// Distinct set of columns across all 18 metrics (for the index select).
List<String> get biometricColumns =>
    biometricMetrics.values.map((m) => m.column).toSet().toList();

// ---------------------------------------------------------------------------
// Stats + classification (§4)
// ---------------------------------------------------------------------------

/// Result of [computeStats]: population mean/stddev + count.
class MetricStats {
  const MetricStats({this.mean, this.stddev, required this.count});

  final double? mean;
  final double? stddev;
  final int count;

  static const empty = MetricStats(count: 0);
}

/// `stats(nums)` — population stddev (÷n). null mean/stddev if empty (§4).
MetricStats computeStats(Iterable<double?> nums) {
  final values = nums.whereType<double>().where((v) => v.isFinite).toList();
  if (values.isEmpty) return MetricStats.empty;
  final mean = values.reduce((a, b) => a + b) / values.length;
  final variance = values
          .map((v) => (v - mean) * (v - mean))
          .reduce((a, b) => a + b) /
      values.length;
  return MetricStats(
    mean: mean,
    stddev: math.sqrt(variance),
    count: values.length,
  );
}

/// `classifyValue(meta, value, baseline)` — direction-agnostic z-score (§4).
MetricStatus classifyValue(
  BiometricMetricMeta meta,
  double? value,
  MetricStats baseline,
) {
  if (value == null || baseline.mean == null || baseline.stddev == null) {
    return MetricStatus.unknown;
  }
  final sd = math.max(baseline.stddev!, baseline.mean! * 0.05);
  if (sd == 0) return MetricStatus.inRange;
  final z = (value - baseline.mean!) / sd;
  if (z.abs() <= 1) return MetricStatus.inRange;
  return z > 1 ? MetricStatus.high : MetricStatus.low;
}

/// Tone + label for a status badge (§4).
class StatusToneResult {
  const StatusToneResult({required this.label, required this.tone});

  final String label;
  final StatusTone tone;
}

/// `statusTone(meta, status)` (§4).
StatusToneResult statusTone(BiometricMetricMeta meta, MetricStatus status) {
  switch (status) {
    case MetricStatus.unknown:
      return const StatusToneResult(label: '–', tone: StatusTone.neutral);
    case MetricStatus.inRange:
      return const StatusToneResult(
        label: 'In range',
        tone: StatusTone.good,
      );
    case MetricStatus.low:
    case MetricStatus.high:
      final low = status == MetricStatus.low;
      final high = status == MetricStatus.high;
      final bad = (meta.direction == MetricDirection.higherBetter && low) ||
          (meta.direction == MetricDirection.lowerBetter && high);
      if (bad || meta.direction == MetricDirection.neutral) {
        return const StatusToneResult(
          label: 'Pay attention',
          tone: StatusTone.warn,
        );
      }
      // A "good-direction" out-of-range (e.g. higher_better & high).
      return StatusToneResult(
        label: low ? 'Low' : 'High',
        tone: StatusTone.neutral,
      );
  }
}

/// `isAttention(meta, status)` — "needs a look" trigger (§4).
bool isAttention(BiometricMetricMeta meta, MetricStatus status) {
  if (status == MetricStatus.unknown || status == MetricStatus.inRange) {
    return false;
  }
  if (meta.direction == MetricDirection.higherBetter) {
    return status == MetricStatus.low;
  }
  if (meta.direction == MetricDirection.lowerBetter) {
    return status == MetricStatus.high;
  }
  return true; // neutral: any out-of-range
}

// ---------------------------------------------------------------------------
// Source metadata (§6)
// ---------------------------------------------------------------------------

/// Source display order (§6).
const List<SourceKey> sources = <SourceKey>[
  SourceKey.oura,
  SourceKey.whoop,
  SourceKey.appleHealth,
  SourceKey.healthConnect,
  SourceKey.manual,
];

/// Map a raw `source` string to a [SourceKey], or null if not recognized.
SourceKey? sourceKeyFromString(String? raw) {
  switch (raw) {
    case 'oura':
      return SourceKey.oura;
    case 'whoop':
      return SourceKey.whoop;
    case 'apple_health':
      return SourceKey.appleHealth;
    case 'health_connect':
      return SourceKey.healthConnect;
    case 'manual':
      return SourceKey.manual;
    default:
      return null;
  }
}

/// Canonical string for a [SourceKey] (matches DB values).
String sourceKeyToString(SourceKey key) {
  switch (key) {
    case SourceKey.oura:
      return 'oura';
    case SourceKey.whoop:
      return 'whoop';
    case SourceKey.appleHealth:
      return 'apple_health';
    case SourceKey.healthConnect:
      return 'health_connect';
    case SourceKey.manual:
      return 'manual';
  }
}

/// Source display labels (§6).
const Map<SourceKey, String> sourceLabels = <SourceKey, String>{
  SourceKey.oura: 'Oura',
  SourceKey.whoop: 'Whoop',
  SourceKey.appleHealth: 'Apple Health',
  SourceKey.healthConnect: 'Health Connect',
  SourceKey.manual: 'Manual',
};

/// Source line colors (§6). Oura falls back to the purple-primary token,
/// resolved at the UI layer; the others are fixed hex.
const Map<SourceKey, Color> sourceColors = <SourceKey, Color>{
  SourceKey.whoop: Color(0xFF34D399),
  SourceKey.appleHealth: Color(0xFFF472B6),
  SourceKey.healthConnect: Color(0xFFF472B6),
  SourceKey.manual: Color(0xFFA1A1AA),
};

/// One row of the source capability matrix (§6).
class SourceCapabilityRow {
  const SourceCapabilityRow({
    required this.label,
    required this.oura,
    required this.whoop,
    required this.apple,
  });

  final String label;
  final bool oura;
  final bool whoop;
  final bool apple;
}

/// Static "What does each source provide?" capability matrix (§6).
const List<SourceCapabilityRow> sourceFieldMatrix = <SourceCapabilityRow>[
  SourceCapabilityRow(
      label: 'Total sleep', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(
      label: 'Sleep score', oura: true, whoop: true, apple: false),
  SourceCapabilityRow(
      label: 'REM / Deep sleep', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(
      label: 'HRV (RMSSD)', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(
      label: 'Resting HR', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(
      label: 'Respiratory rate', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(label: 'SpO₂', oura: true, whoop: false, apple: true),
  SourceCapabilityRow(
      label: 'Skin temperature', oura: true, whoop: false, apple: true),
  SourceCapabilityRow(
      label: 'Readiness / Recovery', oura: true, whoop: true, apple: false),
  SourceCapabilityRow(
      label: 'Stress / Strain', oura: true, whoop: true, apple: false),
  SourceCapabilityRow(label: 'Steps', oura: true, whoop: false, apple: true),
  SourceCapabilityRow(
      label: 'Active calories', oura: true, whoop: true, apple: true),
  SourceCapabilityRow(label: 'VO₂max', oura: false, whoop: false, apple: true),
  SourceCapabilityRow(
      label: 'Workout minutes', oura: true, whoop: true, apple: true),
];

/// Footnote for the source matrix (§6).
const String sourceMatrixFootnote =
    'When multiple sources report the same signal, the card shows one colored '
    'line per source so you can compare them side by side.';

// ---------------------------------------------------------------------------
// Range & compare option sets (§8)
// ---------------------------------------------------------------------------

/// Range option: label + window length in days.
class RangeOption {
  const RangeOption(this.key, this.label, this.days);
  final String key;
  final String label;
  final int days;
}

/// Range options in display order (§8). Default = 30d.
const List<RangeOption> rangeOptions = <RangeOption>[
  RangeOption('1d', 'Today', 1),
  RangeOption('7d', '7d', 7),
  RangeOption('30d', '30d', 30),
  RangeOption('90d', '90d', 90),
  RangeOption('365d', '1y', 365),
];

/// Comparison mode (§8).
enum CompareMode { none, previous, yearAgo }

/// Compare button labels (§8).
String compareModeLabel(CompareMode mode) {
  switch (mode) {
    case CompareMode.none:
      return 'No compare';
    case CompareMode.previous:
      return 'vs previous';
    case CompareMode.yearAgo:
      return 'vs year ago';
  }
}

/// Lookback window (days) needed to cover a comparison (§8).
int lookbackDaysForCompare(int windowDays, CompareMode mode) {
  switch (mode) {
    case CompareMode.none:
      return windowDays;
    case CompareMode.previous:
      return windowDays * 2;
    case CompareMode.yearAgo:
      return 365 + windowDays;
  }
}
