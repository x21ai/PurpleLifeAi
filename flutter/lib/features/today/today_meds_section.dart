import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/auth/auth_state.dart' as core_auth;
import '../../core/providers/core_providers.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../meds/dose_list.dart';
import '../meds/med_refill_sheet.dart';
import '../meds/meds_repository.dart';
import '../meds/models/dose.dart';
import '../meds/models/medication.dart';

/// Doses for a specific calendar day (`yyyy-MM-dd`), mirroring web
/// `TodayDoses date={selectedDate}` without editing [medsDataProvider].
final medsForDayProvider = FutureProvider.autoDispose
    .family<MedsData, String>((ref, dateYmd) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  // Same as todayDataProvider: stream may lag after password sign-in.
  final session = core_auth.readActiveSession(ref);
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

  Future<void> _openRefill(
    WidgetRef ref,
    BuildContext context,
    Medication medication,
  ) async {
    final saved = await MedRefillSheet.show(context, medication);
    if (saved == true) {
      ref.invalidate(medsForDayProvider(_dateYmd));
      ref.invalidate(medsDataProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stock updated'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medsAsync = ref.watch(medsForDayProvider(_dateYmd));
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final emptySchedule = isToday
        ? 'No medications scheduled for today.'
        : 'No medications scheduled for ${DateFormat('EEEE, MMMM d').format(selectedDate)}.';

    return medsAsync.when(
      loading: () => Text(
        'Loading your dose schedule.',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.64),
            ),
      ),
      error: (_, __) => Column(
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
      data: (medsData) {
        final doses = medsData.todayDoses;
        final hasMedication = medicationCount > 0 || medsData.hasMeds;

        // Flat body: shell already provides glass chrome + "Today's doses" title.
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: SizedBox(
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
            ),
              if (doses.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
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
                  padding: EdgeInsets.zero,
                  itemCount: doses.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: parseTokenColor(colors.divider),
                  ),
                  itemBuilder: (context, index) {
                    final dose = doses[index];
                    final med = dose.medication;
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
                      onUndo: dose.status == 'taken'
                          ? () => _doseAction(
                                ref,
                                context,
                                () => ref
                                    .read(medsRepositoryProvider)
                                    .reclassifyDose(dose.id, 'pending'),
                                successMessage: 'Marked pending',
                              )
                          : null,
                      onITookIt: (dose.status == 'missed' ||
                              dose.status == 'skipped')
                          ? () => _doseAction(
                                ref,
                                context,
                                () => ref
                                    .read(medsRepositoryProvider)
                                    .reclassifyDose(dose.id, 'taken'),
                                successMessage: 'Marked as taken',
                              )
                          : null,
                      onRefill: med != null && med.outOfStock
                          ? () => _openRefill(ref, context, med)
                          : null,
                    );
                  },
                ),
          ],
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
    this.onUndo,
    this.onITookIt,
    this.onRefill,
  });

  final MedicationDose dose;
  final VoidCallback? onTaken;
  final VoidCallback? onSnooze;
  final VoidCallback? onSkip;
  final VoidCallback? onUndo;
  final VoidCallback? onITookIt;
  final VoidCallback? onRefill;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final medName = dose.medication?.name ?? 'Medication';
    final strength = dose.medication?.strength;
    final timeLabel = DateFormat.jm().format(dose.scheduledAt.toLocal());
    final outOfStock = dose.medication?.outOfStock ?? false;
    final showActions =
        dose.isPending && !outOfStock && onTaken != null && onSkip != null;
    final showRefillChip = outOfStock && onRefill != null;
    final showTakenUndo = dose.status == 'taken' && onUndo != null;
    final showITookIt = onITookIt != null;
    final destructive = parseTokenColor(colors.destructive);
    final statusColor = _statusColor(dose.status, colors);

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
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          medName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          softWrap: true,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.93),
                                  ),
                        ),
                        if (showRefillChip)
                          _ZeroPillsChip(
                            color: destructive,
                            onTap: onRefill!,
                          ),
                      ],
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
            ],
          ),
          if (showActions) ...[
            const SizedBox(height: 10),
            MedsPendingDoseActions(
              onTaken: onTaken!,
              onSnooze: onSnooze ?? onSkip!,
              onSkip: onSkip!,
            ),
          ] else if (showRefillChip && dose.isPending) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: onRefill,
                style: TextButton.styleFrom(
                  minimumSize: const Size(0, 44),
                  foregroundColor: destructive,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                child: const Text('Refill to update'),
              ),
            ),
          ] else if (showTakenUndo) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  'Taken',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                MedsDoseActionButton(
                  label: 'Undo',
                  onTap: onUndo!,
                  kind: MedsActionKind.ghost,
                ),
              ],
            ),
          ] else if (showITookIt) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  _statusLabel(dose.status),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                MedsDoseActionButton(
                  label: 'I took it',
                  onTap: onITookIt!,
                  kind: MedsActionKind.outline,
                ),
              ],
            ),
          ] else ...[
            const SizedBox(height: 8),
            Text(
              _statusLabel(dose.status),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: statusColor,
                  ),
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

/// Tappable stock chip when remaining count is zero.
class _ZeroPillsChip extends StatelessWidget {
  const _ZeroPillsChip({required this.color, required this.onTap});

  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: color.withValues(alpha: 0.35)),
            ),
            child: Text(
              '0 pills left',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ),
      ),
    );
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
