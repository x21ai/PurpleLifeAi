import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../design/tokens.dart';
import '../hydration/hydration_repository.dart';
import '../shared/glass_helpers.dart';
import '../shared/score_hero.dart';
import '../shared/score_tile.dart';
import 'models/score_snapshot.dart';
import 'seven_day_trends.dart';
import 'today_focus_store.dart';
import 'today_repository.dart';
import '../../design/ploy_colors.dart';

/// Which Today expand panel is open (Merged preview accordion).
enum TodayExpandPanel { meds, hydration, wearables, log }

/// Three-up Readiness / Sleep / Activity tiles for Merged Today.
///
/// The focused tile is the active one. A second tap on that tile (when it has
/// a real score) opens the ScoreHero detail overlay. Focus is stored with the
/// same key as web Today (`purple-today-focus`) and restored on the next launch.
class TodayScoreTiles extends StatefulWidget {
  const TodayScoreTiles({
    super.key,
    required this.scores,
    this.narrative,
    this.onSeeFullReading,
  });

  final ScoreSnapshot scores;
  final String? narrative;
  final VoidCallback? onSeeFullReading;

  @override
  State<TodayScoreTiles> createState() => _TodayScoreTilesState();
}

class _TodayScoreTilesState extends State<TodayScoreTiles> {
  String _focus = todayFocusFallback;
  var _userChose = false;

  @override
  void initState() {
    super.initState();
    unawaited(_loadFocus());
  }

  Future<void> _loadFocus() async {
    final saved = await readTodayFocus();
    if (!mounted || _userChose || saved == _focus) return;
    setState(() => _focus = saved);
  }

  void _onTap(String key, double? value) {
    if (value == null) return;
    if (_focus == key) {
      showTodayScoreDetail(
        context,
        label: switch (key) {
          'readiness' => 'Readiness',
          'activity' => 'Activity',
          _ => 'Sleep',
        },
        score: value,
        narrative: widget.narrative,
        onSeeFullReading: widget.onSeeFullReading,
      );
      return;
    }
    _userChose = true;
    setState(() => _focus = key);
    unawaited(writeTodayFocus(key));
  }

  @override
  Widget build(BuildContext context) {
    final scores = widget.scores;
    return Row(
      children: [
        Expanded(
          child: ScoreTile(
            label: 'Readiness',
            value: scores.readiness,
            active: _focus == 'readiness' && scores.readiness != null,
            onTap: () => _onTap('readiness', scores.readiness),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ScoreTile(
            label: 'Sleep',
            value: scores.sleepScore,
            active: _focus == 'sleep' && scores.sleepScore != null,
            onTap: () => _onTap('sleep', scores.sleepScore),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ScoreTile(
            label: 'Activity',
            value: scores.activity,
            active: _focus == 'activity' && scores.activity != null,
            onTap: () => _onTap('activity', scores.activity),
          ),
        ),
      ],
    );
  }
}

/// Full-screen score detail: ScoreHero, band phrase, narrative, risk link.
Future<void> showTodayScoreDetail(
  BuildContext context, {
  required String label,
  required double score,
  String? narrative,
  VoidCallback? onSeeFullReading,
}) {
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Close score detail',
    barrierColor: const Color(0x7318161D),
    pageBuilder: (dialogContext, _, __) {
      final muted = PloyColors.fromWhiteAlpha(0.7);
      return SafeArea(
        child: Material(
          color: Colors.transparent,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => Navigator.of(dialogContext).pop(),
                      icon: Icon(Icons.chevron_left, color: muted),
                      label: Text('Close', style: TextStyle(color: muted)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ScoreHero(
                    score: score,
                    label: label,
                    phrase: phraseForScore(score),
                    narrative: narrative,
                    compact: true,
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(dialogContext).pop();
                        onSeeFullReading?.call();
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: PloyColors.fromWhiteAlpha(0.8),
                        minimumSize: const Size(44, 44),
                      ),
                      child: const Text('See the full reading'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

/// "Your signals" grid matching Merged preview.
class TodayYourSignals extends StatelessWidget {
  const TodayYourSignals({
    super.key,
    required this.scores,
    required this.onViewAll,
    required this.onMetricTap,
    this.onConnect,
    this.isToday = true,
    this.emptyDateLabel,
  });

  final ScoreSnapshot scores;
  final VoidCallback onViewAll;
  final ValueChanged<String> onMetricTap;
  final VoidCallback? onConnect;
  final bool isToday;
  final String? emptyDateLabel;

  static String formatVital(TodayVitalItem item) {
    if (item.key == 'steps') return _groupDigits(item.value.round());
    if (item.key == 'spo2') {
      final text = item.value.toStringAsFixed(1);
      return item.unit == null ? text : '$text${item.unit}';
    }
    final whole = item.value == item.value.roundToDouble();
    final number =
        whole ? item.value.round().toString() : item.value.toStringAsFixed(1);
    final unit = item.unit;
    if (unit == null || unit.isEmpty) return number;
    return '$number $unit';
  }

  static String _groupDigits(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      final fromEnd = s.length - i;
      if (i > 0 && fromEnd % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final muted = PloyColors.fromWhiteAlpha(0.45);
    final vitals = buildTodayVitalItems(scores);
    final items = <({String key, String label, String value})>[
      for (final item in vitals)
        (
          key: item.metric ?? item.key,
          label: item.label,
          value: formatVital(item),
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(
              'YOUR SIGNALS',
              style: TextStyle(
                fontSize: tokens.typography.labelSize('labelEyebrow'),
                letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
                fontWeight: FontWeight.w600,
                color: muted,
              ),
            ),
            const Spacer(),
            if (items.isNotEmpty)
              TextButton(
                onPressed: onViewAll,
                style: TextButton.styleFrom(
                  foregroundColor: PloyColors.fromWhiteAlpha(0.55),
                  padding: EdgeInsets.zero,
                  minimumSize:
                      Size(tokens.touch.minTarget, tokens.touch.minTarget),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('View all ›', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 10),
        if (items.isEmpty)
          _SignalsEmpty(
            isToday: isToday,
            dateLabel: emptyDateLabel,
            onConnect: onConnect,
          )
        else
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 2.2,
          ),
          itemBuilder: (context, i) {
            final item = items[i];
            return Material(
              color: PloyColors.fromWhiteAlpha(0.06),
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () => onMetricTap(item.key),
                borderRadius: BorderRadius.circular(14),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          color: muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Same overflow pattern as ScoreTile: units like
                      // "+0.3°", "58 bpm", "12,345" must stay one line in
                      // the half-width grid (Temp Δ / Resp especially).
                      SizedBox(
                        width: double.infinity,
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            item.value,
                            maxLines: 1,
                            softWrap: false,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              height: 1,
                              color: PloyColors.ink,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _SignalsEmpty extends StatelessWidget {
  const _SignalsEmpty({
    required this.isToday,
    this.dateLabel,
    this.onConnect,
  });

  final bool isToday;
  final String? dateLabel;
  final VoidCallback? onConnect;

  @override
  Widget build(BuildContext context) {
    final muted = PloyColors.fromWhiteAlpha(0.55);
    return Material(
      color: PloyColors.fromWhiteAlpha(0.06),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isToday
                  ? 'Connect a device to see your signals'
                  : 'No signals recorded on ${dateLabel ?? 'this day'}.',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: PloyColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              isToday
                  ? 'Oura, Whoop, or Apple Health: your readings appear here once synced.'
                  : 'Purple only shows readings that were actually captured that day.',
              style: TextStyle(fontSize: 12, height: 1.4, color: muted),
            ),
            if (isToday && onConnect != null)
              TextButton(
                onPressed: onConnect,
                style: TextButton.styleFrom(
                  foregroundColor: PloyColors.fromWhiteAlpha(0.7),
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(44, 44),
                  alignment: Alignment.centerLeft,
                ),
                child: const Text('Connect'),
              ),
          ],
        ),
      ),
    );
  }
}

/// Meds / Hydration / Wearables / Log icon row (Merged preview).
class TodayIconActionRow extends StatelessWidget {
  const TodayIconActionRow({
    super.key,
    required this.expanded,
    required this.onSelect,
  });

  final TodayExpandPanel? expanded;
  final ValueChanged<TodayExpandPanel> onSelect;

  @override
  Widget build(BuildContext context) {
    final items = <(TodayExpandPanel, IconData, String)>[
      (TodayExpandPanel.meds, Icons.medication_outlined, 'Meds'),
      (TodayExpandPanel.hydration, Icons.water_drop_outlined, 'Hydration'),
      (TodayExpandPanel.wearables, Icons.watch_outlined, 'Wearables'),
      (TodayExpandPanel.log, Icons.bolt_outlined, 'Log'),
    ];

    return Row(
      children: [
        for (final item in items) ...[
          Expanded(
            child: _IconChip(
              icon: item.$2,
              label: item.$3,
              selected: expanded == item.$1,
              onTap: () => onSelect(item.$1),
            ),
          ),
          if (item != items.last) const SizedBox(width: 8),
        ],
      ],
    );
  }
}

class _IconChip extends StatelessWidget {
  const _IconChip({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Material(
      color: selected
          ? purple.withValues(alpha: 0.18)
          : PloyColors.fromWhiteAlpha(0.06),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: tokens.touch.minTarget),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: 20,
                  color: selected
                      ? purple
                      : PloyColors.fromWhiteAlpha(0.75),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected
                        ? PloyColors.fromWhiteAlpha(0.95)
                        : PloyColors.fromWhiteAlpha(0.6),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Expand panel chrome with close control.
class TodayExpandPanelShell extends StatelessWidget {
  const TodayExpandPanelShell({
    super.key,
    required this.title,
    required this.onClose,
    required this.child,
    this.trailing,
  });

  final String title;
  final VoidCallback onClose;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: PloyColors.fromWhiteAlpha(0.9),
                  ),
                ),
              ),
              if (trailing != null) trailing!,
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.close, size: 18),
                color: PloyColors.fromWhiteAlpha(0.55),
                constraints: BoxConstraints(
                  minWidth: tokens.touch.minTarget,
                  minHeight: tokens.touch.minTarget,
                ),
              ),
            ],
          ),
          child,
        ],
      ),
    );
  }
}

/// Last 7 days metric grid (capsule bars) plus a link to Data.
///
/// Rows appear only when that metric has a captured value. An empty week
/// stays an empty state, never sample bars.
class TodayLastSevenDaysCard extends ConsumerWidget {
  const TodayLastSevenDaysCard({
    super.key,
    required this.onOpenData,
  });

  final VoidCallback onOpenData;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final muted = PloyColors.fromWhiteAlpha(0.55);
    final purple = parseTokenColor(colors.purplePrimary);
    final trendsAsync = ref.watch(sevenDayTrendsProvider);
    final weekAsync = ref.watch(hydrationWeekProvider);
    final trends = trendsAsync.asData?.value ?? SevenDayTrends.empty;
    final week = weekAsync.asData?.value ?? HydrationWeekData.empty;
    final rows = _trendRows(trends, week);
    final loading = trendsAsync.isLoading && !trends.hasTrendData && !week.hasAny;

    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'LAST 7 DAYS',
            style: TextStyle(
              fontSize: tokens.typography.labelSize('labelEyebrow'),
              letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
              fontWeight: FontWeight.w600,
              color: muted,
            ),
          ),
          const SizedBox(height: 8),
          if (loading)
            Text(
              'Loading the last 7 days.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: PloyColors.fromWhiteAlpha(0.7),
              ),
            )
          else if (rows.isEmpty)
            Text(
              'No readings in the last 7 days yet.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: PloyColors.fromWhiteAlpha(0.7),
              ),
            )
          else
            Column(
              key: const Key('today-trend-grid'),
              children: [
                for (var i = 0; i < rows.length; i++) ...[
                  if (i > 0) const SizedBox(height: 14),
                  rows[i],
                ],
              ],
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: onOpenData,
              style: TextButton.styleFrom(
                foregroundColor: purple,
                padding: EdgeInsets.zero,
                minimumSize: Size(tokens.touch.minTarget, tokens.touch.minTarget),
              ),
              child: const Text('Open Data ›'),
            ),
          ),
        ],
      ),
    );
  }
}

List<Widget> _trendRows(SevenDayTrends trends, HydrationWeekData week) {
  final rows = <Widget>[];
  if (week.hasAny) {
    final maxMl = [
      week.goalMl,
      ...week.dailyMl,
    ].reduce((a, b) => a > b ? a : b);
    rows.add(
      _TrendMetric(
        label: 'Hydration',
        value: '${(week.totalMl / 1000).toStringAsFixed(2)} L',
        subtitle: 'week total',
        intensities: [
          for (final ml in week.dailyMl) maxMl <= 0 ? 0.0 : ml / maxMl,
        ],
        tone: _TrendTone.on,
      ),
    );
  }
  if (trends.stepsAvg != null) {
    final maxSteps = trends.days
        .map((d) => d.steps ?? 0)
        .fold<double>(0, (a, b) => a > b ? a : b);
    rows.add(
      _TrendMetric(
        label: 'Steps',
        value: _groupTrendDigits(trends.stepsAvg!),
        subtitle: 'weekly avg',
        intensities: [
          for (final day in trends.days)
            day.steps == null || maxSteps <= 0 ? 0 : day.steps! / maxSteps,
        ],
        tone: _TrendTone.on,
      ),
    );
  }
  if (trends.activityAvg != null) {
    rows.add(
      _TrendMetric(
        label: 'Activity avg',
        value: '${trends.activityAvg}',
        subtitle: null,
        intensities: [
          for (final day in trends.days)
            day.activity == null ? 0 : (day.activity! / 100).clamp(0, 1),
        ],
        tone: _TrendTone.on,
      ),
    );
  }
  if (trends.sleepAvgMin != null) {
    final debt = trends.sleepDebtMin;
    rows.add(
      _TrendMetric(
        label: 'Sleep avg',
        value: formatSleepMinutes(trends.sleepAvgMin!),
        subtitle: debt != null && debt > 60
            ? 'debt ${formatSleepMinutes(debt)}'
            : null,
        intensities: [
          for (final day in trends.days)
            day.sleepMin == null
                ? 0
                : (day.sleepMin! / SevenDayTrends.sleepTargetMin).clamp(0, 1),
        ],
        tone: _TrendTone.warn,
      ),
    );
  }
  if (trends.hrvAvgMs != null) {
    final delta = trends.hrvDelta14d;
    final deltaLabel = delta == null
        ? null
        : '${delta >= 0 ? '+' : ''}$delta ms vs prior week';
    final scale = trends.hrvAvgMs! < 20 ? 20.0 : trends.hrvAvgMs!.toDouble();
    rows.add(
      _TrendMetric(
        label: 'HRV avg',
        value: '${trends.hrvAvgMs} ms',
        subtitle: deltaLabel,
        intensities: [
          for (final day in trends.days)
            day.hrvMs == null ? 0 : (day.hrvMs! / scale).clamp(0, 1),
        ],
        tone: _TrendTone.on,
      ),
    );
  }
  if (trends.readinessDaysWithData > 0) {
    rows.add(
      _TrendMetric(
        label: 'Readiness',
        value: '${trends.readinessDaysAbove80}/7',
        subtitle: '≥80 on ${trends.readinessDaysAbove80} of 7 days',
        intensities: [
          for (final day in trends.days)
            day.readiness == null ? 0 : (day.readiness! / 100).clamp(0, 1),
        ],
        tone: _TrendTone.on,
      ),
    );
  }
  if (trends.dosesInWindow > 0) {
    rows.add(
      _TrendMetric(
        label: 'Missed doses',
        value: '${trends.missedDoses}',
        subtitle: 'across the week',
        intensities: [
          for (final day in trends.days) day.missedDoses > 0 ? 1.0 : 0.15,
        ],
        tone: _TrendTone.alert,
      ),
    );
  }
  return rows;
}

String _groupTrendDigits(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    final fromEnd = s.length - i;
    if (i > 0 && fromEnd % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}

enum _TrendTone { on, warn, alert }

class _TrendMetric extends StatelessWidget {
  const _TrendMetric({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.intensities,
    required this.tone,
  });

  final String label;
  final String value;
  final String? subtitle;
  final List<double> intensities;
  final _TrendTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final warn = parseTokenColor(colors.warning);
    final alert = parseTokenColor(colors.danger);
    final empty = PloyColors.fromWhiteAlpha(0.16);
    final muted = PloyColors.fromWhiteAlpha(0.55);

    Color barColor(double intensity) {
      if (intensity <= 0) return empty;
      if (tone == _TrendTone.alert) {
        return intensity < 0.5 ? empty : alert;
      }
      if (tone == _TrendTone.warn && intensity < 0.85) return warn;
      return purple.withValues(alpha: 0.45 + 0.55 * intensity.clamp(0, 1));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label.toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      letterSpacing: 0.4,
                      color: muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: TextStyle(fontSize: 11, color: muted),
                    ),
                ],
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: PloyColors.ink,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (var i = 0; i < intensities.length; i++) ...[
              if (i > 0) const SizedBox(width: 4),
              Expanded(
                child: Container(
                  height: 10,
                  decoration: BoxDecoration(
                    color: barColor(intensities[i]),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

/// Compact hydration / wearables / log panel bodies for expanders.
///
/// Hydration expand on Today uses [TodayHydrationPanel] (progress + quick-add).
/// Keep this stub only if a screen needs a deep-link-only fallback.
class TodayHydrationExpandBody extends StatelessWidget {
  const TodayHydrationExpandBody({super.key, required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Log every drink, water and electrolytes.',
          style: TextStyle(
            fontSize: 13,
            color: PloyColors.fromWhiteAlpha(0.65),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: onOpen,
          child: const Text('Open hydration'),
        ),
      ],
    );
  }
}

class TodayWearablesExpandBody extends StatelessWidget {
  const TodayWearablesExpandBody({
    super.key,
    required this.onOpenTools,
  });

  final VoidCallback onOpenTools;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Manage Oura, Apple Health, and WHOOP sync from Tools.',
          style: TextStyle(
            fontSize: 13,
            color: PloyColors.fromWhiteAlpha(0.65),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: onOpenTools,
          child: const Text('Open Tools'),
        ),
      ],
    );
  }
}
