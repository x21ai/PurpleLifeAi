import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/database.dart';
import '../../core/providers/core_providers.dart';
import 'models/score_snapshot.dart';
import 'models/today_data.dart';

/// Fetches Today data from Supabase with Drift fallback when offline.
/// Mirrors `getScoreSnapshot` and Today page queries without server functions.
class TodayRepository {
  TodayRepository({
    required SupabaseClient supabase,
    required AppDatabase database,
    required ConnectivityService connectivity,
  })  : _supabase = supabase,
        _database = database,
        _connectivity = connectivity;

  final SupabaseClient _supabase;
  final AppDatabase _database;
  final ConnectivityService _connectivity;

  String? get _userId => _supabase.auth.currentUser?.id;

  Future<TodayData> loadToday({String? dateYmd}) async {
    final userId = _userId;
    if (userId == null) return TodayData.empty;

    if (_connectivity.isOnline) {
      try {
        final results = await Future.wait([
          _fetchScoreSnapshotOnline(userId, dateYmd: dateYmd),
          _fetchProfile(userId),
          _fetchNarrative(userId),
          _fetchMedicationCount(userId),
          _fetchJournalCount(userId),
        ]);
        final scores = results[0] as ScoreSnapshot;
        return TodayData(
          scores: scores,
          firstName: results[1] as String?,
          narrative: results[2] as String?,
          medicationCount: results[3] as int,
          journalEntryCount: results[4] as int,
          isOffline: false,
          loadedAt: DateTime.now(),
        );
      } catch (_) {
        // Fall through to cache on network or Supabase errors.
      }
    }

    final cached = await _loadScoreSnapshotFromCache(userId);
    return TodayData(
      scores: cached.copyWith(isFromCache: true),
      isOffline: true,
      loadedAt: DateTime.now(),
    );
  }

  Future<ScoreSnapshot> loadScoreSnapshot({String? dateYmd}) async {
    final userId = _userId;
    if (userId == null) return ScoreSnapshot.empty;

    if (_connectivity.isOnline) {
      try {
        return await _fetchScoreSnapshotOnline(userId, dateYmd: dateYmd);
      } catch (_) {
        // Cache fallback below.
      }
    }
    final cached = await _loadScoreSnapshotFromCache(userId);
    return cached.copyWith(isFromCache: true);
  }

  Future<ScoreSnapshot> _fetchScoreSnapshotOnline(
    String userId, {
    String? dateYmd,
  }) async {
    const lookbackDays = 60;
    final since = DateTime.now()
        .subtract(const Duration(days: lookbackDays))
        .toUtc()
        .toIso8601String();

    final response = await _supabase
        .from('biometrics')
        .select(
          'id, recorded_at, oura_readiness_score, sleep_score, oura_activity_score, '
          'oura_stress_score, hrv_rmssd_ms, resting_hr_bpm, vo2_max, spo2_pct, steps',
        )
        .eq('user_id', userId)
        .gte('recorded_at', since)
        .order('recorded_at', ascending: false)
        .limit(200);

    final rows = (response as List).cast<Map<String, dynamic>>();
    await _cacheBiometricRows(userId, rows);

    return _computeScoreSnapshot(rows, dateYmd: dateYmd);
  }

  Future<void> _cacheBiometricRows(
    String userId,
    List<Map<String, dynamic>> rows,
  ) async {
    for (final row in rows) {
      final recordedAtRaw = row['recorded_at'] as String?;
      if (recordedAtRaw == null) continue;
      final id = (row['id'] as String?) ?? '${userId}_$recordedAtRaw';
      final payload = Map<String, dynamic>.from(row)
        ..['id'] = id
        ..['user_id'] = userId;
      await _database.upsertBiometricCache(
        id: id,
        userId: userId,
        payload: payload,
        recordedAt: DateTime.parse(recordedAtRaw),
      );
    }
    await _database.setLastSyncedAt('biometrics', DateTime.now().toUtc());
  }

  Future<ScoreSnapshot> _loadScoreSnapshotFromCache(String userId) async {
    final rows = await _database.readCachedTable('biometrics', userId: userId);
    return _computeScoreSnapshot(rows);
  }

  ScoreSnapshot _computeScoreSnapshot(
    List<Map<String, dynamic>> rows, {
    String? dateYmd,
  }) {
    if (rows.isEmpty) return ScoreSnapshot.empty;

    final dayRows = dateYmd == null
        ? rows
        : rows.where((row) {
            final recordedAt = row['recorded_at'] as String?;
            if (recordedAt == null) return false;
            return recordedAt.startsWith(dateYmd);
          }).toList();

    double? latestFor(String key) {
      for (final row in dayRows) {
        final value = row[key];
        if (value != null) return (value as num).toDouble();
      }
      return null;
    }

    double? averageStepsWithin(int days) {
      const dayMs = 24 * 3600 * 1000;
      final now = DateTime.now().millisecondsSinceEpoch;
      final values = <double>[];
      for (final row in rows) {
        final steps = row['steps'];
        final recordedAt = row['recorded_at'] as String?;
        if (steps == null || recordedAt == null) continue;
        final age = now - DateTime.parse(recordedAt).millisecondsSinceEpoch;
        if (age <= days * dayMs) values.add((steps as num).toDouble());
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
      latestAt: rows.first['recorded_at'] as String?,
      hasData: rows.isNotEmpty,
    );
  }

  Future<String?> _fetchProfile(String userId) async {
    final row = await _supabase
        .from('profiles')
        .select('first_name')
        .eq('id', userId)
        .maybeSingle();
    return row?['first_name'] as String?;
  }

  Future<String?> _fetchNarrative(String userId) async {
    final today = DateTime.now().toUtc();
    final dayKey =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final row = await _supabase
        .from('health_narratives')
        .select('narrative')
        .eq('user_id', userId)
        .eq('for_date', dayKey)
        .maybeSingle();
    return row?['narrative'] as String?;
  }

  Future<int> _fetchMedicationCount(String userId) async {
    final rows = await _supabase
        .from('medications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);
    return (rows as List).length;
  }

  Future<int> _fetchJournalCount(String userId) async {
    final rows = await _supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId);
    return (rows as List).length;
  }
}

final todayRepositoryProvider = Provider<TodayRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return TodayRepository(
    supabase: ref.watch(supabaseClientProvider),
    database: ref.watch(appDatabaseProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final todayDataProvider = FutureProvider.autoDispose<TodayData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(todayRepositoryProvider).loadToday();
});

final scoreSnapshotProvider = FutureProvider.autoDispose<ScoreSnapshot>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(todayRepositoryProvider).loadScoreSnapshot();
});
