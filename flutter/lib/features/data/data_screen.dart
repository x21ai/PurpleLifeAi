import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'data_providers.dart';
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
    await ref.read(dataScreenSnapshotProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final snapshotAsync = ref.watch(dataScreenSnapshotProvider);
    final tokens = PurpleTokens.loaded;
    final muted = Colors.white.withValues(alpha: 0.55);

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
                child: GlassCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Could not load your data',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Pull to refresh or retry.',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: muted),
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
                    Text(
                      'Your data',
                      style: PurpleType.displayStyle(
                        fontSize: 22,
                        height: 1.1,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Labs from report_metrics and wearable signals from biometrics.',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: muted, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    if (snapshot.hasLabs) ...[
                      DataSummaryBar(summary: snapshot.labSummary),
                      const SizedBox(height: 12),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'Search metric_key or display_name…',
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.06),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                        ),
                        style: Theme.of(context).textTheme.bodyMedium,
                        onChanged: (value) => setState(() => _query = value),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (wearables.isNotEmpty) ...[
                      _SectionHead(
                        title: 'WEARABLES · /biometrics',
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
                    _SectionHead(
                      title: 'LABS · /reports',
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

class _SectionHead extends StatelessWidget {
  const _SectionHead({required this.title, required this.trailing});

  final String title;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.08,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
          ),
          Text(
            trailing,
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyLabsCard extends StatelessWidget {
  const _EmptyLabsCard({required this.onUpload});

  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: parseTokenColor(colors.divider),
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        children: [
          Text(
            '🧪',
            style: TextStyle(
              fontSize: 32,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'No labs yet',
            style: PurpleType.displayStyle(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.95),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Upload past results to unlock biomarker trends and summary flags.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.4,
                ),
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
