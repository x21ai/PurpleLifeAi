import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_repository.dart';
import 'incoming_care_invites_card.dart';

enum _InboxFilter { all, meds, journal, other }

const _filterLabels = <_InboxFilter, String>{
  _InboxFilter.all: 'All',
  _InboxFilter.meds: 'Meds',
  _InboxFilter.journal: 'Journal',
  _InboxFilter.other: 'Other',
};

_InboxFilter _bucketOf(String type) {
  if (type.contains('meds')) return _InboxFilter.meds;
  if (type.contains('journal')) return _InboxFilter.journal;
  return _InboxFilter.other;
}

/// Owner inbox for approving caregiver-proposed record changes.
class CareInboxScreen extends ConsumerStatefulWidget {
  const CareInboxScreen({super.key});

  @override
  ConsumerState<CareInboxScreen> createState() => _CareInboxScreenState();
}

class _CareInboxScreenState extends ConsumerState<CareInboxScreen> {
  _InboxFilter _filter = _InboxFilter.all;
  var _bulkBusy = false;

  Future<void> _refresh() async {
    ref.invalidate(careInboxProvider);
    await ref.read(careInboxProvider.future);
  }

  Future<void> _bulkDecide(List<String> ids, String decision) async {
    final verb = decision == 'approved' ? 'approve' : 'reject';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${verb[0].toUpperCase()}${verb.substring(1)} changes?'),
        content: Text(
          '${verb[0].toUpperCase()}${verb.substring(1)} ${ids.length} changes?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('${verb[0].toUpperCase()}${verb.substring(1)}'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _bulkBusy = true);
    try {
      final result = await ref.read(careRepositoryProvider).decidePendingChangesBulk(
            ids: ids,
            decision: decision,
          );
      if (!mounted) return;
      final past = decision == 'approved' ? 'approved' : 'rejected';
      final suffix = result.failed > 0 ? ' · ${result.failed} failed' : '';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${result.ok} $past$suffix')),
      );
      // Keep the top-bar pending badge in sync with the acted-on items.
      ref.invalidate(carePendingCountProvider);
      await _refresh();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Couldn't save decisions. $error")),
      );
    } finally {
      if (mounted) setState(() => _bulkBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inboxAsync = ref.watch(careInboxProvider);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: inboxAsync.when(
              loading: () => const LoadingSkeleton(
                sectionTitle: 'Inbox',
                tileCount: 2,
              ),
              error: (_, __) => EmptyState(
                eyebrow: 'Inbox',
                title: 'Could not load inbox',
                body: 'Pull to refresh and try again in a moment.',
                primaryActionLabel: 'Try again',
                onPrimaryAction: _refresh,
              ),
              data: (data) => _InboxBody(
                data: data,
                filter: _filter,
                bulkBusy: _bulkBusy,
                onFilterChanged: (filter) => setState(() => _filter = filter),
                onBulkDecide: _bulkDecide,
                onChanged: _refresh,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _InboxBody extends StatelessWidget {
  const _InboxBody({
    required this.data,
    required this.filter,
    required this.bulkBusy,
    required this.onFilterChanged,
    required this.onBulkDecide,
    required this.onChanged,
  });

  final CareInboxData data;
  final _InboxFilter filter;
  final bool bulkBusy;
  final ValueChanged<_InboxFilter> onFilterChanged;
  final Future<void> Function(List<String> ids, String decision) onBulkDecide;
  final Future<void> Function() onChanged;

  @override
  Widget build(BuildContext context) {
    final allChanges = data.changes;
    final counts = <_InboxFilter, int>{
      for (final key in _InboxFilter.values) key: 0,
    };
    counts[_InboxFilter.all] = allChanges.length;
    for (final change in allChanges) {
      counts[_bucketOf(change.type)] =
          (counts[_bucketOf(change.type)] ?? 0) + 1;
    }

    final changes = filter == _InboxFilter.all
        ? allChanges
        : allChanges.where((change) => _bucketOf(change.type) == filter).toList();
    final visibleIds = changes.map((change) => change.id).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextButton.icon(
          onPressed: () => context.go(AppRoutes.settingsSharing),
          icon: Icon(
            Icons.arrow_back,
            color: Colors.white.withValues(alpha: 0.55),
          ),
          label: Text(
            'Sharing and access',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'CAREGIVER INBOX',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Changes waiting\nfor you',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
                height: 1.02,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 12),
        Text(
          'Caregivers proposed these edits to your record. Nothing is applied until you approve it.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.5,
              ),
        ),
        if (data.loadError != null) ...[
          const SizedBox(height: 12),
          Text(
            data.loadError!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ],
        const SizedBox(height: 24),
        IncomingCareInvitesCard(
          invites: data.incomingInvites,
          onChanged: () => onChanged(),
        ),
        if (data.incomingInvites.isNotEmpty) const SizedBox(height: 24),
        if (allChanges.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              for (final entry in _filterLabels.entries)
                FilterChip(
                  label: Text('${entry.value} ${counts[entry.key] ?? 0}'),
                  selected: filter == entry.key,
                  onSelected: (_) => onFilterChanged(entry.key),
                ),
              if (visibleIds.length > 1) ...[
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: bulkBusy
                      ? null
                      : () => onBulkDecide(visibleIds, 'approved'),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Approve all'),
                ),
                TextButton.icon(
                  onPressed: bulkBusy
                      ? null
                      : () => onBulkDecide(visibleIds, 'rejected'),
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Reject all'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
        ],
        if (changes.isEmpty)
          const EmptyState(
            eyebrow: 'Inbox',
            title: "You're all caught up.",
            body: 'When a caregiver proposes a change, it shows up here.',
          )
        else
          for (final change in changes)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _PendingChangeCard(
                change: change,
                onChanged: onChanged,
              ),
            ),
      ],
    );
  }
}

class _PendingChangeCard extends ConsumerStatefulWidget {
  const _PendingChangeCard({
    required this.change,
    required this.onChanged,
  });

  final PendingChangeDetail change;
  final Future<void> Function() onChanged;

  @override
  ConsumerState<_PendingChangeCard> createState() => _PendingChangeCardState();
}

class _PendingChangeCardState extends ConsumerState<_PendingChangeCard> {
  final _noteController = TextEditingController();
  var _busy = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _decide(String decision) async {
    setState(() => _busy = true);
    try {
      final note = _noteController.text.trim();
      await ref.read(careRepositoryProvider).decidePendingChange(
            changeId: widget.change.id,
            decision: decision,
            note: note.isEmpty ? null : note,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            decision == 'approved' ? 'Change applied' : 'Change rejected',
          ),
        ),
      );
      // Keep the top-bar pending badge in sync with the acted-on item.
      ref.invalidate(carePendingCountProvider);
      await widget.onChanged();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Couldn't save decision. $error")),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final change = widget.change;
    final createdAt = DateTime.tryParse(change.createdAt);
    final when = createdAt != null
        ? DateFormat.yMMMd().add_jm().format(createdAt.toLocal())
        : change.createdAt;
    final caregiverName =
        change.caregiverProfile?.displayName() ?? 'A caregiver';
    final current = change.currentValue?.trim();

    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            change.typeLabel,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            '$caregiverName · $when',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final stacked = constraints.maxWidth < 520;
              final currentBox = _ValueBox(
                label: 'CURRENT',
                value: current == null || current.isEmpty
                    ? 'No existing content'
                    : current,
                muted: current == null || current.isEmpty,
              );
              final proposedBox = _ValueBox(
                label: 'PROPOSED ADDITION',
                value: change.proposedText,
                highlight: true,
              );
              if (stacked) {
                return Column(
                  children: [
                    currentBox,
                    const SizedBox(height: 12),
                    proposedBox,
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: currentBox),
                  const SizedBox(width: 12),
                  Expanded(child: proposedBox),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _noteController,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'Note to caregiver (optional)',
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: Wrap(
              spacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: _busy ? null : () => _decide('rejected'),
                  icon: const Icon(Icons.close, size: 16),
                  label: const Text('Reject'),
                ),
                FilledButton.icon(
                  onPressed: _busy ? null : () => _decide('approved'),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Approve and apply'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ValueBox extends StatelessWidget {
  const _ValueBox({
    required this.label,
    required this.value,
    this.muted = false,
    this.highlight = false,
  });

  final String label;
  final String value;
  final bool muted;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: highlight
              ? const Color(0x66B084D1)
              : Colors.white.withValues(alpha: 0.12),
        ),
        color: highlight
            ? const Color(0x14B084D1)
            : Colors.white.withValues(alpha: 0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: highlight
                      ? const Color(0xFFB084D1)
                      : Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: muted
                      ? Colors.white.withValues(alpha: 0.45)
                      : Colors.white.withValues(alpha: 0.9),
                  fontStyle: muted ? FontStyle.italic : FontStyle.normal,
                  height: 1.45,
                ),
          ),
        ],
      ),
    );
  }
}
