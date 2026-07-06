import 'package:flutter/material.dart';

import '../shared/merged_style.dart';

/// Seizure log header matching merged dark routes.
class SeizurePageHeader extends StatelessWidget {
  const SeizurePageHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const MergedSectionLabel('Log event'),
        const SizedBox(height: 12),
        Text(
          'Log a seizure',
          style: medsSerif(
            fontSize: 44,
            letterSpacing: -0.5,
            color: p.textPrimary,
          ),
        ),
      ],
    );
  }
}

TextStyle seizureSectionLabel() => medsEyebrow(palette: mergedPalette());

TextStyle seizureCardTitle() {
  return medsSerif(
    fontSize: 22,
    color: mergedPalette().textPrimary,
  );
}

TextStyle seizureMuted() => medsSans(color: mergedPalette().textTertiary);
