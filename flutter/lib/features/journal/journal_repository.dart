import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/sync_service.dart';
import '../../core/providers/core_providers.dart';
import 'models/journal_entry.dart';

/// Journal entries from Supabase with Drift cache and offline queue writes.
class JournalRepository {
  JournalRepository({
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

  String? get _userId => _supabase.auth.currentUser?.id;

  Future<JournalData> loadEntries() async {
    final userId = _userId;
    if (userId == null) return JournalData.empty;

    var isOffline = false;
    List<Map<String, dynamic>> rows = const [];

    if (_connectivity.isOnline) {
      try {
        await _sync.syncAll();
        final response = await _supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)
            .order('captured_at', ascending: false)
            .limit(200);
        rows = (response as List).cast<Map<String, dynamic>>();
      } catch (_) {
        isOffline = true;
      }
    } else {
      isOffline = true;
    }

    if (isOffline || rows.isEmpty) {
      rows = await _sync.readCached(tableName: SyncTables.journalEntries);
      isOffline = true;
    }

    final entries = rows
        .map(
          (row) => JournalEntry.fromJson(
            row,
            pendingUpload: row['status'] == 'processing',
          ),
        )
        .toList()
      ..sort((a, b) => b.capturedAt.compareTo(a.capturedAt));

    return JournalData(
      entries: entries,
      isOffline: isOffline,
      pendingCount: entries.where((e) => e.pendingUpload).length,
      loadedAt: DateTime.now(),
    );
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
  );
});

final journalDataProvider = FutureProvider.autoDispose<JournalData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(journalRepositoryProvider).loadEntries();
});
