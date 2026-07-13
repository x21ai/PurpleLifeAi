import 'package:flutter/material.dart';

import '../../design/tokens.dart';
import '../hydration/today_hydration_panel.dart';
import '../shared/glass_helpers.dart';
import '../shared/score_tile.dart';
import 'models/score_snapshot.dart';

/// Which Today expand panel is open (Merged preview accordion).
enum TodayExpandPanel { meds, hydration, wearables, log }

/// Three-up Readiness / Sleep / Activity tiles for Merged Today.
class TodayScoreTiles extends StatelessWidget {
  const TodayScoreTiles({
    super.key,
    required this.scores,
    this.onTapData,
  });

  final ScoreSnapshot scores;
  final VoidCallback? onTapData;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ScoreTile(
            label: 'Readiness',
            value: scores.readiness,
            active: scores.readiness != null,
            onTap: onTapData,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ScoreTile(
            label: 'Sleep',
            value: scores.sleepScore,
            active: scores.sleepScore != null,
            onTap: onTapData,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ScoreTile(
            label: 'Activity',
            value: scores.activity,
            active: scores.activity != null,
            onTap: onTapData,
          ),
        ),
      ],
    );
  }
}

/// "Your signals" grid matching Merged preview.
class TodayYourSignals extends StatelessWidget {
  const TodayYourSignals({
    super.key,
    required this.scores,
    required this.onViewAll,
    required this.onMetricTap,
  });

  final ScoreSnapshot scores;
  final VoidCallback onViewAll;
  final ValueChanged<String> onMetricTap;

  static const _empty = '—';

  String _fmt(double? v, {int digits = 0, String? unit}) {
    if (v == null) return _empty;
    final n = digits == 0 ? v.round().toString() : v.toStringAsFixed(digits);
    return unit == null ? n : '$n$unit';
  }

  String _fmtSteps(double? v) {
    if (v == null) return _empty;
    final n = v.round();
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
    final muted = Colors.white.withValues(alpha: 0.45);
    final items = <({String key, String label, String value})>[
      (key: 'hrv', label: 'HRV', value: _fmt(scores.hrvMs, unit: ' ms')),
      (
        key: 'resting_hr',
        label: 'Resting HR',
        value: _fmt(scores.restingHr, unit: ' bpm'),
      ),
      (
        key: 'spo2',
        label: 'SpO2',
        value: scores.spo2 == null
            ? _empty
            : '${scores.spo2!.toStringAsFixed(1)}%',
      ),
      (key: 'stress', label: 'Stress', value: _fmt(scores.stress)),
      (key: 'steps', label: 'Steps', value: _fmtSteps(scores.steps)),
      (
        key: 'sleep_score',
        label: 'Sleep score',
        value: _fmt(scores.sleepScore),
      ),
      (
        key: 'temp_delta',
        label: 'Temp Δ',
        value: scores.tempDeviationC == null
            ? _empty
            : '${scores.tempDeviationC! >= 0 ? '+' : ''}${scores.tempDeviationC!.toStringAsFixed(1)}°',
      ),
      (
        key: 'respiratory_rate',
        label: 'Resp',
        value: _fmt(scores.respRateBpm, digits: 1),
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
            TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(
                foregroundColor: Colors.white.withValues(alpha: 0.55),
                padding: EdgeInsets.zero,
                minimumSize: Size(tokens.touch.minTarget, tokens.touch.minTarget),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('View all ›', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 10),
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
              color: Colors.white.withValues(alpha: 0.06),
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
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              height: 1,
                              color: Colors.white,
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
          : Colors.white.withValues(alpha: 0.06),
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
                      : Colors.white.withValues(alpha: 0.75),
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected
                        ? Colors.white.withValues(alpha: 0.95)
                        : Colors.white.withValues(alpha: 0.6),
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
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ),
              if (trailing != null) trailing!,
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.close, size: 18),
                color: Colors.white.withValues(alpha: 0.55),
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

/// Always-visible Last 7 days stub + deep link (no More disclosure).
class TodayLastSevenDaysCard extends StatelessWidget {
  const TodayLastSevenDaysCard({
    super.key,
    required this.onOpenData,
  });

  final VoidCallback onOpenData;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final muted = Colors.white.withValues(alpha: 0.55);

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
          Text(
            'Trends for readiness, sleep, and activity. Open Data for the full chart.',
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: onOpenData,
              style: TextButton.styleFrom(
                foregroundColor: parseTokenColor(
                  PurpleTokens.loaded.colorsFor('dark').purplePrimary,
                ),
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

/// Compact hydration expand body (delegates to hydration feature panel).
class TodayHydrationExpandBody extends StatelessWidget {
  const TodayHydrationExpandBody({super.key, required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return TodayHydrationPanel(onOpenDayView: onOpen);
  }
}

/// Wearables expander body (connection management stays on Tools).
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
            color: Colors.white.withValues(alpha: 0.65),
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
