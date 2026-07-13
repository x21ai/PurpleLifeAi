import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../data/data_style.dart';
import '../shared/glass_helpers.dart';
import 'biometric_metrics.dart';
import 'metric_detail_screen.dart' show StatusBadge, warningTokenColor;
import 'vitals_repository.dart';

/// Local optimistic pin state layered over [pinnedMetricsProvider].
final _pinnedOverrideProvider = StateProvider<List<String>?>((ref) => null);

/// Biometrics hub: all 18 metrics grouped by category, a "Needs a look"
/// attention section, range + compare pickers, and pin/unpin persistence.
class BiometricsHubScreen extends ConsumerStatefulWidget {
  const BiometricsHubScreen({super.key});

  @override
  ConsumerState<BiometricsHubScreen> createState() =>
      _BiometricsHubScreenState();
}

class _BiometricsHubScreenState extends ConsumerState<BiometricsHubScreen> {
  int _rangeDays = 30;
  CompareMode _compare = CompareMode.none;

  List<MetricSeriesQuery> get _queries => [
        for (final key in metricOrder)
          MetricSeriesQuery(
            metricKey: key,
            days: _rangeDays,
            compareMode: _compare,
          ),
      ];

  Future<void> _refresh() async {
    ref.invalidate(pinnedMetricsProvider);
    for (final q in _queries) {
      ref.invalidate(metricSeriesProvider(q));
    }
    await Future.wait([
      ref.read(pinnedMetricsProvider.future),
      ...(_queries.map((q) => ref.read(metricSeriesProvider(q).future))),
    ]);
  }

  Future<void> _togglePin(String key, List<String> current) async {
    final next = List<String>.from(current);
    if (next.contains(key)) {
      next.remove(key);
    } else {
      next.add(key);
    }
    // Optimistic update.
    ref.read(_pinnedOverrideProvider.notifier).state = next;
    try {
      await ref.read(vitalsRepositoryProvider).savePinnedMetrics(next);
      ref.invalidate(pinnedMetricsProvider);
    } catch (_) {
      // Rollback.
      ref.read(_pinnedOverrideProvider.notifier).state = current;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not save pin')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pinnedAsync = ref.watch(pinnedMetricsProvider);
    final pinnedOverride = ref.watch(_pinnedOverrideProvider);
    final pinned = pinnedOverride ?? pinnedAsync.valueOrNull ?? const [];

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DataBackLink(
                  label: 'My Health',
                  onTap: () => context.go(AppRoutes.myHealth),
                ),
                const SizedBox(height: 32),
                const DataHeroHeader(
                  eyebrow: 'Your body',
                  title: 'Every signal\nPurple reads.',
                ),
                const SizedBox(height: 20),
                _RangeSelector(
                  selected: _rangeDays,
                  onSelected: (d) => setState(() => _rangeDays = d),
                ),
                const SizedBox(height: 12),
                _CompareSelector(
                  selected: _compare,
                  onSelected: (m) => setState(() => _compare = m),
                ),
                const SizedBox(height: 8),
                if (pinnedAsync.isLoading && pinnedOverride == null)
                  const SizedBox.shrink(),
                _HubSections(
                  rangeDays: _rangeDays,
                  compare: _compare,
                  pinned: pinned,
                  onTogglePin: (key) => _togglePin(key, pinned),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Watches every metric series and lays out attention / pinned / by-category.
class _HubSections extends ConsumerWidget {
  const _HubSections({
    required this.rangeDays,
    required this.compare,
    required this.pinned,
    required this.onTogglePin,
  });

  final int rangeDays;
  final CompareMode compare;
  final List<String> pinned;
  final ValueChanged<String> onTogglePin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Resolve each metric's series result (or null while loading).
    final results = <String, MetricSeriesResult?>{};
    var anyLoading = false;
    for (final key in metricOrder) {
      final q = MetricSeriesQuery(
        metricKey: key,
        days: rangeDays,
        compareMode: compare,
      );
      final async = ref.watch(metricSeriesProvider(q));
      if (async.isLoading && !async.hasValue) anyLoading = true;
      results[key] = async.valueOrNull;
    }

    // Needs a look: metrics whose status is attention-worthy.
    final attention = metricOrder.where((key) {
      final r = results[key];
      if (r == null) return false;
      return isAttention(biometricMetrics[key]!, r.status);
    }).toList();

    // Metrics with at least one reading (for by-category visibility).
    bool hasReading(String key) {
      final r = results[key];
      return r != null && r.presentSources.isNotEmpty;
    }

    final pinnedShown =
        metricOrder.where((k) => pinned.contains(k)).toList();

    final children = <Widget>[];

    // 1. Needs a look.
    if (attention.isNotEmpty) {
      children
        ..add(const SizedBox(height: 28))
        ..add(_AttentionBanner(attentionKeys: attention))
        ..add(const SizedBox(height: 12));
      for (final key in attention) {
        children
          ..add(_MetricCard(
            metricKey: key,
            result: results[key],
            pinned: pinned.contains(key),
            onTogglePin: () => onTogglePin(key),
            hero: false,
          ))
          ..add(const SizedBox(height: 12));
      }
    }

    // 2. Pinned (hero cards), excluding those already in attention.
    final pinnedNotAttention =
        pinnedShown.where((k) => !attention.contains(k)).toList();
    if (pinnedNotAttention.isNotEmpty) {
      children
        ..add(const SizedBox(height: 16))
        ..add(const _SectionLabel('Pinned'))
        ..add(const SizedBox(height: 12));
      for (final key in pinnedNotAttention) {
        children
          ..add(_MetricCard(
            metricKey: key,
            result: results[key],
            pinned: true,
            onTogglePin: () => onTogglePin(key),
            hero: true,
          ))
          ..add(const SizedBox(height: 12));
      }
    }

    // 3. By category: not pinned, not attention, ≥1 reading.
    for (final category in categoryOrder) {
      final keys = metricOrder.where((key) {
        if (biometricMetrics[key]!.category != category) return false;
        if (attention.contains(key)) return false;
        if (pinned.contains(key)) return false;
        return hasReading(key);
      }).toList();
      if (keys.isEmpty) continue;
      children
        ..add(const SizedBox(height: 16))
        ..add(_SectionLabel(categoryLabel[category]!))
        ..add(const SizedBox(height: 12));
      for (final key in keys) {
        children
          ..add(_MetricCard(
            metricKey: key,
            result: results[key],
            pinned: false,
            onTogglePin: () => onTogglePin(key),
            hero: false,
          ))
          ..add(const SizedBox(height: 12));
      }
    }

    if (children.isEmpty) {
      // Avoid flashing a false empty state while series are still loading.
      if (anyLoading) {
        return const Padding(
          padding: EdgeInsets.only(top: 48),
          child: Center(child: CircularProgressIndicator()),
        );
      }
      return Padding(
        padding: const EdgeInsets.only(top: 28),
        child: Text(
          'No readings yet. Connect a wearable to start seeing your signals.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.65),
                height: 1.5,
              ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }
}

class _AttentionBanner extends StatelessWidget {
  const _AttentionBanner({required this.attentionKeys});

  final List<String> attentionKeys;

  @override
  Widget build(BuildContext context) {
    final n = attentionKeys.length;
    final title = n == 1 ? '1 signal needs a look' : '$n signals need a look';
    final shorts = attentionKeys
        .take(6)
        .map((k) => biometricMetrics[k]!.short)
        .join(', ');
    final sub = attentionKeys.length > 6 ? '$shorts…' : shorts;
    final warn = warningTokenColor();

    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.warning_amber_rounded, size: 18, color: warn),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  sub,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.6),
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

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
            letterSpacing: 1.2,
            color: Colors.white.withValues(alpha: 0.45),
          ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.metricKey,
    required this.result,
    required this.pinned,
    required this.onTogglePin,
    required this.hero,
  });

  final String metricKey;
  final MetricSeriesResult? result;
  final bool pinned;
  final VoidCallback onTogglePin;
  final bool hero;

  @override
  Widget build(BuildContext context) {
    final meta = biometricMetrics[metricKey]!;
    final r = result;
    final display = meta.format(r?.headlineValue);
    final tone = r == null ? null : statusTone(meta, r.status);
    final valueColor = tone?.tone == StatusTone.warn
        ? warningTokenColor()
        : Colors.white.withValues(alpha: 0.95);

    return GlassCard(
      onTap: () => context.go(AppRoutes.biometricsMetric(metricKey)),
      padding: EdgeInsets.all(hero ? 22 : 18),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        meta.label,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                      ),
                    ),
                    if (r != null && r.status != MetricStatus.unknown) ...[
                      const SizedBox(width: 8),
                      StatusBadge(meta: meta, status: r.status),
                    ],
                  ],
                ),
                const SizedBox(height: 8),
                Text.rich(
                  TextSpan(
                    text: display,
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(
                          fontFamily: PurpleType.serif,
                          fontSize: hero ? 40 : 30,
                          color: valueColor,
                          height: 1,
                        ),
                    children: meta.unit == null
                        ? null
                        : [
                            TextSpan(
                              text: ' ${meta.unit}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: Colors.white
                                        .withValues(alpha: 0.5),
                                  ),
                            ),
                          ],
                  ),
                ),
                if (r != null && r.headlineSource != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    'via ${sourceLabels[r.headlineSource] ?? sourceKeyToString(r.headlineSource!)}'
                    '${_deltaSuffix(r)}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.45),
                        ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            onPressed: onTogglePin,
            visualDensity: VisualDensity.compact,
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: Icon(
              pinned ? Icons.push_pin : Icons.push_pin_outlined,
              size: 18,
              color: pinned
                  ? Colors.white.withValues(alpha: 0.85)
                  : Colors.white.withValues(alpha: 0.4),
            ),
            tooltip: pinned ? 'Unpin' : 'Pin',
          ),
        ],
      ),
    );
  }

  String _deltaSuffix(MetricSeriesResult r) {
    final d = r.deltaPct;
    if (d == null) return '';
    final sign = d >= 0 ? '+' : '';
    return '  ·  $sign${d.toStringAsFixed(0)}% ${_compareWord(r.compareMode)}';
  }

  String _compareWord(CompareMode mode) {
    switch (mode) {
      case CompareMode.none:
        return '';
      case CompareMode.previous:
        return 'vs previous';
      case CompareMode.yearAgo:
        return 'vs year ago';
    }
  }
}

class _RangeSelector extends StatelessWidget {
  const _RangeSelector({required this.selected, required this.onSelected});

  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: [
        for (final option in rangeOptions)
          _Pill(
            label: option.label,
            selected: selected == option.days,
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
    return Wrap(
      spacing: 8,
      children: [
        for (final mode in CompareMode.values)
          _Pill(
            label: compareModeLabel(mode),
            selected: selected == mode,
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
          : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 36),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
