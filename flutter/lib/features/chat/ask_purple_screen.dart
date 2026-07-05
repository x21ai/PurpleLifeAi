import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/worker_client.dart';
import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import 'chat_copy.dart';
import 'chat_repository.dart';

/// AI health chat shell mirroring web `/chat`.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _scrollController = ScrollController();
  final _inputController = TextEditingController();
  final _turns = <ChatTurn>[];
  var _streaming = false;
  var _streamError = false;
  String? _draftAssistant;

  @override
  void initState() {
    super.initState();
    final prefill = widget.initialQuery?.trim();
    if (prefill != null && prefill.isNotEmpty) {
      _inputController.text = prefill;
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
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

  Future<void> _send(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _streaming) return;

    final online = ref.read(isOnlineProvider).valueOrNull ?? true;
    if (!online) {
      _showSnack(ChatCopy.askOffline);
      return;
    }

    setState(() {
      _streaming = true;
      _streamError = false;
      _draftAssistant = null;
      _turns.add(ChatTurn(role: 'user', text: trimmed));
      _inputController.clear();
    });
    _scrollToBottom();

    try {
      final repo = ref.read(chatRepositoryProvider);
      var assistant = '';
      await for (final partial in repo.sendAskPurple(
        history: _turns.sublist(0, _turns.length - 1),
        userText: trimmed,
      )) {
        assistant = partial;
        if (!mounted) return;
        setState(() => _draftAssistant = assistant);
        _scrollToBottom();
      }
      if (!mounted) return;
      setState(() {
        if (assistant.trim().isNotEmpty) {
          _turns.add(ChatTurn(role: 'assistant', text: assistant.trim()));
        }
        _draftAssistant = null;
        _streaming = false;
      });
    } on WorkerApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _streaming = false;
        _draftAssistant = null;
        _streamError = true;
      });
      _showSnack(e.message.isNotEmpty ? e.message : ChatCopy.askSendError);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _streaming = false;
        _draftAssistant = null;
        _streamError = true;
      });
      _showSnack(ChatCopy.askSendError);
    }
    _scrollToBottom();
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final conditionsAsync = ref.watch(chatConditionsProvider);
    final suggestions = conditionsAsync.maybeWhen(
      data: getSuggestedQuestions,
      orElse: () => getSuggestedQuestions(const []),
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CanvasBackground(
        child: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _AskHeader(),
              Expanded(
                child: ContentColumn(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ListView(
                    controller: _scrollController,
                    padding: const EdgeInsets.only(top: 24, bottom: 16),
                    children: [
                      if (_turns.isEmpty && !_streaming)
                        _AskEmptyState(
                          suggestions: suggestions,
                          onPick: (s) => _send(s),
                        )
                      else ...[
                        for (final turn in _turns)
                          _ChatBubble(
                            role: turn.role,
                            text: turn.text,
                          ),
                        if (_draftAssistant != null)
                          _ChatBubble(role: 'assistant', text: _draftAssistant!),
                        if (_streaming && _draftAssistant == null)
                          const _ThinkingDots(),
                        if (_streamError)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              ChatCopy.askSendError,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
              _AskComposer(
                controller: _inputController,
                busy: _streaming,
                onSend: () => _send(_inputController.text),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AskHeader extends StatelessWidget {
  const _AskHeader();

  @override
  Widget build(BuildContext context) {
    return ContentColumn(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            ChatCopy.askEyebrow.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.2,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            '${ChatCopy.askTitleLine1}\n${ChatCopy.askTitleLine2}',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontFamily: PurpleType.serif,
                  fontSize: 40,
                  height: 1.02,
                  letterSpacing: 40 * -0.02,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 16),
          Divider(color: Colors.white.withValues(alpha: 0.08), height: 1),
        ],
      ),
    );
  }
}

class _AskEmptyState extends StatelessWidget {
  const _AskEmptyState({
    required this.suggestions,
    required this.onPick,
  });

  final List<String> suggestions;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          ChatCopy.askEmptyBody,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontFamily: PurpleType.serif,
                color: Colors.white.withValues(alpha: 0.85),
                height: 1.5,
              ),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final suggestion in suggestions)
              _SuggestionChip(
                label: suggestion,
                onTap: () => onPick(suggestion),
              ),
          ],
        ),
      ],
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  const _SuggestionChip({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: GlassSurface(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          borderRadius: 999,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.role, required this.text});

  final String role;
  final String text;

  @override
  Widget build(BuildContext context) {
    final isUser = role == 'user';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.sizeOf(context).width * (isUser ? 0.85 : 0.9),
          ),
          child: GlassSurface(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            borderRadius: 20,
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontFamily: isUser ? null : PurpleType.serif,
                    color: Colors.white.withValues(alpha: 0.92),
                    height: 1.45,
                  ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ThinkingDots extends StatelessWidget {
  const _ThinkingDots();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: GlassSurface(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        borderRadius: 20,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            return Padding(
              padding: EdgeInsets.only(left: i == 0 ? 0 : 6),
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _AskComposer extends StatelessWidget {
  const _AskComposer({
    required this.controller,
    required this.busy,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        color: CanvasBackground.canvasColor.withValues(alpha: 0.95),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + bottomInset),
      child: ContentColumn(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              ChatCopy.askDisclaimer,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.45),
                    height: 1.35,
                  ),
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    minLines: 1,
                    maxLines: 5,
                    enabled: !busy,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.95)),
                    decoration: InputDecoration(
                      hintText: ChatCopy.askComposerHint,
                      hintStyle: TextStyle(
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.06),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    onSubmitted: (_) => onSend(),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: busy ? null : onSend,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(44, 44),
                    padding: EdgeInsets.zero,
                    shape: const CircleBorder(),
                  ),
                  child: busy
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 20),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
