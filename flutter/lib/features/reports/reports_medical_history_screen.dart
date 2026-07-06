import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'reports_repository.dart';
import 'widgets/report_tiles.dart';

/// Medical history PDF list mirroring web `/reports/medical-history`.
class ReportsMedicalHistoryScreen extends ConsumerWidget {
  const ReportsMedicalHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hubAsync = ref.watch(reportsHubProvider);

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
              Text(
                'MEDICAL HISTORY',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Clinician\nPDF reports',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Consolidated PDFs from meds, seizures, biometrics, labs, and journal entries.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 24),
              GlassSurface(
                borderRadius: 20,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Generate on web',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'PDF generation, email to your clinician, share links, and monthly auto-reports are available in the web app today. Flutter lists your existing reports below.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.65),
                            height: 1.45,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              hubAsync.when(
                loading: () => const LoadingSkeleton(
                  sectionTitle: 'Medical history',
                  tileCount: 2,
                ),
                error: (_, __) => const EmptyState(
                  eyebrow: 'Medical history',
                  title: 'Could not load reports',
                  body: 'Try again in a moment.',
                ),
                data: (data) {
                  if (data.medicalReports.isEmpty) {
                    return const EmptyState(
                      eyebrow: 'Medical history',
                      title: 'No PDFs yet',
                      body:
                          'Generate a consolidated medical history report on the web app, then it will appear here.',
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const ReportsSectionTitle(title: 'Your reports'),
                      const SizedBox(height: 12),
                      for (final report in data.medicalReports)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: MedicalReportTile(report: report),
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
