import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;
import 'package:uuid/uuid.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/sync_service.dart';
import '../../core/providers/core_providers.dart';
import 'meds_today.dart';
import 'models/dose.dart';
import 'models/medication.dart';

bool _repoTzInit = false;

void _ensureTimezonesForRepo() {
  if (_repoTzInit) return;
  tz_data.initializeTimeZones();
  _repoTzInit = true;
}

tz.Location _locationForHistory(String tzName) {
  _ensureTimezonesForRepo();
  try {
    return tz.getLocation(tzName);
  } catch (_) {
    return tz.UTC;
  }
}

/// Meds and doses loaded from Supabase with Drift cache fallback.
class MedsRepository {
  MedsRepository({
    required SupabaseClient supabase,
    required SyncService syncService,
    required ConnectivityService connectivity,
    Uuid? uuid,
  })  : _supabase = supabase,
        _sync = syncService,
        _connectivity = connectivity,
        _uuid = uuid ?? const Uuid();

  final SupabaseClient _supabase;
  final SyncService _sync;
  final ConnectivityService _connectivity;
  final Uuid _uuid;

  static const _doseSelect =
      'id, medication_id, scheduled_at, status, amount, unit, taken_at, '
      'medication:medications('
      'id, name, dosage, dosage_amount, dosage_unit, times_of_day, '
      'pills_remaining, is_rescue, kind, active, start_date, end_date'
      ')';

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<MedsData> loadMeds({String? viewDateYmd}) async {
    final userId = _userId;
    if (userId == null) return MedsData.empty;
    try {
      _kickSyncIfOnline();
      final timezone = await fetchProfileTimezone(userId, _supabase);
      final medRows = await _fetchMedicationRows(userId);

      if (_connectivity.isOnline) {
        await _regenerateTodayDoses(userId);
      }

      final todayStr = viewDateYmd ?? todayStringForTimezone(timezone);
      final window = dayWindowForTimezone(timezone, todayStr);
      final doseRows = await _fetchDoseRowsForWindow(
        userId,
        startIso: window.startIso,
        endIso: window.endIso,
      );

      final since = DateTime.now().toUtc().subtract(const Duration(days: 14));
      final adherenceRows = await _fetchDoseRowsForWindow(
        userId,
        startIso: since.toIso8601String(),
        endIso: DateTime.now().toUtc().toIso8601String(),
      );

      return _toMedsData(
        medRows: medRows,
        todayDoseRows: doseRows,
        adherenceDoseRows: adherenceRows,
        timezone: timezone,
        todayLabel: window.label,
        isOffline: false,
        allowPartialRows: false,
      );
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final medRows = await _sync.readCached(tableName: SyncTables.medications);
      final doseRows =
          await _sync.readCached(tableName: SyncTables.medicationDoses);
      return _toMedsData(
        medRows: medRows,
        todayDoseRows: doseRows,
        adherenceDoseRows: doseRows,
        timezone: resolveUserTimezone(null),
        todayLabel: DateFormat.yMMMMEEEEd().format(DateTime.now()),
        isOffline: true,
        allowPartialRows: true,
      );
    }
  }

  Future<Medication?> loadMedicationById(String medId) async {
    final userId = _userId;
    if (userId == null) return null;
    try {
      final row = await _supabase
          .from('medications')
          .select('*')
          .eq('id', medId)
          .eq('user_id', userId)
          .maybeSingle();
      if (row == null) return null;
      return Medication.fromJson(_normalizeMedicationRow(row));
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final cached = await _sync.readCached(tableName: SyncTables.medications);
      for (final row in cached) {
        if (row['id']?.toString() == medId) {
          return Medication.fromJson(_normalizeMedicationRow(row));
        }
      }
      return null;
    }
  }

  Future<List<MedicationDose>> loadDosesForMedication(
    String medId, {
    int limit = 30,
  }) async {
    final userId = _userId;
    if (userId == null) return const [];
    try {
      final response = await _supabase
          .from('medication_doses')
          .select(_doseSelect)
          .eq('user_id', userId)
          .eq('medication_id', medId)
          .order('scheduled_at', ascending: false)
          .limit(limit);
      final rows = (response as List).cast<Map<String, dynamic>>();
      final medById = <String, Medication>{};
      return _parseDoses(
        rows,
        medById: medById,
        allowPartialRows: false,
      );
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final cached =
          await _sync.readCached(tableName: SyncTables.medicationDoses);
      final filtered = cached
          .where((row) => row['medication_id']?.toString() == medId)
          .toList();
      return _parseDoses(
        filtered,
        medById: {},
        allowPartialRows: true,
      );
    }
  }

  Future<({List<DoseHistoryDay> groups, String timezone})> loadDoseHistory({
    int days = 30,
  }) async {
    final userId = _userId;
    if (userId == null) {
      return (groups: const <DoseHistoryDay>[], timezone: 'UTC');
    }
    final timezone = await fetchProfileTimezone(userId, _supabase);
    final todayStr = todayStringForTimezone(timezone);
    final start = tzLocalToUtc(
          shiftDateStr(todayStr, -(days - 1)),
          '00:00',
          timezone,
        ) ??
        DateTime.now().toUtc();
    final endBase =
        tzLocalToUtc(todayStr, '23:59', timezone) ?? DateTime.now().toUtc();
    final end = endBase.add(const Duration(milliseconds: 59999));

    final rows = await _fetchDoseRowsForWindow(
      userId,
      startIso: start.toIso8601String(),
      endIso: end.toIso8601String(),
    );

    final medById = <String, Medication>{};
    final allDoses = _parseDoses(
      rows,
      medById: medById,
      allowPartialRows: false,
    );
    final scheduled = allDoses.where(isScheduledDose).toList();

    final loc = _locationForHistory(timezone);
    final byDay = <String, List<MedicationDose>>{};
    for (final dose in scheduled) {
      final local = tz.TZDateTime.from(dose.scheduledAt.toUtc(), loc);
      final key =
          '${local.year.toString().padLeft(4, '0')}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
      byDay.putIfAbsent(key, () => []).add(dose);
    }

    final groups = byDay.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));

    return (
      groups: groups
          .map((entry) {
            final deduped = dedupeTodayDoses(entry.value, timezone);
            return DoseHistoryDay(
              date: entry.key,
              label: dateLabelForTimezone(entry.key, timezone),
              doses: deduped,
              takenCount: deduped.where((d) => d.status == 'taken').length,
              total: deduped.length,
            );
          })
          .toList(),
      timezone: timezone,
    );
  }

  Future<Medication> createMedication({
    required String name,
    required String kind,
    String? dosageAmount,
    String? dosageUnit,
    List<String> timesOfDay = const ['08:00'],
    bool isRescue = false,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Cannot create medication without authenticated user');
    }

    final isRescueKind = isRescue || kind == 'rescue';
    final amount = dosageAmount == null ? null : num.tryParse(dosageAmount);
    final unit = (dosageUnit ?? 'mg').trim();
    final dosageText = amount != null ? '$amount $unit' : null;
    final cleanTimes = isRescueKind
        ? <String>[]
        : (timesOfDay
              .where((t) => RegExp(r'^\d{1,2}:\d{2}$').hasMatch(t))
              .toSet()
              .toList()
            ..sort());

    final payload = <String, dynamic>{
      'name': name.trim(),
      'kind': kind,
      'dosage': dosageText,
      'dosage_amount': amount,
      'dosage_unit': unit.isEmpty ? null : unit,
      'times_of_day': cleanTimes,
      'is_rescue': isRescueKind,
      'active': true,
      'refill_threshold': 7,
    };

    if (_connectivity.isOnline) {
      final data = await _supabase
          .from('medications')
          .insert({...payload, 'user_id': userId})
          .select('*')
          .single();
      await _regenerateTodayDoses(userId);
      return Medication.fromJson(_normalizeMedicationRow(data));
    }

    final id = _uuid.v4();
    await _sync.queueWrite(
      tableName: SyncTables.medications,
      operation: 'insert',
      payload: {...payload, 'id': id},
      recordId: id,
    );
    return Medication.fromJson(_normalizeMedicationRow({...payload, 'id': id}));
  }

  Future<void> updateMedication(
    String medId, {
    required String name,
    required String kind,
    String? dosageAmount,
    String? dosageUnit,
    List<String> timesOfDay = const ['08:00'],
  }) async {
    final isRescueKind = kind == 'rescue';
    final amount = dosageAmount == null ? null : num.tryParse(dosageAmount);
    final unit = (dosageUnit ?? 'mg').trim();
    final dosageText = amount != null ? '$amount $unit' : null;
    final cleanTimes = isRescueKind
        ? <String>[]
        : (timesOfDay
              .where((t) => RegExp(r'^\d{1,2}:\d{2}$').hasMatch(t))
              .toSet()
              .toList()
            ..sort());

    final payload = <String, dynamic>{
      'id': medId,
      'name': name.trim(),
      'kind': kind,
      'dosage': dosageText,
      'dosage_amount': amount,
      'dosage_unit': unit.isEmpty ? null : unit,
      'times_of_day': cleanTimes,
      'is_rescue': isRescueKind,
    };

    await _sync.queueWrite(
      tableName: SyncTables.medications,
      operation: 'update',
      payload: payload,
      recordId: medId,
    );

    if (_connectivity.isOnline) {
      final userId = _userId;
      if (userId != null) {
        await _regenerateTodayDoses(userId);
      }
    }
  }

  Future<void> updateMedicationActive(String medId, {required bool active}) async {
    await _sync.queueWrite(
      tableName: SyncTables.medications,
      operation: 'update',
      payload: {'id': medId, 'active': active},
      recordId: medId,
    );
    if (_connectivity.isOnline && active) {
      final userId = _userId;
      if (userId != null) {
        await _regenerateTodayDoses(userId);
      }
    }
  }

  void _kickSyncIfOnline() {
    if (!_connectivity.isOnline) return;
    unawaited(_sync.syncAll());
  }

  Future<void> _regenerateTodayDoses(String userId) async {
    try {
      await _supabase.rpc<void>(
        'regenerate_today_pending_doses',
        params: {'_user_id': userId},
      );
    } catch (error, stackTrace) {
      debugPrint(
        '[MedsRepository] regenerate_today_pending_doses failed: $error\n$stackTrace',
      );
    }
  }

  Future<List<Map<String, dynamic>>> _fetchMedicationRows(String userId) async {
    try {
      final response = await _supabase
          .from('medications')
          .select('*')
          .eq('user_id', userId)
          .limit(500);
      return (response as List).cast<Map<String, dynamic>>();
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      return _sync.readCached(tableName: SyncTables.medications);
    }
  }

  Future<List<Map<String, dynamic>>> _fetchDoseRowsForWindow(
    String userId, {
    required String startIso,
    required String endIso,
  }) async {
    try {
      final response = await _supabase
          .from('medication_doses')
          .select(_doseSelect)
          .eq('user_id', userId)
          .gte('scheduled_at', startIso)
          .lte('scheduled_at', endIso)
          .order('scheduled_at', ascending: true);
      return (response as List).cast<Map<String, dynamic>>();
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final cached =
          await _sync.readCached(tableName: SyncTables.medicationDoses);
      final start = DateTime.parse(startIso);
      final end = DateTime.parse(endIso);
      return cached.where((row) {
        final at = DateTime.tryParse(row['scheduled_at']?.toString() ?? '');
        if (at == null) return false;
        return !at.isBefore(start) && !at.isAfter(end);
      }).toList();
    }
  }

  MedsData _toMedsData({
    required List<Map<String, dynamic>> medRows,
    required List<Map<String, dynamic>> todayDoseRows,
    required List<Map<String, dynamic>> adherenceDoseRows,
    required String timezone,
    required String todayLabel,
    required bool isOffline,
    required bool allowPartialRows,
  }) {
    final medById = <String, Medication>{};
    for (final row in medRows) {
      _ingestMedicationRow(
        row,
        medById: medById,
        allowPartialRows: allowPartialRows,
      );
    }

    final todayParsed = _parseDoses(
      todayDoseRows,
      medById: medById,
      allowPartialRows: allowPartialRows,
    );
    final scheduledToday =
        todayParsed.where(isScheduledDose).toList(growable: false);
    final todayDoses = dedupeTodayDoses(scheduledToday, timezone);

    final adherenceParsed = _parseDoses(
      adherenceDoseRows,
      medById: medById,
      allowPartialRows: allowPartialRows,
    );
    final adherence = _adherenceLast14Days(
      adherenceParsed.where(isScheduledDose).toList(),
    );

    final medications = medById.values.toList()
      ..sort((a, b) {
        final byKind = a.kind.toLowerCase().compareTo(b.kind.toLowerCase());
        if (byKind != 0) return byKind;
        return a.name.toLowerCase().compareTo(b.name.toLowerCase());
      });

    return MedsData(
      medications: medications,
      todayDoses: todayDoses,
      isOffline: isOffline,
      loadedAt: DateTime.now(),
      adherence: adherence,
      timezone: timezone,
      todayLabel: todayLabel,
    );
  }

  MedsAdherence? _adherenceLast14Days(List<MedicationDose> doses) {
    final now = DateTime.now().toUtc();
    final since = now.subtract(const Duration(days: 14));
    var total = 0;
    var taken = 0;
    for (final dose in doses) {
      final at = dose.scheduledAt.toUtc();
      if (at.isBefore(since) || at.isAfter(now)) continue;
      total += 1;
      if (dose.status == 'taken') taken += 1;
    }
    if (total == 0) return null;
    return MedsAdherence(
      pct: ((taken / total) * 100).round(),
      taken: taken,
      total: total,
    );
  }

  void _ingestMedicationRow(
    Map<String, dynamic> row, {
    required Map<String, Medication> medById,
    required bool allowPartialRows,
  }) {
    try {
      final med = Medication.fromJson(_normalizeMedicationRow(row));
      medById[med.id] = med;
    } catch (error, stackTrace) {
      if (!allowPartialRows) rethrow;
      debugPrint(
        '[MedsRepository] cache medication parse failed: $error\n$stackTrace',
      );
    }
  }

  List<MedicationDose> _parseDoses(
    List<Map<String, dynamic>> rows, {
    required Map<String, Medication> medById,
    required bool allowPartialRows,
  }) {
    final doses = <MedicationDose>[];
    for (final row in rows) {
      try {
        final nested = row['medication'];
        if (nested is Map<String, dynamic>) {
          _ingestMedicationRow(
            nested,
            medById: medById,
            allowPartialRows: allowPartialRows,
          );
        }

        final medicationId = row['medication_id']?.toString();
        doses.add(
          MedicationDose.fromJson(
            row,
            medication:
                medicationId == null ? null : medById[medicationId],
          ),
        );
      } catch (error, stackTrace) {
        if (!allowPartialRows) rethrow;
        debugPrint(
          '[MedsRepository] cache dose parse failed: $error\n$stackTrace',
        );
      }
    }
    return doses;
  }

  bool _canFailOpen(Object error) {
    if (kIsWeb) return true;
    if (error is PostgrestException && _connectivity.isOnline) return false;
    return true;
  }

  Map<String, dynamic> _normalizeMedicationRow(Map<String, dynamic> row) {
    final normalized = Map<String, dynamic>.from(row);
    normalized['active'] = _asBool(normalized['active']) ??
        _asBool(normalized['is_active']) ??
        true;
    return normalized;
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

  Future<void> updateDoseStatus(
    String doseId, {
    required String status,
    DateTime? takenAt,
    DateTime? scheduledAt,
    bool clearTakenAt = false,
  }) async {
    final payload = <String, dynamic>{
      'id': doseId,
      'status': status,
      if (takenAt != null) 'taken_at': takenAt.toUtc().toIso8601String(),
      if (clearTakenAt && takenAt == null) 'taken_at': null,
      if (scheduledAt != null)
        'scheduled_at': scheduledAt.toUtc().toIso8601String(),
    };
    await _sync.queueWrite(
      tableName: SyncTables.medicationDoses,
      operation: 'update',
      payload: payload,
      recordId: doseId,
    );
  }

  Future<void> markDoseTaken(String doseId) {
    return updateDoseStatus(
      doseId,
      status: 'taken',
      takenAt: DateTime.now(),
    );
  }

  Future<void> markDoseSkipped(String doseId) {
    return updateDoseStatus(doseId, status: 'skipped');
  }

  Future<void> snoozeDose(String doseId) {
    return updateDoseStatus(
      doseId,
      status: 'pending',
      scheduledAt: DateTime.now().add(const Duration(minutes: 10)),
    );
  }

  Future<void> markAllPendingTaken(List<MedicationDose> pending) async {
    for (final dose in pending) {
      await markDoseTaken(dose.id);
    }
  }

  Future<void> reclassifyDose(String doseId, String next) {
    if (next == 'taken') {
      return updateDoseStatus(
        doseId,
        status: 'taken',
        takenAt: DateTime.now(),
      );
    }
    return updateDoseStatus(doseId, status: next, clearTakenAt: true);
  }
}

/// 14-day adherence summary shown inline in Today's doses.
class MedsAdherence {
  const MedsAdherence({
    required this.pct,
    required this.taken,
    required this.total,
  });

  final int pct;
  final int taken;
  final int total;
}

class MedsData {
  const MedsData({
    required this.medications,
    required this.todayDoses,
    required this.isOffline,
    required this.loadedAt,
    this.adherence,
    this.timezone = 'UTC',
    this.todayLabel = '',
  });

  static const empty = MedsData(
    medications: [],
    todayDoses: [],
    isOffline: false,
    loadedAt: null,
  );

  final List<Medication> medications;
  final List<MedicationDose> todayDoses;
  final bool isOffline;
  final DateTime? loadedAt;
  final MedsAdherence? adherence;
  final String timezone;
  final String todayLabel;

  List<Medication> get activeMeds =>
      medications.where((m) => m.active).toList();

  List<Medication> get archivedMeds =>
      medications.where((m) => !m.active).toList();

  List<MedicationDose> get pendingDoses =>
      todayDoses.where((d) => d.isPending).toList();

  bool get hasMeds => activeMeds.isNotEmpty;

  Map<String, MedicationDose> get nextPendingDoseByMedId {
    final map = <String, MedicationDose>{};
    for (final dose in todayDoses) {
      if (!dose.isPending) continue;
      final existing = map[dose.medicationId];
      if (existing == null ||
          dose.scheduledAt.isBefore(existing.scheduledAt)) {
        map[dose.medicationId] = dose;
      }
    }
    return map;
  }
}

final medsRepositoryProvider = Provider<MedsRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return MedsRepository(
    supabase: ref.watch(supabaseClientProvider),
    syncService: ref.watch(syncServiceProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final medsDataProvider = FutureProvider.autoDispose<MedsData>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return MedsData.empty;
  return ref.watch(medsRepositoryProvider).loadMeds();
});

final doseHistoryProvider = FutureProvider.autoDispose<
    ({List<DoseHistoryDay> groups, String timezone})>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) {
    return (groups: const <DoseHistoryDay>[], timezone: 'UTC');
  }
  return ref.watch(medsRepositoryProvider).loadDoseHistory();
});

final medicationByIdProvider =
    FutureProvider.autoDispose.family<Medication?, String>((ref, medId) async {
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return null;
  return ref.watch(medsRepositoryProvider).loadMedicationById(medId);
});

final medicationDosesProvider =
    FutureProvider.autoDispose.family<List<MedicationDose>, String>(
  (ref, medId) async {
    await ref.watch(authRepositoryProvider.future);
    final session = ref.watch(authSessionProvider).valueOrNull;
    if (session == null) return const [];
    return ref.watch(medsRepositoryProvider).loadDosesForMedication(medId);
  },
);
