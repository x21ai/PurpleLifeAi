import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/metric_constants.dart';
import '../today/models/score_snapshot.dart';
import 'vitals_repository.dart';

/// Metadata for drilldown routes (`/vitals/metric/:metricKey`).
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

/// Stub drilldown for web `/biometrics/$metric` until full charts ship.
class MetricDetailScreen extends ConsumerWidget {
  const MetricDetailScreen({super.key, required this.metricKey});

  final String metricKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meta = metricMetaForKey(metricKey);
    if (meta == null) {
      return _MetricNotFound(onBack: () => context.go(AppRoutes.vitals));
    }

    final snapshotAsync = ref.watch(vitalsSnapshotProvider);
    final trendAsync = ref.watch(metricTrendProvider(metricKey));
    final tokens = PurpleTokens.loaded;
    final muted = Colors.white.withValues(alpha: 0.55);

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          top: tokens.spacing.x2,
          bottom: 120,
        ),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.vitals),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: Icon(Icons.arrow_back, size: 16, color: muted),
                label: Text(
                  'Vitals',
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
                    'Could not load this metric right now. Pull to refresh on Vitals and try again.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.7),
                          height: 1.45,
                        ),
                  ),
                ),
                data: (snap) {
                  final value = _valueForMetric(snap, meta.key);
                  final display = value == null
                      ? '–'
                      : value == value.roundToDouble()
                          ? value.round().toString()
                          : value.toStringAsFixed(1);
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
                            height: 120,
                            child: Center(child: Text('Loading trend…')),
                          ),
                          error: (_, __) => const SizedBox.shrink(),
                          data: (points) {
                            final values =
                                points.map((p) => p.value).whereType<double>().toList();
                            if (values.length < 2) {
                              return Text(
                                'Not enough history yet for a 7-day trend.',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: Colors.white.withValues(alpha: 0.7),
                                      height: 1.45,
                                    ),
                              );
                            }
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '7-DAY TREND',
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelSmall
                                      ?.copyWith(
                                        letterSpacing: 1.2,
                                        color: Colors.white.withValues(alpha: 0.45),
                                      ),
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  height: 120,
                                  width: double.infinity,
                                  child: _MetricTrendChart(points: points),
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

class _MetricTrendChart extends StatelessWidget {
  const _MetricTrendChart({required this.points});

  final List<MetricDayPoint> points;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _TrendPainter(points: points),
      child: const SizedBox.expand(),
    );
  }
}

class _TrendPainter extends CustomPainter {
  _TrendPainter({required this.points});

  final List<MetricDayPoint> points;

  @override
  void paint(Canvas canvas, Size size) {
    final values = points.map((p) => p.value).whereType<double>().toList();
    if (values.length < 2) return;

    final min = values.reduce((a, b) => a < b ? a : b);
    final max = values.reduce((a, b) => a > b ? a : b);
    final range = (max - min).abs() < 0.001 ? 1.0 : (max - min);

    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withValues(alpha: 0.18),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final fill = Path();
    var started = false;

    for (var i = 0; i < points.length; i++) {
      final value = points[i].value;
      if (value == null) continue;
      final x = points.length == 1 ? 0.0 : i / (points.length - 1) * size.width;
      final y = size.height - ((value - min) / range) * (size.height - 8) - 4;
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
    fill.lineTo(size.width, size.height);
    fill.close();
    canvas.drawPath(fill, fillPaint);
    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(covariant _TrendPainter oldDelegate) =>
      oldDelegate.points != points;
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
                FilledButton(onPressed: onBack, child: const Text('Back to Vitals')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
