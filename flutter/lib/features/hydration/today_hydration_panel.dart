import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../design/tokens.dart';
import '../shared/merged_style.dart';
import 'hydration_repository.dart';
import 'hydration_style.dart';
import 'quick_add_water.dart';

DateTime _todayKey() {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day);
}

/// Today icon-row expand body: goal progress + web-parity quick-add + day view link.
class TodayHydrationPanel extends ConsumerWidget {
  const TodayHydrationPanel({super.key, required this.onOpenDayView});

  final VoidCallback onOpenDayView;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = mergedPalette();
    final today = _todayKey();
    final dayAsync = ref.watch(hydrationDayProvider(today));
    final weekAsync = ref.watch(hydrationWeekProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Log every drink, water and electrolytes.',
          style: hydrationSans(fontSize: 13, color: p.textTertiary),
        ),
        const SizedBox(height: 10),
        dayAsync.when(
          loading: () => Text(
            'Loading today…',
            style: hydrationSans(fontSize: 13, color: p.textTertiary),
          ),
          error: (_, __) => Text(
            'Could not load hydration. You can still try logging below.',
            style: hydrationSans(fontSize: 13, color: p.textTertiary),
          ),
          data: (data) {
            final liters = data.totalMl / 1000;
            final goalLiters = data.goalMl / 1000;
            final pct = (data.progress * 100).round();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${liters.toStringAsFixed(2)} L / ${goalLiters.toStringAsFixed(1)} L · $pct%',
                  style: hydrationSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: p.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: data.progress,
                    minHeight: 6,
                    backgroundColor: p.divider,
                    color: p.purplePrimary,
                  ),
                ),
                if (data.isOffline) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Offline: goal from last known profile.',
                    style: hydrationSans(fontSize: 11, color: p.textTertiary),
                  ),
                ],
              ],
            );
          },
        ),
        const SizedBox(height: 12),
        weekAsync.maybeWhen(
          data: (week) => _HydrationWeekBars(week: week, palette: p),
          orElse: () => const SizedBox.shrink(),
        ),
        const SizedBox(height: 12),
        QuickAddWater(
          compact: true,
          onLogged: () {
            ref.invalidate(hydrationDayProvider(today));
            ref.invalidate(hydrationWeekProvider);
          },
        ),
        dayAsync.maybeWhen(
          data: (data) => _HydrationEntryList(rows: data.rows, palette: p),
          orElse: () => const SizedBox.shrink(),
        ),
        const SizedBox(height: 4),
        TextButton(
          onPressed: onOpenDayView,
          style: TextButton.styleFrom(
            foregroundColor: p.purplePrimary,
            padding: EdgeInsets.zero,
            minimumSize: const Size(44, 44),
            alignment: Alignment.centerLeft,
          ),
          child: const Text('Day view ›'),
        ),
      ],
    );
  }
}

class _HydrationWeekBars extends StatelessWidget {
  const _HydrationWeekBars({required this.week, required this.palette});

  final HydrationWeekData week;
  final MergedPalette palette;

  @override
  Widget build(BuildContext context) {
    final maxMl = [
      week.goalMl,
      ...week.dailyMl,
    ].reduce((a, b) => a > b ? a : b);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'LAST 7 DAYS',
          style: hydrationSans(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: palette.textTertiary,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          key: const Key('hydration-week-bars'),
          children: [
            for (var i = 0; i < week.dailyMl.length; i++) ...[
              if (i > 0) const SizedBox(width: 4),
              Expanded(
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: week.dailyMl[i] <= 0
                        ? palette.divider
                        : palette.purplePrimary.withValues(
                            alpha: 0.35 +
                                0.65 *
                                    (maxMl <= 0
                                        ? 0
                                        : (week.dailyMl[i] / maxMl)
                                            .clamp(0, 1)),
                          ),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _HydrationEntryList extends StatelessWidget {
  const _HydrationEntryList({required this.rows, required this.palette});

  final List<HydrationRow> rows;
  final MergedPalette palette;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const SizedBox.shrink();
    final newest = rows.reversed.take(8).toList();
    return Column(
      key: const Key('hydration-entry-list'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        for (final row in newest) ...[
          Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: palette.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: palette.divider),
            ),
            child: Row(
              children: [
                _KindChip(kind: row.kind, palette: palette),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${row.volumeMl} ml ${row.displayLabel}',
                    style: hydrationSans(fontSize: 12, color: palette.textPrimary),
                  ),
                ),
                Text(
                  DateFormat.jm().format(row.consumedAt),
                  style: hydrationSans(fontSize: 11, color: palette.textTertiary),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _KindChip extends StatelessWidget {
  const _KindChip({required this.kind, required this.palette});

  final String kind;
  final MergedPalette palette;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final tone = switch (kind) {
      'electrolyte' => parseTokenColor(colors.warning),
      'water' => parseTokenColor(colors.info),
      _ => palette.textTertiary,
    };
    final label = switch (kind) {
      'electrolyte' => 'ELECTROLYTE',
      'water' => 'WATER',
      'coffee' => 'COFFEE',
      'tea' => 'TEA',
      _ => 'DRINK',
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: tone.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: hydrationSans(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: tone,
        ),
      ),
    );
  }
}
