import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../design/tokens.dart';
import '../models/report_row.dart';

/// Out-of-range (high) lab value color, from dark design tokens.
Color get _dangerColor =>
    parseTokenColor(PurpleTokens.loaded.colorsFor('dark').danger);

/// Below-range (low) lab value color, from dark design tokens.
Color get _warningColor =>
    parseTokenColor(PurpleTokens.loaded.colorsFor('dark').warning);

/// Numeric readings from a metric series, oldest-first, dropping any row
/// without a parseable value or timestamp.
List<_Point> _points(List<ReportMetricRow> rows) {
  final points = <_Point>[];
  for (final row in rows) {
    final v = row.value;
    if (v == null) continue;
    final at = row.measuredAt;
    final t = (at != null && at.isNotEmpty) ? DateTime.tryParse(at) : null;
    points.add(_Point(t?.millisecondsSinceEpoch.toDouble() ?? points.length.toDouble(), v));
  }
  return points;
}

class _Point {
  const _Point(this.x, this.y);
  final double x;
  final double y;
}

/// Full line chart with an optional shaded reference band (low–high), used on
/// the metric trend detail screen. Mirrors the web trends chart.
class MetricLineChart extends StatelessWidget {
  const MetricLineChart({
    super.key,
    required this.rows,
    this.referenceLow,
    this.referenceHigh,
    this.height = 200,
  });

  final List<ReportMetricRow> rows;
  final double? referenceLow;
  final double? referenceHigh;
  final double height;

  @override
  Widget build(BuildContext context) {
    final points = _points(rows);
    if (points.length < 2) return const SizedBox.shrink();

    var minY = points.first.y;
    var maxY = points.first.y;
    for (final p in points) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    if (referenceLow != null && referenceLow! < minY) minY = referenceLow!;
    if (referenceHigh != null && referenceHigh! > maxY) maxY = referenceHigh!;
    final pad = (maxY - minY).abs() < 0.001 ? (maxY.abs() * 0.1 + 1) : (maxY - minY) * 0.15;
    final chartMin = minY - pad;
    final chartMax = maxY + pad;

    final line = Colors.white.withValues(alpha: 0.85);

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          minY: chartMin,
          maxY: chartMax,
          minX: points.first.x,
          maxX: points.last.x,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: (chartMax - chartMin) / 4,
            getDrawingHorizontalLine: (_) => FlLine(
              color: Colors.white.withValues(alpha: 0.06),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 40,
                getTitlesWidget: (value, meta) {
                  if (value == meta.min || value == meta.max) {
                    return const SizedBox.shrink();
                  }
                  return Text(
                    _fmt(value),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 10,
                    ),
                  );
                },
              ),
            ),
            rightTitles: const AxisTitles(),
            topTitles: const AxisTitles(),
            bottomTitles: const AxisTitles(),
          ),
          borderData: FlBorderData(show: false),
          // Reference band drawn as a shaded region between low and high.
          rangeAnnotations: RangeAnnotations(
            horizontalRangeAnnotations: [
              if (referenceLow != null && referenceHigh != null)
                HorizontalRangeAnnotation(
                  y1: referenceLow!,
                  y2: referenceHigh!,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
            ],
          ),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => const Color(0xFF2A2340),
              getTooltipItems: (spots) => spots
                  .map(
                    (s) => LineTooltipItem(
                      _fmt(s.y),
                      TextStyle(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontSize: 12,
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: [for (final p in points) FlSpot(p.x, p.y)],
              isCurved: true,
              curveSmoothness: 0.2,
              color: line,
              barWidth: 2,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, _, __, ___) {
                  final outOfRange = (referenceLow != null && spot.y < referenceLow!) ||
                      (referenceHigh != null && spot.y > referenceHigh!);
                  return FlDotCirclePainter(
                    radius: 3,
                    color: outOfRange
                        ? (referenceHigh != null && spot.y > referenceHigh!
                            ? _dangerColor
                            : _warningColor)
                        : line,
                    strokeWidth: 0,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                color: Colors.white.withValues(alpha: 0.04),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact inline sparkline for per-metric rows (metrics grid / detail).
class MetricSparkline extends StatelessWidget {
  const MetricSparkline({
    super.key,
    required this.rows,
    this.width = 64,
    this.height = 24,
  });

  final List<ReportMetricRow> rows;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final points = _points(rows);
    if (points.length < 2) return SizedBox(width: width, height: height);

    var minY = points.first.y;
    var maxY = points.first.y;
    for (final p in points) {
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    return SizedBox(
      width: width,
      height: height,
      child: LineChart(
        LineChartData(
          minY: minY,
          maxY: maxY,
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineTouchData: const LineTouchData(enabled: false),
          lineBarsData: [
            LineChartBarData(
              spots: [for (final p in points) FlSpot(p.x, p.y)],
              isCurved: true,
              curveSmoothness: 0.2,
              color: Colors.white.withValues(alpha: 0.7),
              barWidth: 1.5,
              dotData: const FlDotData(show: false),
            ),
          ],
        ),
      ),
    );
  }
}

String _fmt(double v) {
  if (v == v.roundToDouble()) return v.toStringAsFixed(0);
  if (v.abs() >= 100) return v.toStringAsFixed(0);
  return v.toStringAsFixed(1);
}
