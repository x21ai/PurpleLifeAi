import 'package:flutter/material.dart';

import '../shared/merged_style.dart';

/// Reuses dark merged palette; hydration-specific header helper.
class HydrationPageHeader extends StatelessWidget {
  const HydrationPageHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const MergedSectionLabel('Intake'),
        const SizedBox(height: 12),
        Text(
          'Water, electrolytes,\nand déjà vu.',
          style: medsSerif(
            fontSize: 44,
            letterSpacing: -0.88,
            color: p.textPrimary,
          ),
        ),
      ],
    );
  }
}

TextStyle hydrationSans({
  double fontSize = 14,
  Color? color,
  FontWeight fontWeight = FontWeight.w400,
  double? height,
}) {
  return medsSans(
    fontSize: fontSize,
    height: height ?? 1.45,
    color: color ?? mergedPalette().textTertiary,
    fontWeight: fontWeight,
  );
}

Color hydrationMuted() => mergedPalette().textTertiary;

Color hydrationBody() => mergedPalette().textPrimary.withValues(alpha: 0.9);

Color hydrationDivider() => mergedPalette().divider;
