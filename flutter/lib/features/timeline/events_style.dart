import 'package:flutter/material.dart';

import '../shared/merged_style.dart';

/// Timeline (events) route header matching merged preview `/timeline`.
class EventsPageHeader extends StatelessWidget {
  const EventsPageHeader({super.key, this.onExport});

  final VoidCallback? onExport;

  @override
  Widget build(BuildContext context) {
    final p = mergedPalette();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const MergedSectionLabel('Timeline'),
              const SizedBox(height: 12),
              Text(
                'Everything,\nin order.',
                style: medsSerif(
                  fontSize: 40,
                  height: 1.05,
                  letterSpacing: -0.8,
                  color: p.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (onExport != null)
          OutlinedButton.icon(
            onPressed: onExport,
            icon: const Icon(Icons.download_outlined, size: 18),
            label: const Text('Export'),
            style: OutlinedButton.styleFrom(
              foregroundColor: p.textPrimary.withValues(alpha: 0.85),
              side: BorderSide(color: p.divider),
            ),
          ),
      ],
    );
  }
}

TextStyle eventsIntroBody() {
  final p = mergedPalette();
  return medsSerif(
    fontSize: 17,
    height: 1.5,
    color: p.textPrimary.withValues(alpha: 0.75),
  );
}

TextStyle eventsMuted({double fontSize = 13}) {
  return medsSans(fontSize: fontSize, color: mergedPalette().textTertiary);
}
