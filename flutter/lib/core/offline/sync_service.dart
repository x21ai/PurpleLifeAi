import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../api/worker_client.dart';
import '../auth/auth_repository.dart';
import '../network/connectivity_service.dart';
import 'database.dart';

/// Known Supabase tables mirrored locally.
abstract final class SyncTables {
  static const biometrics = 'biometrics';
  static const medications = 'medications';
  static const medicationDoses = 'medication_doses';
  static const journalEntries = 'journal_entries';

  static const all = [
    biometrics,
    medications,
    medicationDoses,
    journalEntries,
  ];

  /// Health data tables where server rows win on conflict.
  static const serverWins = {biometrics, medications, medicationDoses};
}

/// Offline-first sync: queue writes offline, flush and pull on reconnect.
class SyncService {
  SyncService({
    required AppDatabase database,
    required AuthRepository authRepository,
    required ConnectivityService connectivityService,
    required WorkerClient workerClient,
    SupabaseClient? supabaseClient,
    Uuid? uuid,
  })  : _db = database,
        _auth = authRepository,
        _connectivity = connectivityService,
        _worker = workerClient,
        _supabase = supabaseClient ?? Supabase.instance.client,
        _uuid = uuid ?? const Uuid();

  final AppDatabase _db;
  final AuthRepository _auth;
  final ConnectivityService _connectivity;
  final WorkerClient _worker;
  final SupabaseClient _supabase;
  final Uuid _uuid;

  bool _syncing = false;

  Future<void> start() async {
    _connectivity.onlineStream.listen((online) {
      if (online) {
        unawaited(syncAll());
      }
    });
    if (_connectivity.isOnline) {
      await syncAll();
    }
  }

  /// Queue a write for later Supabase flush (also updates local cache optimistically).
  Future<void> queueWrite({
    required String tableName,
    required String operation,
    required Map<String, dynamic> payload,
    String? recordId,
  }) async {
    final userId = _auth.currentUser?.id;
    if (userId == null) {
      throw StateError('Cannot queue write without authenticated user');
    }

    final enriched = Map<String, dynamic>.from(payload)..['user_id'] = userId;
    final id = recordId ?? enriched['id'] as String? ?? _uuid.v4();
    enriched['id'] = id;

    await _db.enqueueWrite(
      tableName: tableName,
      operation: operation,
      payload: enriched,
      recordId: id,
    );

    await _applyOptimisticCache(tableName, enriched, pendingUpload: true);
  }

  /// Full sync: flush queue, then pull latest rows from Supabase.
  Future<SyncResult> syncAll() async {
    if (_syncing) return SyncResult.skipped();
    if (!_connectivity.isOnline || !_auth.isAuthenticated) {
      return SyncResult.skipped();
    }

    _syncing = true;
    try {
      final flush = await _flushQueue();
      final pull = await _pullAllTables();
      return SyncResult(
        queueSent: flush.sent,
        queueFailed: flush.failed,
        rowsPulled: pull,
      );
    } finally {
      _syncing = false;
    }
  }

  Future<({int sent, int failed})> _flushQueue() async {
    final pending = await _db.pendingQueue();
    var sent = 0;
    var failed = 0;

    for (final item in pending) {
      try {
        final payload =
            jsonDecode(item.payloadJson) as Map<String, dynamic>;
        await _applyRemoteWrite(
          tableName: item.targetTable,
          operation: item.operation,
          payload: payload,
        );
        await _db.removeQueueItem(item.id);
        sent += 1;
      } catch (e, st) {
        failed += 1;
        final retries = item.retryCount + 1;
        await _db.markQueueError(item.id, e.toString(), retries);
        debugPrint('[SyncService] queue flush failed: $e\n$st');
      }
    }
    return (sent: sent, failed: failed);
  }

  Future<void> _applyRemoteWrite({
    required String tableName,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    switch (operation) {
      case 'insert':
        await _supabase.from(tableName).insert(payload);
      case 'update':
        final id = payload['id'] as String?;
        if (id == null) {
          throw ArgumentError('Update payload requires id');
        }
        final updatePayload = Map<String, dynamic>.from(payload)..remove('id');
        await _supabase.from(tableName).update(updatePayload).eq('id', id);
      case 'delete':
        final id = payload['id'] as String?;
        if (id == null) {
          throw ArgumentError('Delete payload requires id');
        }
        await _supabase.from(tableName).delete().eq('id', id);
      case 'native_health_sync':
        await _worker.postNativeHealthSync(
          source: payload['source'] as String,
          samples: (payload['samples'] as List)
              .cast<Map<String, dynamic>>(),
        );
      default:
        throw UnsupportedError('Unknown sync operation: $operation');
    }

    if (tableName == SyncTables.journalEntries && operation == 'insert') {
      final entryId = payload['id'] as String?;
      if (entryId != null) {
        unawaited(
          _supabase.functions
              .invoke('journal-processor', body: {'entry_id': entryId}),
        );
      }
    }
  }

  Future<int> _pullAllTables() async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return 0;

    var total = 0;
    for (final table in SyncTables.all) {
      total += await _pullTable(table, userId);
    }
    return total;
  }

  Future<int> _pullTable(String tableName, String userId) async {
    final since = await _db.lastSyncedAt(tableName);
    var query = _supabase.from(tableName).select().eq('user_id', userId);

    final timestampColumn = _timestampColumn(tableName);
    if (since != null && timestampColumn != null) {
      query = query.gte(timestampColumn, since.toUtc().toIso8601String());
    }

    final rows = await query;
    final list = (rows as List).cast<Map<String, dynamic>>();

    for (final row in list) {
      await _upsertServerRow(tableName, row);
    }

    await _db.setLastSyncedAt(tableName, DateTime.now().toUtc());
    return list.length;
  }

  String? _timestampColumn(String tableName) {
    switch (tableName) {
      case SyncTables.biometrics:
        return 'recorded_at';
      case SyncTables.medications:
        return 'updated_at';
      case SyncTables.medicationDoses:
        return 'scheduled_at';
      case SyncTables.journalEntries:
        return 'captured_at';
      default:
        return null;
    }
  }

  Future<void> _upsertServerRow(
    String tableName,
    Map<String, dynamic> row,
  ) async {
    final id = row['id'] as String?;
    final userId = row['user_id'] as String?;
    if (id == null || userId == null) return;

    // Pull path: server rows replace local cache (health data conflicts: server wins).
    await _applyOptimisticCache(tableName, row, pendingUpload: false);
  }

  Future<void> _applyOptimisticCache(
    String tableName,
    Map<String, dynamic> row, {
    required bool pendingUpload,
  }) async {
    final id = row['id'] as String;
    final userId = row['user_id'] as String;

    switch (tableName) {
      case SyncTables.biometrics:
        final recordedAt = DateTime.parse(row['recorded_at'] as String);
        await _db.upsertBiometricCache(
          id: id,
          userId: userId,
          payload: row,
          recordedAt: recordedAt,
        );
      case SyncTables.medications:
        final updatedAt = DateTime.parse(
          (row['updated_at'] ?? row['created_at']) as String,
        );
        await _db.upsertMedicationCache(
          id: id,
          userId: userId,
          payload: row,
          updatedAt: updatedAt,
        );
      case SyncTables.medicationDoses:
        final scheduledAt = DateTime.parse(row['scheduled_at'] as String);
        await _db.upsertDoseCache(
          id: id,
          userId: userId,
          medicationId: row['medication_id'] as String,
          payload: row,
          scheduledAt: scheduledAt,
        );
      case SyncTables.journalEntries:
        final capturedAt = DateTime.parse(
          (row['captured_at'] ?? row['created_at']) as String,
        );
        await _db.upsertJournalCache(
          id: id,
          userId: userId,
          payload: row,
          capturedAt: capturedAt,
          pendingUpload: pendingUpload,
        );
    }
  }

  Future<List<Map<String, dynamic>>> readCached({
    required String tableName,
  }) async {
    final userId = _auth.currentUser?.id;
    if (userId == null) return const [];
    return _db.readCachedTable(tableName, userId: userId);
  }
}

class SyncResult {
  const SyncResult({
    required this.queueSent,
    required this.queueFailed,
    required this.rowsPulled,
  });

  factory SyncResult.skipped() =>
      const SyncResult(queueSent: 0, queueFailed: 0, rowsPulled: 0);

  final int queueSent;
  final int queueFailed;
  final int rowsPulled;

  bool get hadWork => queueSent > 0 || queueFailed > 0 || rowsPulled > 0;
}
