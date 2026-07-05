import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/purple_theme.dart';
import '../shared/glass_helpers.dart' show ContentColumn;
import 'journal_repository.dart';
import 'journal_style.dart';
import 'models/journal_entry.dart';

/// Journal entry list mirroring web `journal.index.tsx`: the one always-light
/// route (#faf8fb canvas, lavender glow), serif header, active/archive tabs,
/// date filters, paginated entry cards, capture FAB.
class JournalScreen extends ConsumerStatefulWidget {
  const JournalScreen({super.key});

  @override
  ConsumerState<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends ConsumerState<JournalScreen> {
  static const _pageSize = 15;

  String _tab = 'active';
  String _datePreset = 'all';
  DateTime? _fromDate;
  DateTime? _toDate;
  int _page = 1;

  Future<void> _refresh() async {
    ref.invalidate(journalDataProvider);
    try {
      await ref.read(journalDataProvider.future);
    } catch (_) {
      // Keep pull-to-refresh stable when provider recovery falls back to empty.
    }
  }

  void _setTab(String value) {
    setState(() {
      _tab = value;
      _page = 1;
    });
  }

  void _applyPreset(String preset) {
    setState(() {
      _datePreset = preset;
      _page = 1;
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

  Future<void> _pickDate({required bool isFrom}) async {
    final now = DateTime.now();
    final initial = (isFrom ? _fromDate : _toDate) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: now,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _datePreset = 'custom';
      _page = 1;
      if (isFrom) {
        _fromDate = picked;
        if (_toDate != null && _toDate!.isBefore(picked)) _toDate = picked;
      } else {
        _toDate = picked;
        if (_fromDate != null && _fromDate!.isAfter(picked)) _fromDate = picked;
      }
    });
  }

  List<JournalEntry> _filteredEntries(JournalData data) {
    return data.entries.where((entry) {
      final tabMatch = _tab == 'active' ? !entry.isArchived : entry.isArchived;
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
    final palette = JournalPalette.light();

    return Theme(
      data: PurpleTheme.light(),
      child: JournalLightCanvas(
        child: Stack(
          children: [
            journalAsync.when(
              loading: () => SingleChildScrollView(
                padding: const EdgeInsets.only(top: 24, bottom: 140),
                child: ContentColumn(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _JournalHeader(
                        palette: palette,
                        refreshing: true,
                        onRefresh: _refresh,
                      ),
                      const SizedBox(height: 40),
                      for (var i = 0; i < 3; i++)
                        const Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: JournalGlassSurface(
                            padding: EdgeInsets.zero,
                            child: SizedBox(height: 112, width: double.infinity),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              error: (_, __) => SingleChildScrollView(
                padding: const EdgeInsets.only(top: 24, bottom: 140),
                child: ContentColumn(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _JournalHeader(
                        palette: palette,
                        refreshing: false,
                        onRefresh: _refresh,
                      ),
                      const SizedBox(height: 24),
                      _JournalEmptyState(archive: false, palette: palette),
                    ],
                  ),
                ),
              ),
              data: (data) {
                final filtered = _filteredEntries(data);
                final hasDateFilter = _fromDate != null || _toDate != null;

                final totalPages =
                    (filtered.length / _pageSize).ceil().clamp(1, 1 << 30);
                final safePage = _page.clamp(1, totalPages);
                final startIdx = (safePage - 1) * _pageSize;
                final endIdx =
                    (startIdx + _pageSize).clamp(0, filtered.length);
                final pageSlice = filtered.sublist(
                  startIdx.clamp(0, filtered.length),
                  endIdx,
                );
                final showPagination = filtered.length > _pageSize;

                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.only(top: 24, bottom: 140),
                    child: ContentColumn(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _JournalHeader(
                            palette: palette,
                            refreshing: false,
                            isOffline: data.isOffline,
                            onRefresh: _refresh,
                          ),
                          if (data.pendingCount > 0) ...[
                            const SizedBox(height: 16),
                            _OfflineQueueBanner(
                              palette: palette,
                              count: data.pendingCount,
                              online: !data.isOffline,
                              onSync: _refresh,
                            ),
                          ],
                          const SizedBox(height: 32),
                          _TabSwitcher(
                            palette: palette,
                            tab: _tab,
                            onChanged: _setTab,
                          ),
                          const SizedBox(height: 16),
                          _DateFilterBar(
                            palette: palette,
                            preset: _datePreset,
                            onPreset: _applyPreset,
                            fromDate: _fromDate,
                            toDate: _toDate,
                            onPickFrom: () => _pickDate(isFrom: true),
                            onPickTo: () => _pickDate(isFrom: false),
                            hasFilter: hasDateFilter,
                            onClear: () => _applyPreset('all'),
                          ),
                          const SizedBox(height: 24),
                          if (filtered.isEmpty)
                            hasDateFilter
                                ? _FilteredEmptyState(
                                    palette: palette,
                                    onClear: () => _applyPreset('all'),
                                  )
                                : _JournalEmptyState(
                                    archive: _tab == 'archive',
                                    palette: palette,
                                  )
                          else ...[
                            for (final entry in pageSlice)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: JournalEntryCard(entry: entry),
                              ),
                            if (showPagination)
                              _Pagination(
                                palette: palette,
                                page: safePage,
                                totalPages: totalPages,
                                startIdx: startIdx,
                                endIdx: endIdx,
                                total: filtered.length,
                                onPage: (p) => setState(() => _page = p),
                              ),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            Positioned(
              right: 20,
              bottom: 96,
              child: _NewEntryFab(
                palette: palette,
                onTap: () => context.go('/journal/new'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Serif header matching web: "Journal" eyebrow, two-line serif title, refresh.
class _JournalHeader extends StatelessWidget {
  const _JournalHeader({
    required this.palette,
    required this.refreshing,
    required this.onRefresh,
    this.isOffline = false,
  });

  final JournalPalette palette;
  final bool refreshing;
  final bool isOffline;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'JOURNAL',
                style: journalSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                  color: palette.textTertiary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                "Everything you've\nshared, in order.",
                style: journalSerif(
                  fontSize: 40,
                  height: 1.02,
                  letterSpacing: -0.8,
                  color: palette.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (isOffline)
          Container(
            margin: const EdgeInsets.only(right: 4, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: palette.backgroundTertiary,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: palette.divider),
            ),
            child: Text(
              'Offline',
              style: journalSans(
                fontSize: 11,
                color: palette.textTertiary,
              ),
            ),
          ),
        IconButton(
          onPressed: onRefresh,
          icon: refreshing
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: palette.textTertiary,
                  ),
                )
              : Icon(Icons.refresh, color: palette.textTertiary),
          tooltip: 'Refresh',
        ),
      ],
    );
  }
}

/// Queued-entries banner matching web `OfflineQueueBanner` (light variant).
class _OfflineQueueBanner extends StatelessWidget {
  const _OfflineQueueBanner({
    required this.palette,
    required this.count,
    required this.online,
    required this.onSync,
  });

  final JournalPalette palette;
  final int count;
  final bool online;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final amber = palette.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: amber.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: amber.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.cloud_off_outlined, size: 18, color: amber),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count == 1
                      ? '1 entry waiting to sync'
                      : '$count entries waiting to sync',
                  style: journalSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: amber,
                  ),
                ),
                Text(
                  online
                      ? 'Tap to sync now.'
                      : "We'll send them as soon as you're back online.",
                  style: journalSans(
                    fontSize: 11,
                    color: amber.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          if (online)
            TextButton.icon(
              onPressed: onSync,
              icon: Icon(Icons.refresh, size: 14, color: amber),
              label: const Text('Sync'),
              style: TextButton.styleFrom(
                foregroundColor: amber,
                shape: StadiumBorder(
                  side: BorderSide(color: amber.withValues(alpha: 0.5)),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
            ),
        ],
      ),
    );
  }
}

class _TabSwitcher extends StatelessWidget {
  const _TabSwitcher({
    required this.palette,
    required this.tab,
    required this.onChanged,
  });

  final JournalPalette palette;
  final String tab;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return JournalGlassPill(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _TabButton(
            palette: palette,
            label: 'Active',
            selected: tab == 'active',
            onTap: () => onChanged('active'),
          ),
          _TabButton(
            palette: palette,
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
    required this.palette,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final JournalPalette palette;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? palette.surface.withValues(alpha: 0.9)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Text(
            label,
            style: journalSans(
              fontSize: 14,
              fontWeight: selected ? FontWeight.w500 : FontWeight.w400,
              color: selected ? palette.textPrimary : palette.textTertiary,
            ),
          ),
        ),
      ),
    );
  }
}

/// Date filter bar matching web: preset pills plus From/To pickers and Clear.
class _DateFilterBar extends StatelessWidget {
  const _DateFilterBar({
    required this.palette,
    required this.preset,
    required this.onPreset,
    required this.fromDate,
    required this.toDate,
    required this.onPickFrom,
    required this.onPickTo,
    required this.hasFilter,
    required this.onClear,
  });

  final JournalPalette palette;
  final String preset;
  final ValueChanged<String> onPreset;
  final DateTime? fromDate;
  final DateTime? toDate;
  final VoidCallback onPickFrom;
  final VoidCallback onPickTo;
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
    final dateFormat = DateFormat('MMM d, yyyy');
    return JournalGlassSurface(
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
                  backgroundColor: palette.surface,
                  selectedColor: palette.purpleSoft,
                  labelStyle: journalSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: preset == key
                        ? palette.purplePrimary
                        : palette.textSecondary,
                  ),
                  side: BorderSide(color: palette.divider),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _DateField(
                palette: palette,
                label: 'From',
                value: fromDate == null ? null : dateFormat.format(fromDate!),
                onTap: onPickFrom,
              ),
              _DateField(
                palette: palette,
                label: 'To',
                value: toDate == null ? null : dateFormat.format(toDate!),
                onTap: onPickTo,
              ),
              if (hasFilter)
                TextButton(
                  onPressed: onClear,
                  child: Text(
                    'Clear',
                    style: journalSans(
                      fontSize: 12,
                      color: palette.textPrimary,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.palette,
    required this.label,
    required this.value,
    required this.onTap,
  });

  final JournalPalette palette;
  final String label;
  final String? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: palette.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: palette.divider),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: journalSans(fontSize: 11, color: palette.textTertiary),
            ),
            const SizedBox(width: 8),
            Text(
              value ?? 'Any',
              style: journalSans(fontSize: 11, color: palette.textPrimary),
            ),
          ],
        ),
      ),
    );
  }
}

/// Empty states matching web `EmptyState` in journal.index.tsx.
class _JournalEmptyState extends StatelessWidget {
  const _JournalEmptyState({required this.archive, required this.palette});

  final bool archive;
  final JournalPalette palette;

  @override
  Widget build(BuildContext context) {
    if (archive) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Text(
              'Nothing archived yet. Archived entries land here so you can restore or delete them.',
              textAlign: TextAlign.center,
              style: journalSerif(
                fontSize: 18,
                height: 1.6,
                color: palette.textTertiary,
              ),
            ),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: palette.purpleSoft,
              ),
              child: Icon(
                Icons.menu_book_outlined,
                size: 36,
                color: palette.purplePrimary.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 24),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 448),
              child: Text(
                'Your journal is yours. Write, speak, photograph, or record anything. I will read it carefully and remember it for you.',
                textAlign: TextAlign.center,
                style: journalSerif(
                  fontSize: 18,
                  height: 1.6,
                  color: palette.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilteredEmptyState extends StatelessWidget {
  const _FilteredEmptyState({required this.palette, required this.onClear});

  final JournalPalette palette;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 448),
        child: JournalGlassSurface(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
          child: Column(
            children: [
              Text(
                'No entries in this date range.',
                style: journalSans(
                  fontSize: 14,
                  color: palette.textTertiary,
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: onClear,
                child: Text(
                  'Clear filter',
                  style: journalSans(
                    fontSize: 14,
                    color: palette.purplePrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Pager matching web: Prev / compact numbered pills / Next + range caption.
class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.palette,
    required this.page,
    required this.totalPages,
    required this.startIdx,
    required this.endIdx,
    required this.total,
    required this.onPage,
  });

  final JournalPalette palette;
  final int page;
  final int totalPages;
  final int startIdx;
  final int endIdx;
  final int total;
  final ValueChanged<int> onPage;

  /// Web `compactPages`: 1 … around-current … last.
  List<Object> _compactPages() {
    if (totalPages <= 7) {
      return [for (var i = 1; i <= totalPages; i++) i];
    }
    final pages = <Object>[1];
    final start = (page - 1).clamp(2, totalPages - 1);
    final end = (page + 1).clamp(2, totalPages - 1);
    if (start > 2) pages.add('…');
    for (var i = start; i <= end; i++) {
      pages.add(i);
    }
    if (end < totalPages - 1) pages.add('…');
    pages.add(totalPages);
    return pages;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        children: [
          Center(
            child: Wrap(
              spacing: 4,
              runSpacing: 4,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _PagePill(
                  palette: palette,
                  label: 'Prev',
                  enabled: page > 1,
                  onTap: () => onPage(page - 1),
                ),
                for (final p in _compactPages())
                  if (p is int)
                    _PagePill(
                      palette: palette,
                      label: '$p',
                      active: p == page,
                      enabled: true,
                      onTap: () => onPage(p),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        '…',
                        style: journalSans(
                          fontSize: 12,
                          color: palette.textTertiary,
                        ),
                      ),
                    ),
                _PagePill(
                  palette: palette,
                  label: 'Next',
                  enabled: page < totalPages,
                  onTap: () => onPage(page + 1),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Showing ${startIdx + 1}\u2013$endIdx of $total',
              style: journalSans(
                fontSize: 11,
                color: palette.textTertiary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PagePill extends StatelessWidget {
  const _PagePill({
    required this.palette,
    required this.label,
    required this.enabled,
    required this.onTap,
    this.active = false,
  });

  final JournalPalette palette;
  final String label;
  final bool enabled;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.4,
      child: Material(
        color: active ? palette.purplePrimary : palette.glassFill,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minWidth: 32),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: active ? palette.purplePrimary : palette.divider,
              ),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: journalSans(
                fontSize: 12,
                fontWeight: active ? FontWeight.w500 : FontWeight.w400,
                color: active ? palette.surface : palette.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Fixed capture FAB matching web: primary pill with plus and "New entry".
class _NewEntryFab extends StatelessWidget {
  const _NewEntryFab({required this.palette, required this.onTap});

  final JournalPalette palette;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: palette.purplePrimary,
      borderRadius: BorderRadius.circular(999),
      elevation: 8,
      shadowColor: palette.purplePrimary.withValues(alpha: 0.4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.add, size: 20, color: palette.surface),
              const SizedBox(width: 8),
              Text(
                'New entry',
                style: journalSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: palette.surface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Single journal entry card matching web `entry-card.tsx`: kind icon,
/// timestamps, processing/retry states, kebab actions, inline edit, media
/// grid, AI summary inset, tag pills, logged-to-tools line.
class JournalEntryCard extends ConsumerStatefulWidget {
  const JournalEntryCard({super.key, required this.entry});

  final JournalEntry entry;

  @override
  ConsumerState<JournalEntryCard> createState() => _JournalEntryCardState();
}

class _JournalEntryCardState extends ConsumerState<JournalEntryCard> {
  bool _busy = false;
  bool _editing = false;
  bool _savingEdit = false;
  late TextEditingController _draftText;
  late TextEditingController _draftVoice;
  late DateTime _draftAt;

  static const _kindIcons = <String, IconData>{
    'text': Icons.edit_outlined,
    'voice': Icons.mic_none,
    'photo': Icons.photo_camera_outlined,
    'video': Icons.videocam_outlined,
    'mixed': Icons.auto_awesome_outlined,
  };

  static final _imagePattern =
      RegExp(r'\.(png|jpe?g|webp|gif|heic|avif)(\?|$)', caseSensitive: false);
  static final _videoPattern =
      RegExp(r'\.(mp4|webm|mov|m4v)(\?|$)', caseSensitive: false);

  JournalEntry get entry => widget.entry;

  @override
  void initState() {
    super.initState();
    _draftText = TextEditingController(text: entry.text ?? '');
    _draftVoice = TextEditingController(text: entry.voiceTranscript ?? '');
    _draftAt = entry.capturedAt.toLocal();
  }

  @override
  void dispose() {
    _draftText.dispose();
    _draftVoice.dispose();
    super.dispose();
  }

  String _relativeTime(DateTime time) {
    final diff = DateTime.now().difference(time.toLocal());
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} minute${diff.inMinutes == 1 ? '' : 's'} ago';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours} hour${diff.inHours == 1 ? '' : 's'} ago';
    }
    if (diff.inDays < 30) {
      return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
    }
    final months = (diff.inDays / 30).floor();
    if (months < 12) return '$months month${months == 1 ? '' : 's'} ago';
    final years = (diff.inDays / 365).floor();
    return '$years year${years == 1 ? '' : 's'} ago';
  }

  List<String> _loggedChips() {
    final extracted = entry.aiExtracted;
    int count(String key) {
      final value = extracted[key];
      return value is List ? value.length : 0;
    }

    final hydration = count('hydration');
    final vitals = count('vitals');
    final food = count('food');
    return [
      if (hydration > 0) '$hydration hydration',
      if (vitals > 0) '$vitals vital${vitals == 1 ? '' : 's'}',
      if (food > 0) '$food meal${food == 1 ? '' : 's'}',
    ];
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _setArchived({required bool archived}) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(journalRepositoryProvider)
          .setArchived(entry, archived: archived);
      ref.invalidate(journalDataProvider);
      _snack(archived ? 'Entry archived' : 'Entry restored');
    } catch (_) {
      _snack(archived ? "Couldn't archive entry" : "Couldn't restore entry");
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmDelete() async {
    final palette = JournalPalette.light();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this entry?'),
        content: const Text(
          "This permanently removes the journal entry and any behaviors extracted from it. This can't be undone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: palette.destructive,
              foregroundColor: palette.surface,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await ref.read(journalRepositoryProvider).deleteEntry(entry);
      ref.invalidate(journalDataProvider);
      _snack('Entry deleted');
    } catch (_) {
      _snack("Couldn't delete entry");
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _retryProcessing() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(journalRepositoryProvider).retryProcessing(entry);
      ref.invalidate(journalDataProvider);
      _snack('Re-reading entry…');
    } catch (_) {
      _snack("Couldn't restart. Try again later.");
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openEdit() {
    setState(() {
      _draftText.text = entry.text ?? '';
      _draftVoice.text = entry.voiceTranscript ?? '';
      _draftAt = entry.capturedAt.toLocal();
      _editing = true;
    });
  }

  Future<void> _pickDraftDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _draftAt,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_draftAt),
    );
    if (time == null || !mounted) return;
    setState(() {
      _draftAt = DateTime(
        picked.year,
        picked.month,
        picked.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _saveEdit() async {
    if (_savingEdit) return;
    setState(() => _savingEdit = true);
    try {
      await ref.read(journalRepositoryProvider).updateEntry(
            entry,
            text: _draftText.text,
            voiceTranscript: _draftVoice.text,
            capturedAt: _draftAt,
          );
      ref.invalidate(journalDataProvider);
      if (mounted) {
        setState(() => _editing = false);
        _snack('Entry updated');
      }
    } catch (_) {
      _snack("Couldn't save changes");
    } finally {
      if (mounted) setState(() => _savingEdit = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = JournalPalette.light();
    final captured = entry.capturedAt.toLocal();
    final dateLabel = DateFormat('EEE, MMM d, yyyy · h:mm a').format(captured);
    final summary = entry.aiSummary?.trim() ?? '';
    final loggedChips = _loggedChips();
    final showRetry = entry.isFailed || entry.isStaleProcessing;
    final showReading =
        entry.isProcessing && !entry.isStaleProcessing && !entry.pendingUpload;

    return JournalGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: palette.surface,
                  border: Border.all(color: palette.divider),
                ),
                child: Icon(
                  _kindIcons[entry.kind] ?? Icons.edit_outlined,
                  size: 14,
                  color: palette.purplePrimary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateLabel,
                      style: journalSans(
                        fontSize: 11,
                        color: palette.textPrimary.withValues(alpha: 0.8),
                      ),
                    ),
                    Text(
                      _relativeTime(entry.capturedAt),
                      style: journalSans(
                        fontSize: 10,
                        color: palette.textTertiary.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
              if (showReading) ...[
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: palette.purplePrimary.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  'reading…',
                  style: journalSans(
                    fontSize: 11,
                    color: palette.purplePrimary.withValues(alpha: 0.8),
                  ),
                ),
              ],
              if (showRetry) ...[
                const SizedBox(width: 8),
                _RetryPill(
                  palette: palette,
                  label: entry.isFailed ? 'Retry reading' : 'Stuck, retry',
                  busy: _busy,
                  onTap: _retryProcessing,
                ),
              ],
              if (entry.pendingUpload) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: palette.backgroundTertiary,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Pending',
                    style: journalSans(
                      fontSize: 11,
                      color: palette.textTertiary,
                    ),
                  ),
                ),
              ],
              PopupMenuButton<String>(
                tooltip: 'Entry actions',
                enabled: !_busy,
                icon: Icon(
                  Icons.more_vert,
                  size: 18,
                  color: palette.textTertiary,
                ),
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      _openEdit();
                    case 'archive':
                      _setArchived(archived: true);
                    case 'restore':
                      _setArchived(archived: false);
                    case 'delete':
                      _confirmDelete();
                  }
                },
                itemBuilder: (context) => [
                  if (!entry.isArchived) ...[
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Edit'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'archive',
                      child: Row(
                        children: [
                          Icon(Icons.archive_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Archive'),
                        ],
                      ),
                    ),
                  ] else ...[
                    const PopupMenuItem(
                      value: 'restore',
                      child: Row(
                        children: [
                          Icon(Icons.unarchive_outlined, size: 16),
                          SizedBox(width: 8),
                          Text('Restore'),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(
                            Icons.delete_outline,
                            size: 16,
                            color: palette.destructive,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Delete permanently',
                            style: TextStyle(color: palette.destructive),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          if (_editing)
            _buildEditMode(palette)
          else ...[
            if (entry.text != null && entry.text!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                entry.text!,
                style: journalSerif(
                  fontSize: 15,
                  height: 1.6,
                  color: palette.textPrimary,
                ),
              ),
            ],
            if (entry.voiceTranscript != null &&
                entry.voiceTranscript!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                '\u201C${entry.voiceTranscript!}\u201D',
                style: journalSerif(
                  fontSize: 15,
                  height: 1.6,
                  fontStyle: FontStyle.italic,
                  color: palette.textPrimary.withValues(alpha: 0.9),
                ),
              ),
            ],
            ..._buildMediaGrid(palette),
            if (summary.isNotEmpty) ...[
              const SizedBox(height: 16),
              JournalGlassSurface(
                borderRadius: 16,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Text(
                  summary,
                  style: journalSerif(
                    fontSize: 14,
                    height: 1.5,
                    color: palette.textSecondary,
                  ),
                ),
              ),
            ],
            if (entry.aiTags.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final tag in entry.aiTags)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color:
                              palette.purplePrimary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        tag,
                        style: journalSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.4,
                          color: palette.purplePrimary,
                        ),
                      ),
                    ),
                ],
              ),
            ],
            if (loggedChips.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'Logged to your tools: ${loggedChips.join(' · ')}',
                style: journalSans(
                  fontSize: 11,
                  color: palette.textTertiary,
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  List<Widget> _buildMediaGrid(JournalPalette palette) {
    final photos =
        entry.mediaUrls.where((u) => _imagePattern.hasMatch(u)).toList();
    final videos =
        entry.mediaUrls.where((u) => _videoPattern.hasMatch(u)).toList();
    final total = photos.length + videos.length;
    if (total == 0) return const [];

    Widget tile(Widget child) => ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: AspectRatio(aspectRatio: 1, child: child),
        );

    return [
      const SizedBox(height: 12),
      GridView.count(
        crossAxisCount: total > 1 ? 2 : 1,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          for (final url in photos)
            tile(
              Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => ColoredBox(
                  color: palette.backgroundTertiary,
                  child: Icon(
                    Icons.broken_image_outlined,
                    color: palette.textQuaternary,
                  ),
                ),
              ),
            ),
          for (final _ in videos)
            tile(
              ColoredBox(
                color: palette.textPrimary,
                child: Icon(
                  Icons.play_circle_outline,
                  size: 32,
                  color: palette.surface.withValues(alpha: 0.9),
                ),
              ),
            ),
        ],
      ),
    ];
  }

  Widget _buildEditMode(JournalPalette palette) {
    final hasVoice = (entry.voiceTranscript ?? '').isNotEmpty ||
        _draftVoice.text.isNotEmpty;
    final canSave =
        _draftText.text.trim().isNotEmpty || _draftVoice.text.trim().isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_outlined,
                  size: 12, color: palette.textTertiary),
              const SizedBox(width: 4),
              Text(
                'WHEN DID THIS HAPPEN?',
                style: journalSans(
                  fontSize: 10,
                  letterSpacing: 1,
                  color: palette.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: _pickDraftDate,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: palette.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: palette.divider),
              ),
              child: Text(
                DateFormat('EEE, MMM d, yyyy · h:mm a').format(_draftAt),
                style: journalSans(
                  fontSize: 13,
                  color: palette.textPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _draftText,
            autofocus: true,
            maxLines: null,
            minLines: 4,
            onChanged: (_) => setState(() {}),
            style: journalSerif(
              fontSize: 15,
              height: 1.6,
              color: palette.textPrimary,
            ),
            decoration: InputDecoration(
              hintText: 'What is happening, or what just happened?',
              filled: true,
              fillColor: palette.surface,
            ),
          ),
          if (hasVoice) ...[
            const SizedBox(height: 12),
            Text(
              'VOICE TRANSCRIPT',
              style: journalSans(
                fontSize: 10,
                letterSpacing: 1,
                color: palette.textTertiary,
              ),
            ),
            const SizedBox(height: 4),
            TextField(
              controller: _draftVoice,
              maxLines: null,
              minLines: 3,
              onChanged: (_) => setState(() {}),
              style: journalSerif(
                fontSize: 14,
                height: 1.5,
                fontStyle: FontStyle.italic,
                color: palette.textPrimary,
              ),
              decoration: InputDecoration(
                filled: true,
                fillColor: palette.backgroundTertiary,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed:
                    _savingEdit ? null : () => setState(() => _editing = false),
                icon: const Icon(Icons.close, size: 14),
                label: const Text('Cancel'),
                style: TextButton.styleFrom(
                  foregroundColor: palette.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: _savingEdit || !canSave ? null : _saveEdit,
                icon: _savingEdit
                    ? SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: palette.surface,
                        ),
                      )
                    : const Icon(Icons.check, size: 14),
                label: const Text('Save'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RetryPill extends StatelessWidget {
  const _RetryPill({
    required this.palette,
    required this.label,
    required this.busy,
    required this.onTap,
  });

  final JournalPalette palette;
  final String label;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: palette.glassFill,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: busy ? null : onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: palette.divider),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (busy) ...[
                SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: palette.textTertiary,
                  ),
                ),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: journalSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: palette.textTertiary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
