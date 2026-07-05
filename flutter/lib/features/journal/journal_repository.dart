import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/database.dart';
import '../../core/offline/sync_service.dart';
import '../../core/providers/core_providers.dart';
import 'models/journal_entry.dart';

/// Journal entries from Supabase with Drift cache and offline queue writes.
class JournalRepository {
  JournalRepository({
    required SupabaseClient supabase,
    required SyncService syncService,
    required ConnectivityService connectivity,
    required AppDatabase database,
    Uuid? uuid,
  })  : _supabase = supabase,
        _sync = syncService,
        _connectivity = connectivity,
        _db = database,
        _uuid = uuid ?? const Uuid();

  final SupabaseClient _supabase;
  final SyncService _sync;
  final ConnectivityService _connectivity;
  final AppDatabase _db;
  final Uuid _uuid;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<JournalData> loadEntries() async {
    final userId = _userId;
    if (userId == null) return JournalData.empty;
    try {
      _kickSyncIfOnline();
      final rows = await _fetchEntryRows(userId);
      return await _toJournalData(
        rows,
        isOffline: false,
        allowPartialRows: false,
      );
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      final rows = await _sync.readCached(tableName: SyncTables.journalEntries);
      return await _toJournalData(
        rows,
        isOffline: true,
        allowPartialRows: true,
      );
    }
  }

  /// Entry IDs with writes still in the offline sync queue (not AI processing).
  Future<Set<String>> _pendingUploadEntryIds() async {
    final pending = await _db.pendingQueue();
    return pending
        .where((item) => item.targetTable == SyncTables.journalEntries)
        .map((item) => item.recordId)
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet();
  }

  void _kickSyncIfOnline() {
    if (!_connectivity.isOnline) return;
    unawaited(_sync.syncAll());
  }

  Future<List<Map<String, dynamic>>> _fetchEntryRows(String userId) async {
    try {
      final response = await _supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('captured_at', ascending: false)
          .limit(200);
      return (response as List).cast<Map<String, dynamic>>();
    } catch (error) {
      if (!_canFailOpen(error)) rethrow;
      return _sync.readCached(tableName: SyncTables.journalEntries);
    }
  }

  Future<JournalEntry> saveEntry({
    required String text,
    DateTime? capturedAt,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Cannot save journal entry without authenticated user');
    }

    final trimmed = text.trim();
    if (trimmed.isEmpty) {
      throw ArgumentError('Entry text cannot be empty');
    }

    final id = _uuid.v4();
    final at = (capturedAt ?? DateTime.now()).toUtc();
    final payload = <String, dynamic>{
      'id': id,
      'user_id': userId,
      'text': trimmed,
      'kind': 'text',
      'status': 'processing',
      'captured_at': at.toIso8601String(),
      'media_urls': <String>[],
      'ai_tags': <String>[],
      'created_by_kind': 'user',
    };

    await _sync.queueWrite(
      tableName: SyncTables.journalEntries,
      operation: 'insert',
      payload: payload,
      recordId: id,
    );

    return JournalEntry.fromJson(payload, pendingUpload: true);
  }

  /// Archive or restore an entry (queued offline-first update).
  Future<void> setArchived(JournalEntry entry, {required bool archived}) async {
    final payload = entry.toJson()
      ..['archived_at'] =
          archived ? DateTime.now().toUtc().toIso8601String() : null;
    await _sync.queueWrite(
      tableName: SyncTables.journalEntries,
      operation: 'update',
      payload: payload,
      recordId: entry.id,
    );
  }

  /// Edit text / voice transcript / captured time, then re-run AI processing
  /// (mirrors web entry-card saveEdit). Online edits go straight to Supabase
  /// so the processor reads fresh content; offline edits queue for sync.
  Future<void> updateEntry(
    JournalEntry entry, {
    required String? text,
    required String? voiceTranscript,
    required DateTime capturedAt,
  }) async {
    final trimmedText = text?.trim();
    final trimmedVoice = voiceTranscript?.trim();
    final fields = <String, dynamic>{
      'text': (trimmedText?.isEmpty ?? true) ? null : trimmedText,
      'voice_transcript':
          (trimmedVoice?.isEmpty ?? true) ? null : trimmedVoice,
      'captured_at': capturedAt.toUtc().toIso8601String(),
      'status': 'processing',
    };

    if (_connectivity.isOnline) {
      await _supabase.from('journal_entries').update(fields).eq('id', entry.id);
      _invokeProcessors(entry.id);
      return;
    }

    // Offline: queue the full merged row so the local cache stays complete.
    await _sync.queueWrite(
      tableName: SyncTables.journalEntries,
      operation: 'update',
      payload: entry.toJson()..addAll(fields),
      recordId: entry.id,
    );
  }

  /// Re-trigger AI reading for a stuck or failed entry (web "Retry reading").
  Future<void> retryProcessing(JournalEntry entry) async {
    await _supabase
        .from('journal_entries')
        .update({'status': 'processing'}).eq('id', entry.id);
    await _supabase.functions
        .invoke('journal-processor', body: {'entry_id': entry.id});
  }

  /// Permanently delete an archived entry and its extracted behaviors
  /// (web "Delete permanently"). Online-only, matching web.
  Future<void> deleteEntry(JournalEntry entry) async {
    await _supabase
        .from('daily_behaviors')
        .delete()
        .eq('journal_entry_id', entry.id);
    await _supabase.from('journal_entries').delete().eq('id', entry.id);
  }

  void _invokeProcessors(String entryId) {
    unawaited(() async {
      try {
        await _supabase.functions
            .invoke('journal-processor', body: {'entry_id': entryId});
      } catch (_) {
        // Processing errors don't block the edit (web parity).
      }
      try {
        await _supabase.functions
            .invoke('journal-extract', body: {'journal_entry_id': entryId});
      } catch (_) {
        // Extraction errors don't block the edit (web parity).
      }
    }());
  }

  Future<JournalData> _toJournalData(
    List<Map<String, dynamic>> rows, {
    required bool isOffline,
    required bool allowPartialRows,
  }) async {
    final pendingIds = await _pendingUploadEntryIds();
    final entries = <JournalEntry>[];
    for (final row in rows) {
      try {
        final id = row['id']?.toString();
        entries.add(
          JournalEntry.fromJson(
            row,
            pendingUpload: id != null && pendingIds.contains(id),
          ),
        );
      } catch (error, stackTrace) {
        if (!allowPartialRows) rethrow;
        debugPrint(
          '[JournalRepository] cache row parse failed: $error\n$stackTrace',
        );
      }
    }
    entries.sort((a, b) => b.capturedAt.compareTo(a.capturedAt));

    return JournalData(
      entries: entries,
      isOffline: isOffline,
      pendingCount: pendingIds.length,
      loadedAt: DateTime.now(),
    );
  }

  bool _canFailOpen(Object error) {
    if (_connectivity.isOnline) return false;
    return error is! PostgrestException;
  }
}

class JournalData {
  const JournalData({
    required this.entries,
    required this.isOffline,
    required this.pendingCount,
    required this.loadedAt,
  });

  static const empty = JournalData(
    entries: [],
    isOffline: false,
    pendingCount: 0,
    loadedAt: null,
  );

  final List<JournalEntry> entries;
  final bool isOffline;
  final int pendingCount;
  final DateTime? loadedAt;
}

final journalRepositoryProvider = Provider<JournalRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return JournalRepository(
    supabase: ref.watch(supabaseClientProvider),
    syncService: ref.watch(syncServiceProvider),
    connectivity: ref.watch(connectivityServiceProvider),
    database: ref.watch(appDatabaseProvider),
  );
});

final journalDataProvider =
    FutureProvider.autoDispose<JournalData>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return JournalData.empty;
  final repository = ref.watch(journalRepositoryProvider);
  return repository.loadEntries();
});
