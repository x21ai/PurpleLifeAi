import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/database.dart';
import '../../core/offline/supabase_row_parse.dart';
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

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<TodayData> loadToday({String? dateYmd}) async {
    final userId = _userId;
    if (userId == null) return TodayData.empty;
    try {
      final scores = await _fetchScoreSnapshotOnline(userId, dateYmd: dateYmd);
      final profile = await _fetchProfileFieldsSafe(userId);
      final narrative = await _fetchNarrativeSafe(userId);
      final medicationCount = await _fetchMedicationCountSafe(userId);
      final journalEntryCount = await _fetchJournalCountSafe(userId);
      final announcement = await _fetchAnnouncementSafe(userId);
      final showWearablesNudge = await _fetchWearablesNudgeSafe(userId);

      return TodayData(
        scores: scores,
        firstName: profile.firstName,
        conditions: profile.conditions,
        narrative: narrative,
        medicationCount: medicationCount,
        journalEntryCount: journalEntryCount,
        announcement: announcement,
        showWearablesNudge: showWearablesNudge,
        isOffline: false,
        loadedAt: DateTime.now(),
      );
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final profile = await _fetchProfileFieldsSafe(userId);
      final narrative = await _fetchNarrativeSafe(userId);
      final medicationCount = await _fetchMedicationCountSafe(userId);
      final journalEntryCount = await _fetchJournalCountSafe(userId);
      final announcement = await _fetchAnnouncementSafe(userId);
      final showWearablesNudge = await _fetchWearablesNudgeSafe(userId);
      try {
        final cached = await _loadScoreSnapshotFromCache(userId);
        return TodayData(
          scores: cached.copyWith(isFromCache: true),
          firstName: profile.firstName,
          conditions: profile.conditions,
          narrative: narrative,
          medicationCount: medicationCount,
          journalEntryCount: journalEntryCount,
          announcement: announcement,
          showWearablesNudge: showWearablesNudge,
          isOffline: true,
          loadedAt: DateTime.now(),
        );
      } catch (cacheError, stack) {
        debugPrint('[TodayRepository] offline fallback failed: $cacheError\n$stack');
        return TodayData(
          scores: ScoreSnapshot.empty,
          firstName: profile.firstName,
          conditions: profile.conditions,
          narrative: narrative,
          medicationCount: medicationCount,
          journalEntryCount: journalEntryCount,
          announcement: announcement,
          showWearablesNudge: showWearablesNudge,
          isOffline: true,
          loadedAt: DateTime.now(),
        );
      }
    }
  }

  Future<ScoreSnapshot> loadScoreSnapshot({String? dateYmd}) async {
    final userId = _userId;
    if (userId == null) return ScoreSnapshot.empty;
    try {
      return await _fetchScoreSnapshotOnline(userId, dateYmd: dateYmd);
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final cached = await _loadScoreSnapshotFromCache(userId);
      return cached.copyWith(isFromCache: true);
    }
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
      debugPrint('[TodayRepository] biometric cache skipped: $error\n$stack');
    }
  }

  Future<ScoreSnapshot> _loadScoreSnapshotFromCache(String userId) async {
    try {
      final rows = await _database.readCachedTable('biometrics', userId: userId);
      return _computeScoreSnapshot(rows);
    } catch (error, stack) {
      debugPrint('[TodayRepository] cache read failed: $error\n$stack');
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
      tempDeviationC: latestFor('body_temp_deviation_c'),
      respRateBpm: latestFor('respiratory_rate_bpm'),
      latestAt: formatSupabaseDateTime(rows.first['recorded_at']),
      hasData: rows.isNotEmpty,
    );
  }

  Future<_ProfileFields> _fetchProfileFieldsSafe(String userId) async {
    try {
      return await _fetchProfileFields(userId);
    } catch (error, stack) {
      debugPrint('[TodayRepository] profile fetch failed: $error\n$stack');
      return const _ProfileFields();
    }
  }

  Future<_ProfileFields> _fetchProfileFields(String userId) async {
    final row = await _supabase
        .from('profiles')
        .select('first_name, conditions')
        .eq('id', userId)
        .maybeSingle();
    final raw = row?['conditions'];
    var conditions = const <String>[];
    if (raw is List) {
      conditions = raw.whereType<String>().toList();
    }
    return _ProfileFields(
      firstName: row?['first_name'] as String?,
      conditions: conditions,
    );
  }

  Future<String?> _fetchNarrativeSafe(String userId) async {
    try {
      return await _fetchNarrative(userId);
    } catch (error, stack) {
      debugPrint('[TodayRepository] narrative fetch failed: $error\n$stack');
      return null;
    }
  }

  Future<int> _fetchMedicationCountSafe(String userId) async {
    try {
      return await _fetchMedicationCount(userId);
    } catch (error, stack) {
      debugPrint('[TodayRepository] medication count failed: $error\n$stack');
      return 0;
    }
  }

  Future<int> _fetchJournalCountSafe(String userId) async {
    try {
      return await _fetchJournalCount(userId);
    } catch (error, stack) {
      debugPrint('[TodayRepository] journal count failed: $error\n$stack');
      return 0;
    }
  }

  /// Latest broadcast-or-personal admin message, mirroring the web Today
  /// `admin_messages` query. Fail-open to null.
  Future<TodayAnnouncement?> _fetchAnnouncementSafe(String userId) async {
    try {
      final row = await _supabase
          .from('admin_messages')
          .select('subject, body, created_at')
          .or('is_broadcast.eq.true,recipient_id.eq.$userId')
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();
      final subject = (row?['subject'] as String?)?.trim();
      final body = (row?['body'] as String?)?.trim();
      if (subject == null || subject.isEmpty || body == null) return null;
      return TodayAnnouncement(subject: subject, body: body);
    } catch (error, stack) {
      debugPrint('[TodayRepository] announcement fetch failed: $error\n$stack');
      return null;
    }
  }

  /// Web `ConnectWearablesCard` gate: onboarded at least a day ago and no
  /// Oura or Whoop connection. Fail-open to false (card hidden).
  Future<bool> _fetchWearablesNudgeSafe(String userId) async {
    try {
      final profile = await _supabase
          .from('profiles')
          .select('onboarded_at')
          .eq('id', userId)
          .maybeSingle();
      final onboardedAt = parseSupabaseDateTime(profile?['onboarded_at']);
      if (onboardedAt == null) return false;
      if (DateTime.now().difference(onboardedAt) < const Duration(days: 1)) {
        return false;
      }
      final oura = await _supabase
          .from('oura_tokens')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
      if (oura != null) return false;
      final whoop = await _supabase
          .from('whoop_tokens')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
      return whoop == null;
    } catch (error, stack) {
      debugPrint('[TodayRepository] wearables nudge failed: $error\n$stack');
      return false;
    }
  }

  /// Web Today reads `risk_forecasts.ai_narrative` first; falls back to
  /// `health_narratives` when no forecast narrative exists.
  Future<String?> _fetchNarrative(String userId) async {
    final forecastNarrative = await _fetchRiskForecastNarrative(userId);
    if (forecastNarrative != null) return forecastNarrative;
    return _fetchHealthNarrative(userId);
  }

  Future<String?> _fetchRiskForecastNarrative(String userId) async {
    final row = await _supabase
        .from('risk_forecasts')
        .select('ai_narrative')
        .eq('user_id', userId)
        .order('for_date', ascending: false)
        .limit(1)
        .maybeSingle();
    final narrative = (row?['ai_narrative'] as String?)?.trim();
    if (narrative == null || narrative.isEmpty) return null;
    return narrative;
  }

  Future<String?> _fetchHealthNarrative(String userId) async {
    final today = DateTime.now().toUtc();
    final dayKey =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final rows = await _supabase
        .from('health_narratives')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(30);
    final list = (rows as List).cast<Map<String, dynamic>>();
    for (final row in list) {
      final rowDay = _narrativeDayKey(row);
      final narrative = (row['narrative'] as String?)?.trim();
      if (rowDay == dayKey && narrative != null && narrative.isNotEmpty) {
        return narrative;
      }
    }
    for (final row in list) {
      final narrative = (row['narrative'] as String?)?.trim();
      if (narrative != null && narrative.isNotEmpty) return narrative;
    }
    return null;
  }

  Future<int> _fetchMedicationCount(String userId) async {
    final rows =
        await _supabase.from('medications').select('*').eq('user_id', userId);
    final list = (rows as List).cast<Map<String, dynamic>>();
    var count = 0;
    for (final row in list) {
      final active =
          _asBool(row['active']) ?? _asBool(row['is_active']) ?? true;
      if (active) count += 1;
    }
    return count;
  }

  Future<int> _fetchJournalCount(String userId) async {
    final rows = await _supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId);
    return (rows as List).length;
  }

  bool _canFailOpen(Object error) {
    // Web preview: never block Supabase reads on local cache/Drift failures.
    if (kIsWeb) return true;
    if (error is PostgrestException && _connectivity.isOnline) return false;
    return true;
  }

  double? _asDouble(Object? value) {
    if (value is num) return value.toDouble();
    if (value is String && value.isNotEmpty) return double.tryParse(value);
    return null;
  }

  bool? _asBool(Object? value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final normalized = value.trim().toLowerCase();
      if (normalized == 'true' || normalized == 't' || normalized == '1') {
        return true;
      }
      if (normalized == 'false' || normalized == 'f' || normalized == '0') {
        return false;
      }
    }
    return null;
  }

  String? _narrativeDayKey(Map<String, dynamic> row) {
    final raw = row['day'] ?? row['for_date'];
    if (raw == null) return null;
    if (raw is DateTime) {
      final utc = raw.toUtc();
      return '${utc.year.toString().padLeft(4, '0')}-${utc.month.toString().padLeft(2, '0')}-${utc.day.toString().padLeft(2, '0')}';
    }
    final text = raw.toString();
    if (text.length >= 10) return text.substring(0, 10);
    return null;
  }
}

class _ProfileFields {
  const _ProfileFields({this.firstName, this.conditions = const []});

  final String? firstName;
  final List<String> conditions;
}

final todayRepositoryProvider = Provider<TodayRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return TodayRepository(
    supabase: ref.watch(supabaseClientProvider),
    database: ref.watch(appDatabaseProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final todayDataProvider = FutureProvider.autoDispose<TodayData>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return TodayData.empty;
  final repository = ref.watch(todayRepositoryProvider);
  return repository.loadToday();
});

final scoreSnapshotProvider =
    FutureProvider.autoDispose<ScoreSnapshot>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return ScoreSnapshot.empty;
  final repository = ref.watch(todayRepositoryProvider);
  return repository.loadScoreSnapshot();
});

/// Day-filtered snapshot for the Today date strip (key: `yyyy-MM-dd`).
/// Mirrors web `getScoreSnapshot({ date })` used when browsing past days.
final scoreSnapshotForDayProvider = FutureProvider.autoDispose
    .family<ScoreSnapshot, String>((ref, dateYmd) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return ScoreSnapshot.empty;
  final repository = ref.watch(todayRepositoryProvider);
  return repository.loadScoreSnapshot(dateYmd: dateYmd);
});
