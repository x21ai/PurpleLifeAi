import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'data_insights_teaser.dart';
import 'data_providers.dart';
import 'data_style.dart';
import '../insights/ai_insights_repository.dart';
import 'widgets/data_metric_row.dart';
import 'widgets/data_summary_bar.dart';

/// Unified Data tab: lab biomarker summary + wearable metric rows.
class DataScreen extends ConsumerStatefulWidget {
  const DataScreen({super.key});

  @override
  ConsumerState<DataScreen> createState() => _DataScreenState();
}

class _DataScreenState extends ConsumerState<DataScreen> {
  String _query = '';

  Future<void> _refresh() async {
    ref.invalidate(dataScreenSnapshotProvider);
    ref.invalidate(dailyInsightCardsProvider);
    await ref.read(dataScreenSnapshotProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final snapshotAsync = ref.watch(dataScreenSnapshotProvider);
    final tokens = PurpleTokens.loaded;
    final p = DataPalette.dark();

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: snapshotAsync.when(
          loading: () => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.only(
              top: tokens.spacing.x2,
              bottom: tokens.spacing.xl,
            ),
            child: const ContentColumn(
              child: LoadingSkeleton(sectionTitle: 'Your data', tileCount: 5),
            ),
          ),
          error: (_, __) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ContentColumn(
              child: Padding(
                padding: EdgeInsets.only(top: tokens.spacing.x2),
                child: DataCardShell(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Could not load your data',
                        style: dataSans(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: p.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Pull to refresh or retry.',
                        style: dataSans(fontSize: 13, color: p.textTertiary),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _refresh,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          data: (snapshot) {
            final q = _query.trim().toLowerCase();
            bool matches(String label, String key) =>
                q.isEmpty ||
                label.toLowerCase().contains(q) ||
                key.toLowerCase().contains(q);

            final wearables = snapshot.wearables
                .where((m) => matches(m.label, m.metricKey))
                .toList();
            final labs = snapshot.labMetrics
                .where((m) => matches(m.label, m.metricKey))
                .toList();

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.only(
                top: tokens.spacing.x2,
                bottom: tokens.spacing.xl,
              ),
              child: ContentColumn(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const DataPageTitle(
                      title: 'Your data',
                      subtitle:
                          'Labs from report_metrics and wearable signals from biometrics.',
                    ),
                    const SizedBox(height: 16),
                    if (snapshot.hasLabs) ...[
                      DataSummaryBar(summary: snapshot.labSummary),
                      const SizedBox(height: 12),
                      DataSearchField(
                        onChanged: (value) => setState(() => _query = value),
                      ),
                      const SizedBox(height: 12),
                    ] else ...[
                      DataSearchField(
                        enabled: false,
                        onChanged: (_) {},
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (wearables.isNotEmpty) ...[
                      DataSectionHead(
                        title: 'Wearables · /biometrics',
                        trailing: '${wearables.length}',
                      ),
                      for (final metric in wearables)
                        DataMetricRow(
                          label: metric.label,
                          valueLabel: metric.valueLabel,
                          badge: metric.source ?? 'wearable',
                          isLab: false,
                          spark: metric.spark,
                          onTap: () => context.go(
                            AppRoutes.biometricsMetric(metric.metricKey),
                          ),
                        ),
                    ],
                    DataSectionHead(
                      title: 'Labs · /reports',
                      trailing: '${labs.length}',
                    ),
                    if (!snapshot.hasLabs)
                      _EmptyLabsCard(
                        onUpload: () => context.go(AppRoutes.reportsNew),
                      )
                    else ...[
                      for (final metric in labs)
                        DataMetricRow(
                          label: metric.label,
                          valueLabel: metric.valueLabel,
                          badge: metric.flag ?? 'normal',
                          isLab: true,
                          referenceLow: metric.referenceLow,
                          referenceHigh: metric.referenceHigh,
                          value: _parseValue(metric.valueLabel),
                          spark: metric.spark,
                          onTap: () => context.go(
                            AppRoutes.reportTrend(metric.metricKey),
                          ),
                        ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () => context.go(AppRoutes.reportsNew),
                          child: const Text('Upload past labs'),
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    const DataInsightsTeaser(),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  double? _parseValue(String label) {
    final match = RegExp(r'^-?\d+(\.\d+)?').firstMatch(label.trim());
    if (match == null) return null;
    return double.tryParse(match.group(0)!);
  }
}

class _EmptyLabsCard extends StatelessWidget {
  const _EmptyLabsCard({required this.onUpload});

  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    final p = DataPalette.dark();
    return DataCardShell(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      child: Column(
        children: [
          Text('🧪', style: TextStyle(fontSize: 32, color: p.textSecondary)),
          const SizedBox(height: 8),
          Text(
            'No labs yet',
            style: dataSerif(fontSize: 16, color: p.textPrimary),
          ),
          const SizedBox(height: 6),
          Text(
            'Upload past results to unlock biomarker trends and summary flags.',
            textAlign: TextAlign.center,
            style: dataSans(fontSize: 13, height: 1.4, color: p.textTertiary),
          ),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: onUpload,
            child: const Text('Upload past labs'),
          ),
        ],
      ),
    );
  }
}
