import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../meds/dose_list.dart';
import '../meds/meds_repository.dart';
import '../meds/models/dose.dart';
import '../shared/glass_helpers.dart';

/// Doses for a specific calendar day (`yyyy-MM-dd`), mirroring web
/// `TodayDoses date={selectedDate}` without editing [medsDataProvider].
final medsForDayProvider = FutureProvider.autoDispose
    .family<MedsData, String>((ref, dateYmd) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return MedsData.empty;
  if (dateYmd.split('-').length != 3) return MedsData.empty;
  return ref.watch(medsRepositoryProvider).loadMeds(viewDateYmd: dateYmd);
});

/// Dose schedule card on Today with inline Taken / Snooze / Skip for pending doses.
class TodayMedsSection extends ConsumerWidget {
  const TodayMedsSection({
    super.key,
    required this.selectedDate,
    required this.isToday,
    required this.medicationCount,
  });

  final DateTime selectedDate;
  final bool isToday;
  final int medicationCount;

  String get _dateYmd => DateFormat('yyyy-MM-dd').format(selectedDate);

  Future<void> _doseAction(
    WidgetRef ref,
    BuildContext context,
    Future<void> Function() action, {
    String? successMessage,
  }) async {
    try {
      await action();
      ref.invalidate(medsForDayProvider(_dateYmd));
      ref.invalidate(medsDataProvider);
      if (successMessage != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(successMessage),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update dose')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medsAsync = ref.watch(medsForDayProvider(_dateYmd));
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final sectionTitle =
        isToday ? 'Today' : DateFormat('EEEE, MMMM d').format(selectedDate);
    final emptySchedule = isToday
        ? 'No medications scheduled for today.'
        : 'No medications scheduled for ${DateFormat('EEEE, MMMM d').format(selectedDate)}.';

    return medsAsync.when(
      loading: () => GlassCard(
        child: Text(
          'Loading your dose schedule.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.64),
              ),
        ),
      ),
      error: (_, __) => GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Could not load doses right now.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.64),
                  ),
            ),
            SizedBox(
              height: tokens.touch.minTarget,
              child: TextButton(
                onPressed: () => context.go(AppRoutes.meds),
                child: const Text('Open meds'),
              ),
            ),
          ],
        ),
      ),
      data: (medsData) {
        final doses = medsData.todayDoses;
        final hasMedication = medicationCount > 0 || medsData.hasMeds;

        return GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sectionTitle,
                      style: TextStyle(
                        fontFamily: PurpleType.serif,
                        fontSize: 20,
                        color: const Color(0xFFF2F2F5),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: tokens.touch.minTarget,
                    child: TextButton(
                      onPressed: () => context.go(AppRoutes.meds),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size(
                          tokens.touch.minTarget,
                          tokens.touch.minTarget,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Medications',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            size: 16,
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              if (doses.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.medication_outlined,
                        size: 16,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          hasMedication
                              ? emptySchedule
                              : '$emptySchedule Add one in Meds.',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.64),
                                    height: 1.4,
                                  ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(top: 8),
                  itemCount: doses.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: parseTokenColor(colors.divider),
                  ),
                  itemBuilder: (context, index) {
                    final dose = doses[index];
                    return _TodayDoseRow(
                      dose: dose,
                      onTaken: dose.isPending
                          ? () => _doseAction(
                                ref,
                                context,
                                () => ref
                                    .read(medsRepositoryProvider)
                                    .markDoseTaken(dose.id),
                              )
                          : null,
                      onSnooze: dose.isPending
                          ? () => _doseAction(
                                ref,
                                context,
                                () => ref
                                    .read(medsRepositoryProvider)
                                    .snoozeDose(dose.id),
                                successMessage: 'Snoozed 10 min',
                              )
                          : null,
                      onSkip: dose.isPending
                          ? () => _doseAction(
                                ref,
                                context,
                                () => ref
                                    .read(medsRepositoryProvider)
                                    .markDoseSkipped(dose.id),
                              )
                          : null,
                    );
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

class _TodayDoseRow extends StatelessWidget {
  const _TodayDoseRow({
    required this.dose,
    this.onTaken,
    this.onSnooze,
    this.onSkip,
  });

  final MedicationDose dose;
  final VoidCallback? onTaken;
  final VoidCallback? onSnooze;
  final VoidCallback? onSkip;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final medName = dose.medication?.name ?? 'Medication';
    final strength = dose.medication?.strength;
    final timeLabel = DateFormat.jm().format(dose.scheduledAt.toLocal());
    final outOfStock = dose.medication?.outOfStock ?? false;
    final showActions =
        dose.isPending && !outOfStock && onTaken != null && onSkip != null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TimePill(time: timeLabel, status: dose.status, colors: colors),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      medName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      softWrap: true,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.93),
                          ),
                    ),
                    if (strength != null && strength.isNotEmpty)
                      Text(
                        strength,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                  ],
                ),
              ),
              if (!showActions) ...[
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    _statusLabel(dose.status),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: _statusColor(dose.status, colors),
                        ),
                  ),
                ),
              ],
            ],
          ),
          if (showActions) ...[
            const SizedBox(height: 10),
            MedsPendingDoseActions(
              onTaken: onTaken!,
              onSnooze: onSnooze ?? onSkip!,
              onSkip: onSkip!,
            ),
          ],
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'taken':
        return 'Taken';
      case 'skipped':
        return 'Skipped';
      case 'missed':
        return 'Missed';
      default:
        return 'Pending';
    }
  }

  Color _statusColor(String status, PurpleColorTokens colors) {
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

class _TimePill extends StatelessWidget {
  const _TimePill({
    required this.time,
    required this.status,
    required this.colors,
  });

  final String time;
  final String status;
  final PurpleColorTokens colors;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, ring) = switch (status) {
      'taken' => (
          parseTokenColor(colors.success).withValues(alpha: 0.15),
          parseTokenColor(colors.success),
          parseTokenColor(colors.success).withValues(alpha: 0.3),
        ),
      'missed' => (
          parseTokenColor(colors.destructive).withValues(alpha: 0.15),
          parseTokenColor(colors.destructive),
          parseTokenColor(colors.destructive).withValues(alpha: 0.3),
        ),
      'skipped' => (
          Colors.white.withValues(alpha: 0.08),
          Colors.white.withValues(alpha: 0.55),
          Colors.white.withValues(alpha: 0.12),
        ),
      _ => (
          parseTokenColor(colors.purplePrimary).withValues(alpha: 0.15),
          parseTokenColor(colors.purplePrimary),
          parseTokenColor(colors.purplePrimary).withValues(alpha: 0.3),
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: ring),
      ),
      child: Text(
        time,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: fg,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
      ),
    );
  }
}
