import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'meds_repository.dart';
import 'meds_today.dart';
import 'models/dose.dart';

/// 30-day dose history
class MedsHistoryScreen extends ConsumerWidget {
  const MedsHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(doseHistoryProvider);

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.meds),
                icon: Icon(
                  Icons.arrow_back,
                  size: 18,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Medications',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                // Mirrors web meds.history.eyebrow.
                'MEDICATIONS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                // Mirrors web meds.history.title.
                'Dose history',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                // Mirrors web meds.history.subtitle.
                'Every scheduled dose across your medications, day by day.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 24),
              historyAsync.when(
                loading: () => const LoadingSkeleton(
                  sectionTitle: 'History',
                  tileCount: 4,
                ),
                error: (_, __) => Text(
                  'Could not load dose history.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                      ),
                ),
                data: (result) {
                  if (result.groups.isEmpty) {
                    return Text(
                      'No dose history yet.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.65),
                          ),
                    );
                  }
                  return Column(
                    children: [
                      for (final day in result.groups) ...[
                        _HistoryDaySection(
                          day: day,
                          timezone: result.timezone,
                        ),
                        const SizedBox(height: 24),
                      ],
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HistoryDaySection extends StatelessWidget {
  const _HistoryDaySection({
    required this.day,
    required this.timezone,
  });

  final DoseHistoryDay day;
  final String timezone;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                day.label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ),
            Text(
              '${day.takenCount} of ${day.total} taken',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (var i = 0; i < day.doses.length; i++) ...[
                if (i > 0)
                  Divider(
                    height: 1,
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                _HistoryDoseRow(
                  dose: day.doses[i],
                  timezone: timezone,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _HistoryDoseRow extends StatelessWidget {
  const _HistoryDoseRow({
    required this.dose,
    required this.timezone,
  });

  final MedicationDose dose;
  final String timezone;

  @override
  Widget build(BuildContext context) {
    final medId = dose.medication?.id;
    final statusColor = _statusColor(dose.status);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: medId == null
            ? null
            : () => context.push(AppRoutes.medDetail(medId)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            children: [
              SizedBox(
                width: 64,
                child: Text(
                  formatDoseLocalTime(dose.scheduledAt, timezone),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                ),
              ),
              Expanded(
                child: Text(
                  dose.medication?.name ?? 'Medication',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                ),
              ),
              if (dose.amountLabel != null) ...[
                const SizedBox(width: 8),
                Text(
                  dose.amountLabel!,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                ),
              ],
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  dose.status,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Token-backed status color, matching `dose_list.dart` so the history log
  /// and Today's doses share one palette instead of a divergent hardcoded one.
  Color _statusColor(String status) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    switch (status) {
      case 'taken':
        return parseTokenColor(colors.success);
      case 'missed':
        return parseTokenColor(colors.destructive);
      case 'skipped':
        return Colors.white.withValues(alpha: 0.55);
      default:
        return parseTokenColor(colors.purplePrimary);
    }
  }
}
