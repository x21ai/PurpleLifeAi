import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers/core_providers.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_chat_repository.dart';
import 'chat_copy.dart';

/// Caregiver messaging shell mirroring web `/chat-care`.
class ChatCareScreen extends ConsumerWidget {
  const ChatCareScreen({super.key, this.threadId});

  final String? threadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              TextButton.icon(
                onPressed: onOpenSharing,
                icon: const Icon(Icons.group_add_outlined, size: 18),
                label: const Text('Sharing'),
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _markRead());
  }

  @override
  void didUpdateWidget(covariant _ConversationPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.thread.id != widget.thread.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _markRead());
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
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
      await ref.read(careChatRepositoryProvider).sendMessage(
            threadId: widget.thread.id,
            body: text,
          );
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

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
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
            data: (messages) {
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

              return ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final message = messages[index];
                  final mine = message.senderId == meId;
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
                          Text(
                            message.body,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: mine
                                      ? Theme.of(context).colorScheme.onPrimary
                                      : Colors.white.withValues(alpha: 0.92),
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatMessageTime(message.createdAt),
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: mine
                                      ? Theme.of(context)
                                          .colorScheme
                                          .onPrimary
                                          .withValues(alpha: 0.75)
                                      : Colors.white.withValues(alpha: 0.45),
                                ),
                          ),
                        ],
                      ),
                    ),
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
