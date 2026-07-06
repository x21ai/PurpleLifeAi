import 'package:flutter/material.dart';

import '../data_providers.dart';
import '../data_style.dart';

/// Biomarker flag summary bar from latest report_metrics flags.
class DataSummaryBar extends StatelessWidget {
  const DataSummaryBar({super.key, required this.summary});

  final LabFlagSummary summary;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    final total = summary.total;
    final normalPct = total == 0 ? 0.0 : summary.normal / total;
    final outPct = total == 0 ? 0.0 : summary.outOfRange / total;
    final restPct = total == 0 ? 0.0 : 1 - normalPct - outPct;

    return DataCardShell(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Biomarkers · $total total',
            style: dataEyebrow(palette: p),
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
                      child: ColoredBox(color: p.success),
                    ),
                  if (restPct > 0)
                    Expanded(
                      flex: (restPct * 1000).round().clamp(1, 1000),
                      child: ColoredBox(color: p.info),
                    ),
                  if (outPct > 0)
                    Expanded(
                      flex: (outPct * 1000).round().clamp(1, 1000),
                      child: ColoredBox(color: p.destructive),
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
              _LegendDot(
                color: p.success,
                label: '${summary.normal} in range',
              ),
              _LegendDot(
                color: p.destructive,
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
    final p = DataPalette.dark();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: dataSans(fontSize: 11, color: p.textTertiary)),
      ],
    );
  }
}
