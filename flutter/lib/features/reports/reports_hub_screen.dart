import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'models/report_row.dart';
import 'reports_repository.dart';

/// Labs and reports hub: read-only list of uploaded documents and medical PDFs.
class ReportsHubScreen extends ConsumerWidget {
  const ReportsHubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hubAsync = ref.watch(reportsHubProvider);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(reportsHubProvider);
          await ref.read(reportsHubProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () => context.go('/settings'),
                  icon: Icon(
                    Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                  label: Text(
                    'Settings',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'REPORTS',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Labs and\nreports',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Uploaded lab PDFs and generated medical summaries. Educational only, not medical advice.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
                        height: 1.5,
                      ),
                ),
                const SizedBox(height: 28),
                hubAsync.when(
                  loading: () => const LoadingSkeleton(
                    sectionTitle: 'Reports',
                    tileCount: 4,
                  ),
                  error: (_, __) => const EmptyState(
                    eyebrow: 'Reports',
                    title: 'Could not load reports',
                    body: 'Pull to refresh and try again in a moment.',
                  ),
                  data: (data) => _ReportsBody(data: data),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReportsBody extends StatelessWidget {
  const _ReportsBody({required this.data});

  final ReportsHubData data;

  @override
  Widget build(BuildContext context) {
    if (data.loadError != null && data.isEmpty) {
      return EmptyState(
        eyebrow: 'Reports',
        title: 'No reports yet',
        body: data.loadError!,
      );
    }

    if (data.isEmpty) {
      return const EmptyState(
        eyebrow: 'Reports',
        title: 'No reports yet',
        body:
            'Upload lab PDFs or photos on the web app. Processed reports and trends appear here.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (data.loadError != null) ...[
          Text(
            data.loadError!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
        ],
        if (data.documents.isNotEmpty) ...[
          const _SectionTitle(title: 'Uploaded documents'),
          const SizedBox(height: 12),
          for (final doc in data.documents)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _ReportDocumentTile(document: doc),
            ),
          const SizedBox(height: 24),
        ],
        if (data.medicalReports.isNotEmpty) ...[
          const _SectionTitle(title: 'Medical history reports'),
          const SizedBox(height: 12),
          for (final report in data.medicalReports)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _MedicalReportTile(report: report),
            ),
        ],
        const SizedBox(height: 16),
        Text(
          'Upload, reprocess, and metric trends are available on the web app for now.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontFamily: GoogleFonts.sourceSerif4().fontFamily,
            color: Colors.white.withValues(alpha: 0.95),
          ),
    );
  }
}

class _ReportDocumentTile extends StatelessWidget {
  const _ReportDocumentTile({required this.document});

  final ReportDocumentRow document;

  @override
  Widget build(BuildContext context) {
    final type = document.reportType?.trim();
    final subtitle = [
      if (type != null && type.isNotEmpty) type,
      if (document.dateLabel.isNotEmpty) document.dateLabel,
      if (document.metricCount > 0)
        '${document.metricCount} metric${document.metricCount == 1 ? '' : 's'}',
      _statusLabel(document.status),
    ].join(' · ');

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.description_outlined,
            color: Colors.white.withValues(alpha: 0.55),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.displayTitle,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                  ),
                ],
                if (document.summary?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Text(
                    document.summary!.trim(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                          height: 1.4,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }
}

class _MedicalReportTile extends StatelessWidget {
  const _MedicalReportTile({required this.report});

  final MedicalReportRow report;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.medical_information_outlined,
            color: Colors.white.withValues(alpha: 0.55),
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Medical history',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  report.windowLabel,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.6),
                      ),
                ),
                if (report.summary?.trim().isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Text(
                    report.summary!.trim(),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                          height: 1.4,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
