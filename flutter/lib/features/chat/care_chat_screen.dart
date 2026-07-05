import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show RealtimeChannel;

import 'dart:async';

import '../../core/providers/core_providers.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_attachment_view.dart';
import 'care_chat_pickers.dart';
import 'care_chat_repository.dart';
import 'chat_copy.dart';

/// Caregiver messaging shell mirroring web `/chat-care`.
class ChatCareScreen extends ConsumerStatefulWidget {
  const ChatCareScreen({super.key, this.threadId});

  final String? threadId;

  @override
  ConsumerState<ChatCareScreen> createState() => _ChatCareScreenState();
}

class _ChatCareScreenState extends ConsumerState<ChatCareScreen> {
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    // Web polls the thread list every 15s (chat-care.tsx:527). Mirror it.
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) ref.invalidate(careThreadsProvider);
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final threadId = widget.threadId;
    final threadsAsync = ref.watch(careThreadsProvider);
    final width = MediaQuery.sizeOf(context).width;
    final showSplit = width >= 768;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CanvasBackground(
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: showSplit ? 16 : 0,
              vertical: showSplit ? 16 : 0,
            ),
            child: GlassSurface(
              padding: EdgeInsets.zero,
              borderRadius: showSplit ? 20 : 0,
              child: threadsAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: LoadingSkeleton(sectionTitle: 'Care chat', tileCount: 3),
                ),
                error: (_, __) => _CareChatError(
                  onRetry: () => ref.invalidate(careThreadsProvider),
                ),
                data: (threads) {
                  final activeId =
                      threadId ?? (showSplit && threads.isNotEmpty ? threads.first.id : null);
                  final activeThread = activeId == null
                      ? null
                      : threads.cast<CareThreadSummary?>().firstWhere(
                            (t) => t!.id == activeId,
                            orElse: () => null,
                          );
                  final threadOnly = !showSplit && threadId != null;

                  return LayoutBuilder(
                    builder: (context, constraints) {
                      return SizedBox(
                        height: constraints.maxHeight,
                        child: Row(
                          children: [
                            if (!threadOnly)
                              Expanded(
                                flex: showSplit ? 0 : 1,
                                child: SizedBox(
                                  width: showSplit ? 320 : null,
                                  child: _ThreadListPanel(
                                    threads: threads,
                                    selectedThreadId: activeId,
                                    onSelectThread: (id) {
                                      context.go('${AppRoutes.chatCare}?thread=$id');
                                    },
                                    onOpenSharing: () =>
                                        context.go(AppRoutes.settingsSharing),
                                  ),
                                ),
                              ),
                            if (showSplit || threadOnly)
                              Expanded(
                                child: activeThread == null
                                    ? _ConversationPlaceholder(
                                        hasThreads: threads.isNotEmpty,
                                        onBack: threadOnly
                                            ? () => context.go(AppRoutes.chatCare)
                                            : null,
                                      )
                                    : _ConversationPanel(
                                        thread: activeThread,
                                        onBack: threadOnly
                                            ? () => context.go(AppRoutes.chatCare)
                                            : null,
                                      ),
                              ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CareChatError extends StatelessWidget {
  const _CareChatError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Could not load care chat',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _ThreadListPanel extends ConsumerWidget {
  const _ThreadListPanel({
    required this.threads,
    required this.selectedThreadId,
    required this.onSelectThread,
    required this.onOpenSharing,
  });

  final List<CareThreadSummary> threads;
  final String? selectedThreadId;
  final ValueChanged<String> onSelectThread;
  final VoidCallback onOpenSharing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meId = ref.watch(authSessionProvider).valueOrNull?.user.id;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  ChatCopy.careTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              TextButton.icon(
                onPressed: () => showNewChatPicker(
                  context,
                  ref,
                  onPicked: onSelectThread,
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: const Size(0, 40),
                ),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('New'),
              ),
              TextButton.icon(
                onPressed: () => showGroupPicker(
                  context,
                  ref,
                  onPicked: onSelectThread,
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: const Size(0, 40),
                ),
                icon: const Icon(Icons.groups_outlined, size: 18),
                label: const Text('Group'),
              ),
            ],
          ),
        ),
        Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
        Expanded(
          child: threads.isEmpty
              ? _CareEmptyState(onOpenSharing: onOpenSharing)
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: threads.length,
                  itemBuilder: (context, index) {
                    final thread = threads[index];
                    final selected = thread.id == selectedThreadId;
                    final preview = thread.lastMessage == null
                        ? 'No messages yet'
                        : '${thread.lastMessage!.senderId == meId ? 'You: ' : ''}${thread.lastMessage!.body}';
                    return _ThreadTile(
                      title: thread.displayName(meId),
                      subtitle: preview,
                      timeLabel: _formatThreadTime(thread.lastMessageAt),
                      unread: thread.unread,
                      isGroup: thread.kind == 'group',
                      selected: selected,
                      onTap: () => onSelectThread(thread.id),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _CareEmptyState extends StatelessWidget {
  const _CareEmptyState({required this.onOpenSharing});

  final VoidCallback onOpenSharing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 40,
            color: Colors.white.withValues(alpha: 0.35),
          ),
          const SizedBox(height: 16),
          Text(
            ChatCopy.careEmptyTitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            ChatCopy.careEmptyBody,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: onOpenSharing,
            child: const Text('Go to Sharing'),
          ),
        ],
      ),
    );
  }
}

class _ThreadTile extends StatelessWidget {
  const _ThreadTile({
    required this.title,
    required this.subtitle,
    required this.timeLabel,
    required this.unread,
    required this.isGroup,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String timeLabel;
  final int unread;
  final bool isGroup;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Colors.white.withValues(alpha: 0.08)
          : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: selected
                    ? Theme.of(context).colorScheme.primary
                    : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (isGroup) ...[
                          Icon(
                            Icons.groups_outlined,
                            size: 14,
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Expanded(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.92),
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    timeLabel,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.45),
                        ),
                  ),
                  if (unread > 0) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        unread > 99 ? '99+' : '$unread',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Theme.of(context).colorScheme.onPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConversationPlaceholder extends StatelessWidget {
  const _ConversationPlaceholder({
    required this.hasThreads,
    required this.onBack,
  });

  final bool hasThreads;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (onBack != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: onBack,
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
              ),
            ),
          ),
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                hasThreads ? ChatCopy.careSelectThread : ChatCopy.careNoRelationships,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ConversationPanel extends ConsumerStatefulWidget {
  const _ConversationPanel({
    required this.thread,
    required this.onBack,
  });

  final CareThreadSummary thread;
  final VoidCallback? onBack;

  @override
  ConsumerState<_ConversationPanel> createState() => _ConversationPanelState();
}

class _ConversationPanelState extends ConsumerState<_ConversationPanel> {
  final _scrollController = ScrollController();
  final _inputController = TextEditingController();
  var _sending = false;
  var _muteBusy = false;

  /// Live-appended inserts from the realtime channel, keyed by message id.
  /// Merged with the fetched provider list on build.
  final _liveById = <String, CareMessage>{};
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _markRead());
    _subscribe(widget.thread.id);
  }

  @override
  void didUpdateWidget(covariant _ConversationPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.thread.id != widget.thread.id) {
      _unsubscribe();
      _liveById.clear();
      _subscribe(widget.thread.id);
      WidgetsBinding.instance.addPostFrameCallback((_) => _markRead());
    }
  }

  @override
  void dispose() {
    _unsubscribe();
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  void _subscribe(String threadId) {
    final repo = ref.read(careChatRepositoryProvider);
    _channel = repo.subscribeThread(threadId, (message) {
      if (!mounted || message.threadId != widget.thread.id) return;
      setState(() => _liveById[message.id] = message);
      // Inbound message from someone else: refresh unread + mark read on open.
      final meId = ref.read(authSessionProvider).valueOrNull?.user.id;
      if (message.senderId != meId) {
        _markRead();
      }
      ref.invalidate(careThreadsProvider);
      _scrollToBottom();
    });
  }

  void _unsubscribe() {
    final channel = _channel;
    if (channel != null) {
      ref.read(careChatRepositoryProvider).removeChannel(channel);
      _channel = null;
    }
  }

  Future<void> _markRead() async {
    try {
      await ref.read(careChatRepositoryProvider).markThreadRead(widget.thread.id);
      ref.invalidate(careThreadsProvider);
    } catch (_) {
      // Best effort.
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _sending) return;

    final online = ref.read(isOnlineProvider).valueOrNull ?? true;
    if (!online) {
      _showSnack(ChatCopy.careOffline);
      return;
    }

    setState(() => _sending = true);
    _inputController.clear();

    try {
      final sent = await ref.read(careChatRepositoryProvider).sendMessage(
            threadId: widget.thread.id,
            body: text,
          );
      // Merge our own message locally so it appears without a refetch race
      // (realtime may not echo the sender's own insert in time).
      _liveById[sent.id] = sent;
      ref.invalidate(careMessagesProvider(widget.thread.id));
      ref.invalidate(careThreadsProvider);
      if (mounted) setState(() => _sending = false);
      _scrollToBottom();
    } on CareChatException catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      _inputController.text = text;
      _showSnack(e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _sending = false);
      _inputController.text = text;
      _showSnack(ChatCopy.careSendError);
    }
  }

  Future<void> _toggleMute() async {
    if (_muteBusy) return;
    setState(() => _muteBusy = true);
    final next = !widget.thread.muted;
    try {
      await ref.read(careChatRepositoryProvider).setThreadMute(
            threadId: widget.thread.id,
            muted: next,
          );
      ref.invalidate(careThreadsProvider);
      if (mounted) _showSnack(next ? 'Muted' : 'Unmuted');
    } catch (_) {
      if (mounted) {
        _showSnack("That change didn't save. Try again in a moment.");
      }
    } finally {
      if (mounted) setState(() => _muteBusy = false);
    }
  }

  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF15121D),
        title: const Text('Leave this chat?',
            style: TextStyle(color: Colors.white)),
        content: Text(
          'You can be re-added later by the chat owner.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(careChatRepositoryProvider).leaveThread(widget.thread.id);
      ref.invalidate(careThreadsProvider);
      if (!mounted) return;
      _showSnack('You left the chat');
      context.go(AppRoutes.chatCare);
    } on CareChatException catch (e) {
      if (mounted) _showSnack(e.message);
    } catch (_) {
      if (mounted) _showSnack("Couldn't leave");
    }
  }

  /// Merge fetched messages with live inserts, dedupe by id, sort ascending.
  List<CareMessage> _mergeMessages(List<CareMessage> fetched) {
    final byId = <String, CareMessage>{};
    for (final m in fetched) {
      byId[m.id] = m;
    }
    for (final entry in _liveById.entries) {
      byId.putIfAbsent(entry.key, () => entry.value);
    }
    final list = byId.values.toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return list;
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String? _senderName(String senderId) {
    for (final o in widget.thread.others) {
      if (o.userId == senderId) return o.name;
    }
    return null;
  }

  bool _sameDay(String isoA, String isoB) {
    final a = DateTime.parse(isoA).toLocal();
    final b = DateTime.parse(isoB).toLocal();
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  Widget _daySeparator(BuildContext context, String iso) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 6),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            _dayLabel(iso),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.6),
                  letterSpacing: 0.5,
                ),
          ),
        ),
      ),
    );
  }

  Widget _bubble(
    BuildContext context, {
    required CareMessage message,
    required bool mine,
    required bool isGroup,
    required String? senderName,
  }) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        decoration: BoxDecoration(
          color: mine
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.85)
              : Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment:
              mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!mine && isGroup && senderName != null) ...[
              Text(
                senderName,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 3),
            ],
            if (message.isDeleted)
              Text(
                'Message deleted',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: (mine ? onPrimary : Colors.white)
                          .withValues(alpha: 0.5),
                      fontStyle: FontStyle.italic,
                    ),
              )
            else ...[
              if (message.attachments.isNotEmpty) ...[
                ...message.attachments.map(
                  (a) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: CareAttachmentView(
                      threadId: widget.thread.id,
                      attachment: a,
                      mine: mine,
                    ),
                  ),
                ),
              ],
              if (message.body.isNotEmpty)
                Text(
                  message.body,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: mine
                            ? onPrimary
                            : Colors.white.withValues(alpha: 0.92),
                      ),
                ),
            ],
            const SizedBox(height: 4),
            Text(
              _formatMessageTime(message.createdAt),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: mine
                        ? onPrimary.withValues(alpha: 0.75)
                        : Colors.white.withValues(alpha: 0.45),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final meId = ref.watch(authSessionProvider).valueOrNull?.user.id;
    final messagesAsync = ref.watch(careMessagesProvider(widget.thread.id));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
          child: Row(
            children: [
              if (widget.onBack != null)
                IconButton(
                  onPressed: widget.onBack,
                  icon: Icon(
                    Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.thread.displayName(meId),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    if (widget.thread.kind == 'group')
                      Text(
                        '${widget.thread.others.length + 1} people',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                      ),
                  ],
                ),
              ),
              if (widget.thread.muted)
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Icon(
                    Icons.notifications_off_outlined,
                    size: 18,
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
                ),
              PopupMenuButton<String>(
                tooltip: 'Chat options',
                icon: Icon(
                  Icons.more_vert,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
                color: const Color(0xFF1B1724),
                enabled: !_muteBusy,
                onSelected: (value) {
                  if (value == 'mute') {
                    _toggleMute();
                  } else if (value == 'leave') {
                    _leave();
                  }
                },
                itemBuilder: (context) {
                  final isOwner = widget.thread.ownerId == meId;
                  return [
                    PopupMenuItem<String>(
                      value: 'mute',
                      child: Row(
                        children: [
                          Icon(
                            widget.thread.muted
                                ? Icons.notifications_active_outlined
                                : Icons.notifications_off_outlined,
                            size: 18,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            widget.thread.muted
                                ? 'Unmute notifications'
                                : 'Mute notifications',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                    if (!isOwner)
                      const PopupMenuItem<String>(
                        value: 'leave',
                        child: Row(
                          children: [
                            Icon(Icons.logout, size: 18, color: Color(0xFFFF6B6B)),
                            SizedBox(width: 10),
                            Text('Leave chat',
                                style: TextStyle(color: Color(0xFFFF6B6B))),
                          ],
                        ),
                      ),
                  ];
                },
              ),
            ],
          ),
        ),
        Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
        Expanded(
          child: messagesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => Center(
              child: TextButton(
                onPressed: () =>
                    ref.invalidate(careMessagesProvider(widget.thread.id)),
                child: const Text('Could not load messages. Try again.'),
              ),
            ),
            data: (fetched) {
              final messages = _mergeMessages(fetched);
              if (messages.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.forum_outlined,
                          size: 36,
                          color: Colors.white.withValues(alpha: 0.35),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No messages yet',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.85),
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          ChatCopy.careConnectBody,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.55),
                                height: 1.4,
                              ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

              final isGroup = widget.thread.kind == 'group';
              return ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final message = messages[index];
                  final prev = index > 0 ? messages[index - 1] : null;
                  final showDaySep = prev == null ||
                      !_sameDay(prev.createdAt, message.createdAt);
                  final mine = message.senderId == meId;
                  final senderName = _senderName(message.senderId);
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (showDaySep) _daySeparator(context, message.createdAt),
                      _bubble(
                        context,
                        message: message,
                        mine: mine,
                        isGroup: isGroup,
                        senderName: senderName,
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ),
        Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // TODO(wave3): attachments — needs a native file/image picker.
              // Web has an attach button + pending-file chips here
              // (chat-care.tsx:937-1021). Rendering of received attachments is
              // handled by CareAttachmentView; sending is deferred to Wave 3.
              Expanded(
                child: TextField(
                  controller: _inputController,
                  enabled: !_sending,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: ChatCopy.careComposerHint,
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.35),
                    ),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.04),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.92)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _sending ? null : _send,
                tooltip: 'Send',
                icon: _sending
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      )
                    : Icon(
                        Icons.send_rounded,
                        color: Theme.of(context).colorScheme.primary,
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

String _formatThreadTime(String iso) {
  final d = DateTime.parse(iso).toLocal();
  final today = DateTime.now();
  if (d.year == today.year && d.month == today.month && d.day == today.day) {
    return _formatClock(d);
  }
  return '${_month(d.month)} ${d.day}';
}

String _dayLabel(String iso) {
  final d = DateTime.parse(iso).toLocal();
  final today = DateTime.now();
  if (d.year == today.year && d.month == today.month && d.day == today.day) {
    return 'Today';
  }
  final yesterday = today.subtract(const Duration(days: 1));
  if (d.year == yesterday.year &&
      d.month == yesterday.month &&
      d.day == yesterday.day) {
    return 'Yesterday';
  }
  return '${_month(d.month)} ${d.day}, ${d.year}';
}

String _formatMessageTime(String iso) {
  final d = DateTime.parse(iso).toLocal();
  final today = DateTime.now();
  final time = _formatClock(d);
  if (d.year == today.year && d.month == today.month && d.day == today.day) {
    return time;
  }
  final yesterday = today.subtract(const Duration(days: 1));
  if (d.year == yesterday.year &&
      d.month == yesterday.month &&
      d.day == yesterday.day) {
    return 'Yesterday · $time';
  }
  return '${_month(d.month)} ${d.day} · $time';
}

String _formatClock(DateTime d) {
  final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
  final minute = d.minute.toString().padLeft(2, '0');
  final period = d.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}

String _month(int month) {
  const names = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return names[month - 1];
}
