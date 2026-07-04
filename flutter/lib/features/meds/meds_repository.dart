import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/sync_service.dart';
import '../../core/providers/core_providers.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Meds and doses loaded from Supabase with Drift cache fallback.
class MedsRepository {
  MedsRepository({
    required SupabaseClient supabase,
    required SyncService syncService,
    required ConnectivityService connectivity,
  })  : _supabase = supabase,
        _sync = syncService,
        _connectivity = connectivity;

  final SupabaseClient _supabase;
  final SyncService _sync;
  final ConnectivityService _connectivity;

  String? get _userId => _supabase.auth.currentUser?.id;

  Future<MedsData> loadMeds({DateTime? viewDate}) async {
    final userId = _userId;
    if (userId == null) return MedsData.empty;

    var isOffline = false;
    List<Map<String, dynamic>> medRows = const [];
    List<Map<String, dynamic>> doseRows = const [];

    if (_connectivity.isOnline) {
      try {
        await _sync.syncAll();
        final results = await Future.wait([
          _supabase
              .from('medications')
              .select(
                'id, name, dosage, dosage_amount, dosage_unit, times_of_day, '
                'pills_remaining, is_rescue, kind, active, start_date, end_date',
              )
              .eq('user_id', userId)
              .order('kind')
              .order('name'),
          _supabase
              .from('medication_doses')
              .select('*')
              .eq('user_id', userId)
              .order('scheduled_at', ascending: false)
              .limit(500),
        ]);
        medRows = (results[0] as List).cast<Map<String, dynamic>>();
        doseRows = (results[1] as List).cast<Map<String, dynamic>>();
      } catch (_) {
        isOffline = true;
      }
    } else {
      isOffline = true;
    }

    if (isOffline || medRows.isEmpty && doseRows.isEmpty) {
      medRows = await _sync.readCached(tableName: SyncTables.medications);
      doseRows = await _sync.readCached(tableName: SyncTables.medicationDoses);
      isOffline = true;
    }

    final meds = medRows.map(Medication.fromJson).toList();
    final medById = {for (final m in meds) m.id: m};

    final allDoses = doseRows
        .map(
          (row) => MedicationDose.fromJson(
            row,
            medication: medById[row['medication_id'] as String? ?? ''],
          ),
        )
        .toList();

    final target = viewDate ?? DateTime.now();
    final todayDoses = _dosesForDay(allDoses, target);

    return MedsData(
      medications: meds,
      todayDoses: todayDoses,
      isOffline: isOffline,
      loadedAt: DateTime.now(),
    );
  }

  List<MedicationDose> _dosesForDay(
    List<MedicationDose> doses,
    DateTime day,
  ) {
    final start = DateTime(day.year, day.month, day.day);
    final end = start.add(const Duration(days: 1));
    return doses
        .where(
          (d) =>
              !d.scheduledAt.isBefore(start) && d.scheduledAt.isBefore(end),
        )
        .toList()
      ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
  }

  Future<void> updateDoseStatus(
    String doseId, {
    required String status,
    DateTime? takenAt,
    DateTime? scheduledAt,
  }) async {
    final payload = <String, dynamic>{
      'id': doseId,
      'status': status,
      if (takenAt != null) 'taken_at': takenAt.toUtc().toIso8601String(),
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
}

class MedsData {
  const MedsData({
    required this.medications,
    required this.todayDoses,
    required this.isOffline,
    required this.loadedAt,
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

  List<Medication> get activeMeds =>
      medications.where((m) => m.active).toList();

  List<Medication> get archivedMeds =>
      medications.where((m) => !m.active).toList();

  List<MedicationDose> get pendingDoses =>
      todayDoses.where((d) => d.isPending).toList();

  bool get hasMeds => activeMeds.isNotEmpty;
}

final medsRepositoryProvider = Provider<MedsRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return MedsRepository(
    supabase: ref.watch(supabaseClientProvider),
    syncService: ref.watch(syncServiceProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final medsDataProvider = FutureProvider.autoDispose<MedsData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(medsRepositoryProvider).loadMeds();
});
