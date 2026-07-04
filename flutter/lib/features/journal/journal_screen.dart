import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'journal_repository.dart';
import 'models/journal_entry.dart';

/// Journal entry list with active/archive tabs and date filters.
class JournalScreen extends ConsumerStatefulWidget {
  const JournalScreen({super.key});

  @override
  ConsumerState<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends ConsumerState<JournalScreen> {
  String _tab = 'active';
  String _datePreset = 'all';
  DateTime? _fromDate;
  DateTime? _toDate;

  Future<void> _refresh() async {
    ref.invalidate(journalDataProvider);
    await ref.read(journalDataProvider.future);
  }

  void _applyPreset(String preset) {
    setState(() {
      _datePreset = preset;
      final now = DateTime.now();
      switch (preset) {
        case '7d':
          _fromDate = now.subtract(const Duration(days: 6));
          _toDate = now;
        case '30d':
          _fromDate = now.subtract(const Duration(days: 29));
          _toDate = now;
        case 'month':
          _fromDate = DateTime(now.year, now.month, 1);
          _toDate = now;
        default:
          _fromDate = null;
          _toDate = null;
      }
    });
  }

  List<JournalEntry> _filteredEntries(JournalData data) {
    return data.entries.where((entry) {
      final tabMatch =
          _tab == 'active' ? !entry.isArchived : entry.isArchived;
      if (!tabMatch) return false;

      if (_fromDate == null && _toDate == null) return true;
      final captured = entry.capturedAt.toLocal();
      if (_fromDate != null) {
        final start = DateTime(
          _fromDate!.year,
          _fromDate!.month,
          _fromDate!.day,
        );
        if (captured.isBefore(start)) return false;
      }
      if (_toDate != null) {
        final end = DateTime(
          _toDate!.year,
          _toDate!.month,
          _toDate!.day,
          23,
          59,
          59,
          999,
        );
        if (captured.isAfter(end)) return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final journalAsync = ref.watch(journalDataProvider);

    return CanvasBackground(
      child: journalAsync.when(
        loading: () => const SingleChildScrollView(
          padding: EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: LoadingSkeleton(sectionTitle: 'Journal', tileCount: 3),
          ),
        ),
        error: (_, __) => ContentColumn(
          child: Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: EmptyState(
              eyebrow: 'Journal',
              title: 'Could not load entries',
              body: 'Check your connection and try again.',
              primaryActionLabel: 'Retry',
              onPrimaryAction: _refresh,
            ),
          ),
        ),
        data: (data) {
          final filtered = _filteredEntries(data);
          final hasDateFilter = _fromDate != null || _toDate != null;

          return RefreshIndicator(
            onRefresh: _refresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(top: 24, bottom: 120),
              child: ContentColumn(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _JournalHeader(
                      isOffline: data.isOffline,
                      onRefresh: _refresh,
                    ),
                    if (data.pendingCount > 0) ...[
                      const SizedBox(height: 12),
                      _PendingBanner(count: data.pendingCount),
                    ],
                    const SizedBox(height: 20),
                    _TabSwitcher(
                      tab: _tab,
                      onChanged: (value) => setState(() => _tab = value),
                    ),
                    const SizedBox(height: 16),
                    _DateFilterBar(
                      preset: _datePreset,
                      onPreset: _applyPreset,
                      hasFilter: hasDateFilter,
                      onClear: () => _applyPreset('all'),
                    ),
                    const SizedBox(height: 20),
                    if (filtered.isEmpty)
                      hasDateFilter
                          ? GlassSurface(
                              child: Column(
                                children: [
                                  Text(
                                    'No entries in this date range.',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: Colors.white
                                              .withValues(alpha: 0.65),
                                        ),
                                  ),
                                  TextButton(
                                    onPressed: () => _applyPreset('all'),
                                    child: const Text('Clear filter'),
                                  ),
                                ],
                              ),
                            )
                          : EmptyState(
                              eyebrow: 'Journal',
                              title: _tab == 'archive'
                                  ? 'No archived entries'
                                  : 'Your story starts here',
                              body: _tab == 'archive'
                                  ? 'Archived entries will appear here.'
                                  : 'Capture symptoms, moods, and moments. Purple learns from what you share.',
                              primaryActionLabel:
                                  _tab == 'active' ? 'Write first entry' : null,
                              onPrimaryAction: _tab == 'active'
                                  ? () => context.go('/journal/new')
                                  : null,
                            )
                    else
                      ...filtered.map(
                        (entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: JournalEntryCard(entry: entry),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _JournalHeader extends StatelessWidget {
  const _JournalHeader({
    required this.isOffline,
    required this.onRefresh,
  });

  final bool isOffline;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'JOURNAL',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your\nstory',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: 'Georgia',
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: onRefresh,
          icon: Icon(Icons.refresh, color: Colors.white.withValues(alpha: 0.55)),
          tooltip: 'Refresh',
        ),
        IconButton(
          onPressed: () => context.go('/journal/new'),
          icon: Icon(Icons.add, color: Colors.white.withValues(alpha: 0.85)),
          tooltip: 'New entry',
        ),
        if (isOffline)
          Container(
            margin: const EdgeInsets.only(left: 4, top: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Text(
              'Offline',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
            ),
          ),
      ],
    );
  }
}

class _PendingBanner extends StatelessWidget {
  const _PendingBanner({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(Icons.cloud_upload_outlined,
              size: 18, color: Colors.white.withValues(alpha: 0.7)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              count == 1
                  ? '1 entry waiting to upload'
                  : '$count entries waiting to upload',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabSwitcher extends StatelessWidget {
  const _TabSwitcher({
    required this.tab,
    required this.onChanged,
  });

  final String tab;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(4),
      borderRadius: 999,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TabButton(
            label: 'Active',
            selected: tab == 'active',
            onTap: () => onChanged('active'),
          ),
          _TabButton(
            label: 'Archive',
            selected: tab == 'archive',
            onTap: () => onChanged('archive'),
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Colors.white.withValues(alpha: 0.14)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: selected ? 0.95 : 0.55),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
          ),
        ),
      ),
    );
  }
}

class _DateFilterBar extends StatelessWidget {
  const _DateFilterBar({
    required this.preset,
    required this.onPreset,
    required this.hasFilter,
    required this.onClear,
  });

  final String preset;
  final ValueChanged<String> onPreset;
  final bool hasFilter;
  final VoidCallback onClear;

  static const _presets = [
    ('all', 'All'),
    ('7d', '7 days'),
    ('30d', '30 days'),
    ('month', 'This month'),
  ];

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final (key, label) in _presets)
                FilterChip(
                  label: Text(label),
                  selected: preset == key,
                  onSelected: (_) => onPreset(key),
                  showCheckmark: false,
                  visualDensity: VisualDensity.compact,
                  backgroundColor: Colors.white.withValues(alpha: 0.06),
                  selectedColor: Colors.white.withValues(alpha: 0.14),
                  labelStyle: TextStyle(
                    color: Colors.white.withValues(
                      alpha: preset == key ? 0.95 : 0.65,
                    ),
                  ),
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                ),
            ],
          ),
          if (hasFilter) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: onClear,
              child: const Text('Clear filter'),
            ),
          ],
        ],
      ),
    );
  }
}

/// Single journal entry card.
class JournalEntryCard extends StatelessWidget {
  const JournalEntryCard({super.key, required this.entry});

  final JournalEntry entry;

  @override
  Widget build(BuildContext context) {
    final dateLabel =
        DateFormat('EEE, MMM d · h:mm a').format(entry.capturedAt.toLocal());

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  dateLabel,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ),
              if (entry.pendingUpload)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Pending',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.65),
                        ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            entry.preview,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.88),
                  height: 1.45,
                ),
          ),
          if (entry.aiSummary != null && entry.aiSummary!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              entry.aiSummary!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontStyle: FontStyle.italic,
                  ),
            ),
          ],
          if (entry.mediaUrls.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              '${entry.mediaUrls.length} attachment${entry.mediaUrls.length == 1 ? '' : 's'}',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
          ],
        ],
      ),
    );
  }
}
