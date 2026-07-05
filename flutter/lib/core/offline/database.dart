import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'database.g.dart';

/// Cached biometrics row (server JSON snapshot, no fake seed data).
class CachedBiometrics extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get recordedAt => dateTime()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedMedications extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedDoses extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get medicationId => text()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get scheduledAt => dateTime()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedJournalEntries extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get capturedAt => dateTime()();
  BoolColumn get pendingUpload =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Pending writes captured while offline.
class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get targetTable => text()();
  TextColumn get operation => text()();
  TextColumn get recordId => text().nullable()();
  TextColumn get payloadJson => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
}

/// Per-table pull cursor (last successful Supabase sync).
class TableSyncState extends Table {
  TextColumn get targetTable => text()();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {targetTable};
}

@DriftDatabase(
  tables: [
    CachedBiometrics,
    CachedMedications,
    CachedDoses,
    CachedJournalEntries,
    SyncQueue,
    TableSyncState,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    // On web this requires sqlite3.wasm + drift_worker.js served next to
    // index.html (copied into build/web by scripts/flutter-web-serve.sh).
    return driftDatabase(
      name: 'purple_offline',
      web: DriftWebOptions(
        sqlite3Wasm: Uri.parse('sqlite3.wasm'),
        driftWorker: Uri.parse('drift_worker.js'),
      ),
    );
  }

  Future<DateTime?> lastSyncedAt(String tableName) async {
    final row = await (select(tableSyncState)
          ..where((t) => t.targetTable.equals(tableName)))
        .getSingleOrNull();
    return row?.lastSyncedAt;
  }

  Future<void> setLastSyncedAt(String tableName, DateTime at) {
    return into(tableSyncState).insertOnConflictUpdate(
      TableSyncStateCompanion.insert(
        targetTable: tableName,
        lastSyncedAt: Value(at),
      ),
    );
  }

  Future<List<SyncQueueData>> pendingQueue() {
    return (select(syncQueue)..orderBy([(q) => OrderingTerm.asc(q.createdAt)]))
        .get();
  }

  Future<void> enqueueWrite({
    required String tableName,
    required String operation,
    required Map<String, dynamic> payload,
    String? recordId,
  }) {
    return into(syncQueue).insert(
      SyncQueueCompanion.insert(
        targetTable: tableName,
        operation: operation,
        recordId: Value(recordId),
        payloadJson: jsonEncode(payload),
      ),
    );
  }

  Future<void> removeQueueItem(int id) {
    return (delete(syncQueue)..where((q) => q.id.equals(id))).go();
  }

  Future<void> markQueueError(int id, String error, int retryCount) {
    return (update(syncQueue)..where((q) => q.id.equals(id))).write(
      SyncQueueCompanion(
        lastError: Value(error),
        retryCount: Value(retryCount),
      ),
    );
  }

  Future<void> upsertBiometricCache({
    required String id,
    required String userId,
    required Map<String, dynamic> payload,
    required DateTime recordedAt,
  }) {
    return into(cachedBiometrics).insertOnConflictUpdate(
      CachedBiometricsCompanion.insert(
        id: id,
        userId: userId,
        payloadJson: jsonEncode(payload),
        recordedAt: recordedAt,
      ),
    );
  }

  Future<void> upsertMedicationCache({
    required String id,
    required String userId,
    required Map<String, dynamic> payload,
    required DateTime updatedAt,
  }) {
    return into(cachedMedications).insertOnConflictUpdate(
      CachedMedicationsCompanion.insert(
        id: id,
        userId: userId,
        payloadJson: jsonEncode(payload),
        updatedAt: updatedAt,
      ),
    );
  }

  Future<void> upsertDoseCache({
    required String id,
    required String userId,
    required String medicationId,
    required Map<String, dynamic> payload,
    required DateTime scheduledAt,
  }) {
    return into(cachedDoses).insertOnConflictUpdate(
      CachedDosesCompanion.insert(
        id: id,
        userId: userId,
        medicationId: medicationId,
        payloadJson: jsonEncode(payload),
        scheduledAt: scheduledAt,
      ),
    );
  }

  Future<void> upsertJournalCache({
    required String id,
    required String userId,
    required Map<String, dynamic> payload,
    required DateTime capturedAt,
    bool pendingUpload = false,
  }) {
    return into(cachedJournalEntries).insertOnConflictUpdate(
      CachedJournalEntriesCompanion.insert(
        id: id,
        userId: userId,
        payloadJson: jsonEncode(payload),
        capturedAt: capturedAt,
        pendingUpload: Value(pendingUpload),
      ),
    );
  }

  Future<List<Map<String, dynamic>>> readCachedTable(
    String tableName, {
    required String userId,
  }) async {
    switch (tableName) {
      case 'biometrics':
        final rows = await (select(cachedBiometrics)
              ..where((t) => t.userId.equals(userId))
              ..orderBy([(t) => OrderingTerm.desc(t.recordedAt)]))
            .get();
        return rows
            .map((r) => jsonDecode(r.payloadJson) as Map<String, dynamic>)
            .toList();
      case 'medications':
        final rows = await (select(cachedMedications)
              ..where((t) => t.userId.equals(userId)))
            .get();
        return rows
            .map((r) => jsonDecode(r.payloadJson) as Map<String, dynamic>)
            .toList();
      case 'medication_doses':
        final rows = await (select(cachedDoses)
              ..where((t) => t.userId.equals(userId))
              ..orderBy([(t) => OrderingTerm.desc(t.scheduledAt)]))
            .get();
        return rows
            .map((r) => jsonDecode(r.payloadJson) as Map<String, dynamic>)
            .toList();
      case 'journal_entries':
        final rows = await (select(cachedJournalEntries)
              ..where((t) => t.userId.equals(userId))
              ..orderBy([(t) => OrderingTerm.desc(t.capturedAt)]))
            .get();
        return rows
            .map((r) => jsonDecode(r.payloadJson) as Map<String, dynamic>)
            .toList();
      default:
        return const [];
    }
  }

  Future<void> clearUserCache(String userId) async {
    await (delete(cachedBiometrics)..where((t) => t.userId.equals(userId))).go();
    await (delete(cachedMedications)..where((t) => t.userId.equals(userId))).go();
    await (delete(cachedDoses)..where((t) => t.userId.equals(userId))).go();
    await (delete(cachedJournalEntries)
          ..where((t) => t.userId.equals(userId)))
        .go();
  }
}
