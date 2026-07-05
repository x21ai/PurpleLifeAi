import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';
import '../seizures/seizure_repository.dart';
import '../vitals/vitals_repository.dart';

/// Eyebrow + serif title pair used across Insights sections.
class InsightsSectionHeader extends StatelessWidget {
  const InsightsSectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
  });

  final String eyebrow;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontFamily: PurpleType.serif,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
      ],
    );
  }
}

/// One latest-vital tile: label, big serif value, and a sub caption.
class VitalTile extends StatelessWidget {
  const VitalTile({
    super.key,
    required this.label,
    required this.value,
    required this.sub,
  });

  final String label;
  final String value;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontFamily: PurpleType.serif,
                  fontFeatures: const [FontFeature.tabularFigures()],
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
        ],
      ),
    );
  }
}

/// A responsive 2-column grid of [VitalTile]s.
class VitalTilesGrid extends StatelessWidget {
  const VitalTilesGrid({super.key, required this.tiles});

  final List<VitalTile> tiles;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.55,
      children: tiles,
    );
  }
}

/// A single health-records category count chip.
class CategoryTile extends StatelessWidget {
  const CategoryTile({
    super.key,
    required this.label,
    required this.count,
    required this.icon,
    this.onTap,
  });

  final String label;
  final int count;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      borderRadius: 18,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 36,
            width: 36,
            decoration: BoxDecoration(
              color: purple.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: purple),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(height: 2),
          Text(
            count == 0
                ? 'Nothing yet'
                : '$count ${count == 1 ? 'record' : 'records'}',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
        ],
      ),
    );
  }
}

/// Health-records category metadata mirroring web `REPORT_CATEGORIES`
/// (`src/lib/report-categories.ts`). Colors intentionally map to
/// PurpleTokens purplePrimary rather than the web per-category hex, per the
/// dark-glass on-token rule.
class InsightsRecordCategory {
  const InsightsRecordCategory({
    required this.slug,
    required this.label,
    required this.icon,
  });

  final String slug;
  final String label;
  final IconData icon;
}

const List<InsightsRecordCategory> kReportCategories = [
  InsightsRecordCategory(
    slug: 'blood',
    label: 'Blood work',
    icon: Icons.science_outlined,
  ),
  InsightsRecordCategory(
    slug: 'dna',
    label: 'DNA / Genetics',
    icon: Icons.biotech_outlined,
  ),
  InsightsRecordCategory(
    slug: 'mri',
    label: 'MRI',
    icon: Icons.psychology_outlined,
  ),
  InsightsRecordCategory(
    slug: 'ct',
    label: 'CT Scan',
    icon: Icons.document_scanner_outlined,
  ),
  InsightsRecordCategory(
    slug: 'xray',
    label: 'X-Ray',
    icon: Icons.accessibility_new_outlined,
  ),
  InsightsRecordCategory(
    slug: 'ultrasound',
    label: 'Ultrasound',
    icon: Icons.monitor_heart_outlined,
  ),
  InsightsRecordCategory(
    slug: 'cardiology',
    label: 'Cardiology',
    icon: Icons.favorite_outline,
  ),
  InsightsRecordCategory(
    slug: 'pathology',
    label: 'Pathology',
    icon: Icons.coronavirus_outlined,
  ),
  InsightsRecordCategory(
    slug: 'notes',
    label: 'Clinical notes',
    icon: Icons.description_outlined,
  ),
  InsightsRecordCategory(
    slug: 'other',
    label: 'Other',
    icon: Icons.folder_outlined,
  ),
];

/// Last-N-day seizure heatmap (GitHub-style calendar) driven by `seizure_events`.
/// Column-major, 7 rows (Sun..Sat), padded so the first column starts on Sunday.
class SeizureHeatmap extends StatelessWidget {
  const SeizureHeatmap({super.key, required this.events, this.days = 90});

  final List<SeizureEvent> events;
  final int days;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    // Count events per local day.
    final counts = <String, int>{};
    String keyOf(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    for (final e in events) {
      final local = e.startedAt.toLocal();
      final day = DateTime(local.year, local.month, local.day);
      final k = keyOf(day);
      counts[k] = (counts[k] ?? 0) + 1;
    }

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final cells = <_HeatCell>[];
    for (var i = days - 1; i >= 0; i--) {
      final d = today.subtract(Duration(days: i));
      cells.add(_HeatCell(date: d, count: counts[keyOf(d)] ?? 0));
    }

    // Pad leading nulls so the first column starts on Sunday (weekday 7 == Sun).
    final firstDow = cells.first.date.weekday % 7; // Mon=1..Sun=0
    final grid = <_HeatCell?>[
      ...List<_HeatCell?>.filled(firstDow, null),
      ...cells,
    ];
    final columns = (grid.length / 7).ceil();

    Color intensity(int n) {
      if (n <= 0) return Colors.white.withValues(alpha: 0.06);
      if (n == 1) return purple.withValues(alpha: 0.30);
      if (n == 2) return purple.withValues(alpha: 0.55);
      if (n == 3) return purple.withValues(alpha: 0.75);
      return purple;
    }

    return GlassSurface(
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              const gap = 3.0;
              final cell =
                  ((constraints.maxWidth - (columns - 1) * gap) / columns)
                      .clamp(4.0, 18.0);
              return SizedBox(
                height: cell * 7 + gap * 6,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (var col = 0; col < columns; col++) ...[
                      Column(
                        children: [
                          for (var row = 0; row < 7; row++) ...[
                            Builder(builder: (context) {
                              final idx = col * 7 + row;
                              final c =
                                  idx < grid.length ? grid[idx] : null;
                              return Container(
                                width: cell,
                                height: cell,
                                decoration: BoxDecoration(
                                  color: c == null
                                      ? Colors.transparent
                                      : intensity(c.count),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              );
                            }),
                            if (row < 6) const SizedBox(height: gap),
                          ],
                        ],
                      ),
                      if (col < columns - 1) const SizedBox(width: gap),
                    ],
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'Less',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(width: 6),
              for (final n in const [0, 1, 2, 3, 4]) ...[
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: intensity(n),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 4),
              ],
              const SizedBox(width: 2),
              Text(
                'More',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeatCell {
  const _HeatCell({required this.date, required this.count});
  final DateTime date;
  final int count;
}

/// One row in the seizure event list with severity / duration / injury badges.
class SeizureListItem extends StatelessWidget {
  const SeizureListItem({super.key, required this.event});

  final SeizureEvent event;

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  static const _weekdays = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];

  String _formatDate(DateTime d) {
    final local = d.toLocal();
    final wd = _weekdays[local.weekday - 1];
    final mo = _months[local.month - 1];
    final h24 = local.hour;
    final ampm = h24 >= 12 ? 'PM' : 'AM';
    var h12 = h24 % 12;
    if (h12 == 0) h12 = 12;
    final mm = local.minute.toString().padLeft(2, '0');
    return '$wd, $mo ${local.day} · $h12:$mm $ampm';
  }

  String _formatDuration(int seconds) {
    if (seconds < 60) return '${seconds}s';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return s == 0 ? '${m}m' : '${m}m ${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final danger = parseTokenColor(colors.danger);
    final typeLabel = (event.type != null && event.type!.trim().isNotEmpty)
        ? event.type!.replaceAll('_', ' ')
        : 'Seizure';

    return GlassSurface(
      padding: const EdgeInsets.all(16),
      borderRadius: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      typeLabel,
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontFamily: PurpleType.serif,
                                color: Colors.white.withValues(alpha: 0.92),
                              ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatDate(event.startedAt),
                      style:
                          Theme.of(context).textTheme.labelSmall?.copyWith(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                    ),
                  ],
                ),
              ),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                alignment: WrapAlignment.end,
                children: [
                  if (event.durationSeconds != null &&
                      event.durationSeconds! > 0)
                    _Badge(label: _formatDuration(event.durationSeconds!)),
                  if (event.severity != null)
                    _Badge(label: 'sev ${event.severity}'),
                  if (event.injury == true)
                    _Badge(label: 'injury', color: danger),
                ],
              ),
            ],
          ),
          if (event.notes != null && event.notes!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              event.notes!.trim(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final tone = color ?? Colors.white;
    final bg = color != null
        ? color!.withValues(alpha: 0.15)
        : Colors.white.withValues(alpha: 0.08);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontSize: 11,
              color: tone.withValues(alpha: color != null ? 0.95 : 0.7),
            ),
      ),
    );
  }
}

/// Multi-series 14-night wearable trend chart (sleep / HRV / resting HR),
/// rendered with fl_chart. Each series is min-max normalised to 0..1 so the
/// three lines share one axis, mirroring the web `WaveTrend`.
class InsightsTrendChart extends StatelessWidget {
  const InsightsTrendChart({
    super.key,
    required this.sleep,
    required this.hrv,
    required this.rhr,
  });

  final MetricTrendResult sleep;
  final MetricTrendResult hrv;
  final MetricTrendResult rhr;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final series = <_ChartSeries>[
      _ChartSeries(
        label: 'Sleep',
        points: sleep.points,
        color: parseTokenColor(colors.purplePrimary),
      ),
      _ChartSeries(
        label: 'HRV',
        points: hrv.points,
        color: parseTokenColor(colors.info),
      ),
      _ChartSeries(
        label: 'Resting HR',
        points: rhr.points,
        color: parseTokenColor(colors.accentWarm),
      ),
    ].where((s) => s.hasData).toList();

    return GlassSurface(
      padding: const EdgeInsets.all(20),
      borderRadius: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'LAST 14 NIGHTS',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 150,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 1,
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineTouchData: const LineTouchData(enabled: false),
                lineBarsData: [
                  for (final s in series)
                    LineChartBarData(
                      spots: s.normalisedSpots(),
                      isCurved: true,
                      preventCurveOverShooting: true,
                      color: s.color,
                      barWidth: 2,
                      dotData: const FlDotData(show: false),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              for (final s in series)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: s.color,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      s.label,
                      style:
                          Theme.of(context).textTheme.labelSmall?.copyWith(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: 0.6),
                              ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChartSeries {
  _ChartSeries({
    required this.label,
    required this.points,
    required this.color,
  });

  final String label;
  final List<MetricDayPoint> points;
  final Color color;

  bool get hasData => points.any((p) => p.value != null);

  /// Normalise present values to 0..1 (min-max) and keep their day index on X.
  List<FlSpot> normalisedSpots() {
    final present = points.where((p) => p.value != null).toList();
    if (present.isEmpty) return const [];
    var min = double.infinity;
    var max = double.negativeInfinity;
    for (final p in present) {
      min = math.min(min, p.value!);
      max = math.max(max, p.value!);
    }
    final range = (max - min).abs();
    final spots = <FlSpot>[];
    for (var i = 0; i < points.length; i++) {
      final v = points[i].value;
      if (v == null) continue;
      final y = range == 0 ? 0.5 : (v - min) / range;
      spots.add(FlSpot(i.toDouble(), y));
    }
    return spots;
  }
}
