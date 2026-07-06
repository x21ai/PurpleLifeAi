import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/lab_upload_prompt.dart';
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

class _DocumentsBody extends StatefulWidget {
  const _DocumentsBody({required this.data});

  final ReportsHubData data;

  @override
  State<_DocumentsBody> createState() => _DocumentsBodyState();
}

class _DocumentsBodyState extends State<_DocumentsBody> {
  final _searchController = TextEditingController();
  String _query = '';
  String? _category;
  String? _year;
  String? _type;
  String? _status;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ReportDocumentRow> get _all => widget.data.documents;

  List<String> _distinct(String? Function(ReportDocumentRow) pick) {
    final values = <String>{};
    for (final doc in _all) {
      final v = pick(doc)?.trim();
      if (v != null && v.isNotEmpty) values.add(v);
    }
    final list = values.toList()..sort();
    return list;
  }

  List<ReportDocumentRow> get _filtered {
    final q = _query.trim().toLowerCase();
    return _all.where((doc) {
      if (_category != null && (doc.reportCategory ?? '') != _category) {
        return false;
      }
      if (_type != null && (doc.reportType ?? '') != _type) return false;
      if (_status != null && doc.status != _status) return false;
      if (_year != null) {
        final raw = doc.reportDate ?? doc.createdAt;
        if (!raw.startsWith(_year!)) return false;
      }
      if (q.isNotEmpty) {
        final haystack = [
          doc.displayTitle,
          doc.reportType ?? '',
          doc.reportCategory ?? '',
          doc.summary ?? '',
        ].join(' ').toLowerCase();
        if (!haystack.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  bool get _hasFilters =>
      _query.isNotEmpty ||
      _category != null ||
      _year != null ||
      _type != null ||
      _status != null;

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _query = '';
      _category = null;
      _year = null;
      _type = null;
      _status = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.data;

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
      return LabUploadEmptyCard(
        title: 'Start your private ledger',
        body:
            'Drop a lab PDF or photo. Purple reads title, date, and values automatically.',
        buttonLabel: 'Upload lab report',
        onUpload: () => context.go(AppRoutes.reportsNew),
      );
    }

    final readyCount = _all.where((doc) => doc.status == 'ready').length;
    final processingCount =
        _all.where((doc) => doc.status == 'processing').length;
    final metricsTotal =
        _all.fold<int>(0, (sum, doc) => sum + doc.metricCount);

    final filtered = _filtered;
    final years = _distinct((d) => (d.reportDate ?? d.createdAt).isNotEmpty
        ? (d.reportDate ?? d.createdAt).split('-').first
        : null);
    final categories = _distinct((d) => d.reportCategory);
    final types = _distinct((d) => d.reportType);
    final statuses = _distinct((d) => d.status);

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
            _StatChip(label: 'Reports', value: '${_all.length}'),
            _StatChip(label: 'Metrics tracked', value: '$metricsTotal'),
            _StatChip(
              label: processingCount > 0 ? 'Processing' : 'Ready',
              value: processingCount > 0 ? '$processingCount' : '$readyCount',
            ),
          ],
        ),
        const SizedBox(height: 20),
        LabUploadButton(onPressed: () => context.go(AppRoutes.reportsNew)),
        const SizedBox(height: 24),
        // Client-side search over the already-loaded list.
        TextField(
          controller: _searchController,
          onChanged: (v) => setState(() => _query = v),
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Search reports',
            hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
            prefixIcon: Icon(
              Icons.search,
              color: Colors.white.withValues(alpha: 0.5),
            ),
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.05),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        _FilterRow(
          label: 'Category',
          options: categories,
          selected: _category,
          onSelected: (v) => setState(() => _category = v),
        ),
        _FilterRow(
          label: 'Type',
          options: types,
          selected: _type,
          humanize: true,
          onSelected: (v) => setState(() => _type = v),
        ),
        _FilterRow(
          label: 'Year',
          options: years,
          selected: _year,
          onSelected: (v) => setState(() => _year = v),
        ),
        _FilterRow(
          label: 'Status',
          options: statuses,
          selected: _status,
          humanize: true,
          onSelected: (v) => setState(() => _status = v),
        ),
        if (_hasFilters) ...[
          const SizedBox(height: 4),
          TextButton.icon(
            onPressed: _clearFilters,
            icon: Icon(
              Icons.close,
              size: 16,
              color: Colors.white.withValues(alpha: 0.6),
            ),
            label: Text(
              'Clear filters',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
            ),
          ),
        ],
        const SizedBox(height: 16),
        ReportsSectionTitle(
          title: _hasFilters
              ? '${filtered.length} of ${_all.length} reports'
              : 'Contributing reports',
        ),
        const SizedBox(height: 12),
        if (filtered.isEmpty)
          GlassSurface(
            borderRadius: 20,
            padding: const EdgeInsets.all(20),
            child: Text(
              'No reports match these filters.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.65),
                  ),
            ),
          )
        else
          for (final doc in filtered)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ReportDocumentTile(document: doc),
            ),
        const SizedBox(height: 16),
        Text(
          'Bulk download (zip) and re-run failed extractions stay on the web app for now.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.45),
                height: 1.4,
              ),
        ),
      ],
    );
  }
}

/// A labelled horizontal row of single-select filter chips. Hidden when there
/// are fewer than two distinct options (nothing to filter).
class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.label,
    required this.options,
    required this.selected,
    required this.onSelected,
    this.humanize = false,
  });

  final String label;
  final List<String> options;
  final String? selected;
  final ValueChanged<String?> onSelected;
  final bool humanize;

  String _display(String raw) =>
      humanize ? raw.replaceAll('_', ' ') : raw;

  @override
  Widget build(BuildContext context) {
    if (options.length < 2) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.4),
                ),
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final option in options)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: _Chip(
                      label: _display(option),
                      selected: selected == option,
                      onTap: () =>
                          onSelected(selected == option ? null : option),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Colors.white.withValues(alpha: 0.16)
          : Colors.white.withValues(alpha: 0.05),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          constraints: const BoxConstraints(minHeight: 36),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.95)
                      : Colors.white.withValues(alpha: 0.7),
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
          ),
        ),
      ),
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
