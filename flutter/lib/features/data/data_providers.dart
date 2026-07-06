import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_state.dart' as core_auth;
import '../../core/providers/core_providers.dart';
import '../reports/models/report_row.dart';
import '../reports/reports_repository.dart' hide metricSeriesProvider;
import '../today/models/score_snapshot.dart';
import '../today/models/today_data.dart';
import '../today/today_repository.dart';
import '../vitals/biometric_metrics.dart';
import '../vitals/vitals_repository.dart';

/// Per-query timeout for Data tab parallel fetches.
const dataQueryTimeout = Duration(seconds: 12);

/// Max skeleton display before surfacing a retry CTA in the UI.
const dataLoadingSkeletonMax = Duration(seconds: 15);

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
    this.loadError,
    this.failedQueries = 0,
  });

  final LabFlagSummary labSummary;
  final List<LabMetricLatest> labMetrics;
  final List<WearableMetricLatest> wearables;
  final bool hasLabs;
  final String? loadError;
  final int failedQueries;

  bool get hasAnyRows => hasLabs || wearables.isNotEmpty;

  bool get isEmptyFailure => loadError != null && !hasAnyRows;
}

class _QueryResult<T> {
  const _QueryResult._({this.value, this.error});

  final T? value;
  final Object? error;

  static Future<_QueryResult<T>> guard<T>(
    Future<T> future, {
    Duration timeout = dataQueryTimeout,
    String? debugLabel,
  }) async {
    try {
      return _QueryResult._(value: await future.timeout(timeout));
    } on TimeoutException catch (error, stackTrace) {
      debugPrint(
        '[DataScreen] query timed out${debugLabel == null ? '' : ' ($debugLabel)'}: $error\n$stackTrace',
      );
      return _QueryResult._(error: error);
    } catch (error, stackTrace) {
      debugPrint(
        '[DataScreen] query failed${debugLabel == null ? '' : ' ($debugLabel)'}: $error\n$stackTrace',
      );
      return _QueryResult._(error: error);
    }
  }
}

String? _loadErrorMessage({
  required int failedQueries,
  required bool hasAnyRows,
}) {
  if (failedQueries == 0) return null;
  if (!hasAnyRows) {
    return 'Could not load your data. Pull to refresh or retry.';
  }
  return 'Some data could not load. Pull to refresh to try again.';
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
  await ref.watch(authRepositoryProvider.future);
  final session = core_auth.readActiveSession(ref);
  if (session == null) {
    return const DataScreenSnapshot(
      labSummary: LabFlagSummary.empty,
      labMetrics: [],
      wearables: [],
      hasLabs: false,
    );
  }

  final vitalsRepo = ref.read(vitalsRepositoryProvider);

  var failedQueries = 0;

  final labAndToday = await (
    _QueryResult.guard<Map<String, List<ReportMetricRow>>>(
      ref.watch(allMetricSeriesProvider.future),
      debugLabel: 'labs',
    ),
    _QueryResult.guard<TodayData>(
      ref.watch(todayDataProvider.future),
      debugLabel: 'today',
    ),
  ).wait;
  final labResult = labAndToday.$1;
  final todayResult = labAndToday.$2;

  final labSeries =
      labResult.value ?? const <String, List<ReportMetricRow>>{};
  if (labResult.error != null) failedQueries += 1;

  final today = todayResult.value;
  if (todayResult.error != null) failedQueries += 1;

  final labMetrics = _labRows(labSeries);
  final summary = labMetrics.isEmpty
      ? LabFlagSummary.empty
      : _summarizeFlags(labSeries);

  final wearableResults = await Future.wait(
    dataWearableMetricKeys.map(
      (key) => _QueryResult.guard<MetricSeriesResult>(
        vitalsRepo.loadMetricSeries(
          MetricSeriesQuery(metricKey: key, days: 14),
        ),
        debugLabel: key,
      ),
    ),
  );

  final wearables = <WearableMetricLatest>[];
  for (var i = 0; i < dataWearableMetricKeys.length; i++) {
    final result = wearableResults[i];
    if (result.error != null) {
      failedQueries += 1;
      continue;
    }
    final series = result.value;
    if (series == null) continue;
    final row = _wearableFromSeries(dataWearableMetricKeys[i], series);
    if (row != null) wearables.add(row);
  }

  if (wearables.isEmpty && today?.scores.hasData == true) {
    wearables.addAll(_wearableRows(today!.scores));
  }

  final hasAnyRows = labMetrics.isNotEmpty || wearables.isNotEmpty;

  return DataScreenSnapshot(
    labSummary: summary,
    labMetrics: labMetrics,
    wearables: wearables,
    hasLabs: labMetrics.isNotEmpty,
    failedQueries: failedQueries,
    loadError: _loadErrorMessage(
      failedQueries: failedQueries,
      hasAnyRows: hasAnyRows,
    ),
  );
});
