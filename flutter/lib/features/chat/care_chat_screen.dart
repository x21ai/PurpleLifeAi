import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../care/care_repository.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'chat_copy.dart';

/// Caregiver messaging shell mirroring web `/chat-care`.
class ChatCareScreen extends ConsumerWidget {
  const ChatCareScreen({super.key, this.threadId});

  final String? threadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sharingAsync = ref.watch(sharingListProvider);
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
            child: sharingAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: LoadingSkeleton(sectionTitle: 'Care chat', tileCount: 3),
              ),
              error: (_, __) => _CareChatError(
                onRetry: () => ref.invalidate(sharingListProvider),
              ),
              data: (sharing) {
                final activeMine = sharing.myCaregivers
                    .where((r) => r.status == 'active')
                    .toList();
                final activeShared = sharing.sharingWithMe
                    .where((r) => r.status == 'active')
                    .toList();
                final hasRelationships =
                    activeMine.isNotEmpty || activeShared.isNotEmpty;

                return LayoutBuilder(
                  builder: (context, constraints) {
                    final threadOnly = !showSplit && threadId != null;

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
                                  hasRelationships: hasRelationships,
                                  activeMine: activeMine,
                                  activeShared: activeShared,
                                  selectedThreadId: threadId,
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
                              child: _ConversationPanel(
                                threadId: threadId,
                                hasRelationships: hasRelationships,
                                onBack: threadOnly
                                    ? () => context.go(AppRoutes.chatCare)
                                    : null,
                                onOpenSharing: () =>
                                    context.go(AppRoutes.settingsSharing),
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

class _ThreadListPanel extends StatelessWidget {
  const _ThreadListPanel({
    required this.hasRelationships,
    required this.activeMine,
    required this.activeShared,
    required this.selectedThreadId,
    required this.onSelectThread,
    required this.onOpenSharing,
  });

  final bool hasRelationships;
  final List<CareRelationshipRow> activeMine;
  final List<CareRelationshipRow> activeShared;
  final String? selectedThreadId;
  final ValueChanged<String> onSelectThread;
  final VoidCallback onOpenSharing;

  @override
  Widget build(BuildContext context) {
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
          child: !hasRelationships
              ? _CareEmptyState(onOpenSharing: onOpenSharing)
              : ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                      child: Text(
                        ChatCopy.careConnectTitle,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.75),
                            ),
                      ),
                    ),
                    for (final rel in activeMine)
                      _RelationshipTile(
                        label: rel.inviteEmail.isNotEmpty
                            ? rel.inviteEmail
                            : 'Caregiver',
                        subtitle: 'Your caregiver',
                        selected: selectedThreadId == rel.id,
                        onTap: () => onSelectThread(rel.id),
                      ),
                    for (final rel in activeShared)
                      _RelationshipTile(
                        label: rel.ownerDisplayName?.trim().isNotEmpty == true
                            ? rel.ownerDisplayName!.trim()
                            : 'Person sharing with you',
                        subtitle: 'Sharing with you',
                        selected: selectedThreadId == rel.id,
                        onTap: () => onSelectThread(rel.id),
                      ),
                  ],
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

class _RelationshipTile extends StatelessWidget {
  const _RelationshipTile({
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String subtitle;
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.92),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConversationPanel extends StatelessWidget {
  const _ConversationPanel({
    required this.threadId,
    required this.hasRelationships,
    required this.onBack,
    required this.onOpenSharing,
  });

  final String? threadId;
  final bool hasRelationships;
  final VoidCallback? onBack;
  final VoidCallback onOpenSharing;

  @override
  Widget build(BuildContext context) {
    if (threadId == null || threadId!.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            hasRelationships
                ? ChatCopy.careSelectThread
                : ChatCopy.careNoRelationships,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
          child: Row(
            children: [
              if (onBack != null)
                IconButton(
                  onPressed: onBack,
                  icon: Icon(
                    Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              Expanded(
                child: Text(
                  'Conversation',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ),
        Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
        Expanded(
          child: Center(
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
          ),
        ),
        Divider(height: 1, color: Colors.white.withValues(alpha: 0.08)),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  enabled: false,
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
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: onOpenSharing,
                tooltip: 'Manage sharing',
                icon: Icon(
                  Icons.settings_outlined,
                  color: Colors.white.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
