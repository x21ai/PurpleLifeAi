import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'care_repository.dart';

/// Read-only caregiver report detail — mirror of web
/// `care.$ownerId.reports.$reportId.tsx` (`caregiverReadReport`).
///
/// Calls `POST /api/care/report` (fronts `caregiverReadReport` via
/// `caregiverReadReportForUser` in `src/lib/care.server.ts`), which is
/// scope-checked server-side (`assertScope('reports:read')`) and writes the
/// mandatory `phi_access_log { action: 'caregiver_view' }` audit row on
/// success -- preserved by the Worker route, not just the web server fn.
class CareReportScreen extends ConsumerWidget {
  const CareReportScreen({
    super.key,
    required this.ownerId,
    required this.reportId,
  });

  final String ownerId;
  final String reportId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(
      careReportDetailProvider(CareReportKey(ownerId, reportId)),
    );

    return CanvasBackground(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/care/$ownerId'),
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Back to care view',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
                style: TextButton.styleFrom(
                  minimumSize: const Size(0, 44),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'CARE · REPORT',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                async.maybeWhen(
                  data: (detail) =>
                      (detail.report['title'] as String?) ??
                      (detail.report['report_type'] as String?) ??
                      'Report',
                  orElse: () => 'Report',
                ),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      height: 1.04,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              async.when(
                loading: () => const LoadingSkeleton(
                  sectionTitle: 'Report',
                  tileCount: 3,
                ),
                error: (error, _) => EmptyState(
                  eyebrow: 'Read-only',
                  title: "Couldn't load this report",
                  body: error is CareAccessException
                      ? error.message
                      : 'Pull to refresh and try again in a moment.',
                ),
                data: (detail) => _ReportDetailBody(detail: detail),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReportDetailBody extends StatelessWidget {
  const _ReportDetailBody({required this.detail});

  final CareReportDetail detail;

  @override
  Widget build(BuildContext context) {
    final report = detail.report;
    final summary = (report['ai_summary'] as String?)?.trim().isNotEmpty == true
        ? (report['ai_summary'] as String).trim()
        : (report['summary'] as String?)?.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'DETAILS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.1,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                (report['report_date'] as String?) ??
                    ((report['created_at'] as String?) ?? '').split('T').first,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
              ),
              if ((report['status'] as String?)?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 4),
                Text(
                  'Status: ${report['status']}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
              ],
              if (summary != null && summary.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  summary,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'METRICS',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.1,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 8),
        if (detail.metrics.isEmpty)
          Text(
            'No structured metrics were extracted from this report.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.5),
                ),
          )
        else
          ...detail.metrics.map(
            (metric) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        (metric['display_name'] as String?) ??
                            (metric['metric_key'] as String? ?? 'Metric'),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                      ),
                    ),
                    Text(
                      _formatMetricValue(metric),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: metric['flag'] != null &&
                                    (metric['flag'] as String).isNotEmpty
                                ? const Color(0xFFE8A6C4)
                                : Colors.white.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  String _formatMetricValue(Map<String, dynamic> metric) {
    final text = metric['value_text'] as String?;
    if (text != null && text.trim().isNotEmpty) return text.trim();
    final value = metric['value'];
    final unit = metric['unit'] as String?;
    if (value == null) return '–';
    return unit != null && unit.trim().isNotEmpty ? '$value $unit' : '$value';
  }
}
