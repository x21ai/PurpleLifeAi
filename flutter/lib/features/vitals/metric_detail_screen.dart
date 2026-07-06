import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'biometric_metrics.dart';
import 'vitals_repository.dart';

/// Legacy lightweight metric metadata kept for backward compatibility with
/// `vitals_screen.dart` (Wave-1). New code should use [BiometricMetricMeta]
/// from `biometric_metrics.dart`.
class MetricMeta {
  const MetricMeta({required this.key, required this.label, this.unit});

  final String key;
  final String label;
  final String? unit;
}

/// Backward-compatible lookup: resolves any of the 18 ported metrics.
///
/// Previously only 8 keys resolved; widening this only enables more signals
/// to open their detail page, which is the intended Wave-2 behavior.
MetricMeta? metricMetaForKey(String key) {
  final meta = biometricMetricForKey(key);
  if (meta == null) return null;
  return MetricMeta(key: meta.key, label: meta.label, unit: meta.unit);
}

/// Legacy catalog view over the ported metrics (kept for compatibility).
Map<String, MetricMeta> get metricCatalog => {
      for (final key in metricOrder)
        key: MetricMeta(
          key: key,
          label: biometricMetrics[key]!.label,
          unit: biometricMetrics[key]!.unit,
        ),
    };

/// Resolve the Oura source line color (purple-primary token) at UI layer.
Color sourceColorFor(SourceKey source) {
  if (source == SourceKey.oura) {
    return parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
  }
  return sourceColors[source] ?? Colors.white;
}

/// Warning tone color from tokens (for "Pay attention" badges/bands).
Color warningTokenColor() =>
    parseTokenColor(PurpleTokens.loaded.colorsFor('dark').warning);

/// Status badge shared by hub + detail.
class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.meta, required this.status});

  final BiometricMetricMeta meta;
  final MetricStatus status;

  @override
  Widget build(BuildContext context) {
    final tone = statusTone(meta, status);
    late final Color bg;
    late final Color fg;
    switch (tone.tone) {
      case StatusTone.warn:
        final w = warningTokenColor();
        bg = w.withValues(alpha: 0.15);
        fg = w;
      case StatusTone.good:
        bg = Colors.white.withValues(alpha: 0.08);
        fg = Colors.white.withValues(alpha: 0.85);
      case StatusTone.neutral:
        bg = Colors.white.withValues(alpha: 0.06);
        fg = Colors.white.withValues(alpha: 0.55);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        tone.label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: fg,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

/// Metric drilldown: baseline band, meaning, status, 5 ranges, compare overlay.
class MetricDetailScreen extends ConsumerStatefulWidget {
  const MetricDetailScreen({super.key, required this.metricKey});

  final String metricKey;

  @override
  ConsumerState<MetricDetailScreen> createState() => _MetricDetailScreenState();
}

class _MetricDetailScreenState extends ConsumerState<MetricDetailScreen> {
  int _rangeDays = 30;
  CompareMode _compare = CompareMode.previous;

  @override
  Widget build(BuildContext context) {
    final meta = biometricMetricForKey(widget.metricKey);
    if (meta == null) {
      return _MetricNotFound(onBack: () => context.go(AppRoutes.biometrics));
    }

    final query = MetricSeriesQuery(
      metricKey: widget.metricKey,
      days: _rangeDays,
      compareMode: _compare,
    );
    final seriesAsync = ref.watch(metricSeriesProvider(query));
    final muted = Colors.white.withValues(alpha: 0.55);
    final rangeLabel = rangeOptions
        .firstWhere((r) => r.days == _rangeDays, orElse: () => rangeOptions[2])
        .label;

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(metricSeriesProvider(query));
          await ref.read(metricSeriesProvider(query).future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () => context.go(AppRoutes.biometrics),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: Icon(Icons.arrow_back, size: 16, color: muted),
                  label: Text(
                    'Biometrics',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: muted,
                        ),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  categoryLabel[meta.category]!.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  meta.label,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: PurpleType.serif,
                        fontSize: 44,
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 20),
                _RangeSelector(
                  selected: _rangeDays,
                  onSelected: (days) => setState(() => _rangeDays = days),
                ),
                const SizedBox(height: 12),
                _CompareSelector(
                  selected: _compare,
                  onSelected: (mode) => setState(() => _compare = mode),
                ),
                const SizedBox(height: 24),
                seriesAsync.when(
                  loading: () => const GlassSurface(
                    padding: EdgeInsets.all(24),
                    child: SizedBox(
                      height: 120,
                      child: Center(child: Text('Loading…')),
                    ),
                  ),
                  error: (_, __) => GlassSurface(
                    borderRadius: 24,
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'Could not load this metric right now. Pull to refresh and try again.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.7),
                            height: 1.45,
                          ),
                    ),
                  ),
                  data: (result) {
                    final readingsQuery = MetricReadingsQuery(
                      metricKey: widget.metricKey,
                      days: _rangeDays,
                      limit: 20,
                    );
                    final readingsAsync =
                        ref.watch(metricReadingsProvider(readingsQuery));
                    return _DetailBody(
                      meta: meta,
                      result: result,
                      rangeLabel: rangeLabel,
                      readings: readingsAsync.valueOrNull ?? const [],
                      readingsLoading: readingsAsync.isLoading,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({
    required this.meta,
    required this.result,
    required this.rangeLabel,
    required this.readings,
    required this.readingsLoading,
  });

  final BiometricMetricMeta meta;
  final MetricSeriesResult result;
  final String rangeLabel;
  final List<MetricReading> readings;
  final bool readingsLoading;

  String? _latestMetaLine() {
    final dateYmd = result.headlineDateYmd;
    final source = result.headlineSource;
    if (dateYmd == null && source == null) return null;
    final parts = <String>[];
    if (dateYmd != null) {
      final d = DateTime.tryParse(dateYmd);
      parts.add(d == null ? dateYmd : DateFormat.MMMd().format(d));
    }
    if (source != null) {
      parts.add(sourceLabels[source]!);
    }
    return parts.join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final present = result.presentSources;
    final hasData = present.isNotEmpty;
    final display = meta.format(result.headlineValue);
    final tone = statusTone(meta, result.status);
    final headlineColor = tone.tone == StatusTone.warn
        ? warningTokenColor()
        : Colors.white.withValues(alpha: 0.95);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GlassSurface(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Latest reading',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  ),
                  const Spacer(),
                  StatusBadge(meta: meta, status: result.status),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                display,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      fontSize: 56,
                      height: 1,
                      color: headlineColor,
                    ),
              ),
              if (_latestMetaLine() != null) ...[
                const SizedBox(height: 8),
                Text(
                  _latestMetaLine()!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
              ] else if (result.headlineSource != null) ...[
                const SizedBox(height: 8),
                Text(
                  'via ${sourceLabels[result.headlineSource]}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
              ],
              const SizedBox(height: 24),
              if (!hasData)
                Text(
                  'No readings in this range yet.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                        height: 1.45,
                      ),
                )
              else ...[
                Row(
                  children: [
                    Text(
                      '${rangeLabel.toUpperCase()} TREND',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.2,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const Spacer(),
                    if (result.deltaPct != null) _DeltaPill(delta: result.deltaPct!),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 180,
                  width: double.infinity,
                  child: _totalPointCount(result) < 2
                      ? Center(
                          child: Text(
                            'Not enough history yet for a $rangeLabel trend.',
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.7),
                                  height: 1.45,
                                ),
                          ),
                        )
                      : _MetricChart(meta: meta, result: result),
                ),
                const SizedBox(height: 16),
                SourceLegend(sources: present),
              ],
            ],
          ),
        ),
        if (hasData && (readings.isNotEmpty || readingsLoading)) ...[
          const SizedBox(height: 16),
          GlassSurface(
            borderRadius: 24,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Reading history',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                if (readingsLoading && readings.isEmpty)
                  Text(
                    'Loading readings…',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  )
                else if (readings.isEmpty)
                  Text(
                    'No individual readings in this range.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  )
                else
                  for (var i = 0; i < readings.length && i < 8; i++)
                    _ReadingHistoryRow(
                      reading: readings[i],
                      meta: meta,
                      isLatest: i == 0,
                    ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        GlassSurface(
          borderRadius: 24,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'What this means for you',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.92),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                meta.meaning,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.75),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  meta.baselineHint,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                        height: 1.45,
                      ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  int _totalPointCount(MetricSeriesResult result) => result.seriesBySource.values
      .fold(0, (sum, list) => sum + list.where((p) => p.value != null).length);
}

class _ReadingHistoryRow extends StatelessWidget {
  const _ReadingHistoryRow({
    required this.reading,
    required this.meta,
    required this.isLatest,
  });

  final MetricReading reading;
  final BiometricMetricMeta meta;
  final bool isLatest;

  @override
  Widget build(BuildContext context) {
    final dateLabel = DateFormat.yMMMd().format(reading.recordedAt.toLocal());
    final valueLabel = meta.format(reading.value);
    final src = reading.source;
    SourceKey? srcKey;
    if (src != null && src.isNotEmpty) {
      srcKey = sourceKeyFromString(src);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              dateLabel,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isLatest
                        ? Colors.white.withValues(alpha: 0.92)
                        : Colors.white.withValues(alpha: 0.65),
                    fontWeight: isLatest ? FontWeight.w600 : FontWeight.w400,
                  ),
            ),
          ),
          Text(
            valueLabel,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.92),
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
          ),
          if (srcKey != null) ...[
            const SizedBox(width: 8),
            Text(
              sourceLabels[srcKey]!,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DeltaPill extends StatelessWidget {
  const _DeltaPill({required this.delta});

  final double delta;

  @override
  Widget build(BuildContext context) {
    final up = delta >= 0;
    final sign = up ? '+' : '';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            up ? Icons.arrow_upward : Icons.arrow_downward,
            size: 11,
            color: Colors.white.withValues(alpha: 0.7),
          ),
          const SizedBox(width: 3),
          Text(
            '$sign${delta.toStringAsFixed(0)}%',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.75),
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}

/// fl_chart line chart: one line per source + baseline ±1σ reference band.
class _MetricChart extends StatelessWidget {
  const _MetricChart({required this.meta, required this.result});

  final BiometricMetricMeta meta;
  final MetricSeriesResult result;

  @override
  Widget build(BuildContext context) {
    // Build a unified x-axis of yyyy-mm-dd across all present sources, sorted.
    final dates = <String>{};
    for (final series in result.seriesBySource.values) {
      for (final p in series) {
        if (p.value != null) dates.add(p.dateYmd);
      }
    }
    final sortedDates = dates.toList()..sort();
    final xIndex = {for (var i = 0; i < sortedDates.length; i++) sortedDates[i]: i};

    final lineBars = <LineChartBarData>[];
    var minY = double.infinity;
    var maxY = -double.infinity;

    for (final source in result.presentSources) {
      final series = result.seriesBySource[source]!;
      final spots = <FlSpot>[];
      for (final p in series) {
        final v = p.value;
        final xi = xIndex[p.dateYmd];
        if (v == null || xi == null) continue;
        spots.add(FlSpot(xi.toDouble(), v));
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
      if (spots.isEmpty) continue;
      spots.sort((a, b) => a.x.compareTo(b.x));
      final color = sourceColorFor(source);
      lineBars.add(
        LineChartBarData(
          spots: spots,
          isCurved: true,
          curveSmoothness: 0.25,
          color: color,
          barWidth: 2.5,
          isStrokeCapRound: true,
          dotData: FlDotData(
            show: result.days <= 30,
            getDotPainter: (spot, _, __, ___) => FlDotCirclePainter(
              radius: 2.5,
              color: color,
              strokeWidth: 0,
            ),
          ),
          belowBarData: BarAreaData(show: false),
        ),
      );
    }

    // Baseline ±1σ reference band (§3).
    final mean = result.baseline.mean;
    final stddev = result.baseline.stddev;
    ExtraLinesData? extraLines;
    if (mean != null && stddev != null) {
      final sd = stddev < mean * 0.05 ? mean * 0.05 : stddev;
      final lo = mean - sd;
      final hi = mean + sd;
      if (lo < minY) minY = lo;
      if (hi > maxY) maxY = hi;
      extraLines = ExtraLinesData(
        horizontalLines: [
          HorizontalLine(
            y: mean,
            color: Colors.white.withValues(alpha: 0.25),
            strokeWidth: 1,
            dashArray: [4, 4],
          ),
          HorizontalLine(
            y: hi,
            color: Colors.white.withValues(alpha: 0.12),
            strokeWidth: 1,
          ),
          HorizontalLine(
            y: lo,
            color: Colors.white.withValues(alpha: 0.12),
            strokeWidth: 1,
          ),
        ],
      );
    }

    if (!minY.isFinite || !maxY.isFinite) {
      return const SizedBox.shrink();
    }
    final span = (maxY - minY).abs() < 0.001 ? 1.0 : (maxY - minY);
    final pad = span * 0.12;

    return LineChart(
      LineChartData(
        minY: minY - pad,
        maxY: maxY + pad,
        minX: 0,
        maxX: (sortedDates.length - 1).toDouble().clamp(1, double.infinity),
        clipData: const FlClipData.all(),
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        extraLinesData: extraLines,
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 20,
              interval: (sortedDates.length - 1)
                  .toDouble()
                  .clamp(1, double.infinity),
              getTitlesWidget: (value, _) {
                final i = value.round();
                if (i < 0 || i >= sortedDates.length) {
                  return const SizedBox.shrink();
                }
                // Show start, middle, and end date labels on the x-axis.
                final tickIdx = sortedDates.length <= 3
                    ? List.generate(sortedDates.length, (j) => j)
                    : [0, sortedDates.length ~/ 2, sortedDates.length - 1];
                if (!tickIdx.contains(i)) {
                  return const SizedBox.shrink();
                }
                final d = DateTime.tryParse(sortedDates[i]);
                final label = d == null
                    ? ''
                    : (sortedDates.length > 60
                        ? DateFormat.yMMMd().format(d)
                        : DateFormat.MMMd().format(d));
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    label,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 10,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        lineTouchData: const LineTouchData(enabled: false),
        lineBarsData: lineBars,
      ),
    );
  }
}

/// Source color legend.
class SourceLegend extends StatelessWidget {
  const SourceLegend({super.key, required this.sources});

  final List<SourceKey> sources;

  @override
  Widget build(BuildContext context) {
    if (sources.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: [
        for (final s in sources)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 3,
                decoration: BoxDecoration(
                  color: sourceColorFor(s),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                sourceLabels[s]!,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
            ],
          ),
      ],
    );
  }
}

class _RangeSelector extends StatelessWidget {
  const _RangeSelector({required this.selected, required this.onSelected});

  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Wrap(
      spacing: 8,
      children: [
        for (final option in rangeOptions)
          _Pill(
            label: option.label,
            selected: selected == option.days,
            activeColor: purple,
            onTap: () => onSelected(option.days),
          ),
      ],
    );
  }
}

class _CompareSelector extends StatelessWidget {
  const _CompareSelector({required this.selected, required this.onSelected});

  final CompareMode selected;
  final ValueChanged<CompareMode> onSelected;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    return Wrap(
      spacing: 8,
      children: [
        for (final mode in CompareMode.values)
          _Pill(
            label: compareModeLabel(mode),
            selected: selected == mode,
            activeColor: purple,
            onTap: () => onSelected(mode),
          ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.selected,
    required this.activeColor,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? activeColor.withValues(alpha: 0.2)
          : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 36),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Center(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.95)
                          : Colors.white.withValues(alpha: 0.55),
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w500,
                    ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MetricNotFound extends StatelessWidget {
  const _MetricNotFound({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: ContentColumn(
        child: Padding(
          padding: const EdgeInsets.only(top: 32, bottom: 120),
          child: GlassSurface(
            borderRadius: 24,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Metric not found',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This signal is not available yet in Flutter.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: onBack,
                  child: const Text('Back to biometrics'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
