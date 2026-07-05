import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import 'models/report_row.dart';
import 'reports_repository.dart';

/// Single uploaded report mirroring web `/reports/$reportId`.
///
/// Stateful so it can poll (`processReport` runs server-side and flips
/// `status` from `processing` → `ready`/`failed`): while the loaded report is
/// still processing we re-fetch every 3s, matching the web client's poll.
class ReportsDetailScreen extends ConsumerStatefulWidget {
  const ReportsDetailScreen({super.key, required this.reportId});

  final String reportId;

  @override
  ConsumerState<ReportsDetailScreen> createState() =>
      _ReportsDetailScreenState();
}

class _ReportsDetailScreenState extends ConsumerState<ReportsDetailScreen> {
  Timer? _pollTimer;

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _syncPolling(String? status) {
    final processing = status == 'processing';
    if (processing && _pollTimer == null) {
      _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        ref.invalidate(reportDetailProvider(widget.reportId));
      });
    } else if (!processing && _pollTimer != null) {
      _pollTimer!.cancel();
      _pollTimer = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AppRoutes.isReportId(widget.reportId)) {
      return const _ReportShell(
        child: EmptyState(
          eyebrow: 'Report',
          title: 'Report not found',
          body: 'This link does not point to a valid report.',
        ),
      );
    }

    final detailAsync = ref.watch(reportDetailProvider(widget.reportId));
    // Start/stop the processing poll based on the latest known status.
    _syncPolling(detailAsync.asData?.value?.document.status);

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

          return _ReportDetailBody(detail: detail, reportId: widget.reportId);
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

class _ReportDetailBody extends ConsumerStatefulWidget {
  const _ReportDetailBody({required this.detail, required this.reportId});

  final ReportDetailData detail;
  final String reportId;

  @override
  ConsumerState<_ReportDetailBody> createState() => _ReportDetailBodyState();
}

class _ReportDetailBodyState extends ConsumerState<_ReportDetailBody> {
  bool _busy = false;

  ReportDetailData get detail => widget.detail;

  Future<void> _openFile() async {
    final ref0 = await _signed();
    if (ref0 == null) return;
    // Native browser handles PDF/image rendering + its own share/print — no
    // in-app iframe (per Wave-2 rules).
    final ok = await launchUrl(
      Uri.parse(ref0.url),
      mode: LaunchMode.externalApplication,
    );
    if (!ok) _toast('Could not open the file.');
  }

  Future<void> _shareFile() async {
    final ref0 = await _signed();
    if (ref0 == null) return;
    // No share_plus dependency in this app; copy the short-lived signed link
    // to the clipboard so the user can paste it into any share target. (The
    // web app mints a 7-day link; this is the 5-minute view URL.)
    await Clipboard.setData(ClipboardData(text: ref0.url));
    _toast('Signed link copied. It expires in ~5 minutes.');
  }

  Future<ReportFileRef?> _signed() async {
    if (_busy) return null;
    setState(() => _busy = true);
    try {
      final result = await ref
          .read(reportsRepositoryProvider)
          .getReportFileUrl(widget.reportId);
      if (result == null) {
        _toast('No file is attached to this report.');
      }
      return result;
    } catch (_) {
      _toast('Could not sign the file link.');
      return null;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1830),
        title: const Text(
          'Delete this report?',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'This removes the file and its extracted values. This cannot be undone.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Delete', style: TextStyle(color: _dangerColor)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await ref.read(reportsRepositoryProvider).deleteReport(widget.reportId);
      ref.invalidate(reportsHubProvider);
      ref.invalidate(trackedMetricsProvider);
      if (mounted) context.go(AppRoutes.reportsDocuments);
    } catch (_) {
      // RLS or a server-owned constraint blocked the delete — surface it
      // honestly rather than pretending it worked. (Web `deleteReport` is a
      // server fn; if the client delete is denied, deletion must happen there.)
      if (mounted) {
        setState(() => _busy = false);
        _toast('Delete was blocked. Remove this report from the web app.');
      }
    }
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final doc = detail.document;
    final byPanel = detail.metricsByPanel;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StatusPill(status: doc.status),
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
        const SizedBox(height: 20),
        _ActionBar(
          busy: _busy,
          onView: _openFile,
          onShare: _shareFile,
          onDelete: _confirmDelete,
        ),
        if (doc.summary?.trim().isNotEmpty == true) ...[
          const SizedBox(height: 20),
          _InfoCard(label: 'SUMMARY', body: doc.summary!.trim()),
        ],
        // AI "explain report" — server-owned (`summarizeReport` calls the AI
        // provider + credits). Show the cached explanation if the web app has
        // already generated one; otherwise an honest available-on-web state.
        const SizedBox(height: 20),
        if (doc.aiSummary?.trim().isNotEmpty == true)
          _InfoCard(label: 'AI EXPLANATION', body: doc.aiSummary!.trim())
        else
          GlassSurface(
            borderRadius: 20,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI EXPLANATION',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.1,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Plain-English AI explanations are generated on the web app. Once created there, the explanation appears here.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                        height: 1.5,
                      ),
                ),
              ],
            ),
          ),
        if (doc.status == 'processing') ...[
          const SizedBox(height: 20),
          Row(
            children: [
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(_warningColor),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Purple is extracting values. This refreshes automatically.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: _warningColor,
                      ),
                ),
              ),
            ],
          ),
        ],
        if (doc.status == 'failed') ...[
          const SizedBox(height: 20),
          Text(
            doc.errorMessage?.trim().isNotEmpty == true
                ? 'Extraction failed: ${doc.errorMessage!.trim()}'
                : 'Extraction failed. Re-run from the web app or upload again.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: _dangerColor,
                ),
          ),
        ],
        if (detail.metrics.isNotEmpty) ...[
          const SizedBox(height: 28),
          Text(
            'Extracted values',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 4),
          for (final entry in _orderedPanels(byPanel)) ...[
            const SizedBox(height: 16),
            Text(
              _panelLabel(entry.key),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.1,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 8),
            for (final metric in entry.value)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _MetricTile(metric: metric),
              ),
          ],
        ] else if (doc.status == 'ready') ...[
          const SizedBox(height: 20),
          Text(
            'No structured values were extracted. You can still view the original file above.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                  height: 1.4,
                ),
          ),
        ],
      ],
    );
  }

  /// Panels ordered with "other" pushed to the end; other keys keep insertion
  /// order (dictionary panels already arrive grouped).
  List<MapEntry<String, List<ReportMetricRow>>> _orderedPanels(
    Map<String, List<ReportMetricRow>> byPanel,
  ) {
    final entries = byPanel.entries.toList();
    entries.sort((a, b) {
      if (a.key == 'other') return 1;
      if (b.key == 'other') return -1;
      return a.key.compareTo(b.key);
    });
    return entries;
  }

  String _panelLabel(String panel) {
    if (panel == 'other') return 'OTHER VALUES';
    return panel.replaceAll('_', ' ').toUpperCase();
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.metric});

  final ReportMetricRow metric;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: () => context.go(AppRoutes.reportTrend(metric.metricKey)),
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
                if (metric.referenceLow != null || metric.referenceHigh != null)
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
                      ? _dangerColor
                      : metric.flag == 'low'
                          ? _warningColor
                          : Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right,
            color: Colors.white.withValues(alpha: 0.4),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.label, required this.body});

  final String label;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.85),
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'ready' => ('READY', const Color(0xFF6FCF97)),
      'failed' => ('FAILED', _dangerColor),
      'processing' => ('PROCESSING', _warningColor),
      _ => (status.toUpperCase(), Colors.white.withValues(alpha: 0.75)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: color.withValues(alpha: 0.16),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1,
              color: color,
            ),
      ),
    );
  }
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.busy,
    required this.onView,
    required this.onShare,
    required this.onDelete,
  });

  final bool busy;
  final VoidCallback onView;
  final VoidCallback onShare;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _ActionButton(
          icon: Icons.open_in_new,
          label: 'View file',
          onTap: busy ? null : onView,
        ),
        _ActionButton(
          icon: Icons.ios_share,
          label: 'Share link',
          onTap: busy ? null : onShare,
        ),
        _ActionButton(
          icon: Icons.delete_outline,
          label: 'Delete',
          onTap: busy ? null : onDelete,
          danger: true,
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? _dangerColor : Colors.white.withValues(alpha: 0.9);
    return Material(
      color: Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        // 44pt minimum tap target.
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: color,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Out-of-range (high) lab value color, from dark design tokens.
Color get _dangerColor =>
    parseTokenColor(PurpleTokens.loaded.colorsFor('dark').danger);

/// Below-range (low) / pending lab value color, from dark design tokens.
Color get _warningColor =>
    parseTokenColor(PurpleTokens.loaded.colorsFor('dark').warning);
