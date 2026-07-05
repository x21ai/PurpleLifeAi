import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/score_arc.dart';
import 'risk_forecast_repository.dart';

ScoreArcTone _bandTone(String band) {
  return switch (band) {
    'high' || 'elevated' => ScoreArcTone.alert,
    _ => ScoreArcTone.cream,
  };
}

String _bandLabel(String band) {
  return switch (band) {
    'high' => 'High',
    'elevated' => 'Elevated',
    'moderate' => 'Moderate',
    _ => 'Low',
  };
}

/// Risk drilldown mirroring web `/today/risk`.
class TodayRiskScreen extends ConsumerWidget {
  const TodayRiskScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PurpleTokens.loaded;
    final muted = Colors.white.withValues(alpha: 0.55);
    final forecastAsync = ref.watch(latestRiskForecastProvider);

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
                onPressed: () => context.go('/today'),
                icon: Icon(Icons.chevron_left, size: 18, color: muted),
                label: Text(
                  'Today',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: muted,
                      ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                "TODAY'S READING",
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Full risk reading',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      fontSize: 44,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              forecastAsync.when(
                loading: () => const LoadingSkeleton(
                  sectionTitle: 'Risk',
                  tileCount: 2,
                ),
                error: (_, __) => GlassSurface(
                  borderRadius: 24,
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Could not load your reading right now.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: muted,
                          height: 1.45,
                        ),
                  ),
                ),
                data: (forecast) {
                  if (forecast == null) {
                    return GlassSurface(
                      borderRadius: 24,
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'No reading yet',
                            style: PurpleType.serifStyle(
                              fontSize: 22,
                              color: Colors.white.withValues(alpha: 0.95),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Connect a wearable and check back after Purple runs your daily forecast.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: muted,
                                  height: 1.45,
                                ),
                          ),
                        ],
                      ),
                    );
                  }
                  return _ForecastBody(forecast: forecast);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ForecastBody extends StatelessWidget {
  const _ForecastBody({required this.forecast});

  final RiskForecast forecast;

  @override
  Widget build(BuildContext context) {
    final muted = Colors.white.withValues(alpha: 0.55);
    final readiness = forecast.readinessScore.toDouble();
    final tone = _bandTone(forecast.band);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassSurface(
          borderRadius: 24,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            children: [
              SizedBox(
                width: 260,
                height: 260,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ScoreArc(
                      score: readiness,
                      size: 260,
                      stroke: 6,
                      tone: tone,
                      semanticLabel: 'Readiness ${readiness.round()}',
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${readiness.round()}',
                          style: PurpleType.serifStyle(
                            fontSize: 88,
                            height: 1,
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                        ),
                        Text(
                          'READINESS',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                letterSpacing: 1.2,
                                color: muted,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${_bandLabel(forecast.band)} · score ${forecast.riskScore}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.4,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                ),
              ),
              if (forecast.aiNarrative != null &&
                  forecast.aiNarrative!.isNotEmpty) ...[
                const SizedBox(height: 20),
                Text(
                  forecast.aiNarrative!,
                  textAlign: TextAlign.center,
                  style: PurpleType.serifStyle(
                    fontSize: 22,
                    height: 1.35,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 28),
        Text(
          "WHAT'S SHIFTING",
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 12),
        if (forecast.topFactors.isEmpty)
          Text(
            'Nothing in your data is out of pattern. Steady is good.',
            style: PurpleType.serifStyle(
              fontSize: 18,
              color: muted,
            ),
          )
        else
          Column(
            children: [
              for (final factor in forecast.topFactors)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassSurface(
                    borderRadius: 16,
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                factor.label,
                                style: PurpleType.serifStyle(
                                  fontSize: 18,
                                  color: Colors.white.withValues(alpha: 0.95),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                factor.detail,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: muted,
                                      height: 1.45,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '+${factor.weight}',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                letterSpacing: 1.2,
                                color: muted,
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        if (forecast.computedAt != null) ...[
          const SizedBox(height: 16),
          Text(
            'Model ${forecast.modelVersion ?? 'unknown'} · computed ${DateFormat('MMM d, h:mm a').format(forecast.computedAt!)}',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.4),
                ),
          ),
        ],
      ],
    );
  }
}
