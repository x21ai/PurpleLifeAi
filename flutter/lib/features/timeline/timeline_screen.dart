import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../meds/meds_repository.dart';
import '../shared/glass_helpers.dart';
import 'events_style.dart';
import 'timeline_repository.dart';

enum TimelineRange { day, week, month, year, custom }

TimelineQuery timelineQueryForRange({
  required TimelineRange range,
  DateTime? customFrom,
  DateTime? customTo,
}) {
  final now = DateTime.now();
  final until = range == TimelineRange.custom ? (customTo ?? now) : now;
  late DateTime since;
  switch (range) {
    case TimelineRange.day:
      since = DateTime(now.year, now.month, now.day);
    case TimelineRange.week:
      final weekday = now.weekday;
      since = DateTime(now.year, now.month, now.day)
          .subtract(Duration(days: weekday - DateTime.monday));
    case TimelineRange.month:
      since = DateTime(now.year, now.month, 1);
    case TimelineRange.year:
      since = DateTime(now.year, 1, 1);
    case TimelineRange.custom:
      since = customFrom ??
          DateTime(now.year, now.month, now.day).subtract(const Duration(days: 30));
  }
  return TimelineQuery(since: since, until: until);
}

/// Unified event timeline mirroring web `/timeline`.
class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key});

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> {
  static const _pageSize = 25;

  TimelineRange _range = TimelineRange.week;
  String _search = '';
  int _page = 1;
  DateTime _customFrom =
      DateTime.now().subtract(const Duration(days: 30));
  DateTime _customTo = DateTime.now();

  TimelineQuery get _query => timelineQueryForRange(
        range: _range,
        customFrom: DateTime(
          _customFrom.year,
          _customFrom.month,
          _customFrom.day,
        ),
        customTo: _customTo,
      );

  Future<void> _refresh() async {
    ref.invalidate(timelineEntriesProvider(_query));
    try {
      await ref.read(timelineEntriesProvider(_query).future);
    } catch (_) {
      // Fail open: keep prior rows or empty state.
    }
  }

  void _setRange(TimelineRange range) {
    setState(() {
      _range = range;
      _page = 1;
    });
  }

  void _setSearch(String value) {
    setState(() {
      _search = value;
      _page = 1;
    });
  }

  void _showExportNotice() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'CSV, text, and print export are on the web app for now.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entriesAsync = ref.watch(timelineEntriesProvider(_query));
    final dateFormat = DateFormat('EEE, MMM d · h:mm a');

    final q = _search.trim().toLowerCase();
    final rows = entriesAsync.valueOrNull ?? const <TimelineEntry>[];
    final filtered = q.isEmpty
        ? rows
        : rows.where((row) {
            final haystack = '${row.title} ${row.body ?? ''}'.toLowerCase();
            return haystack.contains(q);
          }).toList();

    final totalPages = (filtered.length / _pageSize).ceil().clamp(1, 999999);
    final currentPage = _page.clamp(1, totalPages);
    final startIdx = (currentPage - 1) * _pageSize;
    final visible = filtered.skip(startIdx).take(_pageSize).toList();

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 128),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                EventsPageHeader(onExport: _showExportNotice),
                const SizedBox(height: 16),
                Text(
                  'Seizures, journal entries, and doses, side by side. Filter by range, search, then export when you need to share with your care team.',
                  style: eventsIntroBody(),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      'Add:',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                    _QuickAddChip(
                      icon: Icons.menu_book_outlined,
                      label: 'Journal entry',
                      onTap: () => context.go(AppRoutes.journalNew),
                    ),
                    _QuickAddChip(
                      icon: Icons.bolt_outlined,
                      label: 'Seizure',
                      onTap: () => context.go(AppRoutes.seizuresNew),
                    ),
                    _QuickAddChip(
                      icon: Icons.medication_outlined,
                      label: 'Dose',
                      onTap: () => context.go(AppRoutes.meds),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final range in TimelineRange.values)
                      _RangeChip(
                        label: _rangeLabel(range),
                        selected: _range == range,
                        onTap: () => _setRange(range),
                      ),
                    SizedBox(
                      width: 220,
                      child: TextField(
                        onChanged: _setSearch,
                        decoration: InputDecoration(
                          hintText: 'Search…',
                          isDense: true,
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.06),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                        ),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                    ),
                  ],
                ),
                if (_range == TimelineRange.custom) ...[
                  const SizedBox(height: 12),
                  GlassSurface(
                    padding: const EdgeInsets.all(12),
                    child: Wrap(
                      spacing: 16,
                      runSpacing: 12,
                      children: [
                        _DateField(
                          label: 'From',
                          value: _customFrom,
                          onPick: (date) => setState(() {
                            _customFrom = date;
                            _page = 1;
                          }),
                        ),
                        _DateField(
                          label: 'To',
                          value: _customTo,
                          onPick: (date) => setState(() {
                            _customTo = date;
                            _page = 1;
                          }),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                entriesAsync.when(
                  loading: () => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Center(
                      child: Text(
                        'Loading…',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                    ),
                  ),
                  error: (_, __) => _TimelineEmpty(
                    onJournal: () => context.go(AppRoutes.journalNew),
                  ),
                  data: (_) {
                    if (filtered.isEmpty) {
                      return _TimelineEmpty(
                        onJournal: () => context.go(AppRoutes.journalNew),
                      );
                    }
                    return Column(
                      children: [
                        for (final row in visible)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _TimelineRow(
                              entry: row,
                              whenLabel: dateFormat.format(row.at.toLocal()),
                              query: _query,
                            ),
                          ),
                        if (filtered.length > _pageSize)
                          _PaginationBar(
                            currentPage: currentPage,
                            totalPages: totalPages,
                            startIdx: startIdx,
                            total: filtered.length,
                            onPrevious: currentPage > 1
                                ? () => setState(() => _page -= 1)
                                : null,
                            onNext: currentPage < totalPages
                                ? () => setState(() => _page += 1)
                                : null,
                          ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  'Want to add older history? Medications and Log past event both accept any date.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _rangeLabel(TimelineRange range) => switch (range) {
        TimelineRange.day => 'Day',
        TimelineRange.week => 'Week',
        TimelineRange.month => 'Month',
        TimelineRange.year => 'Year',
        TimelineRange.custom => 'Custom',
      };
}

class _QuickAddChip extends StatelessWidget {
  const _QuickAddChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white.withValues(alpha: 0.85),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
}

class _RangeChip extends StatelessWidget {
  const _RangeChip({
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
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: selected
                ? Theme.of(context).colorScheme.primary
                : Colors.white.withValues(alpha: 0.06),
            border: Border.all(
              color: selected
                  ? Theme.of(context).colorScheme.primary
                  : Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: selected
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.85),
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onPick,
  });

  final String label;
  final DateTime value;
  final ValueChanged<DateTime> onPick;

  @override
  Widget build(BuildContext context) {
    final formatted = DateFormat.yMMMd().format(value);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.1,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 4),
        OutlinedButton(
          onPressed: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: value,
              firstDate: DateTime(2000),
              lastDate: DateTime.now(),
            );
            if (picked != null) onPick(picked);
          },
          child: Text(formatted),
        ),
      ],
    );
  }
}

class _TimelineEmpty extends StatelessWidget {
  const _TimelineEmpty({required this.onJournal});

  final VoidCallback onJournal;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Text(
            'Nothing in this range yet.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Entries, doses, and seizure logs from this range will line up here.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: onJournal,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white.withValues(alpha: 0.85),
              side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
              shape: const StadiumBorder(),
            ),
            child: const Text('Write a journal entry'),
          ),
        ],
      ),
    );
  }
}

class _TimelineRow extends ConsumerStatefulWidget {
  const _TimelineRow({
    required this.entry,
    required this.whenLabel,
    required this.query,
  });

  final TimelineEntry entry;
  final String whenLabel;
  final TimelineQuery query;

  @override
  ConsumerState<_TimelineRow> createState() => _TimelineRowState();
}

class _TimelineRowState extends ConsumerState<_TimelineRow> {
  /// True while a dose mutation + sync flush is in flight; disables the
  /// row's action buttons so a double tap cannot queue duplicate writes.
  bool _busy = false;

  TimelineEntry get entry => widget.entry;

  IconData get _icon => switch (entry.kind) {
        TimelineEntryKind.seizure => Icons.bolt_outlined,
        TimelineEntryKind.journal => Icons.menu_book_outlined,
        TimelineEntryKind.dose => Icons.medication_outlined,
      };

  Future<void> _updateDose(String next) async {
    final doseId = entry.doseId;
    if (doseId == null || _busy) return;
    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      // Reuse the shared meds mutation methods (see meds_screen.dart).
      final repo = ref.read(medsRepositoryProvider);
      switch (next) {
        case 'taken':
          await repo.markDoseTaken(doseId);
        case 'skipped':
          await repo.markDoseSkipped(doseId);
        default:
          await repo.reclassifyDose(doseId, next);
      }
      // The repo methods only queue the write locally. Flush the queue to
      // Supabase BEFORE re-reading, otherwise timelineEntriesProvider (which
      // reads Supabase directly) refetches the old row and the status reverts.
      final syncResult = await ref.read(syncServiceProvider).syncAll();
      final flushed = syncResult.queueSent > 0 && syncResult.queueFailed == 0;
      // Refresh timeline and any meds views so status reflects immediately.
      ref.invalidate(timelineEntriesProvider(widget.query));
      ref.invalidate(medsDataProvider);
      final actionLabel = next == 'taken'
          ? 'Marked as taken'
          : next == 'skipped'
              ? 'Marked as skipped'
              : 'Reset to pending';
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            flushed ? actionLabel : '$actionLabel, will sync when online',
          ),
        ),
      );
    } catch (_) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Could not update dose')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDose = entry.kind == TimelineEntryKind.dose && entry.doseId != null;
    final status = entry.doseStatus ?? 'pending';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.06),
            border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
          ),
          child: Icon(_icon, size: 16, color: Theme.of(context).colorScheme.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GlassSurface(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.whenLabel.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 0.8,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  entry.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: PurpleType.serif,
                        color: Colors.white.withValues(alpha: 0.92),
                        height: 1.35,
                      ),
                ),
                if (entry.body != null && entry.body!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    entry.body!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.7),
                          height: 1.45,
                        ),
                  ),
                ],
                if (isDose) ...[
                  const SizedBox(height: 12),
                  if (status != 'taken')
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _DoseActionButton(
                          label: 'I took it',
                          filled: true,
                          onTap: _busy ? null : () => _updateDose('taken'),
                        ),
                        if (status != 'skipped')
                          _DoseActionButton(
                            label: 'Skip',
                            onTap: _busy ? null : () => _updateDose('skipped'),
                          ),
                      ],
                    )
                  else
                    _DoseActionButton(
                      label: 'Undo',
                      muted: true,
                      onTap: _busy ? null : () => _updateDose('pending'),
                    ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Pill-shaped dose action button matching web timeline (I took it / Skip / Undo).
class _DoseActionButton extends StatelessWidget {
  const _DoseActionButton({
    required this.label,
    required this.onTap,
    this.filled = false,
    this.muted = false,
  });

  final String label;

  /// Null disables the button (used while a dose mutation is in flight).
  final VoidCallback? onTap;
  final bool filled;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    final primary = Theme.of(context).colorScheme.primary;
    final Color background;
    final Color foreground;
    final Color border;
    if (filled) {
      background = primary;
      foreground = Colors.white;
      border = primary;
    } else if (muted) {
      background = Colors.transparent;
      foreground = Colors.white.withValues(alpha: 0.55);
      border = Colors.transparent;
    } else {
      background = Colors.white.withValues(alpha: 0.06);
      foreground = Colors.white.withValues(alpha: 0.85);
      border = Colors.white.withValues(alpha: 0.15);
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Opacity(
          opacity: disabled ? 0.5 : 1,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
            child: Container(
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: background,
                border: Border.all(color: border),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: foreground,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PaginationBar extends StatelessWidget {
  const _PaginationBar({
    required this.currentPage,
    required this.totalPages,
    required this.startIdx,
    required this.total,
    required this.onPrevious,
    required this.onNext,
  });

  final int currentPage;
  final int totalPages;
  final int startIdx;
  final int total;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final end = (startIdx + _TimelineScreenState._pageSize).clamp(0, total);
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            OutlinedButton(
              onPressed: onPrevious,
              child: const Text('Previous'),
            ),
            const SizedBox(width: 8),
            Text(
              '$currentPage / $totalPages',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: onNext,
              child: const Text('Next'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Showing ${startIdx + 1}–$end of $total',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
      ],
    );
  }
}
