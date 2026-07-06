import 'package:flutter/material.dart';

import '../../../design/tokens.dart';
import '../data_providers.dart';

/// Biomarker flag summary bar from latest report_metrics flags.
class DataSummaryBar extends StatelessWidget {
  const DataSummaryBar({super.key, required this.summary});

  final LabFlagSummary summary;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final success = parseTokenColor(colors.success);
    final info = parseTokenColor(colors.info);
    final danger = parseTokenColor(colors.destructive);
    final total = summary.total;
    final normalPct = total == 0 ? 0.0 : summary.normal / total;
    final outPct = total == 0 ? 0.0 : summary.outOfRange / total;
    final restPct = total == 0 ? 0.0 : 1 - normalPct - outPct;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Biomarkers · $total total',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 0.08,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: SizedBox(
              height: 8,
              child: Row(
                children: [
                  if (normalPct > 0)
                    Expanded(
                      flex: (normalPct * 1000).round().clamp(1, 1000),
                      child: ColoredBox(color: success),
                    ),
                  if (restPct > 0)
                    Expanded(
                      flex: (restPct * 1000).round().clamp(1, 1000),
                      child: ColoredBox(color: info),
                    ),
                  if (outPct > 0)
                    Expanded(
                      flex: (outPct * 1000).round().clamp(1, 1000),
                      child: ColoredBox(color: danger),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: [
              _LegendDot(color: success, label: '${summary.normal} in range'),
              _LegendDot(
                color: danger,
                label: '${summary.outOfRange} out of range',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.white.withValues(alpha: 0.55),
          ),
        ),
      ],
    );
  }
}
