import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/lab_upload_prompt.dart';
import '../shared/loading_skeleton.dart';
import 'models/report_row.dart';
import 'reports_repository.dart';
import 'widgets/reports_layout.dart';
import 'widgets/trend_chart.dart';

/// Lab metric trends hub mirroring web `/reports/metrics`.
class ReportsMetricsScreen extends ConsumerWidget {
  const ReportsMetricsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(trackedMetricsProvider);
    final seriesAsync = ref.watch(allMetricSeriesProvider);

    return ReportsLayout(
      activeTab: ReportsTab.metrics,
      showMedicalHistoryLink: true,
      child: metricsAsync.when(
        loading: () => const LoadingSkeleton(
          sectionTitle: 'Metrics',
          tileCount: 6,
        ),
        error: (_, __) => EmptyState(
          eyebrow: 'Metrics',
          title: 'Could not load metrics',
          body: 'Pull to refresh from Settings and try again.',
          primaryActionLabel: 'Upload lab report',
          onPrimaryAction: () => context.go(AppRoutes.reportsNew),
        ),
        data: (metrics) {
          if (metrics.isEmpty) {
            return LabUploadEmptyCard(
              title: 'No lab metrics yet',
              body:
                  'Upload a lab PDF and Purple extracts values for trends over time. Charts and AI insights need at least two readings per metric.',
              buttonLabel: 'Upload lab report',
              onUpload: () => context.go(AppRoutes.reportsNew),
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${metrics.length} tracked metric${metrics.length == 1 ? '' : 's'} from your uploads.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 16),
              for (final metric in metrics)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GlassCard(
                    onTap: () =>
                        context.go(AppRoutes.reportTrend(metric.metricKey)),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                metric.displayName,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                      color:
                                          Colors.white.withValues(alpha: 0.95),
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${metric.readingCount} reading${metric.readingCount == 1 ? '' : 's'} · latest ${metric.latestLabel}',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color:
                                          Colors.white.withValues(alpha: 0.6),
                                    ),
                              ),
                            ],
                          ),
                        ),
                        _sparkline(seriesAsync, metric.metricKey),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.chevron_right,
                          color: Colors.white.withValues(alpha: 0.4),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  /// Sparkline for a metric row, drawn from the pre-loaded all-series map.
  /// Renders an empty box while loading / when fewer than 2 numeric readings.
  Widget _sparkline(
    AsyncValue<Map<String, List<ReportMetricRow>>> seriesAsync,
    String metricKey,
  ) {
    final rows = seriesAsync.asData?.value[metricKey] ?? const [];
    if (rows.where((r) => r.value != null).length < 2) {
      return const SizedBox(width: 64, height: 24);
    }
    return MetricSparkline(rows: rows);
  }
}
