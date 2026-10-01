import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../design/tokens.dart';
import 'med_intelligence.dart';
import 'meds_style.dart';
import 'models/dose.dart';
import 'models/medication.dart';

/// Refill forecast and adherence extras for `/meds`.
///
/// Hidden when there is nothing to say, matching web `RefillForecastCard` and
/// `AdherenceExtrasCard`.
class MedIntelligenceCards extends StatelessWidget {
  const MedIntelligenceCards({
    super.key,
    required this.medications,
    required this.recentDoses,
    required this.onOpenMed,
  });

  final List<Medication> medications;
  final List<MedicationDose> recentDoses;
  final ValueChanged<Medication> onOpenMed;

  @override
  Widget build(BuildContext context) {
    final intel = computeMedIntelligence(
      medications: medications,
      recentDoses: recentDoses,
    );
    final soon = intel.soonRefills;
    if (soon.isEmpty && !intel.showExtras) return const SizedBox.shrink();

    final palette = MedsPalette.dark();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (soon.isNotEmpty)
          _RefillForecastCard(
            worst: soon.first,
            extraCount: soon.length - 1,
            palette: palette,
            onOpen: () {
              final match = medications.where((m) => m.id == soon.first.medId);
              if (match.isNotEmpty) onOpenMed(match.first);
            },
          ),
        if (intel.showExtras) ...[
          if (soon.isNotEmpty) const SizedBox(height: 12),
          _AdherenceExtras(
            streakDays: intel.streakDays,
            pattern: intel.missedPattern,
            palette: palette,
          ),
        ],
      ],
    );
  }
}

class _RefillForecastCard extends StatelessWidget {
  const _RefillForecastCard({
    required this.worst,
    required this.extraCount,
    required this.palette,
    required this.onOpen,
  });

  final RefillProjection worst;
  final int extraCount;
  final MedsPalette palette;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final danger = parseTokenColor(colors.danger);
    final warning = parseTokenColor(colors.warning);
    final urgent = worst.daysLeft <= 3;
    final soon = worst.daysLeft <= 7;
    final tone = urgent ? danger : (soon ? warning : palette.textPrimary);
    final fill = urgent
        ? danger.withValues(alpha: 0.12)
        : soon
            ? warning.withValues(alpha: 0.12)
            : palette.surfaceSecondary;
    final border = urgent
        ? danger.withValues(alpha: 0.45)
        : soon
            ? warning.withValues(alpha: 0.45)
            : palette.divider;
    final dayLabel = worst.daysLeft == 1 ? 'day' : 'days';
    final when = DateFormat('EEE, MMM d').format(worst.runoutDate);
    final extras = extraCount > 0
        ? ' · +$extraCount other ${extraCount == 1 ? 'med' : 'meds'} due soon'
        : '';

    return Container(
      key: const Key('meds-refill-forecast'),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, size: 18, color: tone),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('REFILL AHEAD', style: medsEyebrow(color: tone)),
                const SizedBox(height: 6),
                Text(
                  '${worst.name} runs out in ${worst.daysLeft} $dayLabel',
                  style: medsSerif(fontSize: 18, color: palette.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  'around $when',
                  style: medsSans(fontSize: 13, color: palette.textSecondary),
                ),
                const SizedBox(height: 6),
                Text(
                  '${worst.pillsRemaining} left · ${worst.dosesPerDay}/day$extras',
                  style: medsSans(fontSize: 12, color: palette.textTertiary),
                ),
                TextButton(
                  onPressed: onOpen,
                  style: TextButton.styleFrom(
                    foregroundColor: palette.purplePrimary,
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(44, 44),
                    alignment: Alignment.centerLeft,
                  ),
                  child: const Text('Update count or schedule refill'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AdherenceExtras extends StatelessWidget {
  const _AdherenceExtras({
    required this.streakDays,
    required this.pattern,
    required this.palette,
  });

  final int streakDays;
  final MissedDosePattern? pattern;
  final MedsPalette palette;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 520;
        final cards = <Widget>[
          if (streakDays > 0)
            _ExtraCard(
              key: const Key('meds-on-time-streak'),
              icon: Icons.local_fire_department_outlined,
              eyebrow: 'ON-TIME STREAK',
              title: '$streakDays day${streakDays == 1 ? '' : 's'}',
              body: 'Every scheduled dose taken, day by day.',
              palette: palette,
            ),
          if (pattern != null)
            _ExtraCard(
              key: const Key('meds-missed-pattern'),
              icon: Icons.schedule,
              eyebrow: 'NOTICED PATTERN',
              title:
                  'Your ${medTimeBucketLabel(pattern!.bucket)} doses are missed more often (${pattern!.pct}% in the last 30 days).',
              body: 'Consider an extra reminder around that window.',
              palette: palette,
              titleIsBody: true,
            ),
        ];
        if (cards.isEmpty) return const SizedBox.shrink();
        if (!wide || cards.length == 1) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < cards.length; i++) ...[
                if (i > 0) const SizedBox(height: 12),
                cards[i],
              ],
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: cards[0]),
            const SizedBox(width: 12),
            Expanded(child: cards[1]),
          ],
        );
      },
    );
  }
}

class _ExtraCard extends StatelessWidget {
  const _ExtraCard({
    super.key,
    required this.icon,
    required this.eyebrow,
    required this.title,
    required this.body,
    required this.palette,
    this.titleIsBody = false,
  });

  final IconData icon;
  final String eyebrow;
  final String title;
  final String body;
  final MedsPalette palette;
  final bool titleIsBody;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: palette.surfaceSecondary,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: palette.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: palette.textPrimary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(eyebrow, style: medsEyebrow(palette: palette)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: titleIsBody
                ? medsSans(fontSize: 14, color: palette.textPrimary)
                : medsSerif(fontSize: 24, color: palette.textPrimary),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: medsSans(fontSize: 12, color: palette.textTertiary),
          ),
        ],
      ),
    );
  }
}
