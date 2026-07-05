import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  ChatRepository({required WorkerClient worker}) : _worker = worker;

  final WorkerClient _worker;

  /// Streams assistant text deltas from `/api/chat` (AI SDK UI message stream).
  Stream<String> sendAskPurple({
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
              yield buffer.toString();
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
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(worker: ref.watch(workerClientProvider));
});
