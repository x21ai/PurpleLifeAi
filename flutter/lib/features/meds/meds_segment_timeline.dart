import 'package:flutter/material.dart';

import '../../design/tokens.dart';
import 'models/dose.dart';

/// Equal segments for today's doses, matching the merged preview
/// `.meds-timeline` bar. Each segment follows that dose's status.
class MedsSegmentTimeline extends StatelessWidget {
  const MedsSegmentTimeline({super.key, required this.doses});

  final List<MedicationDose> doses;

  @override
  Widget build(BuildContext context) {
    if (doses.isEmpty) return const SizedBox.shrink();
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final danger = parseTokenColor(colors.danger);
    final muted = Colors.white.withValues(alpha: 0.18);
    final skipped = Colors.white.withValues(alpha: 0.32);
    final taken = doses.where((dose) => dose.status == 'taken').length;

    Color colorFor(MedicationDose dose) {
      return switch (dose.status) {
        'taken' => purple,
        'missed' => danger,
        'skipped' => skipped,
        _ => muted,
      };
    }

    return Semantics(
      key: const Key('meds-mini-timeline'),
      label: 'Dose timeline, $taken of ${doses.length} taken',
      child: Row(
        children: [
          for (var i = 0; i < doses.length; i++) ...[
            if (i > 0) const SizedBox(width: 4),
            Expanded(
              child: Container(
                height: 4,
                decoration: BoxDecoration(
                  color: colorFor(doses[i]),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
