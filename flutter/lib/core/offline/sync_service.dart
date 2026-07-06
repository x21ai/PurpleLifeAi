import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../api/worker_client.dart';
import '../auth/auth_repository.dart';
import '../network/connectivity_service.dart';
import 'database.dart';
import 'supabase_row_parse.dart';

/// Known Supabase tables mirrored locally.
abstract class SyncTables {

  static const nativeHealth = 'native_health';

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

  bool _started = false;
  Future<SyncResult>? _inFlightSync;
  DateTime? _lastCompletedSyncAt;
  int _activeSyncGeneration = 0;

  /// Minimum gap between full background syncs (queue flush + table pull).
  /// Prevents tab switches and parallel repository loads from stacking work.
  static const minBackgroundSyncInterval = Duration(seconds: 45);

  /// Upper bound for a full sync run so first load never waits forever.
  static const syncOperationTimeout = Duration(seconds: 30);

  /// Whether a recent background sync should be skipped (see [syncIfStale]).
  @visibleForTesting
  static bool shouldThrottleBackgroundSync({
    required DateTime? lastCompletedSyncAt,
    required Duration elapsed,
    required bool cacheEmpty,
  }) {
    if (lastCompletedSyncAt == null) return false;
    if (elapsed >= minBackgroundSyncInterval) return false;
    // Reinstall / cold Drift: keep pulling until mirrored rows exist locally.
    return !cacheEmpty;
  }

  String? get _currentUserId =>
      _auth.currentSession?.user.id ?? _auth.currentUser?.id;

  /// Removes all Drift cache rows for [userId] (call before sign-out).
  Future<void> clearUserCache(String userId) => _db.clearUserCache(userId);

  Future<void> start() async {
    if (_started) return;
    _started = true;

    _connectivity.onlineStream.listen((online) {
      if (online) {
        unawaited(_safeSyncAll(trigger: 'connectivity'));
      }
    });
    if (_connectivity.isOnline) {
      unawaited(_safeSyncAll(trigger: 'startup'));
    }
  }

  /// Queue a write for later Supabase flush (also updates local cache optimistically).
  Future<void> queueWrite({
    required String tableName,
    required String operation,
    required Map<String, dynamic> payload,
    String? recordId,
  }) async {
    final userId = _currentUserId;
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

  /// Queue a native HealthKit / Health Connect batch for Worker flush.
  Future<void> queueNativeHealthSync({
    required String source,
    required List<Map<String, dynamic>> samples,
  }) async {
    await queueWrite(
      tableName: SyncTables.nativeHealth,
      operation: 'native_health_sync',
      payload: {
        'source': source,
        'samples': samples,
      },
    );
  }

  /// Full sync: flush queue, then pull latest rows from Supabase.
  ///
  /// Concurrent callers share one in-flight run. Use [syncIfStale] for
  /// background kicks so tab switches do not stack duplicate pulls.
  Future<SyncResult> syncAll() {
    if (!_connectivity.isOnline || !_auth.isAuthenticated) {
      return Future.value(SyncResult.skipped());
    }

    final inFlight = _inFlightSync;
    if (inFlight != null) return inFlight;

    // Fail open: sync errors should never block direct Supabase reads
    // in callers (for example meds/today on web when worker calls fail).
    final generation = ++_activeSyncGeneration;
    final next = _runSync(generation)
        .timeout(
          syncOperationTimeout,
          onTimeout: () {
            debugPrint(
              '[SyncService] syncAll timed out after '
              '${syncOperationTimeout.inSeconds}s',
            );
            _activeSyncGeneration += 1;
            return SyncResult.skipped();
          },
        )
        .catchError((Object e, StackTrace st) {
          debugPrint('[SyncService] syncAll failed, continuing: $e\n$st');
          return SyncResult.skipped();
        });
    _inFlightSync = next;
    return next.whenComplete(() {
      if (identical(_inFlightSync, next)) {
        _inFlightSync = null;
      }
    });
  }

  /// Background sync with a minimum interval between completed runs.
  ///
  /// Always runs when Drift has no mirrored rows yet (reinstall / cold cache)
  /// so the first pull is never throttled by a recent empty sync.
  Future<SyncResult> syncIfStale() async {
    if (await _shouldSkipBackgroundSync()) {
      return SyncResult.skipped();
    }
    return syncAll();
  }

  Future<bool> _shouldSkipBackgroundSync() async {
    final last = _lastCompletedSyncAt;
    if (last == null) return false;

    final elapsed = DateTime.now().difference(last);
    final cacheEmpty = await _isLocalCacheEmpty();
    return shouldThrottleBackgroundSync(
      lastCompletedSyncAt: last,
      elapsed: elapsed,
      cacheEmpty: cacheEmpty,
    );
  }

  Future<bool> _isLocalCacheEmpty() async {
    final userId = _currentUserId;
    if (userId == null) return true;

    for (final table in SyncTables.all) {
      final rows = await _db.readCachedTable(table, userId: userId);
      if (rows.isNotEmpty) return false;
    }
    return true;
  }

  Future<void> _safeSyncAll({required String trigger}) async {
    try {
      await syncIfStale();
    } catch (e, st) {
      debugPrint('[SyncService] syncAll failed during $trigger: $e\n$st');
    }
  }

  Future<SyncResult> _runSync(int generation) async {
    var queueSent = 0;
    var queueFailed = 0;
    var rowsPulled = 0;

    try {
      final flush = await _flushQueue().timeout(syncOperationTimeout);
      queueSent = flush.sent;
      queueFailed = flush.failed;
    } on TimeoutException {
      debugPrint('[SyncService] queue flush timed out');
    } catch (e, st) {
      debugPrint('[SyncService] queue flush failed: $e\n$st');
    }

    if (generation != _activeSyncGeneration) {
      return SyncResult(
        queueSent: queueSent,
        queueFailed: queueFailed,
        rowsPulled: rowsPulled,
      );
    }

    try {
      rowsPulled = await _pullAllTables().timeout(syncOperationTimeout);
    } on TimeoutException {
      debugPrint('[SyncService] table pull timed out');
    } catch (e, st) {
      debugPrint('[SyncService] table pull failed: $e\n$st');
    }

    final result = SyncResult(
      queueSent: queueSent,
      queueFailed: queueFailed,
      rowsPulled: rowsPulled,
    );

    if (generation != _activeSyncGeneration) {
      return result;
    }

    final cacheStillEmpty = await _isLocalCacheEmpty();
    if (!cacheStillEmpty || result.hadWork) {
      _lastCompletedSyncAt = DateTime.now();
    }
    return result;
  }

  Future<({int sent, int failed})> _flushQueue() async {
    final pending = await _db.pendingQueue();
    var sent = 0;
    var failed = 0;

    for (final item in pending) {
      try {
        final payload = jsonDecode(item.payloadJson) as Map<String, dynamic>;
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
          samples: (payload['samples'] as List).cast<Map<String, dynamic>>(),
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
    final userId = _currentUserId;
    if (userId == null) return 0;

    var total = 0;
    for (final table in SyncTables.all) {
      try {
        total += await _pullTable(table, userId);
      } catch (e, st) {
        debugPrint('[SyncService] pull failed for $table: $e\n$st');
      }
    }
    return total;
  }

  Future<int> _pullTable(String tableName, String userId) async {
    final since = await _db.lastSyncedAt(tableName);
    var query = _supabase.from(tableName).select().eq('user_id', userId);

    final timestampColumn = _timestampColumn(tableName);
    if (since != null && timestampColumn != null) {
      query = query.gte(
        timestampColumn,
        formatSupabaseFilterTimestamp(since),
      );
    }

    final rows = await query.timeout(syncOperationTimeout);
    final list = (rows as List).cast<Map<String, dynamic>>();

    for (final row in list) {
      try {
        await _upsertServerRow(tableName, row);
      } catch (e, st) {
        debugPrint(
          '[SyncService] cache upsert failed for $tableName/${row['id']}: $e\n$st',
        );
      }
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
    final id = row['id']?.toString();
    final userId = row['user_id']?.toString();
    if (id == null || id.isEmpty || userId == null || userId.isEmpty) {
      return;
    }

    switch (tableName) {
      case SyncTables.biometrics:
        final recordedAt = _parseTimestamp(row['recorded_at']);
        if (recordedAt == null) return;
        await _db.upsertBiometricCache(
          id: id,
          userId: userId,
          payload: row,
          recordedAt: recordedAt,
        );
      case SyncTables.medications:
        final updatedAt =
            _parseTimestamp(row['updated_at'] ?? row['created_at']);
        if (updatedAt == null) return;
        await _db.upsertMedicationCache(
          id: id,
          userId: userId,
          payload: row,
          updatedAt: updatedAt,
        );
      case SyncTables.medicationDoses:
        final scheduledAt = _parseTimestamp(row['scheduled_at']);
        final medicationId = row['medication_id']?.toString();
        if (scheduledAt == null ||
            medicationId == null ||
            medicationId.isEmpty) {
          return;
        }
        await _db.upsertDoseCache(
          id: id,
          userId: userId,
          medicationId: medicationId,
          payload: row,
          scheduledAt: scheduledAt,
        );
      case SyncTables.journalEntries:
        final capturedAt =
            _parseTimestamp(row['captured_at'] ?? row['created_at']);
        if (capturedAt == null) return;
        await _db.upsertJournalCache(
          id: id,
          userId: userId,
          payload: row,
          capturedAt: capturedAt,
          pendingUpload: pendingUpload,
        );
    }
  }

  DateTime? _parseTimestamp(Object? raw) {
    if (raw == null) return null;
    if (raw is DateTime) return raw.toUtc();
    if (raw is String && raw.isNotEmpty) {
      return DateTime.tryParse(raw)?.toUtc();
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> readCached({
    required String tableName,
  }) async {
    final userId = _currentUserId;
    if (userId == null) return const [];
    try {
      return await _db.readCachedTable(tableName, userId: userId);
    } catch (error, stack) {
      debugPrint('[SyncService] readCached failed for $tableName: $error\n$stack');
      return const [];
    }
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
