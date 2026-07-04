import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../shared/glass_helpers.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Today's dose schedule panel with action buttons.
class TodayDosePanel extends StatelessWidget {
  const TodayDosePanel({
    super.key,
    required this.doses,
    required this.onTaken,
    required this.onSkip,
    required this.onSnooze,
    this.onMarkAllTaken,
    this.markingAll = false,
  });

  final List<MedicationDose> doses;
  final ValueChanged<MedicationDose> onTaken;
  final ValueChanged<MedicationDose> onSkip;
  final ValueChanged<MedicationDose> onSnooze;
  final VoidCallback? onMarkAllTaken;
  final bool markingAll;

  @override
  Widget build(BuildContext context) {
    if (doses.isEmpty) return const SizedBox.shrink();

    final pending = doses.where((d) => d.isPending).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'TODAY\'S DOSES',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ),
            if (pending.isNotEmpty && onMarkAllTaken != null)
              TextButton(
                onPressed: markingAll ? null : onMarkAllTaken,
                child: markingAll
                    ? SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      )
                    : const Text('Mark all taken'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        ...doses.map(
          (dose) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: DoseRow(
              dose: dose,
              onTaken: () => onTaken(dose),
              onSkip: () => onSkip(dose),
              onSnooze: () => onSnooze(dose),
            ),
          ),
        ),
      ],
    );
  }
}

/// Single dose row with status and quick actions.
class DoseRow extends StatelessWidget {
  const DoseRow({
    super.key,
    required this.dose,
    required this.onTaken,
    required this.onSkip,
    required this.onSnooze,
  });

  final MedicationDose dose;
  final VoidCallback onTaken;
  final VoidCallback onSkip;
  final VoidCallback onSnooze;

  @override
  Widget build(BuildContext context) {
    final med = dose.medication;
    final timeLabel = DateFormat.jm().format(dose.scheduledAt.toLocal());
    final statusLabel = _statusLabel(dose.status);

    return GlassCard(
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
                    Text(
                      med?.name ?? 'Medication',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    if (med?.strength != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        med!.strength!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    timeLabel,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Colors.white.withValues(alpha: 0.75),
                        ),
                  ),
                  Text(
                    statusLabel,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: _statusColor(dose.status),
                        ),
                  ),
                ],
              ),
            ],
          ),
          if (dose.isPending) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _ActionChip(label: 'Taken', onTap: onTaken, primary: true),
                _ActionChip(label: 'Snooze', onTap: onSnooze),
                _ActionChip(label: 'Skip', onTap: onSkip),
              ],
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
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'taken':
        return Colors.greenAccent.withValues(alpha: 0.85);
      case 'skipped':
        return Colors.orangeAccent.withValues(alpha: 0.75);
      case 'pending':
        return Colors.white.withValues(alpha: 0.55);
      default:
        return Colors.white.withValues(alpha: 0.55);
    }
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.onTap,
    this.primary = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    if (primary) {
      return FilledButton(
        onPressed: onTap,
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 36),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shape: const StadiumBorder(),
        ),
        child: Text(label),
      );
    }
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 36),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        foregroundColor: Colors.white.withValues(alpha: 0.75),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.18)),
        shape: const StadiumBorder(),
      ),
      child: Text(label),
    );
  }
}

/// Medication library card for active/archived list.
class MedLibraryCard extends StatelessWidget {
  const MedLibraryCard({
    super.key,
    required this.medication,
    this.onTap,
  });

  final Medication medication;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final times = medication.timesOfDay;
    final schedule = times.isEmpty
        ? 'As needed'
        : times.map(_formatTime).join(', ');

    return GlassCard(
      onTap: onTap,
      child: Row(
        children: [
          Icon(
            medication.isRescueMed ? Icons.flash_on : Icons.medication_outlined,
            color: medication.isRescueMed
                ? Colors.orangeAccent.withValues(alpha: 0.9)
                : Colors.white.withValues(alpha: 0.65),
            size: 22,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medication.name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (medication.strength != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    medication.strength!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  schedule,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
            ),
          ),
          if (medication.pillsRemaining != null)
            Text(
              '${medication.pillsRemaining!.round()} left',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
            ),
          if (onTap != null) ...[
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              color: Colors.white.withValues(alpha: 0.35),
              size: 20,
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(String t) {
    final parts = t.split(':');
    if (parts.length < 2) return t;
    final h = int.tryParse(parts[0]) ?? 0;
    final m = int.tryParse(parts[1]) ?? 0;
    final am = h < 12;
    final h12 = ((h + 11) % 12) + 1;
    return '$h12:${m.toString().padLeft(2, '0')} ${am ? 'AM' : 'PM'}';
  }
}

/// Filter chip row for medication kinds.
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
    ('medication', 'Meds'),
    ('supplement', 'Supplements'),
    ('vitamin', 'Vitamins'),
    ('rescue', 'Rescue'),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (value, label) in filters)
          FilterChip(
            label: Text(label),
            selected: selected == value,
            onSelected: (_) => onChanged(value),
            showCheckmark: false,
            visualDensity: VisualDensity.compact,
            backgroundColor: Colors.white.withValues(alpha: 0.06),
            selectedColor: Colors.white.withValues(alpha: 0.14),
            labelStyle: TextStyle(
              color: Colors.white.withValues(
                alpha: selected == value ? 0.95 : 0.65,
              ),
            ),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
      ],
    );
  }
}
