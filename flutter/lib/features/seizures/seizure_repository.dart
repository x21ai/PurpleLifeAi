import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

/// A single `seizure_events` row for the signed-in user.
///
/// Shared read model used by the Care dashboard (seizures tab) and Insights
/// (heatmap + list) so neither feature defines its own shape.
class SeizureEvent {
  const SeizureEvent({
    required this.id,
    required this.startedAt,
    this.endedAt,
    this.durationSeconds,
    this.type,
    this.severity,
    this.injury,
    this.witnessed,
    this.rescueMedGiven,
    this.notes,
  });

  final String id;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int? durationSeconds;
  final String? type;
  final int? severity;
  final bool? injury;
  final bool? witnessed;
  final bool? rescueMedGiven;
  final String? notes;

  static int? _asInt(Object? value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse(value.toString());
  }

  static bool? _asBool(Object? value) {
    if (value == null) return null;
    if (value is bool) return value;
    final text = value.toString().toLowerCase();
    if (text == 'true' || text == 't' || text == '1') return true;
    if (text == 'false' || text == 'f' || text == '0') return false;
    return null;
  }

  /// Builds a [SeizureEvent] from a Supabase row, or `null` when the row lacks
  /// a usable id / started_at.
  static SeizureEvent? fromRow(Map<String, dynamic> row) {
    final id = row['id']?.toString();
    final startedRaw = row['started_at']?.toString();
    if (id == null || startedRaw == null) return null;
    final startedAt = DateTime.tryParse(startedRaw);
    if (startedAt == null) return null;

    final endedRaw = row['ended_at']?.toString();
    return SeizureEvent(
      id: id,
      startedAt: startedAt,
      endedAt: endedRaw == null ? null : DateTime.tryParse(endedRaw),
      durationSeconds: _asInt(row['duration_seconds']),
      type: row['type']?.toString(),
      severity: _asInt(row['severity']),
      injury: _asBool(row['injury']),
      witnessed: _asBool(row['witnessed']),
      rescueMedGiven: _asBool(row['rescue_med_given']),
      notes: row['notes']?.toString(),
    );
  }
}

/// Read-only repository for `seizure_events`, scoped to the signed-in user via
/// the user's own row RLS (`auth.uid()`). Mirrors the query patterns in
/// [TimelineRepository] and `log_seizure_screen.dart`.
///
/// Self-only by design: no caregiver/owner-scoped reads (those require server
/// routes and are out of scope for this repository).
class SeizureRepository {
  SeizureRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  static const _columns =
      'id, started_at, ended_at, duration_seconds, type, severity, '
      'injury, witnessed, rescue_med_given, notes';

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  /// One-tap / Today quick log into `seizure_events` (mirrors web Quick log now).
  ///
  /// Writes [startedAt] and optional [notes] only; detailed fields stay on
  /// `/seizures/new`. Throws when signed out or the insert fails.
  Future<void> quickLog({
    required DateTime startedAt,
    String? notes,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Sign in to log a seizure');
    }
    final trimmed = notes?.trim();
    await _supabase.from('seizure_events').insert({
      'user_id': userId,
      'started_at': startedAt.toUtc().toIso8601String(),
      if (trimmed != null && trimmed.isNotEmpty) 'notes': trimmed,
    });
  }

  /// Loads the signed-in user's most recent seizures, newest first.
  ///
  /// [limit] caps the number of rows. When [days] is provided, only events with
  /// `started_at` within the last [days] days are returned. Returns an empty
  /// list when signed out or on any read error (offline-safe).
  Future<List<SeizureEvent>> loadRecent({int limit = 500, int? days}) async {
    final userId = _userId;
    if (userId == null) return const [];

    try {
      var filter = _supabase
          .from('seizure_events')
          .select(_columns)
          .eq('user_id', userId);

      if (days != null && days > 0) {
        final since = DateTime.now()
            .toUtc()
            .subtract(Duration(days: days))
            .toIso8601String();
        filter = filter.gte('started_at', since);
      }

      final rows = await filter
          .order('started_at', ascending: false)
          .limit(limit);

      return (rows as List)
          .cast<Map<String, dynamic>>()
          .map(SeizureEvent.fromRow)
          .whereType<SeizureEvent>()
          .toList(growable: false);
    } catch (_) {
      return const [];
    }
  }
}

/// Singleton [SeizureRepository]; rebuilt when auth changes.
final seizureRepositoryProvider = Provider<SeizureRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return SeizureRepository(supabase: ref.watch(supabaseClientProvider));
});

/// Recent seizures for the signed-in user (newest first, up to 500).
///
/// Returns `[]` when signed out. Feature UIs can `.watch` this directly, or use
/// [seizureRepositoryProvider] for custom `limit`/`days` queries.
final recentSeizuresProvider =
    FutureProvider.autoDispose<List<SeizureEvent>>((ref) async {
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return const [];
  return ref.watch(seizureRepositoryProvider).loadRecent();
});
