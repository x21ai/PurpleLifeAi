import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shell/routes.dart';
import '../../shared/glass_helpers.dart';
import '../models/report_row.dart';

class ReportDocumentTile extends StatelessWidget {
  const ReportDocumentTile({super.key, required this.document});

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
      onTap: () => context.go(AppRoutes.reportDetail(document.id)),
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
          Icon(
            Icons.chevron_right,
            color: Colors.white.withValues(alpha: 0.4),
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

class MedicalReportTile extends StatelessWidget {
  const MedicalReportTile({super.key, required this.report});

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

class ReportsSectionTitle extends StatelessWidget {
  const ReportsSectionTitle({super.key, required this.title});

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
