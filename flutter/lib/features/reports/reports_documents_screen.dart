import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/loading_skeleton.dart';
import 'reports_repository.dart';
import 'models/report_row.dart';
import 'widgets/report_tiles.dart';
import 'widgets/reports_layout.dart';

/// Uploaded lab documents mirroring web `/reports/documents`.
class ReportsDocumentsScreen extends ConsumerWidget {
  const ReportsDocumentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hubAsync = ref.watch(reportsHubProvider);

    return ReportsLayout(
      activeTab: ReportsTab.documents,
      showMedicalHistoryLink: true,
      child: hubAsync.when(
        loading: () => const LoadingSkeleton(
          sectionTitle: 'Reports',
          tileCount: 4,
        ),
        error: (_, __) => const EmptyState(
          eyebrow: 'Reports',
          title: 'Could not load reports',
          body: 'Try again in a moment.',
        ),
        data: (data) => _DocumentsBody(data: data),
      ),
    );
  }
}

class _DocumentsBody extends StatelessWidget {
  const _DocumentsBody({required this.data});

  final ReportsHubData data;

  @override
  Widget build(BuildContext context) {
    if (data.loadError != null && data.documents.isEmpty) {
      return EmptyState(
        eyebrow: 'Reports',
        title: 'No reports yet',
        body: data.loadError!,
        primaryActionLabel: 'Upload lab report',
        onPrimaryAction: () => context.go(AppRoutes.reportsNew),
      );
    }

    if (data.documents.isEmpty) {
      return EmptyState(
        eyebrow: 'Reports',
        title: 'Start your private ledger',
        body:
            'Drop a lab PDF or photo. Purple reads title, date, and values automatically.',
        primaryActionLabel: 'Upload lab report',
        onPrimaryAction: () => context.go(AppRoutes.reportsNew),
      );
    }

    final readyCount =
        data.documents.where((doc) => doc.status == 'ready').length;
    final processingCount =
        data.documents.where((doc) => doc.status == 'processing').length;
    final metricsTotal =
        data.documents.fold<int>(0, (sum, doc) => sum + doc.metricCount);

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
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            _StatChip(label: 'Reports', value: '${data.documents.length}'),
            _StatChip(label: 'Metrics tracked', value: '$metricsTotal'),
            _StatChip(
              label: processingCount > 0 ? 'Processing' : 'Ready',
              value: processingCount > 0 ? '$processingCount' : '$readyCount',
            ),
          ],
        ),
        const SizedBox(height: 20),
        FilledButton.icon(
          onPressed: () => context.go(AppRoutes.reportsNew),
          icon: const Icon(Icons.upload_file_outlined),
          label: const Text('Upload lab report'),
        ),
        const SizedBox(height: 24),
        const ReportsSectionTitle(title: 'Contributing reports'),
        const SizedBox(height: 12),
        for (final doc in data.documents)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ReportDocumentTile(document: doc),
          ),
        const SizedBox(height: 16),
        Text(
          'Bulk download, filters, and reprocess stay on the web app for now.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white.withValues(alpha: 0.05),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
        ],
      ),
    );
  }
}
