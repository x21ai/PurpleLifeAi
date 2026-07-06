import 'package:flutter/material.dart';

import '../meds/meds_style.dart';

export '../meds/meds_style.dart'
    show
        MedsGroupedListShell,
        MedsPageHeader,
        MedsPalette,
        MedsSectionEyebrow,
        medsEyebrow,
        medsListDivider,
        medsSans,
        medsSerif;

/// Dark merged-route palette (Today-adjacent canvas screens).
MergedPalette mergedPalette() => MedsPalette.dark();

typedef MergedPalette = MedsPalette;

/// Back link row matching merged preview routes (Vitals, Today, etc.).
class MergedBackLink extends StatelessWidget {
  const MergedBackLink({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return TextButton.icon(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      icon: Icon(Icons.arrow_back, size: 16, color: p.textTertiary),
      label: Text(label, style: medsSans(fontSize: 14, color: p.textTertiary)),
    );
  }
}

/// Uppercase timeline / section label.
class MergedSectionLabel extends StatelessWidget {
  const MergedSectionLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(), style: medsEyebrow(palette: mergedPalette()));
  }
}
