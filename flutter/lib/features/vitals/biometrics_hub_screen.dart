import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'metric_detail_screen.dart';
import 'vitals_repository.dart';

/// Biometrics index mirroring web `/biometrics`: all metric tiles with
/// 90-day day counts from [metricTrendProvider].
class BiometricsHubScreen extends ConsumerWidget {
  const BiometricsHubScreen({super.key});

  static const _hubMetrics = [
    'readiness',
    'sleep_score',
    'activity_score',
    'stress',
    'hrv',
    'resting_hr',
    'spo2',
    'steps',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final muted = Colors.white.withValues(alpha: 0.55);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          for (final key in _hubMetrics) {
            ref.invalidate(
              metricTrendProvider(
                MetricTrendQuery(metricKey: key, days: 90),
              ),
            );
          }
          await Future.wait(
            _hubMetrics.map(
              (key) => ref.read(
                metricTrendProvider(
                  MetricTrendQuery(metricKey: key, days: 90),
                ).future,
              ),
            ),
          );
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () => context.go(AppRoutes.myHealth),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: Icon(Icons.arrow_back, size: 16, color: muted),
                  label: Text(
                    'My Health',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: muted,
                        ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  'YOUR BODY',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Every signal\nPurple reads.',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: PurpleType.serif,
                        fontSize: 44,
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Tap a metric for trends. Day counts reflect readings in the last 90 days.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 28),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.05,
                  children: [
                    for (final key in _hubMetrics)
                      _BiometricMetricTile(metricKey: key),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BiometricMetricTile extends ConsumerWidget {
  const _BiometricMetricTile({required this.metricKey});

  final String metricKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meta = metricMetaForKey(metricKey);
    if (meta == null) return const SizedBox.shrink();

    final trendAsync = ref.watch(
      metricTrendProvider(MetricTrendQuery(metricKey: metricKey, days: 90)),
    );

    return GlassCard(
      onTap: () => context.go(AppRoutes.biometricsMetric(metricKey)),
      child: trendAsync.when(
        loading: () => const Center(child: Text('…')),
        error: (_, __) => _TileBody(
          label: meta.label,
          subtitle: 'Could not load',
        ),
        data: (result) {
          final days = result.stats.dayCount;
          final subtitle = days == 0
              ? 'No readings in 90 days'
              : '$days day${days == 1 ? '' : 's'} in last 90 days';
          final latest = result.points.reversed
              .map((p) => p.value)
              .whereType<double>()
              .firstOrNull;
          return _TileBody(
            label: meta.label,
            subtitle: subtitle,
            value: latest,
            unit: meta.unit,
          );
        },
      ),
    );
  }
}

class _TileBody extends StatelessWidget {
  const _TileBody({
    required this.label,
    required this.subtitle,
    this.value,
    this.unit,
  });

  final String label;
  final String subtitle;
  final double? value;
  final String? unit;

  @override
  Widget build(BuildContext context) {
    final display = value == null
        ? '–'
        : value == value!.roundToDouble()
            ? value!.round().toString()
            : value!.toStringAsFixed(1);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const Spacer(),
        Text.rich(
          TextSpan(
            text: display,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.95),
                  height: 1,
                ),
            children: unit == null
                ? null
                : [
                    TextSpan(
                      text: ' $unit',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
      ],
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull {
    final it = iterator;
    if (!it.moveNext()) return null;
    return it.current;
  }
}
