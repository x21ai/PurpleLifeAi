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

/// A stored attachment reference (mirrors web `care_messages.attachments`).
class CareAttachment {
  const CareAttachment({
    required this.path,
    required this.name,
    required this.mime,
    required this.size,
    required this.kind,
  });

  final String path;
  final String name;
  final String mime;
  final int size;
  final String kind; // 'image' | 'file'

  factory CareAttachment.fromMap(Map<String, dynamic> map) {
    return CareAttachment(
      path: map['path'] as String? ?? '',
      name: map['name'] as String? ?? 'Attachment',
      mime: map['mime'] as String? ?? 'application/octet-stream',
      size: (map['size'] as num?)?.toInt() ?? 0,
      kind: map['kind'] as String? ?? 'file',
    );
  }
}

class CareMessage {
  const CareMessage({
    required this.id,
    required this.threadId,
    required this.senderId,
    required this.body,
    required this.createdAt,
    this.attachments = const [],
    this.deletedAt,
  });

  final String id;
  final String threadId;
  final String senderId;
  final String body;
  final String createdAt;
  final List<CareAttachment> attachments;
  final String? deletedAt;

  bool get isDeleted => deletedAt != null;

  factory CareMessage.fromMap(Map<String, dynamic> map) {
    final rawAttachments = map['attachments'];
    final attachments = rawAttachments is List
        ? rawAttachments
            .whereType<Map<dynamic, dynamic>>()
            .map((m) => CareAttachment.fromMap(Map<String, dynamic>.from(m)))
            .toList()
        : const <CareAttachment>[];
    return CareMessage(
      id: map['id'] as String,
      threadId: map['thread_id'] as String,
      senderId: map['sender_id'] as String,
      body: map['body'] as String? ?? '',
      createdAt: map['created_at'] as String,
      attachments: attachments,
      deletedAt: map['deleted_at'] as String?,
    );
  }
}

/// A person the current user can start a direct chat with (a care relationship).
class CareContact {
  const CareContact({
    required this.relationshipId,
    required this.label,
    required this.caregiverId,
    required this.direction,
  });

  final String relationshipId;
  final String label;
  final String? caregiverId;
  final String direction; // 'mine' (I own) | 'shared' (they share with me)
}

/// A group thread the current user owns.
class CareGroupSummary {
  const CareGroupSummary({
    required this.id,
    required this.title,
    required this.lastMessageAt,
    required this.memberCount,
  });

  final String id;
  final String title;
  final String? lastMessageAt;
  final int memberCount;
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

  Future<List<CareMessage>> getMessages(
    String threadId, {
    int limit = 100,
    String? before,
  }) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to view messages.');

    await _assertParticipant(threadId, userId);

    final cappedLimit = limit > 200 ? 200 : limit;
    var query = _supabase
        .from('care_messages')
        .select('id, thread_id, sender_id, body, attachments, created_at, deleted_at')
        .eq('thread_id', threadId);
    if (before != null && before.isNotEmpty) {
      query = query.lt('created_at', before);
    }
    // Newest-first fetch (matches web), then reverse to ascending for display.
    // Tombstones (deleted_at set) are kept so the UI can render "Message deleted".
    final rows = await query
        .order('created_at', ascending: false)
        .limit(cappedLimit);
    final messages = (rows as List)
        .cast<Map<String, dynamic>>()
        .map(CareMessage.fromMap)
        .toList()
        .reversed
        .toList();
    return messages;
  }

  /// Subscribe to inbound INSERTs on `care_messages` for a single thread.
  ///
  /// Mirrors web channel `care-thread-<id>` with filter
  /// `thread_id=eq.<id>` (`chat-care.tsx:720-742`). The caller owns the
  /// returned channel and MUST call [SupabaseClient.removeChannel] on dispose.
  RealtimeChannel subscribeThread(
    String threadId,
    void Function(CareMessage message) onInsert,
  ) {
    final channel = _supabase.channel('care-thread-$threadId');
    channel
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'care_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'thread_id',
            value: threadId,
          ),
          callback: (payload) {
            final record = payload.newRecord;
            if (record.isEmpty) return;
            try {
              onInsert(CareMessage.fromMap(Map<String, dynamic>.from(record)));
            } catch (_) {
              // Ignore malformed realtime payloads.
            }
          },
        )
        .subscribe();
    return channel;
  }

  void removeChannel(RealtimeChannel channel) {
    _supabase.removeChannel(channel);
  }

  Future<CareMessage> sendMessage({
    required String threadId,
    required String body,
    List<CareAttachment> attachments = const [],
  }) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to send messages.');

    final trimmed = body.trim();
    if (trimmed.length > 4000) {
      throw CareChatException('Message is too long.');
    }
    // Web refinement: body OR at least one attachment (care-chat.functions.ts:297-300).
    if (trimmed.isEmpty && attachments.isEmpty) {
      throw CareChatException('Message cannot be empty.');
    }

    await _assertParticipant(threadId, userId);

    final inserted = await _supabase
        .from('care_messages')
        .insert({
          'thread_id': threadId,
          'sender_id': userId,
          'body': trimmed,
          'attachments': attachments
              .map((a) => {
                    'path': a.path,
                    'name': a.name,
                    'mime': a.mime,
                    'size': a.size,
                    'kind': a.kind,
                  })
              .toList(),
        })
        .select('id, thread_id, sender_id, body, attachments, created_at, deleted_at')
        .single();

    // TODO(wave3): trigger native push (FCM/APNs) to non-muted recipients.
    // Web sends web-push inside sendCareMessage; native push is a server/edge
    // concern and is not generated from the client (see spec 2.4).

    final createdAt = inserted['created_at'] as String;
    await _supabase
        .from('care_thread_participants')
        .update({'last_read_at': createdAt})
        .eq('thread_id', threadId)
        .eq('user_id', userId);

    return CareMessage.fromMap(inserted);
  }

  /// Signed URL for an attachment (300s TTL). Mirrors `getCareAttachmentUrl`.
  Future<String> attachmentUrl({
    required String threadId,
    required String path,
  }) async {
    if (!path.startsWith('$threadId/')) {
      throw CareChatException('Invalid attachment path.');
    }
    return _supabase.storage
        .from('care-chat-attachments')
        .createSignedUrl(path, 300);
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

  /// Active care relationships usable as direct-chat targets — both people I
  /// care for (owner_id=me) and people sharing with me (caregiver_id=me).
  /// Mirrors the web New-chat picker's two lists (chat-care.tsx:204-305).
  Future<List<CareContact>> listContacts() async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to start a chat.');

    final mineRaw = await _supabase
        .from('care_relationships')
        .select('id, caregiver_id, invite_email, status')
        .eq('owner_id', userId)
        .filter('archived_at', 'is', null)
        .order('created_at', ascending: false);
    final sharedRaw = await _supabase
        .from('care_relationships')
        .select('id, owner_id, status')
        .eq('caregiver_id', userId)
        .inFilter('status', ['active', 'pending'])
        .order('created_at', ascending: false);

    final out = <CareContact>[];
    for (final r in (mineRaw as List).cast<Map<String, dynamic>>()) {
      if (r['status'] != 'active' || r['caregiver_id'] == null) continue;
      final email = (r['invite_email'] as String?)?.trim();
      out.add(CareContact(
        relationshipId: r['id'] as String,
        label: email != null && email.isNotEmpty ? email : 'Caregiver',
        caregiverId: r['caregiver_id'] as String?,
        direction: 'mine',
      ));
    }
    for (final r in (sharedRaw as List).cast<Map<String, dynamic>>()) {
      if (r['status'] != 'active') continue;
      out.add(CareContact(
        relationshipId: r['id'] as String,
        label: 'Person sharing with you',
        caregiverId: null,
        direction: 'shared',
      ));
    }
    return out;
  }

  /// Active caregivers of the current user (owner_id=me), for the group picker.
  Future<List<CareContact>> listMyCaregivers() async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to start a chat.');

    final rows = await _supabase
        .from('care_relationships')
        .select('id, caregiver_id, invite_email, status')
        .eq('owner_id', userId)
        .filter('archived_at', 'is', null)
        .order('created_at', ascending: false);
    final out = <CareContact>[];
    for (final r in (rows as List).cast<Map<String, dynamic>>()) {
      if (r['status'] != 'active' || r['caregiver_id'] == null) continue;
      final email = (r['invite_email'] as String?)?.trim();
      out.add(CareContact(
        relationshipId: r['id'] as String,
        label: email != null && email.isNotEmpty ? email : 'Caregiver',
        caregiverId: r['caregiver_id'] as String?,
        direction: 'mine',
      ));
    }
    return out;
  }

  /// List the current owner's group threads with member count.
  /// Mirrors `listGroupThreads` (care-chat.functions.ts:447-477).
  Future<List<CareGroupSummary>> listGroupThreads() async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to view groups.');

    final threadsRaw = await _supabase
        .from('care_threads')
        .select('id, title, last_message_at, created_at')
        .eq('owner_id', userId)
        .eq('kind', 'group')
        .order('last_message_at', ascending: false);
    final threads = (threadsRaw as List).cast<Map<String, dynamic>>();
    if (threads.isEmpty) return const [];

    final ids = threads.map((t) => t['id'] as String).toList();
    final partsRaw = await _supabase
        .from('care_thread_participants')
        .select('thread_id')
        .inFilter('thread_id', ids);
    final countByThread = <String, int>{};
    for (final p in (partsRaw as List).cast<Map<String, dynamic>>()) {
      final tid = p['thread_id'] as String;
      countByThread[tid] = (countByThread[tid] ?? 0) + 1;
    }

    return threads
        .map((t) => CareGroupSummary(
              id: t['id'] as String,
              title: (t['title'] as String?)?.trim().isNotEmpty == true
                  ? (t['title'] as String)
                  : 'Care team',
              lastMessageAt: t['last_message_at'] as String?,
              memberCount: countByThread[t['id'] as String] ?? 0,
            ))
        .toList();
  }

  /// Create a named group thread with the chosen caregivers.
  /// Mirrors `createGroupThread` (care-chat.functions.ts:480-532).
  Future<String> createGroupThread({
    required String title,
    required List<String> caregiverIds,
  }) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to create a group.');

    final trimmed = title.trim();
    if (trimmed.isEmpty) throw CareChatException('Give the group a name.');
    if (trimmed.length > 80) throw CareChatException('Group name is too long.');
    if (caregiverIds.isEmpty) {
      throw CareChatException('Pick at least one caregiver.');
    }

    // Validate every id is an active caregiver of the caller.
    final relsRaw = await _supabase
        .from('care_relationships')
        .select('caregiver_id')
        .eq('owner_id', userId)
        .eq('status', 'active');
    final allowed = (relsRaw as List)
        .cast<Map<String, dynamic>>()
        .map((r) => r['caregiver_id'] as String?)
        .whereType<String>()
        .toSet();
    final members =
        caregiverIds.toSet().where(allowed.contains).toList();
    if (members.isEmpty) {
      throw CareChatException(
        "Pick at least one caregiver who's actively sharing with you.",
      );
    }

    final created = await _supabase
        .from('care_threads')
        .insert({'owner_id': userId, 'kind': 'group', 'title': trimmed})
        .select('id')
        .single();
    final threadId = created['id'] as String;

    await _supabase.from('care_thread_participants').insert([
      {'thread_id': threadId, 'user_id': userId, 'role': 'owner'},
      ...members.map((id) => {
            'thread_id': threadId,
            'user_id': id,
            'role': 'caregiver',
          }),
    ]);

    return threadId;
  }

  /// Toggle mute on a thread for the current user.
  /// Mirrors `setCareThreadMute` (care-chat.functions.ts:535-548).
  Future<bool> setThreadMute({
    required String threadId,
    required bool muted,
  }) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to update chat.');

    await _supabase
        .from('care_thread_participants')
        .update({'muted': muted, 'muted_until': null})
        .eq('thread_id', threadId)
        .eq('user_id', userId);
    return muted;
  }

  /// Leave a thread (owner cannot leave their own thread).
  /// Mirrors `leaveCareThread` (care-chat.functions.ts:551-573).
  Future<void> leaveThread(String threadId) async {
    final userId = _userId;
    if (userId == null) throw CareChatException('Sign in to leave chat.');

    final thread = await _supabase
        .from('care_threads')
        .select('owner_id')
        .eq('id', threadId)
        .maybeSingle();
    if (thread != null && thread['owner_id'] == userId) {
      throw CareChatException(
        "You own this chat; you can't leave it. You can mute it instead.",
      );
    }
    await _supabase
        .from('care_thread_participants')
        .delete()
        .eq('thread_id', threadId)
        .eq('user_id', userId);
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

final careContactsProvider =
    FutureProvider.autoDispose<List<CareContact>>((ref) async {
  ref.watch(authSessionProvider);
  return ref.watch(careChatRepositoryProvider).listContacts();
});

final careMyCaregiversProvider =
    FutureProvider.autoDispose<List<CareContact>>((ref) async {
  ref.watch(authSessionProvider);
  return ref.watch(careChatRepositoryProvider).listMyCaregivers();
});

final careGroupThreadsProvider =
    FutureProvider.autoDispose<List<CareGroupSummary>>((ref) async {
  ref.watch(authSessionProvider);
  return ref.watch(careChatRepositoryProvider).listGroupThreads();
});
