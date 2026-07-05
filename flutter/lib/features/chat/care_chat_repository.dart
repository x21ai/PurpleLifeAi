import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

class CareChatException implements Exception {
  CareChatException(this.message);

  final String message;

  @override
  String toString() => message;
}

class CareThreadParticipant {
  const CareThreadParticipant({
    required this.userId,
    required this.name,
    required this.role,
  });

  final String userId;
  final String name;
  final String role;
}

class CareThreadLastMessage {
  const CareThreadLastMessage({
    required this.body,
    required this.senderId,
    required this.createdAt,
  });

  final String body;
  final String senderId;
  final String createdAt;
}

class CareThreadSummary {
  const CareThreadSummary({
    required this.id,
    required this.ownerId,
    required this.kind,
    required this.relationshipId,
    required this.title,
    required this.lastMessageAt,
    required this.others,
    required this.lastMessage,
    required this.unread,
    required this.muted,
  });

  final String id;
  final String ownerId;
  final String kind;
  final String? relationshipId;
  final String? title;
  final String lastMessageAt;
  final List<CareThreadParticipant> others;
  final CareThreadLastMessage? lastMessage;
  final int unread;
  final bool muted;

  String displayName(String? meId) {
    if (kind == 'group') {
      return title?.trim().isNotEmpty == true ? title!.trim() : 'Care team';
    }
    for (final other in others) {
      if (other.userId != meId) return other.name;
    }
    return others.isNotEmpty ? others.first.name : 'Conversation';
  }
}

class CareMessage {
  const CareMessage({
    required this.id,
    required this.threadId,
    required this.senderId,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String threadId;
  final String senderId;
  final String body;
  final String createdAt;

  factory CareMessage.fromMap(Map<String, dynamic> map) {
    return CareMessage(
      id: map['id'] as String,
      threadId: map['thread_id'] as String,
      senderId: map['sender_id'] as String,
      body: map['body'] as String? ?? '',
      createdAt: map['created_at'] as String,
    );
  }
}

/// Care chat data access mirroring web `care-chat.functions.ts` via Supabase RLS.
class CareChatRepository {
  CareChatRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<List<CareThreadSummary>> listThreads() async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to view care chat.');

    final parts = await _supabase
        .from('care_thread_participants')
        .select('thread_id, role, last_read_at, muted, muted_until')
        .eq('user_id', userId);
    final partRows = (parts as List).cast<Map<String, dynamic>>();
    if (partRows.isEmpty) return const [];

    final threadIds =
        partRows.map((p) => p['thread_id'] as String).toSet().toList();
    final lastReadByThread = {
      for (final p in partRows) p['thread_id'] as String: p['last_read_at'] as String?,
    };
    final muteByThread = {
      for (final p in partRows)
        p['thread_id'] as String: _isMuted(
          p['muted'] as bool? ?? false,
          p['muted_until'] as String?,
        ),
    };

    final threadsRaw = await _supabase
        .from('care_threads')
        .select(
          'id, owner_id, kind, relationship_id, title, last_message_at, created_at',
        )
        .inFilter('id', threadIds)
        .order('last_message_at', ascending: false);
    final threadRows = (threadsRaw as List).cast<Map<String, dynamic>>();

    final allPartsRaw = await _supabase
        .from('care_thread_participants')
        .select('thread_id, user_id, role')
        .inFilter('thread_id', threadIds);
    final allParts = (allPartsRaw as List).cast<Map<String, dynamic>>();

    final userIds =
        allParts.map((p) => p['user_id'] as String).toSet().toList();
    final profileById = await _loadProfileNames(userIds);

    final lastMsgsRaw = await _supabase
        .from('care_messages')
        .select('thread_id, sender_id, body, created_at')
        .inFilter('thread_id', threadIds)
        .filter('deleted_at', 'is', null)
        .order('created_at', ascending: false);
    final lastByThread = <String, Map<String, dynamic>>{};
    for (final m in (lastMsgsRaw as List).cast<Map<String, dynamic>>()) {
      final tid = m['thread_id'] as String;
      lastByThread.putIfAbsent(tid, () => m);
    }

    final unreadByThread = <String, int>{};
    for (final t in threadRows) {
      final tid = t['id'] as String;
      unreadByThread[tid] = await _countUnread(
        threadId: tid,
        userId: userId,
        since: lastReadByThread[tid],
      );
    }

    return threadRows.map((t) {
      final tid = t['id'] as String;
      final ps = allParts.where((p) => p['thread_id'] == tid);
      final others = ps
          .where((p) => p['user_id'] != userId)
          .map((p) {
            final uid = p['user_id'] as String;
            return CareThreadParticipant(
              userId: uid,
              name: profileById[uid] ?? 'Unnamed',
              role: p['role'] as String? ?? 'caregiver',
            );
          })
          .toList();
      final last = lastByThread[tid];
      return CareThreadSummary(
        id: tid,
        ownerId: t['owner_id'] as String,
        kind: t['kind'] as String? ?? 'direct',
        relationshipId: t['relationship_id'] as String?,
        title: t['title'] as String?,
        lastMessageAt: t['last_message_at'] as String? ?? t['created_at'] as String,
        others: others,
        lastMessage: last == null
            ? null
            : CareThreadLastMessage(
                body: last['body'] as String? ?? '',
                senderId: last['sender_id'] as String,
                createdAt: last['created_at'] as String,
              ),
        unread: unreadByThread[tid] ?? 0,
        muted: muteByThread[tid] ?? false,
      );
    }).toList();
  }

  Future<List<CareMessage>> getMessages(String threadId, {int limit = 100}) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to view messages.');

    await _assertParticipant(threadId, userId);

    final rows = await _supabase
        .from('care_messages')
        .select('id, thread_id, sender_id, body, created_at, deleted_at')
        .eq('thread_id', threadId)
        .order('created_at', ascending: false)
        .limit(limit);
    final messages = (rows as List)
        .cast<Map<String, dynamic>>()
        .where((m) => m['deleted_at'] == null)
        .map(CareMessage.fromMap)
        .toList()
        .reversed
        .toList();
    return messages;
  }

  Future<CareMessage> sendMessage({
    required String threadId,
    required String body,
  }) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to send messages.');

    final trimmed = body.trim();
    if (trimmed.isEmpty) {
      throw CareChatException('Message cannot be empty.');
    }
    if (trimmed.length > 4000) {
      throw CareChatException('Message is too long.');
    }

    await _assertParticipant(threadId, userId);

    final inserted = await _supabase
        .from('care_messages')
        .insert({
          'thread_id': threadId,
          'sender_id': userId,
          'body': trimmed,
          'attachments': <Object>[],
        })
        .select('id, thread_id, sender_id, body, created_at')
        .single();

    final createdAt = inserted['created_at'] as String;
    await _supabase
        .from('care_thread_participants')
        .update({'last_read_at': createdAt})
        .eq('thread_id', threadId)
        .eq('user_id', userId);

    return CareMessage.fromMap(inserted);
  }

  Future<void> markThreadRead(String threadId) async {
    final userId = _userId;
    if (userId == null) return;

    await _supabase
        .from('care_thread_participants')
        .update({'last_read_at': DateTime.now().toUtc().toIso8601String()})
        .eq('thread_id', threadId)
        .eq('user_id', userId);
  }

  /// Owner-only thread creation via RLS; caregivers reuse an existing thread.
  Future<String> getOrCreateDirectThread(String relationshipId) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to open chat.');

    final rel = await _supabase
        .from('care_relationships')
        .select('id, owner_id, caregiver_id, status')
        .eq('id', relationshipId)
        .maybeSingle();
    if (rel == null) throw CareChatException('Relationship not found.');
    if (rel['owner_id'] != userId && rel['caregiver_id'] != userId) {
      throw CareChatException('Not authorized.');
    }
    if (rel['status'] != 'active' || rel['caregiver_id'] == null) {
      throw CareChatException('Relationship is not active.');
    }

    final existing = await _supabase
        .from('care_threads')
        .select('id')
        .eq('owner_id', rel['owner_id'] as String)
        .eq('relationship_id', relationshipId)
        .eq('kind', 'direct')
        .maybeSingle();
    if (existing != null) return existing['id'] as String;

    if (rel['owner_id'] != userId) {
      throw CareChatException(
        'Chat is not open yet. Ask the person you care for to start the conversation.',
      );
    }

    final created = await _supabase
        .from('care_threads')
        .insert({
          'owner_id': rel['owner_id'],
          'kind': 'direct',
          'relationship_id': relationshipId,
        })
        .select('id')
        .single();
    final threadId = created['id'] as String;

    await _supabase.from('care_thread_participants').insert([
      {
        'thread_id': threadId,
        'user_id': rel['owner_id'],
        'role': 'owner',
      },
      {
        'thread_id': threadId,
        'user_id': rel['caregiver_id'],
        'role': 'caregiver',
      },
    ]);

    return threadId;
  }

  Future<void> _assertParticipant(String threadId, String userId) async {
    final part = await _supabase
        .from('care_thread_participants')
        .select('thread_id')
        .eq('thread_id', threadId)
        .eq('user_id', userId)
        .maybeSingle();
    if (part == null) throw CareChatException('Not a participant.');
  }

  Future<Map<String, String>> _loadProfileNames(List<String> userIds) async {
    if (userIds.isEmpty) return const {};
    final rows = await _supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .inFilter('id', userIds);
    final out = <String, String>{};
    for (final row in (rows as List).cast<Map<String, dynamic>>()) {
      final id = row['id'] as String;
      final parts = [row['first_name'], row['last_name']]
          .whereType<String>()
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty);
      out[id] = parts.isEmpty ? 'Unnamed' : parts.join(' ');
    }
    return out;
  }

  Future<int> _countUnread({
    required String threadId,
    required String userId,
    String? since,
  }) async {
    var query = _supabase
        .from('care_messages')
        .select('id')
        .eq('thread_id', threadId)
        .neq('sender_id', userId)
        .filter('deleted_at', 'is', null);
    if (since != null && since.isNotEmpty) {
      query = query.gt('created_at', since);
    }
    final rows = await query;
    return (rows as List).length;
  }

  bool _isMuted(bool muted, String? mutedUntil) {
    if (muted) return true;
    if (mutedUntil == null || mutedUntil.isEmpty) return false;
    return DateTime.parse(mutedUntil).isAfter(DateTime.now());
  }
}

final careChatRepositoryProvider = Provider<CareChatRepository>((ref) {
  return CareChatRepository(supabase: ref.watch(supabaseClientProvider));
});

final careThreadsProvider = FutureProvider.autoDispose<List<CareThreadSummary>>((ref) async {
  ref.watch(authSessionProvider);
  return ref.watch(careChatRepositoryProvider).listThreads();
});

final careMessagesProvider =
    FutureProvider.autoDispose.family<List<CareMessage>, String>((ref, threadId) async {
  ref.watch(authSessionProvider);
  return ref.watch(careChatRepositoryProvider).getMessages(threadId);
});
