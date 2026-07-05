import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'care_chat_repository.dart';

/// Shared dark-glass sheet chrome for the care-chat pickers.
Future<T?> _showCareSheet<T>(BuildContext context, WidgetBuilder builder) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF15121D),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(ctx).bottom,
        ),
        child: builder(ctx),
      ),
    ),
  );
}

Widget _sheetTitle(BuildContext context, String text) {
  return Padding(
    padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
    child: Text(
      text,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Colors.white.withValues(alpha: 0.95),
            fontWeight: FontWeight.w600,
          ),
    ),
  );
}

/// New-chat picker: lists active care relationships (both directions).
/// Returns nothing; calls [onPicked] with the resolved thread id.
Future<void> showNewChatPicker(
  BuildContext context,
  WidgetRef ref, {
  required void Function(String threadId) onPicked,
}) {
  return _showCareSheet(context, (ctx) {
    return _NewChatSheet(ref: ref, onPicked: onPicked);
  });
}

class _NewChatSheet extends ConsumerStatefulWidget {
  const _NewChatSheet({required this.ref, required this.onPicked});

  final WidgetRef ref;
  final void Function(String threadId) onPicked;

  @override
  ConsumerState<_NewChatSheet> createState() => _NewChatSheetState();
}

class _NewChatSheetState extends ConsumerState<_NewChatSheet> {
  String? _busyRelId;

  Future<void> _pick(CareContact c) async {
    if (_busyRelId != null) return;
    setState(() => _busyRelId = c.relationshipId);
    try {
      final threadId = await ref
          .read(careChatRepositoryProvider)
          .getOrCreateDirectThread(c.relationshipId);
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onPicked(threadId);
    } on CareChatException catch (e) {
      if (!mounted) return;
      setState(() => _busyRelId = null);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _busyRelId = null);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text("Couldn't open chat")));
    }
  }

  @override
  Widget build(BuildContext context) {
    final contactsAsync = ref.watch(careContactsProvider);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sheetTitle(context, 'Start a new chat'),
        contactsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(28),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => const Padding(
            padding: EdgeInsets.fromLTRB(20, 4, 20, 24),
            child: Text(
              "Couldn't load your care relationships.",
              style: TextStyle(color: Colors.white70),
            ),
          ),
          data: (contacts) {
            if (contacts.isEmpty) {
              return const Padding(
                padding: EdgeInsets.fromLTRB(20, 4, 20, 28),
                child: Text(
                  'No active care relationships yet. Invite someone from '
                  'Settings → Sharing.',
                  style: TextStyle(color: Colors.white70, height: 1.4),
                ),
              );
            }
            return Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 12),
                itemCount: contacts.length,
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
                itemBuilder: (context, index) {
                  final c = contacts[index];
                  final busy = _busyRelId == c.relationshipId;
                  return ListTile(
                    minVerticalPadding: 14,
                    leading: Icon(
                      Icons.chat_bubble_outline,
                      color: Colors.white.withValues(alpha: 0.6),
                    ),
                    title: Text(
                      c.label,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : null,
                    onTap: busy ? null : () => _pick(c),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

/// Group picker: list existing groups or create a new one.
Future<void> showGroupPicker(
  BuildContext context,
  WidgetRef ref, {
  required void Function(String threadId) onPicked,
}) {
  return _showCareSheet(context, (ctx) {
    return _GroupSheet(ref: ref, onPicked: onPicked);
  });
}

class _GroupSheet extends ConsumerStatefulWidget {
  const _GroupSheet({required this.ref, required this.onPicked});

  final WidgetRef ref;
  final void Function(String threadId) onPicked;

  @override
  ConsumerState<_GroupSheet> createState() => _GroupSheetState();
}

class _GroupSheetState extends ConsumerState<_GroupSheet> {
  bool _createMode = false;
  bool _busy = false;
  final _titleController = TextEditingController(text: 'Care team');
  final _selected = <String>{};

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    if (_busy) return;
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Give the group a name.')));
      return;
    }
    if (_selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pick at least one caregiver.')));
      return;
    }
    setState(() => _busy = true);
    try {
      final threadId = await ref.read(careChatRepositoryProvider).createGroupThread(
            title: title,
            caregiverIds: _selected.toList(),
          );
      ref.invalidate(careGroupThreadsProvider);
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onPicked(threadId);
    } on CareChatException catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text("Couldn't create group")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sheetTitle(context, _createMode ? 'New group' : 'Group chats'),
        if (_createMode) _buildCreate(context) else _buildList(context),
      ],
    );
  }

  Widget _buildList(BuildContext context) {
    final groupsAsync = ref.watch(careGroupThreadsProvider);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        groupsAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(28),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => const Padding(
            padding: EdgeInsets.fromLTRB(20, 4, 20, 20),
            child: Text("Couldn't load groups.",
                style: TextStyle(color: Colors.white70)),
          ),
          data: (groups) {
            if (groups.isEmpty) {
              return const Padding(
                padding: EdgeInsets.fromLTRB(20, 4, 20, 16),
                child: Text(
                  'No groups yet. Create one to chat with several caregivers '
                  'at once.',
                  style: TextStyle(color: Colors.white70, height: 1.4),
                ),
              );
            }
            return Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: groups.length,
                itemBuilder: (context, index) {
                  final g = groups[index];
                  return ListTile(
                    leading: Icon(Icons.groups_outlined,
                        color: Colors.white.withValues(alpha: 0.6)),
                    title: Text(g.title,
                        style: const TextStyle(color: Colors.white),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    trailing: Text(
                      '${g.memberCount} ${g.memberCount == 1 ? 'member' : 'members'}',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 12),
                    ),
                    onTap: () {
                      Navigator.of(context).pop();
                      widget.onPicked(g.id);
                    },
                  );
                },
              ),
            );
          },
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: FilledButton.icon(
            onPressed: () => setState(() => _createMode = true),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Create new group'),
          ),
        ),
      ],
    );
  }

  Widget _buildCreate(BuildContext context) {
    final caregiversAsync = ref.watch(careMyCaregiversProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _titleController,
            maxLength: 80,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Group name',
              labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.04),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Caregivers',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 12)),
          ),
          const SizedBox(height: 8),
          caregiversAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, __) => const Text("Couldn't load caregivers.",
                style: TextStyle(color: Colors.white70)),
            data: (caregivers) {
              final selectable =
                  caregivers.where((c) => c.caregiverId != null).toList();
              if (selectable.isEmpty) {
                return const Text(
                  'No active caregivers yet. Invite someone from '
                  'Settings → Sharing.',
                  style: TextStyle(color: Colors.white70, height: 1.4),
                );
              }
              return Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: selectable.map((c) {
                    final id = c.caregiverId!;
                    final checked = _selected.contains(id);
                    return CheckboxListTile(
                      value: checked,
                      onChanged: (v) => setState(() {
                        if (v == true) {
                          _selected.add(id);
                        } else {
                          _selected.remove(id);
                        }
                      }),
                      controlAffinity: ListTileControlAffinity.leading,
                      title: Text(c.label,
                          style: const TextStyle(color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed:
                    _busy ? null : () => setState(() => _createMode = false),
                child: const Text('Back'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _busy ? null : _create,
                child: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Create group'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
