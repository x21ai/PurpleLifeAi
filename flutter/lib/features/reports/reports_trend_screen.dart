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

/// Metric trend detail mirroring web `/reports/trends/$metricKey`.
class ReportsTrendScreen extends ConsumerWidget {
  const ReportsTrendScreen({super.key, required this.metricKey});

  final String metricKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seriesAsync = ref.watch(metricSeriesProvider(metricKey));

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.reportsMetrics),
                icon: Icon(
                  Icons.arrow_back,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
                label: Text(
                  'Metrics',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                metricKey.replaceAll('_', ' ').toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                _titleCase(metricKey.replaceAll('_', ' ')),
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              seriesAsync.when(
                loading: () => const LoadingSkeleton(
                  sectionTitle: 'Readings',
                  tileCount: 4,
                ),
                error: (_, __) => const EmptyState(
                  eyebrow: 'Trend',
                  title: 'Could not load readings',
                  body: 'Try again in a moment.',
                ),
                data: (rows) => _TrendBody(metricKey: metricKey, rows: rows),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _titleCase(String input) {
    if (input.isEmpty) return input;
    return input
        .split(' ')
        .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }
}

class _TrendBody extends StatelessWidget {
  const _TrendBody({required this.metricKey, required this.rows});

  final String metricKey;
  final List<ReportMetricRow> rows;

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return EmptyState(
        eyebrow: 'Trend',
        title: 'No readings yet',
        body:
            'Upload a lab report that includes $metricKey to start tracking it over time.',
        primaryActionLabel: 'Upload lab report',
        onPrimaryAction: () => context.go(AppRoutes.reportsNew),
      );
    }

    final numericRows = rows.where((row) => row.value != null).toList();
    final latest = rows.last;
    final unit = latest.unit;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: [
            _StatChip(
              label: 'Readings',
              value: '${rows.length}',
            ),
            _StatChip(
              label: 'Latest',
              value: latest.valueLabel,
            ),
            if (latest.referenceLow != null && latest.referenceHigh != null)
              _StatChip(
                label: 'Reference',
                value:
                    '${latest.referenceLow}–${latest.referenceHigh}${unit != null ? ' $unit' : ''}',
              ),
          ],
        ),
        const SizedBox(height: 20),
        if (numericRows.length < 2)
          GlassSurface(
            borderRadius: 20,
            padding: const EdgeInsets.all(20),
            child: Text(
              'Upload another report with this metric to unlock a trend chart. Charts and CSV export are on the web app today.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.65),
                    height: 1.45,
                  ),
            ),
          )
        else
          GlassSurface(
            borderRadius: 20,
            padding: const EdgeInsets.all(20),
            child: Text(
              '${numericRows.length} numeric readings tracked. Interactive charts, AI insights, and CSV export are on the web app.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.65),
                    height: 1.45,
                  ),
            ),
          ),
        const SizedBox(height: 28),
        Text(
          'Readings',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontFamily: GoogleFonts.sourceSerif4().fontFamily,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 12),
        for (final row in rows.reversed)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GlassCard(
              onTap: () => context.go(AppRoutes.reportDetail(row.reportId)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          row.valueLabel,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                        ),
                        Text(
                          _dateLabel(row.measuredAt),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.55),
                              ),
                        ),
                      ],
                    ),
                  ),
                  if (row.flag != null && row.flag != 'normal')
                    Text(
                      row.flag!.toUpperCase(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: row.flag == 'high'
                                ? const Color(0xFFFF8A80)
                                : const Color(0xFFF3D58B),
                          ),
                    ),
                  Icon(
                    Icons.chevron_right,
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  static String _dateLabel(String? raw) {
    if (raw == null || raw.isEmpty) return 'Date unknown';
    return raw.split('T').first;
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
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
        ],
      ),
    );
  }
}
