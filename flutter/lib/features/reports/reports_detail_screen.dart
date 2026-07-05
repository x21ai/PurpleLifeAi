import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'models/report_row.dart';
import 'reports_repository.dart';

/// Single uploaded report mirroring web `/reports/$reportId`.
class ReportsDetailScreen extends ConsumerWidget {
  const ReportsDetailScreen({super.key, required this.reportId});

  final String reportId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!AppRoutes.isReportId(reportId)) {
      return const _ReportShell(
        child: EmptyState(
          eyebrow: 'Report',
          title: 'Report not found',
          body: 'This link does not point to a valid report.',
        ),
      );
    }

    final detailAsync = ref.watch(reportDetailProvider(reportId));

    return _ReportShell(
      child: detailAsync.when(
        loading: () => const LoadingSkeleton(
          sectionTitle: 'Report',
          tileCount: 3,
        ),
        error: (_, __) => const EmptyState(
          eyebrow: 'Report',
          title: 'Could not load report',
          body: 'Try again in a moment.',
        ),
        data: (detail) {
          if (detail == null) {
            return const EmptyState(
              eyebrow: 'Report',
              title: 'Report not found',
              body: 'It may have been deleted or you may not have access.',
            );
          }

          return _ReportDetailBody(detail: detail);
        },
      ),
    );
  }
}

class _ReportShell extends StatelessWidget {
  const _ReportShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.reportsDocuments),
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Reports',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _ReportDetailBody extends StatelessWidget {
  const _ReportDetailBody({required this.detail});

  final ReportDetailData detail;

  @override
  Widget build(BuildContext context) {
    final doc = detail.document;
    final statusLabel = switch (doc.status) {
      'ready' => 'Ready',
      'failed' => 'Failed',
      'processing' => 'Processing',
      _ => doc.status,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: Colors.white.withValues(alpha: 0.1),
          ),
          child: Text(
            statusLabel.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1,
                  color: Colors.white.withValues(alpha: 0.75),
                ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          doc.displayTitle,
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
                fontFamily: PurpleType.serif,
                height: 1.05,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 8),
        Text(
          [
            if (doc.dateLabel.isNotEmpty) doc.dateLabel,
            if (doc.reportType?.trim().isNotEmpty == true)
              doc.reportType!.replaceAll('_', ' '),
            if (detail.metrics.isNotEmpty)
              '${detail.metrics.length} value${detail.metrics.length == 1 ? '' : 's'}',
          ].join(' · '),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
              ),
        ),
        if (doc.summary?.trim().isNotEmpty == true) ...[
          const SizedBox(height: 20),
          GlassSurface(
            borderRadius: 20,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SUMMARY',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.1,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  doc.summary!.trim(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.85),
                        height: 1.5,
                      ),
                ),
              ],
            ),
          ),
        ],
        if (doc.status == 'processing') ...[
          const SizedBox(height: 20),
          Text(
            'Purple is extracting values. This can take up to a minute.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFF3D58B),
                ),
          ),
        ],
        if (doc.status == 'failed') ...[
          const SizedBox(height: 20),
          Text(
            'Extraction failed. Re-run from the web app or upload again.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: const Color(0xFFFF8A80),
                ),
          ),
        ],
        if (detail.metrics.isNotEmpty) ...[
          const SizedBox(height: 28),
          Text(
            'Extracted values',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 12),
          for (final metric in detail.metrics)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GlassCard(
                onTap: () =>
                    context.go(AppRoutes.reportTrend(metric.metricKey)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            metric.label,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.95),
                                ),
                          ),
                          if (metric.referenceLow != null ||
                              metric.referenceHigh != null)
                            Text(
                              'ref ${metric.referenceLow ?? '–'}–${metric.referenceHigh ?? '–'} ${metric.unit ?? ''}'
                                  .trim(),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                            ),
                        ],
                      ),
                    ),
                    Text(
                      metric.valueLabel,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: metric.flag == 'high'
                                ? const Color(0xFFFF8A80)
                                : metric.flag == 'low'
                                    ? const Color(0xFFF3D58B)
                                    : Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                  ],
                ),
              ),
            ),
        ] else if (doc.status == 'ready') ...[
          const SizedBox(height: 20),
          Text(
            'No structured values were extracted. You can still view the original file on the web app.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                  height: 1.4,
                ),
          ),
        ],
        const SizedBox(height: 20),
        Text(
          'View file, AI explanation, delete, and share link actions stay on the web app for now.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}
