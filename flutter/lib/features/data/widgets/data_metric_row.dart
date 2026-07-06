import 'package:flutter/material.dart';

import '../../../design/purple_type.dart';
import '../../../design/tokens.dart';

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
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final bg = parseTokenColor(colors.backgroundSecondary);
    final border = parseTokenColor(colors.divider);
    final badgeStyle = _badgeStyle(badge, colors);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: border),
            ),
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
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 0.06,
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: badgeStyle.background,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          fontSize: 10,
                          color: badgeStyle.foreground,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  valueLabel,
                  style: PurpleType.displayStyle(
                    fontSize: 26,
                    height: 1.05,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
                ),
                if (isLab &&
                    referenceLow != null &&
                    referenceHigh != null &&
                    value != null)
                  _RangeBar(
                    low: referenceLow!,
                    high: referenceHigh!,
                    value: value!,
                  ),
                if (spark.length >= 2) ...[
                  const SizedBox(height: 8),
                  _Sparkline(values: spark, isLab: isLab),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  ({Color background, Color foreground}) _badgeStyle(
    String flag,
    PurpleColorTokens colors,
  ) {
    final lower = flag.toLowerCase();
    if (lower == 'high' || lower == 'low' || lower == 'abnormal') {
      return (
        background: parseTokenColor(colors.destructive).withValues(alpha: 0.15),
        foreground: parseTokenColor(colors.destructive),
      );
    }
    if (lower == 'normal') {
      return (
        background: parseTokenColor(colors.success).withValues(alpha: 0.18),
        foreground: parseTokenColor(colors.success),
      );
    }
    return (
      background: parseTokenColor(colors.backgroundTertiary),
      foreground: Colors.white.withValues(alpha: 0.55),
    );
  }
}

class _RangeBar extends StatelessWidget {
  const _RangeBar({
    required this.low,
    required this.high,
    required this.value,
  });

  final double low;
  final double high;
  final double value;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
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
                      color: Colors.white.withValues(alpha: 0.08),
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
                        color: parseTokenColor(colors.success)
                            .withValues(alpha: 0.35),
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
                        color: parseTokenColor(colors.purplePrimary),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF0A0710),
                          width: 2,
                        ),
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
              style: TextStyle(
                fontSize: 10,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
            Text(
              'optimal',
              style: TextStyle(
                fontSize: 10,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
            Text(
              high.toString(),
              style: TextStyle(
                fontSize: 10,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Sparkline extends StatelessWidget {
  const _Sparkline({required this.values, required this.isLab});

  final List<double> values;
  final bool isLab;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
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
                      color: purple.withValues(alpha: 0.65),
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
