import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

enum TimelineEntryKind { seizure, journal, dose }

class TimelineEntry {
  const TimelineEntry({
    required this.id,
    required this.at,
    required this.kind,
    required this.title,
    this.body,
    this.doseId,
    this.doseStatus,
  });

  final String id;
  final DateTime at;
  final TimelineEntryKind kind;
  final String title;
  final String? body;
  final String? doseId;
  final String? doseStatus;
}

class TimelineQuery {
  const TimelineQuery({
    required this.since,
    required this.until,
  });

  final DateTime since;
  final DateTime until;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TimelineQuery &&
          since == other.since &&
          until == other.until;

  @override
  int get hashCode => Object.hash(since, until);
}

/// Unified seizure, journal, and dose rows mirroring web `/timeline`.
class TimelineRepository {
  TimelineRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<List<TimelineEntry>> loadEntries(TimelineQuery query) async {
    final userId = _userId;
    if (userId == null) return const [];

    final sinceIso = query.since.toUtc().toIso8601String();
    final untilIso = query.until.toUtc().toIso8601String();

    final results = await Future.wait([
      _supabase
          .from('seizure_events')
          .select('id, started_at, type, severity, notes, detection_source')
          .eq('user_id', userId)
          .gte('started_at', sinceIso)
          .lte('started_at', untilIso)
          .order('started_at', ascending: false),
      _supabase
          .from('journal_entries')
          .select('id, captured_at, text, voice_transcript, ai_summary, kind')
          .eq('user_id', userId)
          .isFilter('archived_at', null)
          .gte('captured_at', sinceIso)
          .lte('captured_at', untilIso)
          .order('captured_at', ascending: false),
      _supabase
          .from('medication_doses')
          .select('id, scheduled_at, taken_at, status, medication_id, medications(name)')
          .eq('user_id', userId)
          .gte('scheduled_at', sinceIso)
          .lte('scheduled_at', untilIso)
          .order('scheduled_at', ascending: false)
          .limit(1000),
    ]);

    final seizures = (results[0] as List).cast<Map<String, dynamic>>();
    final entries = (results[1] as List).cast<Map<String, dynamic>>();
    final doses = (results[2] as List).cast<Map<String, dynamic>>();

    final out = <TimelineEntry>[];

    for (final row in seizures) {
      final id = row['id']?.toString();
      final atRaw = row['started_at']?.toString();
      if (id == null || atRaw == null) continue;
      final at = DateTime.tryParse(atRaw);
      if (at == null) continue;
      final type = row['type']?.toString();
      final severity = row['severity'];
      final fromJournal = row['detection_source']?.toString() == 'journal';
      final parts = <String>['Seizure'];
      if (type != null && type.isNotEmpty) parts.add(type.replaceAll('_', ' '));
      if (severity != null) parts.add('sev $severity');
      if (fromJournal) parts.add('from journal');
      out.add(
        TimelineEntry(
          id: 's-$id',
          at: at,
          kind: TimelineEntryKind.seizure,
          title: parts.join(' · '),
          body: row['notes']?.toString(),
        ),
      );
    }

    for (final row in entries) {
      final id = row['id']?.toString();
      final atRaw = row['captured_at']?.toString();
      if (id == null || atRaw == null) continue;
      final at = DateTime.tryParse(atRaw);
      if (at == null) continue;
      final summary = row['ai_summary']?.toString();
      final text = row['text']?.toString();
      final voice = row['voice_transcript']?.toString();
      final title = summary ??
          (text != null && text.length > 80 ? text.substring(0, 80) : text) ??
          (voice != null && voice.length > 80
              ? voice.substring(0, 80)
              : voice) ??
          'Journal entry';
      out.add(
        TimelineEntry(
          id: 'j-$id',
          at: at,
          kind: TimelineEntryKind.journal,
          title: title,
        ),
      );
    }

    for (final row in doses) {
      final id = row['id']?.toString();
      if (id == null) continue;
      final takenAt = row['taken_at']?.toString();
      final scheduledAt = row['scheduled_at']?.toString();
      final atRaw = takenAt ?? scheduledAt;
      if (atRaw == null) continue;
      final at = DateTime.tryParse(atRaw);
      if (at == null) continue;
      final meds = row['medications'];
      String medName = 'Medication';
      if (meds is Map) {
        medName = meds['name']?.toString() ?? medName;
      }
      final status = row['status']?.toString() ?? 'pending';
      out.add(
        TimelineEntry(
          id: 'd-$id',
          at: at,
          kind: TimelineEntryKind.dose,
          title: '$medName · $status',
          doseId: id,
          doseStatus: status,
        ),
      );
    }

    out.sort((a, b) => b.at.compareTo(a.at));
    return out;
  }
}

final timelineRepositoryProvider = Provider<TimelineRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return TimelineRepository(supabase: ref.watch(supabaseClientProvider));
});

final timelineEntriesProvider = FutureProvider.autoDispose
    .family<List<TimelineEntry>, TimelineQuery>((ref, query) async {
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return const [];
  return ref.watch(timelineRepositoryProvider).loadEntries(query);
});
