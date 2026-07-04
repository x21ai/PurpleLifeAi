import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';

/// AI health chat stub (mirrors web `/chat`). Full UI ships in Phase 3+.
class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SafeArea(
        child: ContentColumn(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: () => context.canPop() ? context.pop() : context.go('/today'),
                  icon: Icon(Icons.arrow_back, color: Colors.white.withValues(alpha: 0.7)),
                  tooltip: 'Back',
                ),
              ),
              Expanded(
                child: EmptyState(
                  eyebrow: 'Chat',
                  title: 'Ask Purple anything',
                  body: initialQuery == null || initialQuery!.trim().isEmpty
                      ? 'Streaming AI chat with your health context ships in a later phase.'
                      : 'Your question will open here once chat is wired. For now, review Today and Vitals.',
                  primaryActionLabel: 'Back to Today',
                  onPrimaryAction: () => context.go('/today'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Caregiver direct chat stub (mirrors web `/chat-care`).
class ChatCareScreen extends StatelessWidget {
  const ChatCareScreen({super.key, this.threadId});

  final String? threadId;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SafeArea(
        child: ContentColumn(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: () => context.canPop() ? context.pop() : context.go('/settings/sharing'),
                  icon: Icon(Icons.arrow_back, color: Colors.white.withValues(alpha: 0.7)),
                  tooltip: 'Back',
                ),
              ),
              Expanded(
                child: EmptyState(
                  eyebrow: 'Care chat',
                  title: 'Message your caregiver',
                  body: threadId == null || threadId!.isEmpty
                      ? 'Direct chat threads with people you share with ship in a later phase.'
                      : 'Thread $threadId will open here once care chat is wired.',
                  primaryActionLabel: 'Back to Sharing',
                  onPrimaryAction: () => context.go('/settings/sharing'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
