import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/database.dart';
import '../../core/offline/supabase_row_parse.dart';
import '../../core/providers/core_providers.dart';
import '../today/models/score_snapshot.dart';

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
