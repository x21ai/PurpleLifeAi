import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    final dayAsync = ref.watch(hydrationDayProvider(_todayKey()));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
        QuickAddWater(
          compact: true,
          onLogged: () {
            ref.invalidate(hydrationDayProvider(_todayKey()));
          },
        ),
        const SizedBox(height: 12),
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
