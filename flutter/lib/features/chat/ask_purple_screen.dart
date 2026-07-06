import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/worker_client.dart';
import '../../core/providers/core_providers.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import 'action_confirm_card.dart';
import 'ask_limit.dart';
import 'chat_copy.dart';
import 'chat_repository.dart';
import 'chat_style.dart';
import 'citation_text.dart';

/// A single assistant turn plus any actions it proposed and their states.
class _AssistantTurn {
  _AssistantTurn({required this.text, required this.proposals});

  String text;
  List<Proposal> proposals;
  final Map<int, ProposalStatus> statuses = {};
  final Set<int> busy = {};
  bool journalSaved = false;
}

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

  /// Flat transcript: each item is either a user or assistant turn.
  final _turns = <ChatTurn>[];

  /// Assistant-turn side data keyed by index in [_turns].
  final _assistant = <int, _AssistantTurn>{};

  var _streaming = false;
  var _streamError = false;
  String? _draftAssistant;

  int _usedToday = 0;
  bool _limitLoaded = false;

  @override
  void initState() {
    super.initState();
    final prefill = widget.initialQuery?.trim();
    if (prefill != null && prefill.isNotEmpty) {
      _inputController.text = prefill;
    }
    _refreshLimit();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _refreshLimit() async {
    final used = await AskLimit.usedToday();
    if (!mounted) return;
    setState(() {
      _usedToday = used;
      _limitLoaded = true;
    });
  }

  bool get _overLimit => _usedToday >= AskLimit.freeDailyLimit;

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

    if (_overLimit) {
      _showSnack(ChatCopy.askLimitReached);
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

    // Record the send against the free-tier daily limit.
    await AskLimit.pushStamp();
    final used = await AskLimit.usedToday();
    if (mounted) setState(() => _usedToday = used);

    try {
      final repo = ref.read(chatRepositoryProvider);
      var text = '';
      var proposals = const <Proposal>[];
      await for (final chunk in repo.sendAskPurple(
        history: _turns.sublist(0, _turns.length - 1),
        userText: trimmed,
      )) {
        text = chunk.text;
        proposals = chunk.proposals;
        if (!mounted) return;
        setState(() => _draftAssistant = text);
        _scrollToBottom();
      }
      if (!mounted) return;
      setState(() {
        _streaming = false;
        _draftAssistant = null;
        if (text.trim().isNotEmpty || proposals.isNotEmpty) {
          _turns.add(ChatTurn(role: 'assistant', text: text.trim()));
          _assistant[_turns.length - 1] = _AssistantTurn(
            text: text.trim(),
            proposals: List.of(proposals),
          );
        }
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

  Future<void> _confirmAction(int turnIndex, int proposalIndex) async {
    final turn = _assistant[turnIndex];
    if (turn == null) return;
    final proposal = turn.proposals[proposalIndex];
    setState(() {
      turn.busy.add(proposalIndex);
      turn.statuses[proposalIndex] = ProposalStatus.pending;
    });
    final repo = ref.read(chatRepositoryProvider);
    final result = await repo.executeAction(proposal);
    if (!mounted) return;
    setState(() {
      turn.busy.remove(proposalIndex);
      turn.statuses[proposalIndex] =
          result.ok ? ProposalStatus.confirmed : ProposalStatus.failed;
    });
    _showSnack(result.ok
        ? ChatCopy.askActionDone
        : (result.error != null && result.error!.isNotEmpty
            ? result.error!
            : ChatCopy.askActionError));
  }

  void _cancelAction(int turnIndex, int proposalIndex) {
    final turn = _assistant[turnIndex];
    if (turn == null) return;
    setState(() => turn.statuses[proposalIndex] = ProposalStatus.cancelled);
  }

  Future<void> _saveToJournal(int turnIndex) async {
    final turn = _assistant[turnIndex];
    if (turn == null || turn.journalSaved || turn.text.isEmpty) return;
    // Preceding user question, if any.
    String? question;
    if (turnIndex > 0 && _turns[turnIndex - 1].role == 'user') {
      question = _turns[turnIndex - 1].text;
    }
    final repo = ref.read(chatRepositoryProvider);
    final ok = await repo.saveAnswerToJournal(
      answer: turn.text,
      question: question,
    );
    if (!mounted) return;
    if (ok) setState(() => turn.journalSaved = true);
    _showSnack(ok ? ChatCopy.askSaveJournalSuccess : ChatCopy.askSaveJournalError);
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  List<String> _followUpsFor(int turnIndex, List<String> conditions) {
    String lastUser = '';
    for (var i = turnIndex; i >= 0; i--) {
      if (_turns[i].role == 'user') {
        lastUser = _turns[i].text;
        break;
      }
    }
    return getFollowUps(conditions, lastUser);
  }

  @override
  Widget build(BuildContext context) {
    final conditionsAsync = ref.watch(chatConditionsProvider);
    final conditions = conditionsAsync.valueOrNull ?? const <String>[];
    final suggestions = getSuggestedQuestions(conditions);
    final lastIndex = _turns.length - 1;
    final remaining = AskLimit.freeDailyLimit - _usedToday;

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
                        for (var i = 0; i < _turns.length; i++)
                          ..._buildTurn(i, conditions, lastIndex),
                        if (_draftAssistant != null)
                          _ChatBubble(role: 'assistant', text: _draftAssistant!),
                        if (_streaming && _draftAssistant == null)
                          const _ThinkingDots(),
                        if (_streamError)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              ChatCopy.askSendError,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              ),
              if (_limitLoaded && _overLimit)
                _LimitGate()
              else
                _AskComposer(
                  controller: _inputController,
                  busy: _streaming,
                  onSend: () => _send(_inputController.text),
                  remaining:
                      remaining <= 3 && remaining > 0 && _limitLoaded ? remaining : null,
                ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildTurn(int i, List<String> conditions, int lastIndex) {
    final turn = _turns[i];
    if (turn.role == 'user') {
      return [_ChatBubble(role: 'user', text: turn.text)];
    }
    final data = _assistant[i];
    final widgets = <Widget>[];
    if (turn.text.isNotEmpty) {
      widgets.add(_ChatBubble(role: 'assistant', text: turn.text));
    }
    if (data != null) {
      for (var p = 0; p < data.proposals.length; p++) {
        widgets.add(
          ActionConfirmCard(
            proposal: data.proposals[p],
            status: data.statuses[p] ?? ProposalStatus.pending,
            busy: data.busy.contains(p),
            onConfirm: () => _confirmAction(i, p),
            onCancel: () => _cancelAction(i, p),
          ),
        );
      }
      final idle = !_streaming;
      // Follow-up chips under the last idle assistant turn with no proposals.
      if (idle && data.proposals.isEmpty && i == lastIndex) {
        final chips = _followUpsFor(i, conditions);
        if (chips.isNotEmpty) {
          widgets.add(
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final chip in chips)
                    _SuggestionChip(label: chip, onTap: () => _send(chip)),
                ],
              ),
            ),
          );
        }
      }
      // Save-to-journal under any idle assistant turn with text.
      if (idle && turn.text.isNotEmpty) {
        widgets.add(
          _SaveToJournalButton(
            saved: data.journalSaved,
            onTap: () => _saveToJournal(i),
          ),
        );
      }
    }
    return widgets;
  }
}

class _AskHeader extends StatelessWidget {
  const _AskHeader();

  @override
  Widget build(BuildContext context) {
    return ContentColumn(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: const ChatAskHeader(),
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
          style: chatBodySerif(),
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
            style: chatBubbleText(isUser: false),
          ),
        ),
      ),
    );
  }
}

class _SaveToJournalButton extends StatelessWidget {
  const _SaveToJournalButton({required this.saved, required this.onTap});

  final bool saved;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: TextButton.icon(
          onPressed: saved ? null : onTap,
          style: TextButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            foregroundColor: Colors.white.withValues(alpha: 0.7),
          ),
          icon: Icon(
            saved ? Icons.check_rounded : Icons.bookmark_add_outlined,
            size: 16,
          ),
          label: Text(
            saved ? ChatCopy.askSavedToJournal : ChatCopy.askSaveToJournal,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.7),
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
            child: isUser
                ? Text(text, style: chatBubbleText(isUser: true))
                : CitationText(text: text),
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

/// Replaces the composer when the free daily limit is reached (Pro upsell).
/// Native has no Pro entitlement flag, so this points users to the web app.
class _LimitGate extends StatelessWidget {
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
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottomInset),
      child: ContentColumn(
        child: GlassSurface(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ChatCopy.askLimitTitle,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                ChatCopy.askLimitBody,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                      height: 1.4,
                    ),
              ),
            ],
          ),
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
    this.remaining,
  });

  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSend;
  final int? remaining;

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
              style: chatComposerHint(),
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
            if (remaining != null) ...[
              const SizedBox(height: 8),
              Text(
                remaining == 1
                    ? '1 free message left today.'
                    : '$remaining free messages left today.',
                textAlign: TextAlign.right,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
