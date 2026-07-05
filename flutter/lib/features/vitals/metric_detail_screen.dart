import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/metric_constants.dart';
import '../today/models/score_snapshot.dart';
import 'vitals_repository.dart';

/// Metadata for drilldown routes (`/biometrics/:metricKey` and `/vitals/metric/:metricKey`).
class MetricMeta {
  const MetricMeta({
    required this.key,
    required this.label,
    this.unit,
  });

  final String key;
  final String label;
  final String? unit;
}

/// Valid metric keys mirroring web `METRIC_ORDER` subset surfaced on Vitals.
const metricCatalog = <String, MetricMeta>{
  'readiness': MetricMeta(
    key: 'readiness',
    label: MetricLabels.readinessScore,
  ),
  'sleep_score': MetricMeta(
    key: 'sleep_score',
    label: MetricLabels.sleepScore,
  ),
  'activity_score': MetricMeta(
    key: 'activity_score',
    label: MetricLabels.activityScore,
  ),
  'stress': MetricMeta(
    key: 'stress',
    label: MetricLabels.daytimeStress,
  ),
  'hrv': MetricMeta(
    key: 'hrv',
    label: MetricLabels.hrv,
    unit: MetricUnits.ms,
  ),
  'resting_hr': MetricMeta(
    key: 'resting_hr',
    label: MetricLabels.restingHeartRate,
    unit: MetricUnits.bpm,
  ),
  'spo2': MetricMeta(
    key: 'spo2',
    label: MetricLabels.spo2,
    unit: MetricUnits.percent,
  ),
  'steps': MetricMeta(
    key: 'steps',
    label: MetricLabels.steps,
  ),
};

MetricMeta? metricMetaForKey(String key) => metricCatalog[key];

/// Metric drilldown with range selector and trend chart.
class MetricDetailScreen extends ConsumerStatefulWidget {
  const MetricDetailScreen({super.key, required this.metricKey});

  final String metricKey;

  @override
  ConsumerState<MetricDetailScreen> createState() => _MetricDetailScreenState();
}

class _MetricDetailScreenState extends ConsumerState<MetricDetailScreen> {
  int _rangeDays = 30;

  static const _ranges = <int, String>{7: '7d', 30: '30d', 90: '90d'};

  @override
  Widget build(BuildContext context) {
    final meta = metricMetaForKey(widget.metricKey);
    if (meta == null) {
      return _MetricNotFound(onBack: () => context.go(AppRoutes.biometrics));
    }

    final snapshotAsync = ref.watch(vitalsSnapshotProvider);
    final query = MetricTrendQuery(
      metricKey: widget.metricKey,
      days: _rangeDays,
    );
    final trendAsync = ref.watch(metricTrendProvider(query));
    final muted = Colors.white.withValues(alpha: 0.55);

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.biometrics),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: Icon(Icons.arrow_back, size: 16, color: muted),
                label: Text(
                  'Biometrics',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: muted,
                      ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                meta.label.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                meta.label,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      fontSize: 44,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 20),
              _RangeSelector(
                ranges: _ranges,
                selected: _rangeDays,
                onSelected: (days) => setState(() => _rangeDays = days),
              ),
              const SizedBox(height: 24),
              snapshotAsync.when(
                loading: () => const GlassSurface(
                  padding: EdgeInsets.all(24),
                  child: Text('Loading latest reading…'),
                ),
                error: (_, __) => GlassSurface(
                  borderRadius: 24,
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load this metric right now. Pull to refresh and try again.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.7),
                          height: 1.45,
                        ),
                  ),
                ),
                data: (snap) {
                  final value = _valueForMetric(snap, meta.key);
                  final display = _formatValue(value);
                  return GlassSurface(
                    borderRadius: 24,
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Latest reading',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                        ),
                        const SizedBox(height: 8),
                        Text.rich(
                          TextSpan(
                            text: display,
                            style: Theme.of(context)
                                .textTheme
                                .displaySmall
                                ?.copyWith(
                                  fontFamily: PurpleType.serif,
                                  fontSize: 56,
                                  height: 1,
                                  color: Colors.white.withValues(alpha: 0.95),
                                ),
                            children: meta.unit == null
                                ? null
                                : [
                                    TextSpan(
                                      text: ' ${meta.unit}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(
                                            color: Colors.white
                                                .withValues(alpha: 0.55),
                                          ),
                                    ),
                                  ],
                          ),
                        ),
                        if (snap.isFromCache) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Showing cached data (offline)',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.45),
                                ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        trendAsync.when(
                          loading: () => const SizedBox(
                            height: 160,
                            child: Center(child: Text('Loading trend…')),
                          ),
                          error: (_, __) => const SizedBox.shrink(),
                          data: (result) {
                            final stats = result.stats;
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _StatsRow(stats: stats, unit: meta.unit),
                                const SizedBox(height: 20),
                                Text(
                                  '${_ranges[_rangeDays]!.toUpperCase()} TREND',
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelSmall
                                      ?.copyWith(
                                        letterSpacing: 1.2,
                                        color:
                                            Colors.white.withValues(alpha: 0.45),
                                      ),
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  height: 160,
                                  width: double.infinity,
                                  child: result.points
                                          .map((p) => p.value)
                                          .whereType<double>()
                                          .length <
                                      2
                                      ? Text(
                                          'Not enough history yet for a ${_ranges[_rangeDays]} trend.',
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodyMedium
                                              ?.copyWith(
                                                color: Colors.white
                                                    .withValues(alpha: 0.7),
                                                height: 1.45,
                                              ),
                                        )
                                      : _MetricTrendChart(
                                          points: result.points,
                                          rangeDays: _rangeDays,
                                        ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatValue(double? value) {
    if (value == null) return '–';
    if (value == value.roundToDouble()) return value.round().toString();
    return value.toStringAsFixed(1);
  }

  double? _valueForMetric(ScoreSnapshot snap, String key) {
    return switch (key) {
      'readiness' => snap.readiness,
      'sleep_score' => snap.sleepScore,
      'activity_score' => snap.activity,
      'stress' => snap.stress,
      'hrv' => snap.hrvMs,
      'resting_hr' => snap.restingHr,
      'spo2' => snap.spo2,
      'steps' => snap.steps,
      _ => null,
    };
  }
}

class _RangeSelector extends StatelessWidget {
  const _RangeSelector({
    required this.ranges,
    required this.selected,
    required this.onSelected,
  });

  final Map<int, String> ranges;
  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Row(
      children: [
        for (final entry in ranges.entries) ...[
          if (entry.key != ranges.keys.first) const SizedBox(width: 8),
          Material(
            color: selected == entry.key
                ? purple.withValues(alpha: 0.2)
                : Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(999),
            child: InkWell(
              onTap: () => onSelected(entry.key),
              borderRadius: BorderRadius.circular(999),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  entry.value,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: selected == entry.key
                            ? Colors.white.withValues(alpha: 0.95)
                            : Colors.white.withValues(alpha: 0.55),
                        fontWeight: selected == entry.key
                            ? FontWeight.w600
                            : FontWeight.w500,
                      ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.stats, this.unit});

  final MetricTrendStats stats;
  final String? unit;

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.labelSmall?.copyWith(
          color: Colors.white.withValues(alpha: 0.45),
        );
    final valueStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
          color: Colors.white.withValues(alpha: 0.92),
          fontWeight: FontWeight.w600,
        );

    String fmt(double? v) {
      if (v == null) return '–';
      final rounded = v == v.roundToDouble()
          ? v.round().toString()
          : v.toStringAsFixed(1);
      return unit == null ? rounded : '$rounded $unit';
    }

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Average', style: labelStyle),
              const SizedBox(height: 4),
              Text(fmt(stats.mean), style: valueStyle),
            ],
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Days with data', style: labelStyle),
              const SizedBox(height: 4),
              Text('${stats.dayCount}', style: valueStyle),
            ],
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Readings', style: labelStyle),
              const SizedBox(height: 4),
              Text('${stats.count}', style: valueStyle),
            ],
          ),
        ),
      ],
    );
  }
}

class _MetricTrendChart extends StatelessWidget {
  const _MetricTrendChart({
    required this.points,
    required this.rangeDays,
  });

  final List<MetricDayPoint> points;
  final int rangeDays;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _TrendPainter(points: points, rangeDays: rangeDays),
      child: const SizedBox.expand(),
    );
  }
}

class _TrendPainter extends CustomPainter {
  _TrendPainter({required this.points, required this.rangeDays});

  final List<MetricDayPoint> points;
  final int rangeDays;

  @override
  void paint(Canvas canvas, Size size) {
    final values = points.map((p) => p.value).whereType<double>().toList();
    if (values.length < 2) return;

    final min = values.reduce((a, b) => a < b ? a : b);
    final max = values.reduce((a, b) => a > b ? a : b);
    final range = (max - min).abs() < 0.001 ? 1.0 : (max - min);

    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final dotPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.9)
      ..style = PaintingStyle.fill;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withValues(alpha: 0.22),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final fill = Path();
    var started = false;
    final coords = <Offset>[];

    for (var i = 0; i < points.length; i++) {
      final value = points[i].value;
      if (value == null) continue;
      final x = points.length == 1
          ? size.width / 2
          : i / (points.length - 1) * size.width;
      final y = size.height - ((value - min) / range) * (size.height - 12) - 6;
      final offset = Offset(x, y);
      coords.add(offset);
      if (!started) {
        path.moveTo(x, y);
        fill.moveTo(x, size.height);
        fill.lineTo(x, y);
        started = true;
      } else {
        path.lineTo(x, y);
        fill.lineTo(x, y);
      }
    }

    if (!started) return;
    fill.lineTo(coords.last.dx, size.height);
    fill.close();
    canvas.drawPath(fill, fillPaint);
    canvas.drawPath(path, linePaint);

    if (rangeDays <= 30) {
      for (final c in coords) {
        canvas.drawCircle(c, 3, dotPaint);
      }
    }

    final labelPaint = TextPainter(
      textDirection: ui.TextDirection.ltr,
    );
    if (points.isNotEmpty) {
      final first = points.first.dateYmd;
      final last = points.last.dateYmd;
      labelPaint.text = TextSpan(
        text: _shortDate(first),
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 10,
        ),
      );
      labelPaint.layout();
      labelPaint.paint(canvas, Offset(0, size.height - 14));

      labelPaint.text = TextSpan(
        text: _shortDate(last),
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.4),
          fontSize: 10,
        ),
      );
      labelPaint.layout();
      labelPaint.paint(
        canvas,
        Offset(size.width - labelPaint.width, size.height - 14),
      );
    }
  }

  String _shortDate(String ymd) {
    try {
      final d = DateTime.parse(ymd);
      return DateFormat.MMMd().format(d);
    } catch (_) {
      return ymd;
    }
  }

  @override
  bool shouldRepaint(covariant _TrendPainter oldDelegate) =>
      oldDelegate.points != points || oldDelegate.rangeDays != rangeDays;
}

class _MetricNotFound extends StatelessWidget {
  const _MetricNotFound({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: ContentColumn(
        child: Padding(
          padding: const EdgeInsets.only(top: 32, bottom: 120),
          child: GlassSurface(
            borderRadius: 24,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Metric not found',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This signal is not available yet in Flutter.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: onBack,
                  child: const Text('Back to biometrics'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
