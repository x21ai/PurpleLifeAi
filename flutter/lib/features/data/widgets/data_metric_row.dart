import 'package:flutter/material.dart';

import '../data_style.dart';

/// Metric list row for the Data tab (labs + wearables).
class DataMetricRow extends StatelessWidget {
  const DataMetricRow({
    super.key,
    required this.label,
    required this.valueLabel,
    required this.badge,
    required this.isLab,
    required this.onTap,
    this.referenceLow,
    this.referenceHigh,
    this.value,
    this.spark = const [],
  });

  final String label;
  final String valueLabel;
  final String badge;
  final bool isLab;
  final VoidCallback onTap;
  final double? referenceLow;
  final double? referenceHigh;
  final double? value;
  final List<double> spark;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    final badgeStyle = _badgeStyle(badge, p);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DataCardShell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: dataSans(
                      fontSize: 10,
                      letterSpacing: 0.6,
                      color: p.textTertiary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeStyle.background,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    badge,
                    style: dataSans(fontSize: 10, color: badgeStyle.foreground),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              valueLabel,
              style: dataSerif(fontSize: 26, height: 1.05, color: p.textPrimary),
            ),
            if (isLab &&
                referenceLow != null &&
                referenceHigh != null &&
                value != null)
              _RangeBar(
                low: referenceLow!,
                high: referenceHigh!,
                value: value!,
                palette: p,
              ),
            if (spark.length >= 2) ...[
              const SizedBox(height: 8),
              _Sparkline(values: spark, palette: p),
            ],
          ],
        ),
      ),
    );
  }

  ({Color background, Color foreground}) _badgeStyle(String flag, DataPalette p) {
    final lower = flag.toLowerCase();
    if (lower == 'high' || lower == 'low' || lower == 'abnormal') {
      return (
        background: p.destructive.withValues(alpha: 0.15),
        foreground: p.destructive,
      );
    }
    if (lower == 'normal') {
      return (
        background: p.success.withValues(alpha: 0.18),
        foreground: p.success,
      );
    }
    return (
      background: p.surfaceSecondary,
      foreground: p.textTertiary,
    );
  }
}

class _RangeBar extends StatelessWidget {
  const _RangeBar({
    required this.low,
    required this.high,
    required this.value,
    required this.palette,
  });

  final double low;
  final double high;
  final double value;
  final DataPalette palette;

  @override
  Widget build(BuildContext context) {
    final span = (high - low).abs().clamp(1.0, double.infinity);
    final pct = ((value - low) / span).clamp(0.0, 1.0);
    const bandLeft = 0.2;
    const bandWidth = 0.6;

    return Column(
      children: [
        const SizedBox(height: 8),
        LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            final dotLeft = width * (bandLeft + bandWidth * pct);
            return SizedBox(
              height: 10,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.centerLeft,
                children: [
                  Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: palette.surfaceSecondary,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  Positioned(
                    left: width * bandLeft,
                    width: width * bandWidth,
                    top: 0,
                    bottom: 0,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: palette.success.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  Positioned(
                    left: dotLeft - 5,
                    top: -2,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: palette.purplePrimary,
                        shape: BoxShape.circle,
                        border: Border.all(color: palette.canvas, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              low.toString(),
              style: dataSans(fontSize: 10, color: palette.textTertiary),
            ),
            Text(
              'optimal',
              style: dataSans(fontSize: 10, color: palette.textTertiary),
            ),
            Text(
              high.toString(),
              style: dataSans(fontSize: 10, color: palette.textTertiary),
            ),
          ],
        ),
      ],
    );
  }
}

class _Sparkline extends StatelessWidget {
  const _Sparkline({required this.values, required this.palette});

  final List<double> values;
  final DataPalette palette;

  @override
  Widget build(BuildContext context) {
    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);
    final span = (max - min).abs().clamp(1.0, double.infinity);

    return SizedBox(
      height: 32,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final v in values)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1.5),
                child: FractionallySizedBox(
                  heightFactor: ((v - min) / span).clamp(0.08, 1.0),
                  alignment: Alignment.bottomCenter,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: palette.purplePrimary.withValues(alpha: 0.65),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(2),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
