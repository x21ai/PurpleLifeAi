import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../../core/providers/core_providers.dart';
import 'chat_copy.dart';

class ChatTurn {
  const ChatTurn({required this.role, required this.text});

  final String role;
  final String text;

  Map<String, dynamic> toUiMessage() {
    return {
      'role': role,
      'parts': [
        {'type': 'text', 'text': text},
      ],
    };
  }
}

/// The five write actions Purple can propose (mirrors web `ProposalKind`).
enum ProposalKind {
  addMedication('add_medication', 'Add medication'),
  logSeizure('log_seizure', 'Log seizure event'),
  createJournalEntry('create_journal_entry', 'Create journal entry'),
  markDoseTaken('mark_dose_taken', 'Mark dose as taken'),
  archiveMedication('archive_medication', 'Archive medication');

  const ProposalKind(this.wire, this.label);

  /// Wire value emitted by the model (`kind` field).
  final String wire;

  /// Card title shown to the user.
  final String label;

  static ProposalKind? fromWire(String? value) {
    for (final kind in ProposalKind.values) {
      if (kind.wire == value) return kind;
    }
    return null;
  }
}

/// A `tool-proposeAction` stream part parsed from the AI-SDK UI stream.
/// Mirrors web `Proposal` (`chat.tsx`) / `ProposalSchema`
/// (`purple-chat-tools.server.ts`).
class Proposal {
  const Proposal({
    required this.kind,
    required this.summary,
    required this.params,
  });

  final ProposalKind kind;
  final String summary;
  final Map<String, dynamic> params;

  /// Params with null / empty / empty-array values dropped, for the card body
  /// (matches web filter in `chat.tsx`).
  List<MapEntry<String, String>> get displayParams {
    final out = <MapEntry<String, String>>[];
    params.forEach((key, value) {
      if (value == null) return;
      if (value is String && value.isEmpty) return;
      if (value is List) {
        if (value.isEmpty) return;
        out.add(MapEntry(key, value.map((e) => '$e').join(', ')));
        return;
      }
      out.add(MapEntry(key, '$value'));
    });
    return out;
  }
}

/// One decoded chunk of the Ask-Purple stream: the running assistant text plus
/// any proposals seen so far in this turn.
class AskPurpleChunk {
  const AskPurpleChunk({required this.text, required this.proposals});

  final String text;
  final List<Proposal> proposals;
}

/// Result of executing a confirmed [Proposal].
class ActionResult {
  const ActionResult({required this.ok, this.id, this.error});

  final bool ok;
  final String? id;
  final String? error;
}

/// Loads profile conditions for Ask Purple suggestion chips.
final chatConditionsProvider = FutureProvider.autoDispose<List<String>>((ref) async {
  ref.watch(authSessionProvider);
  final supabase = ref.watch(supabaseClientProvider);
  final userId = supabase.auth.currentSession?.user.id;
  if (userId == null) return const [];

  final row = await supabase
      .from('profiles')
      .select('conditions')
      .eq('id', userId)
      .maybeSingle();
  final raw = row?['conditions'];
  if (raw is List) {
    return raw.whereType<String>().toList();
  }
  return const [];
});

class ChatRepository {
  ChatRepository({required WorkerClient worker, required SupabaseClient supabase})
      : _worker = worker,
        _supabase = supabase;

  final WorkerClient _worker;
  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  /// Streams assistant text + tool proposals from `/api/chat`
  /// (AI SDK v5 UI message stream). Each emitted [AskPurpleChunk] carries the
  /// running assistant text and every proposal decoded so far this turn.
  Stream<AskPurpleChunk> sendAskPurple({
    required List<ChatTurn> history,
    required String userText,
  }) async* {
    final messages = [
      ...history.map((m) => m.toUiMessage()),
      ChatTurn(role: 'user', text: userText).toUiMessage(),
    ];

    final response = await _worker.postChatStream(messages: messages);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final body = await response.stream.bytesToString();
      throw WorkerApiException(response.statusCode, body);
    }

    final buffer = StringBuffer();
    final proposals = <Proposal>[];
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      for (final line in chunk.split('\n')) {
        final trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        final payload = trimmed.substring(5).trim();
        if (payload.isEmpty || payload == '[DONE]') continue;
        try {
          final json = jsonDecode(payload) as Map<String, dynamic>;
          final type = json['type'] as String?;
          if (type == 'text-delta') {
            final delta = json['delta'] as String? ?? '';
            if (delta.isNotEmpty) {
              buffer.write(delta);
              yield AskPurpleChunk(
                text: buffer.toString(),
                proposals: List.unmodifiable(proposals),
              );
            }
          } else if (type == 'tool-proposeAction') {
            final proposal = _parseProposal(json);
            if (proposal != null) {
              proposals.add(proposal);
              yield AskPurpleChunk(
                text: buffer.toString(),
                proposals: List.unmodifiable(proposals),
              );
            }
          } else if (type == 'error') {
            final message = json['errorText'] as String? ??
                json['message'] as String? ??
                ChatCopy.askSendError;
            throw WorkerApiException(response.statusCode, message);
          }
        } catch (e) {
          if (e is WorkerApiException) rethrow;
          // Ignore malformed SSE lines.
        }
      }
    }
  }

  /// Reads a `tool-proposeAction` part's `{kind, summary, params}` from either
  /// `input` (AI-SDK v5) or `args` (fallback), matching web `extractProposals`.
  Proposal? _parseProposal(Map<String, dynamic> json) {
    final raw = (json['input'] ?? json['args']);
    if (raw is! Map) return null;
    final kind = ProposalKind.fromWire(raw['kind'] as String?);
    final summary = raw['summary'] as String?;
    if (kind == null || summary == null || summary.isEmpty) return null;
    final params = raw['params'];
    return Proposal(
      kind: kind,
      summary: summary,
      params: params is Map ? Map<String, dynamic>.from(params) : const {},
    );
  }

  /// Dart port of server `executePurpleAction` — direct RLS-scoped writes with
  /// the authenticated Supabase session (RLS enforces `user_id`). Replicates
  /// the tables/payloads in `purple-actions.functions.ts` exactly.
  Future<ActionResult> executeAction(Proposal proposal) async {
    final userId = _userId;
    if (userId == null) {
      return const ActionResult(ok: false, error: 'Not signed in');
    }
    final params = proposal.params;
    String str(Object? v) => v == null ? '' : '$v';

    try {
      switch (proposal.kind) {
        case ProposalKind.addMedication:
          final name = str(params['name']).trim();
          if (name.isEmpty) {
            return const ActionResult(ok: false, error: 'name required');
          }
          final rawTimes = params['times_of_day'];
          final times = rawTimes is List
              ? rawTimes.whereType<String>().toList()
              : <String>[];
          final row = await _supabase
              .from('medications')
              .insert({
                'user_id': userId,
                'name': name,
                'dosage': params['dosage'],
                'times_of_day': times,
                'notes': params['notes'],
                'is_rescue': params['is_rescue'] == true,
                'active': true,
              })
              .select('id')
              .single();
          return ActionResult(ok: true, id: row['id'] as String?);

        case ProposalKind.logSeizure:
          final startedAt = params['started_at'] != null
              ? DateTime.parse(str(params['started_at'])).toUtc().toIso8601String()
              : DateTime.now().toUtc().toIso8601String();
          final row = await _supabase
              .from('seizure_events')
              .insert({
                'user_id': userId,
                'started_at': startedAt,
                'type': params['type'],
                'duration_seconds': params['duration_seconds'],
                'severity': params['severity'],
                'notes': params['notes'],
                'detection_source': 'ai_chat',
              })
              .select('id')
              .single();
          return ActionResult(ok: true, id: row['id'] as String?);

        case ProposalKind.createJournalEntry:
          final text = str(params['text']).trim();
          if (text.isEmpty) {
            return const ActionResult(ok: false, error: 'text required');
          }
          final capturedAt = params['captured_at'] != null
              ? DateTime.parse(str(params['captured_at'])).toUtc().toIso8601String()
              : DateTime.now().toUtc().toIso8601String();
          final row = await _supabase
              .from('journal_entries')
              .insert({
                'user_id': userId,
                'kind': 'text',
                'status': 'processing',
                'text': text,
                'captured_at': capturedAt,
              })
              .select('id')
              .single();
          return ActionResult(ok: true, id: row['id'] as String?);

        case ProposalKind.markDoseTaken:
          final medicationId = str(params['medication_id']);
          if (medicationId.isEmpty) {
            return const ActionResult(ok: false, error: 'medication_id required');
          }
          final takenAt = DateTime.now().toUtc().toIso8601String();
          if (params['scheduled_at'] != null) {
            final scheduledAt = DateTime.parse(str(params['scheduled_at']))
                .toUtc()
                .toIso8601String();
            await _supabase
                .from('medication_doses')
                .update({'status': 'taken', 'taken_at': takenAt})
                .eq('user_id', userId)
                .eq('medication_id', medicationId)
                .eq('scheduled_at', scheduledAt);
            return const ActionResult(ok: true);
          }
          final row = await _supabase
              .from('medication_doses')
              .insert({
                'user_id': userId,
                'medication_id': medicationId,
                'scheduled_at': takenAt,
                'status': 'taken',
                'taken_at': takenAt,
              })
              .select('id')
              .single();
          return ActionResult(ok: true, id: row['id'] as String?);

        case ProposalKind.archiveMedication:
          final medicationId = str(params['medication_id']);
          if (medicationId.isEmpty) {
            return const ActionResult(ok: false, error: 'medication_id required');
          }
          final today =
              DateTime.now().toUtc().toIso8601String().substring(0, 10);
          await _supabase
              .from('medications')
              .update({'active': false, 'end_date': today})
              .eq('id', medicationId)
              .eq('user_id', userId);
          return const ActionResult(ok: true);
      }
    } catch (e) {
      return ActionResult(ok: false, error: e is Exception ? '$e' : 'execute error');
    }
  }

  /// Save-to-journal: inserts an ask-purple tagged entry (mirrors web
  /// `SaveToJournalButton`). Direct RLS insert per spec §1.7.
  Future<bool> saveAnswerToJournal({
    required String answer,
    String? question,
  }) async {
    final userId = _userId;
    if (userId == null) return false;
    final body = (question != null && question.trim().isNotEmpty)
        ? '**Q:** ${question.trim()}\n\n**Purple:** $answer'
        : '**Purple:** $answer';
    try {
      await _supabase.from('journal_entries').insert({
        'user_id': userId,
        'kind': 'text',
        'status': 'complete',
        'text': body,
        'ai_tags': ['ask-purple'],
        'captured_at': DateTime.now().toUtc().toIso8601String(),
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(
    worker: ref.watch(workerClientProvider),
    supabase: ref.watch(supabaseClientProvider),
  );
});
