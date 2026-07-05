import 'dart:math' show sqrt;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/database.dart';
import '../../core/offline/supabase_row_parse.dart';
import '../../core/providers/core_providers.dart';
import '../today/models/score_snapshot.dart';
import 'synced_data_overview.dart';

/// One daily value for metric trend charts.
class MetricDayPoint {
  const MetricDayPoint({required this.dateYmd, this.value});

  final String dateYmd;
  final double? value;
}

/// Query key for [metricTrendProvider] (metric + window length).
class MetricTrendQuery {
  const MetricTrendQuery({required this.metricKey, this.days = 7});

  final String metricKey;
  final int days;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MetricTrendQuery &&
          metricKey == other.metricKey &&
          days == other.days;

  @override
  int get hashCode => Object.hash(metricKey, days);
}

/// Aggregated trend stats mirroring web `stats()` from `biometric-metrics.ts`.
class MetricTrendStats {
  const MetricTrendStats({
    this.mean,
    this.stddev,
    required this.count,
    required this.dayCount,
  });

  final double? mean;
  final double? stddev;

  /// Number of non-null readings in the window.
  final int count;

  /// Calendar days with at least one reading.
  final int dayCount;

  static const empty = MetricTrendStats(count: 0, dayCount: 0);
}

class MetricTrendResult {
  const MetricTrendResult({required this.points, required this.stats});

  final List<MetricDayPoint> points;
  final MetricTrendStats stats;
}

/// Distinct-day counts per wearable source in the last 90 days.
class WearableCoverage {
  const WearableCoverage({
    required this.daysBySource,
    this.lastReadingBySource = const {},
  });

  final Map<String, int> daysBySource;
  final Map<String, String> lastReadingBySource;

  int daysForSource(String source) => daysBySource[source] ?? 0;

  static const empty = WearableCoverage(daysBySource: {});
}

/// Loads Vitals biometrics from Supabase with offline cache fallback only.
/// Unlike Today, does not fail-open when online: errors surface retry UI.
class VitalsRepository {
  VitalsRepository({
    required SupabaseClient supabase,
    required AppDatabase database,
    required ConnectivityService connectivity,
  })  : _supabase = supabase,
        _database = database,
        _connectivity = connectivity;

  final SupabaseClient _supabase;
  final AppDatabase _database;
  final ConnectivityService _connectivity;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  /// Latest value per calendar day for the last [days] days (newest last).
  Future<List<MetricDayPoint>> loadMetricTrend(
    String metricKey, {
    int days = 7,
  }) async {
    final userId = _userId;
    if (userId == null) return const [];

    final column = _columnForMetricKey(metricKey);
    if (column == null) return const [];

    final since = DateTime.now().subtract(Duration(days: days + 2));
    try {
      final response = await _supabase
          .from('biometrics')
          .select('recorded_at, $column')
          .eq('user_id', userId)
          .gte('recorded_at', formatSupabaseFilterTimestamp(since))
          .order('recorded_at', ascending: true)
          .limit(500);
      final rows = (response as List).cast<Map<String, dynamic>>();
      return _aggregateDailyTrend(rows, column: column, days: days);
    } catch (error, stack) {
      debugPrint('[VitalsRepository] metric trend failed: $error\n$stack');
      if (!_canUseOfflineCache(error)) rethrow;
      try {
        final rows = await _database.readCachedTable('biometrics', userId: userId);
        return _aggregateDailyTrend(rows, column: column, days: days);
      } catch (_) {
        return const [];
      }
    }
  }

  String? _columnForMetricKey(String metricKey) {
    return switch (metricKey) {
      'readiness' => 'oura_readiness_score',
      'sleep_score' => 'sleep_score',
      'activity_score' => 'oura_activity_score',
      'stress' => 'oura_stress_score',
      'hrv' => 'hrv_rmssd_ms',
      'resting_hr' => 'resting_hr_bpm',
      'spo2' => 'spo2_pct',
      'steps' => 'steps',
      _ => null,
    };
  }

  List<MetricDayPoint> _aggregateDailyTrend(
    List<Map<String, dynamic>> rows, {
    required String column,
    required int days,
  }) {
    final byDay = <String, double>{};
    for (final row in rows) {
      final day = formatSupabaseDateTime(row['recorded_at']);
      if (day == null) continue;
      final ymd = day.substring(0, 10);
      final value = _asDouble(row[column]);
      if (value != null) byDay[ymd] = value;
    }

    final today = DateTime.now();
    final points = <MetricDayPoint>[];
    for (var i = days - 1; i >= 0; i--) {
      final d = DateTime(today.year, today.month, today.day)
          .subtract(Duration(days: i));
      final ymd =
          '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      points.add(MetricDayPoint(dateYmd: ymd, value: byDay[ymd]));
    }
    return points;
  }

  MetricTrendStats statsFromPoints(List<MetricDayPoint> points) {
    final values = points.map((p) => p.value).whereType<double>().toList();
    final dayCount = points.where((p) => p.value != null).length;
    if (values.isEmpty) {
      return MetricTrendStats(count: 0, dayCount: dayCount);
    }
    final mean = values.reduce((a, b) => a + b) / values.length;
    final variance =
        values.map((v) => (v - mean) * (v - mean)).reduce((a, b) => a + b) /
            values.length;
    return MetricTrendStats(
      mean: mean,
      stddev: variance > 0 ? sqrt(variance) : 0,
      count: values.length,
      dayCount: dayCount,
    );
  }

  Future<MetricTrendResult> loadMetricTrendResult(MetricTrendQuery query) async {
    final points = await loadMetricTrend(
      query.metricKey,
      days: query.days,
    );
    return MetricTrendResult(
      points: points,
      stats: statsFromPoints(points),
    );
  }

  Future<WearableCoverage> loadWearableCoverage({int days = 90}) async {
    final userId = _userId;
    if (userId == null) return WearableCoverage.empty;

    final since = DateTime.now().subtract(Duration(days: days + 2));
    try {
      final response = await _supabase
          .from('biometrics')
          .select('recorded_at, source')
          .eq('user_id', userId)
          .gte('recorded_at', formatSupabaseFilterTimestamp(since))
          .order('recorded_at', ascending: true)
          .limit(2000);
      return _aggregateCoverage(
        (response as List).cast<Map<String, dynamic>>(),
        days: days,
      );
    } catch (error, stack) {
      debugPrint('[VitalsRepository] coverage failed: $error\n$stack');
      if (!_canUseOfflineCache(error)) rethrow;
      try {
        final rows =
            await _database.readCachedTable('biometrics', userId: userId);
        return _aggregateCoverage(rows, days: days);
      } catch (_) {
        return WearableCoverage.empty;
      }
    }
  }

  WearableCoverage _aggregateCoverage(
    List<Map<String, dynamic>> rows, {
    required int days,
  }) {
    final bySource = <String, Set<String>>{};
    final latestBySource = <String, String>{};
    for (final row in rows) {
      final recordedAt = formatSupabaseDateTime(row['recorded_at']);
      if (recordedAt == null) continue;
      final ymd = recordedAt.substring(0, 10);
      final source = (row['source'] as String?)?.trim();
      if (source == null || source.isEmpty) continue;
      bySource.putIfAbsent(source, () => {}).add(ymd);
      final prior = latestBySource[source];
      if (prior == null || recordedAt.compareTo(prior) > 0) {
        latestBySource[source] = recordedAt;
      }
    }

    final today = DateTime.now();
    final window = <String>{};
    for (var i = 0; i < days; i++) {
      final d = DateTime(today.year, today.month, today.day)
          .subtract(Duration(days: i));
      window.add(
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}',
      );
    }

    final counts = <String, int>{};
    for (final entry in bySource.entries) {
      counts[entry.key] =
          entry.value.where((ymd) => window.contains(ymd)).length;
    }
    return WearableCoverage(
      daysBySource: counts,
      lastReadingBySource: latestBySource,
    );
  }

  Future<SyncedDataOverview> loadSyncedDataOverview({int days = 90}) async {
    final userId = _userId;
    if (userId == null) return SyncedDataOverview.empty;

    final coverage = await loadWearableCoverage(days: days);
    try {
      final rows = await Future.wait([
        _supabase
            .from('oura_tokens')
            .select('last_sync_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle(),
        _supabase
            .from('whoop_tokens')
            .select('last_sync_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle(),
        _supabase
            .from('apple_health_tokens')
            .select('last_sync_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle(),
      ]);

      final ouraRow = rows[0];
      final whoopRow = rows[1];
      final appleRow = rows[2];

      String? tokenSync(Map<String, dynamic>? row) =>
          (row?['last_sync_at'] as String?) ?? (row?['updated_at'] as String?);

      return SyncedDataOverview.merge(
        coverage: coverage,
        tokenLastSync: {
          'oura': tokenSync(ouraRow),
          'whoop': tokenSync(whoopRow),
          'apple_health': tokenSync(appleRow),
          'health_connect': tokenSync(appleRow),
        },
        tokenConnected: {
          'oura': ouraRow != null,
          'whoop': whoopRow != null,
          'apple_health': appleRow != null,
          'health_connect': appleRow != null,
        },
        windowDays: days,
      );
    } catch (error, stack) {
      debugPrint('[VitalsRepository] sync overview failed: $error\n$stack');
      if (!_canUseOfflineCache(error)) rethrow;
      return SyncedDataOverview.merge(
        coverage: coverage,
        tokenLastSync: const {},
        tokenConnected: const {},
        windowDays: days,
      );
    }
  }

  Future<ScoreSnapshot> loadScoreSnapshot({String? dateYmd}) async {
    final userId = _userId;
    if (userId == null) return ScoreSnapshot.empty;

    try {
      return await _fetchScoreSnapshotOnline(userId, dateYmd: dateYmd);
    } catch (error) {
      if (!_canUseOfflineCache(error)) rethrow;
      final cached = await _loadScoreSnapshotFromCache(userId);
      return cached.copyWith(isFromCache: true);
    }
  }

  bool _canUseOfflineCache(Object error) {
    if (kIsWeb) return true;
    if (_connectivity.isOnline) return false;
    return error is! PostgrestException;
  }

  Future<ScoreSnapshot> _fetchScoreSnapshotOnline(
    String userId, {
    String? dateYmd,
  }) async {
    const lookbackDays = 60;
    final since = formatSupabaseFilterTimestamp(
      DateTime.now().subtract(const Duration(days: lookbackDays)),
    );

    final response = await _supabase
        .from('biometrics')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', since)
        .order('recorded_at', ascending: false)
        .limit(200);

    final rows = (response as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
    if (!kIsWeb) {
      await _cacheBiometricRowsBestEffort(userId, rows);
    }

    if (rows.isNotEmpty) {
      return _computeScoreSnapshot(rows, dateYmd: dateYmd);
    }
    if (kIsWeb) {
      return _computeScoreSnapshot(rows, dateYmd: dateYmd);
    }
    final cached = await _loadScoreSnapshotFromCache(userId);
    if (cached.hasData) return cached;
    return _computeScoreSnapshot(rows, dateYmd: dateYmd);
  }

  Future<void> _cacheBiometricRowsBestEffort(
    String userId,
    List<Map<String, dynamic>> rows,
  ) async {
    try {
      for (final row in rows) {
        final recordedAt = parseSupabaseDateTime(row['recorded_at']);
        if (recordedAt == null) continue;
        final id = (row['id'] as String?) ?? '${userId}_$recordedAt';
        final payload = Map<String, dynamic>.from(row)
          ..['id'] = id
          ..['user_id'] = userId
          ..['recorded_at'] = recordedAt.toIso8601String();
        await _database.upsertBiometricCache(
          id: id,
          userId: userId,
          payload: payload,
          recordedAt: recordedAt,
        );
      }
      await _database.setLastSyncedAt('biometrics', DateTime.now().toUtc());
    } catch (error, stack) {
      debugPrint('[VitalsRepository] biometric cache skipped: $error\n$stack');
    }
  }

  Future<ScoreSnapshot> _loadScoreSnapshotFromCache(String userId) async {
    try {
      final rows = await _database.readCachedTable('biometrics', userId: userId);
      return _computeScoreSnapshot(rows);
    } catch (error, stack) {
      debugPrint('[VitalsRepository] cache read failed: $error\n$stack');
      return ScoreSnapshot.empty;
    }
  }

  ScoreSnapshot _computeScoreSnapshot(
    List<Map<String, dynamic>> rows, {
    String? dateYmd,
  }) {
    if (rows.isEmpty) return ScoreSnapshot.empty;

    final dayRows = dateYmd == null
        ? rows
        : rows.where((row) {
            final recordedAt = formatSupabaseDateTime(row['recorded_at']);
            if (recordedAt == null) return false;
            return recordedAt.startsWith(dateYmd);
          }).toList();

    double? latestFor(String key) {
      for (final row in dayRows) {
        final value = _asDouble(row[key]);
        if (value != null) return value;
      }
      return null;
    }

    double? averageStepsWithin(int days) {
      const dayMs = 24 * 3600 * 1000;
      final now = DateTime.now().millisecondsSinceEpoch;
      final values = <double>[];
      for (final row in rows) {
        final steps = _asDouble(row['steps']);
        final recordedAt = parseSupabaseDateTime(row['recorded_at']);
        if (steps == null || recordedAt == null) continue;
        final age = now - recordedAt.millisecondsSinceEpoch;
        if (age <= days * dayMs) values.add(steps);
      }
      if (values.isEmpty) return null;
      return (values.reduce((a, b) => a + b) / values.length).roundToDouble();
    }

    return ScoreSnapshot(
      readiness: latestFor('oura_readiness_score'),
      sleepScore: latestFor('sleep_score'),
      activity: latestFor('oura_activity_score'),
      stress: latestFor('oura_stress_score'),
      hrvMs: latestFor('hrv_rmssd_ms'),
      restingHr: latestFor('resting_hr_bpm'),
      vo2max: latestFor('vo2_max'),
      spo2: latestFor('spo2_pct'),
      steps: latestFor('steps'),
      stepsAvg30: averageStepsWithin(30),
      stepsAvg60: averageStepsWithin(60),
      latestAt: formatSupabaseDateTime(rows.first['recorded_at']),
      hasData: rows.isNotEmpty,
    );
  }

  double? _asDouble(Object? value) {
    if (value is num) return value.toDouble();
    if (value is String && value.isNotEmpty) return double.tryParse(value);
    return null;
  }
}

final vitalsRepositoryProvider = Provider<VitalsRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return VitalsRepository(
    supabase: ref.watch(supabaseClientProvider),
    database: ref.watch(appDatabaseProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final vitalsSnapshotProvider =
    FutureProvider.autoDispose<ScoreSnapshot>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return ScoreSnapshot.empty;
  final repository = ref.watch(vitalsRepositoryProvider);
  return repository.loadScoreSnapshot();
});

final metricTrendProvider = FutureProvider.autoDispose
    .family<MetricTrendResult, MetricTrendQuery>((ref, query) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) {
    return const MetricTrendResult(
      points: [],
      stats: MetricTrendStats.empty,
    );
  }
  return ref.watch(vitalsRepositoryProvider).loadMetricTrendResult(query);
});

final wearableCoverageProvider =
    FutureProvider.autoDispose<WearableCoverage>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return WearableCoverage.empty;
  return ref.watch(vitalsRepositoryProvider).loadWearableCoverage();
});

final syncedDataOverviewProvider =
    FutureProvider.autoDispose<SyncedDataOverview>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return SyncedDataOverview.empty;
  return ref.watch(vitalsRepositoryProvider).loadSyncedDataOverview();
});
