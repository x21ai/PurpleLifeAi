import 'dart:async';

import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:intl/intl.dart';

import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';
import 'meds_today.dart';
import 'models/dose.dart';
import 'models/medication.dart';

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

String _formatLocaleTime(DateTime at) => DateFormat.jm().format(at.toLocal());

/// "8:00 AM" from a Postgres "HH:mm[:ss]" time-of-day string (web formatTime).
String formatTimeOfDay(String t) {
  final parts = t.split(':');
  if (parts.length < 2) return t;
  final h = int.tryParse(parts[0]) ?? 0;
  final m = int.tryParse(parts[1]) ?? 0;
  final am = h < 12;
  final h12 = ((h + 11) % 12) + 1;
  return '$h12:${m.toString().padLeft(2, '0')} ${am ? 'AM' : 'PM'}';
}

/// Today's doses panel ported from web `TodayPanel`
/// (`src/components/meds/today-panel.tsx`): glass card with date meta,
/// adherence, day timeline, and per-dose status actions.
class TodayDosePanel extends StatelessWidget {
  const TodayDosePanel({
    super.key,
    required this.doses,
    required this.onTaken,
    required this.onSkip,
    required this.onSnooze,
    required this.onReclassify,
    required this.onAddMed,
    this.onOpenMed,
    this.onMarkAllTaken,
    this.markingAll = false,
    this.adherencePct,
    this.adherenceTaken = 0,
    this.adherenceTotal = 0,
    this.timezone = 'UTC',
    this.todayLabel = '',
    this.viewDate = '',
    this.todayStr = '',
    this.onChangeDate,
  });

  final List<MedicationDose> doses;
  final ValueChanged<MedicationDose> onTaken;
  final ValueChanged<MedicationDose> onSkip;
  final ValueChanged<MedicationDose> onSnooze;

  /// Retroactive status edit: `next` is `taken`, `skipped`, or `pending`.
  final void Function(MedicationDose dose, String next) onReclassify;
  final VoidCallback onAddMed;
  final ValueChanged<Medication>? onOpenMed;
  final VoidCallback? onMarkAllTaken;
  final bool markingAll;
  final int? adherencePct;
  final int adherenceTaken;
  final int adherenceTotal;
  final String timezone;
  final String todayLabel;
  final String viewDate;
  final String todayStr;
  final ValueChanged<String>? onChangeDate;

  bool get _isToday =>
      viewDate.isEmpty || todayStr.isEmpty || viewDate == todayStr;

  String get _effectiveViewDate =>
      viewDate.isNotEmpty ? viewDate : todayStr;

  String _timezoneLabel() =>
      timezone.replaceAll('_', ' ');

  @override
  Widget build(BuildContext context) {
    final pending = doses.where((d) => d.isPending).length;
    final taken = doses.where((d) => d.status == 'taken').length;
    final missed = doses.where((d) => d.status == 'missed').length;
    final label = todayLabel.isNotEmpty
        ? todayLabel
        : DateFormat('EEE, MMM d').format(DateTime.now());
    final canGoNext = !_isToday && onChangeDate != null;

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.medication_outlined,
                          size: 16,
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            _isToday ? "Today's doses" : 'Doses for this day',
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  fontFamily: PurpleType.serif,
                                  color: Colors.white.withValues(alpha: 0.95),
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (onChangeDate != null &&
                        _effectiveViewDate.isNotEmpty &&
                        todayStr.isNotEmpty)
                      _DateNavigator(
                        label: label,
                        timezoneLabel: _timezoneLabel(),
                        canGoNext: canGoNext,
                        viewDate: _effectiveViewDate,
                        todayStr: todayStr,
                        onPrev: () => onChangeDate!(
                          shiftDateStr(_effectiveViewDate, -1),
                        ),
                        onNext: canGoNext
                            ? () => onChangeDate!(
                                  shiftDateStr(_effectiveViewDate, 1),
                                )
                            : null,
                        onPickDate: (picked) => onChangeDate!(picked),
                      )
                    else
                      Text(
                        '$label · ${_timezoneLabel()}',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                      ),
                  ],
                ),
              ),
              if (pending > 0 && onMarkAllTaken != null)
                OutlinedButton.icon(
                  onPressed: markingAll ? null : onMarkAllTaken,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 44),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    foregroundColor: Colors.white.withValues(alpha: 0.85),
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.18),
                    ),
                    shape: const StadiumBorder(),
                  ),
                  icon: markingAll
                      ? SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white.withValues(alpha: 0.7),
                          ),
                        )
                      : const Icon(Icons.done_all, size: 14),
                  label: const Text('Mark all taken'),
                ),
            ],
          ),
          if (adherencePct != null && _isToday) ...[
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(
                text: '$adherencePct%',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.95),
                      fontWeight: FontWeight.w500,
                    ),
                children: [
                  TextSpan(
                    text: '  on schedule, last 14 days',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                  ),
                ],
              ),
            ),
            if (adherenceTotal > 0)
              Text(
                '$adherenceTaken of $adherenceTotal doses logged',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
          ],
          if (doses.isEmpty) ...[
            const SizedBox(height: 16),
            Text(
              'No scheduled doses today.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.65),
                  ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: onAddMed,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 44),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                foregroundColor: Colors.white.withValues(alpha: 0.85),
                side: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
                shape: const StadiumBorder(),
              ),
              child: const Text('Add a medication'),
            ),
          ] else ...[
            const SizedBox(height: 16),
            Text(
              '$taken/${doses.length} taken'
              '${missed > 0 ? ' · $missed missed' : ''}',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
            ),
            const SizedBox(height: 12),
            _DoseTimeline(
              doses: doses,
              viewDateYmd: _effectiveViewDate,
              showNowMarker: _isToday,
            ),
            const SizedBox(height: 20),
            ...doses.map(
              (dose) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _DoseRow(
                  dose: dose,
                  onTaken: () => onTaken(dose),
                  onSkip: () => onSkip(dose),
                  onSnooze: () => onSnooze(dose),
                  onReclassify: (next) => onReclassify(dose, next),
                  onOpenMed: onOpenMed,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Prev/next day controls and date picker matching web TodayPanel header.
class _DateNavigator extends StatelessWidget {
  const _DateNavigator({
    required this.label,
    required this.timezoneLabel,
    required this.viewDate,
    required this.todayStr,
    required this.onPrev,
    required this.onPickDate,
    this.canGoNext = false,
    this.onNext,
  });

  final String label;
  final String timezoneLabel;
  final String viewDate;
  final String todayStr;
  final VoidCallback onPrev;
  final VoidCallback? onNext;
  final bool canGoNext;
  final ValueChanged<String> onPickDate;

  Future<void> _openPicker(BuildContext context) async {
    final initial = DateTime.tryParse('${viewDate}T12:00:00') ?? DateTime.now();
    final max = DateTime.tryParse('${todayStr}T12:00:00') ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: max,
    );
    if (picked == null) return;
    onPickDate(DateFormat('yyyy-MM-dd').format(picked));
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 4,
      runSpacing: 4,
      children: [
        _RoundNavButton(
          icon: Icons.chevron_left,
          tooltip: 'Previous day',
          onTap: onPrev,
        ),
        Text(
          '$label · $timezoneLabel',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.5),
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
        ),
        _RoundNavButton(
          icon: Icons.chevron_right,
          tooltip: 'Next day',
          onTap: onNext,
          enabled: canGoNext,
        ),
        OutlinedButton(
          onPressed: () => _openPicker(context),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            foregroundColor: Colors.white.withValues(alpha: 0.65),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: Text(
            viewDate,
            style: const TextStyle(
              fontSize: 12,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
        ),
      ],
    );
  }
}

class _RoundNavButton extends StatelessWidget {
  const _RoundNavButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.enabled = true,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: OutlinedButton(
        onPressed: enabled ? onTap : null,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 44),
          padding: EdgeInsets.zero,
          shape: const CircleBorder(),
          foregroundColor: Colors.white.withValues(alpha: enabled ? 0.65 : 0.3),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
        ),
        child: Icon(icon, size: 18),
      ),
    );
  }
}

/// 24-hour dot strip from web TodayPanel: baseline, hour ticks, optional now
/// marker, one status-colored dot per dose.
class _DoseTimeline extends StatefulWidget {
  const _DoseTimeline({
    required this.doses,
    required this.viewDateYmd,
    this.showNowMarker = true,
  });

  final List<MedicationDose> doses;
  final String viewDateYmd;
  final bool showNowMarker;

  @override
  State<_DoseTimeline> createState() => _DoseTimelineState();
}

class _DoseTimelineState extends State<_DoseTimeline> {
  late DateTime _now;
  Timer? _nowTimer;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    if (widget.showNowMarker) {
      _startNowTimer();
    }
  }

  @override
  void didUpdateWidget(covariant _DoseTimeline oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.showNowMarker && !oldWidget.showNowMarker) {
      _startNowTimer();
    } else if (!widget.showNowMarker && oldWidget.showNowMarker) {
      _nowTimer?.cancel();
      _nowTimer = null;
    }
  }

  @override
  void dispose() {
    _nowTimer?.cancel();
    super.dispose();
  }

  void _startNowTimer() {
    _nowTimer?.cancel();
    _nowTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (!mounted) return;
      setState(() => _now = DateTime.now());
    });
  }

  DateTime get _dayStart {
    final parsed = DateTime.tryParse('${widget.viewDateYmd}T00:00:00');
    if (parsed != null) return parsed;
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  @override
  Widget build(BuildContext context) {
    const dayMs = 86400000;
    final dayStart = _dayStart;
    final nowFraction = widget.showNowMarker
        ? (_now.difference(dayStart).inMilliseconds / dayMs).clamp(0.0, 1.0)
        : 0.0;

    return Column(
      children: [
        SizedBox(
          height: 40,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    left: 0,
                    right: 0,
                    top: 20,
                    child: Container(
                      height: 1,
                      color: Colors.white.withValues(alpha: 0.12),
                    ),
                  ),
                  for (final h in const [0, 6, 12, 18, 24])
                    Positioned(
                      left: (h / 24) * width,
                      top: 16,
                      child: Container(
                        width: 1,
                        height: 8,
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                  if (widget.showNowMarker)
                    Positioned(
                      left: nowFraction * width,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 1,
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                    ),
                  for (final dose in widget.doses)
                    Positioned(
                      left: _doseFraction(dose, dayStart) * width - 6,
                      top: 14,
                      child: Tooltip(
                        message:
                            '${dose.medication?.name ?? 'Dose'} · '
                            '${_formatLocaleTime(dose.scheduledAt)} · '
                            '${dose.status}',
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _statusColor(dose.status),
                            border: Border.all(
                              width: 3,
                              color: _statusColor(dose.status)
                                  .withValues(alpha: 0.3),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (final label in const ['12a', '6a', '12p', '6p', '12a'])
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.white.withValues(alpha: 0.45),
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
          ],
        ),
      ],
    );
  }

  double _doseFraction(MedicationDose dose, DateTime dayStart) {
    const dayMs = 86400000;
    final ms = dose.scheduledAt.toLocal().difference(dayStart).inMilliseconds;
    return (ms / dayMs).clamp(0.0, 1.0);
  }
}

/// Single dose row: time pill, name, and status actions
/// (Taken / Snooze / Skip, Taken + Undo, or status + I took it).
class _DoseRow extends StatelessWidget {
  const _DoseRow({
    required this.dose,
    required this.onTaken,
    required this.onSkip,
    required this.onSnooze,
    required this.onReclassify,
    this.onOpenMed,
  });

  final MedicationDose dose;
  final VoidCallback onTaken;
  final VoidCallback onSkip;
  final VoidCallback onSnooze;
  final ValueChanged<String> onReclassify;
  final ValueChanged<Medication>? onOpenMed;

  @override
  Widget build(BuildContext context) {
    final med = dose.medication;
    final outOfStock = med?.outOfStock ?? false;
    final statusColor = _statusColor(dose.status);
    final destructive = _statusColor('missed');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          _StatusPill(
            label: _formatLocaleTime(dose.scheduledAt),
            color: statusColor,
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 32),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  med?.name ?? 'Medication',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                      ),
                ),
                if (outOfStock) ...[
                  const SizedBox(width: 8),
                  Text(
                    'Count zero, refill to update',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: destructive,
                        ),
                  ),
                ],
              ],
            ),
          ),
          if (dose.isPending && outOfStock)
            TextButton(
              onPressed: med == null || onOpenMed == null
                  ? null
                  : () => onOpenMed!(med),
              style: TextButton.styleFrom(
                minimumSize: const Size(0, 44),
                foregroundColor: destructive,
              ),
              child: const Text('Refill to update'),
            )
          else if (dose.isPending)
            Wrap(
              spacing: 6,
              children: [
                _ActionButton(label: 'Taken', onTap: onTaken, kind: _ActionKind.primary),
                _ActionButton(label: 'Snooze', onTap: onSnooze, kind: _ActionKind.outline),
                _ActionButton(label: 'Skip', onTap: onSkip, kind: _ActionKind.ghost),
              ],
            )
          else if (dose.status == 'taken')
            Wrap(
              spacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _StatusPill(label: 'Taken', color: statusColor),
                _ActionButton(
                  label: 'Undo',
                  onTap: () => onReclassify('pending'),
                  kind: _ActionKind.ghost,
                ),
              ],
            )
          else
            Wrap(
              spacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _StatusPill(
                  label: _capitalize(dose.status),
                  color: statusColor,
                ),
                _ActionButton(
                  label: 'I took it',
                  onTap: () => onReclassify('taken'),
                  kind: _ActionKind.outline,
                ),
              ],
            ),
        ],
      ),
    );
  }

  String _capitalize(String value) =>
      value.isEmpty ? value : value[0].toUpperCase() + value.substring(1);
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
      ),
    );
  }
}

enum _ActionKind { primary, outline, ghost }

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.onTap,
    required this.kind,
  });

  final String label;
  final VoidCallback onTap;
  final _ActionKind kind;

  @override
  Widget build(BuildContext context) {
    switch (kind) {
      case _ActionKind.primary:
        return FilledButton(
          onPressed: onTap,
          style: FilledButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: const StadiumBorder(),
          ),
          child: Text(label),
        );
      case _ActionKind.outline:
        return OutlinedButton(
          onPressed: onTap,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            foregroundColor: Colors.white.withValues(alpha: 0.8),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
            shape: const StadiumBorder(),
          ),
          child: Text(label),
        );
      case _ActionKind.ghost:
        return TextButton(
          onPressed: onTap,
          style: TextButton.styleFrom(
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            foregroundColor: Colors.white.withValues(alpha: 0.65),
            shape: const StadiumBorder(),
          ),
          child: Text(label),
        );
    }
  }
}

/// Library list ported from web med rows: one rounded container with divided
/// rows, badges, right-aligned dose meta, chevron to detail, and a quick
/// "Taken" action when the next dose is pending.
class MedLibraryList extends StatelessWidget {
  const MedLibraryList({
    super.key,
    required this.medications,
    required this.nextDoseByMedId,
    required this.onOpenMed,
    required this.onMarkTaken,
    this.onEditMed,
    this.onArchiveMed,
    this.onRestoreMed,
  });

  final List<Medication> medications;
  final Map<String, MedicationDose> nextDoseByMedId;
  final ValueChanged<Medication> onOpenMed;
  final ValueChanged<MedicationDose> onMarkTaken;
  final ValueChanged<Medication>? onEditMed;
  final ValueChanged<Medication>? onArchiveMed;
  final ValueChanged<Medication>? onRestoreMed;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < medications.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                thickness: 1,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            MedLibraryRow(
              medication: medications[i],
              nextDose: nextDoseByMedId[medications[i].id],
              onTap: () => onOpenMed(medications[i]),
              onMarkTaken: onMarkTaken,
              onEdit: onEditMed == null
                  ? null
                  : () => onEditMed!(medications[i]),
              onArchive: onArchiveMed == null
                  ? null
                  : () => onArchiveMed!(medications[i]),
              onRestore: onRestoreMed == null
                  ? null
                  : () => onRestoreMed!(medications[i]),
            ),
          ],
        ],
      ),
    );
  }
}

/// Single library row matching web `MedRow`.
class MedLibraryRow extends StatelessWidget {
  const MedLibraryRow({
    super.key,
    required this.medication,
    required this.onTap,
    this.nextDose,
    this.onMarkTaken,
    this.onEdit,
    this.onArchive,
    this.onRestore,
  });

  final Medication medication;
  final VoidCallback onTap;
  final MedicationDose? nextDose;
  final ValueChanged<MedicationDose>? onMarkTaken;
  final VoidCallback? onEdit;
  final VoidCallback? onArchive;
  final VoidCallback? onRestore;

  @override
  Widget build(BuildContext context) {
    final destructive = _statusColor('missed');
    final pendingNext = nextDose != null && nextDose!.isPending;
    final showQuickTaken =
        !medication.outOfStock && pendingNext && onMarkTaken != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Opacity(
                opacity: medication.active ? 1 : 0.7,
                child: Row(
                  children: [
                    Expanded(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            medication.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontFamily: PurpleType.serif,
                                  fontSize: 17,
                                  color: Colors.white.withValues(alpha: 0.95),
                                ),
                          ),
                          if (medication.outOfStock)
                            _Badge(label: 'OUT OF STOCK', color: destructive)
                          else if (medication.lowStock)
                            _Badge(label: 'REFILL SOON', color: destructive),
                          if (!medication.active)
                            _Badge(
                              label: 'ARCHIVED',
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 150),
                      child: Text(
                        _metaLabel(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.right,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    if (onEdit != null || onArchive != null || onRestore != null)
                      PopupMenuButton<String>(
                        icon: Icon(
                          Icons.more_horiz,
                          size: 20,
                          color: Colors.white.withValues(alpha: 0.45),
                        ),
                        onSelected: (value) {
                          switch (value) {
                            case 'edit':
                              onEdit?.call();
                            case 'archive':
                              onArchive?.call();
                            case 'restore':
                              onRestore?.call();
                          }
                        },
                        itemBuilder: (context) => [
                          if (onEdit != null)
                            const PopupMenuItem(
                              value: 'edit',
                              child: Text('Edit'),
                            ),
                          if (medication.active && onArchive != null)
                            const PopupMenuItem(
                              value: 'archive',
                              child: Text('Archive'),
                            ),
                          if (!medication.active && onRestore != null)
                            const PopupMenuItem(
                              value: 'restore',
                              child: Text('Restore'),
                            ),
                        ],
                      )
                    else
                      Icon(
                        Icons.chevron_right,
                        size: 18,
                        color: Colors.white.withValues(alpha: 0.4),
                      ),
                  ],
                ),
              ),
            ),
            if (showQuickTaken)
              Padding(
                padding: const EdgeInsets.only(left: 20, right: 20, bottom: 12),
                child: FilledButton(
                  onPressed: () => onMarkTaken!(nextDose!),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text('Taken'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Right meta text mirroring web: strength, then out-of-stock / future
  /// start / next-today time / as-needed / raw schedule times.
  String _metaLabel() {
    final parts = <String>[];
    final strength = medication.strength;
    if (strength != null) parts.add(strength);
    if (medication.outOfStock) {
      parts.add('Count zero, refill to update');
    } else if (medication.startsInFuture) {
      parts.add('Starts ${_formatDateShort(medication.startDate!)}');
    } else if (medication.isRescueMed) {
      parts.add('As needed');
    } else if (nextDose != null && nextDose!.isPending) {
      parts.add('Next today ${_formatLocaleTime(nextDose!.scheduledAt)}');
    } else if (medication.timesOfDay.isNotEmpty) {
      parts.add(medication.timesOfDay.map(formatTimeOfDay).join(', '));
    }
    return parts.join(' · ');
  }

  String _formatDateShort(String dateStr) {
    final parsed = DateTime.tryParse('${dateStr}T12:00:00');
    if (parsed == null) return dateStr;
    return DateFormat.MMMd().format(parsed);
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
          color: color,
        ),
      ),
    );
  }
}

/// Filter chip row for medication kinds, web copy and pill styling.
class MedFilterChips extends StatelessWidget {
  const MedFilterChips({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final String selected;
  final ValueChanged<String> onChanged;

  static const filters = [
    ('all', 'All'),
    ('medication', 'Medications'),
    ('supplement', 'Supplements'),
    ('vitamin', 'Vitamins'),
    ('rescue', 'Rescue'),
  ];

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (value, label) in filters)
          _FilterChip(
            label: label,
            selected: selected == value,
            accent: purple,
            onTap: () => onChanged(value),
          ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.accent,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? accent : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: selected
                  ? const Color(0xFF0A0710)
                  : Colors.white.withValues(alpha: 0.65),
            ),
          ),
        ),
      ),
    );
  }
}
