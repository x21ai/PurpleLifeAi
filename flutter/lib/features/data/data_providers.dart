import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers/core_providers.dart';
import '../reports/models/report_row.dart';
import '../reports/reports_repository.dart' hide metricSeriesProvider;
import '../today/models/score_snapshot.dart';
import '../today/models/today_data.dart';
import '../today/today_repository.dart';
import '../vitals/biometric_metrics.dart';
import '../vitals/vitals_repository.dart';

/// Wearable metric keys surfaced on the unified Data tab (merged preview).
const dataWearableMetricKeys = [
  'sleep_score',
  'sleep_total',
  'hrv',
  'resting_hr',
  'readiness',
  'activity_score',
];

/// Latest lab reading per metric with flag, for summary bar + lab rows.
class LabMetricLatest {
  const LabMetricLatest({
    required this.metricKey,
    required this.label,
    required this.valueLabel,
    this.flag,
    this.referenceLow,
    this.referenceHigh,
    this.spark = const [],
  });

  final String metricKey;
  final String label;
  final String valueLabel;
  final String? flag;
  final double? referenceLow;
  final double? referenceHigh;
  final List<double> spark;
}

class LabFlagSummary {
  const LabFlagSummary({
    required this.normal,
    required this.outOfRange,
    required this.total,
  });

  final int normal;
  final int outOfRange;
  final int total;

  static const empty = LabFlagSummary(normal: 0, outOfRange: 0, total: 0);
}

class WearableMetricLatest {
  const WearableMetricLatest({
    required this.metricKey,
    required this.label,
    required this.valueLabel,
    this.source,
    this.spark = const [],
  });

  final String metricKey;
  final String label;
  final String valueLabel;
  final String? source;
  final List<double> spark;
}

class DataScreenSnapshot {
  const DataScreenSnapshot({
    required this.labSummary,
    required this.labMetrics,
    required this.wearables,
    required this.hasLabs,
  });

  final LabFlagSummary labSummary;
  final List<LabMetricLatest> labMetrics;
  final List<WearableMetricLatest> wearables;
  final bool hasLabs;
}

LabFlagSummary _summarizeFlags(Map<String, List<ReportMetricRow>> seriesByKey) {
  var normal = 0;
  var out = 0;
  for (final rows in seriesByKey.values) {
    if (rows.isEmpty) continue;
    final latest = rows.last;
    final flag = latest.flag?.toLowerCase();
    if (flag == 'high' || flag == 'low' || flag == 'abnormal') {
      out++;
    } else {
      normal++;
    }
  }
  final total = normal + out;
  return LabFlagSummary(normal: normal, outOfRange: out, total: total);
}

List<LabMetricLatest> _labRows(Map<String, List<ReportMetricRow>> seriesByKey) {
  final rows = <LabMetricLatest>[];
  for (final entry in seriesByKey.entries) {
    final list = entry.value;
    if (list.isEmpty) continue;
    final latest = list.last;
    final spark = list
        .map((r) => r.value)
        .whereType<double>()
        .toList(growable: false);
    rows.add(
      LabMetricLatest(
        metricKey: latest.metricKey,
        label: latest.label,
        valueLabel: latest.valueLabel,
        flag: latest.flag,
        referenceLow: latest.referenceLow,
        referenceHigh: latest.referenceHigh,
        spark: spark,
      ),
    );
  }
  rows.sort((a, b) => a.label.compareTo(b.label));
  return rows;
}

List<WearableMetricLatest> _wearableRows(ScoreSnapshot scores) {
  final items = buildTodayVitalItems(scores);
  final out = <WearableMetricLatest>[];
  for (final key in dataWearableMetricKeys) {
    final def = biometricMetrics[key];
    if (def == null) continue;
    TodayVitalItem? match;
    for (final item in items) {
      if (item.metric == key) {
        match = item;
        break;
      }
    }
    if (match == null) continue;
    final valueLabel = match.unit != null
        ? '${_formatNum(match.value)} ${match.unit}'
        : _formatNum(match.value);
    out.add(
      WearableMetricLatest(
        metricKey: key,
        label: def.label,
        valueLabel: valueLabel,
        source: 'wearable',
      ),
    );
  }
  return out;
}

String? _sourceLabel(SourceKey? source) {
  if (source == null) return null;
  return switch (source) {
    SourceKey.oura => 'oura',
    SourceKey.whoop => 'whoop',
    SourceKey.appleHealth => 'apple_health',
    SourceKey.manual => 'manual',
  };
}

String _formatNum(double value) {
  if (value == value.roundToDouble()) return value.round().toString();
  return value.toStringAsFixed(1);
}

WearableMetricLatest? _wearableFromSeries(
  String key,
  MetricSeriesResult series,
) {
  final def = biometricMetrics[key];
  if (def == null) return null;
  if (series.headlineValue == null && series.seriesBySource.isEmpty) {
    return null;
  }
  final headlineSource = series.headlineSource;
  final points = headlineSource != null
      ? (series.seriesBySource[headlineSource] ?? const [])
      : series.seriesBySource.values.expand((p) => p).toList();
  final spark = points
      .map((p) => p.value)
      .whereType<double>()
      .toList(growable: false);
  return WearableMetricLatest(
    metricKey: key,
    label: def.label,
    valueLabel: def.format(series.headlineValue),
    source: _sourceLabel(series.headlineSource),
    spark: spark.length >= 2 ? spark : const [],
  );
}

/// Unified Data tab snapshot: lab flags + wearable rows.
final dataScreenSnapshotProvider =
    FutureProvider.autoDispose<DataScreenSnapshot>((ref) async {
  ref.keepAlive();
  ref.watch(authSessionProvider);
  final vitalsRepo = ref.read(vitalsRepositoryProvider);

  final labAndToday = await Future.wait([
    ref.watch(allMetricSeriesProvider.future),
    ref.watch(todayDataProvider.future),
  ]);
  final labSeries = labAndToday[0] as Map<String, List<ReportMetricRow>>;
  final today = labAndToday[1] as TodayData;

  final labMetrics = _labRows(labSeries);
  final summary = labMetrics.isEmpty
      ? LabFlagSummary.empty
      : _summarizeFlags(labSeries);

  final seriesByKey = await Future.wait(
    dataWearableMetricKeys.map(
      (key) => vitalsRepo.loadMetricSeries(
        MetricSeriesQuery(metricKey: key, days: 14),
      ),
    ),
  );

  final wearables = <WearableMetricLatest>[];
  for (var i = 0; i < dataWearableMetricKeys.length; i++) {
    final row = _wearableFromSeries(dataWearableMetricKeys[i], seriesByKey[i]);
    if (row != null) wearables.add(row);
  }

  if (wearables.isEmpty && today.scores.hasData) {
    wearables.addAll(_wearableRows(today.scores));
  }

  return DataScreenSnapshot(
    labSummary: summary,
    labMetrics: labMetrics,
    wearables: wearables,
    hasLabs: labMetrics.isNotEmpty,
  );
});
