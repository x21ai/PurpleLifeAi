import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/glass_surface.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/condition_prompts.dart';
import 'models/score_snapshot.dart';

/// Horizontal metric strip for merged Today (sleep/HRV focus when relevant).
class TodayMetricStrip extends StatelessWidget {
  const TodayMetricStrip({
    super.key,
    required this.scores,
    required this.conditions,
    required this.onMetricTap,
  });

  final ScoreSnapshot scores;
  final List<String> conditions;
  final ValueChanged<String> onMetricTap;

  bool get _sleepHeartFocus {
    final lower = conditions.map((c) => c.toLowerCase()).toList();
    return lower.any(
      (c) =>
          c.contains('epilep') ||
          c.contains('sleep') ||
          c.contains('hypertension') ||
          c.contains('cardio'),
    );
  }

  List<_StripChip> _chips() {
    if (_sleepHeartFocus) {
      return [
        if (scores.sleepScore != null)
          _StripChip(
            label: 'Sleep',
            value: scores.sleepScore!.round().toString(),
            focused: true,
            metricKey: 'sleep_score',
          ),
        if (scores.hrvMs != null)
          _StripChip(
            label: 'HRV',
            value: '${scores.hrvMs!.round()} ms',
            focused: true,
            metricKey: 'hrv',
          ),
        if (scores.restingHr != null)
          _StripChip(
            label: 'Rest HR',
            value: scores.restingHr!.round().toString(),
            metricKey: 'resting_hr',
          ),
        if (scores.readiness != null)
          _StripChip(
            label: 'Ready',
            value: scores.readiness!.round().toString(),
            metricKey: 'readiness',
          ),
      ];
    }

    return [
      if (scores.readiness != null)
        _StripChip(
          label: 'Ready',
          value: scores.readiness!.round().toString(),
          focused: true,
          metricKey: 'readiness',
        ),
      if (scores.sleepScore != null)
        _StripChip(
          label: 'Sleep',
          value: scores.sleepScore!.round().toString(),
          metricKey: 'sleep_score',
        ),
      if (scores.activity != null)
        _StripChip(
          label: 'Activity',
          value: scores.activity!.round().toString(),
          metricKey: 'activity_score',
        ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final chips = _chips();
    if (chips.isEmpty) return const SizedBox.shrink();

    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: Row(
        children: [
          for (final chip in chips) ...[
            Material(
              color: chip.focused
                  ? purple.withValues(alpha: 0.12)
                  : parseTokenColor(colors.backgroundSecondary),
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: chip.metricKey == null
                    ? null
                    : () => onMetricTap(chip.metricKey!),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  constraints: const BoxConstraints(minWidth: 88),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: chip.focused
                          ? purple.withValues(alpha: 0.45)
                          : parseTokenColor(colors.divider),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        chip.label.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 0.06,
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        chip.value,
                        style: PurpleType.displayStyle(
                          fontSize: 18,
                          height: 1.1,
                          color: Colors.white.withValues(alpha: 0.95),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _StripChip {
  const _StripChip({
    required this.label,
    required this.value,
    this.focused = false,
    this.metricKey,
  });

  final String label;
  final String value;
  final bool focused;
  final String? metricKey;
}

/// Single protocol teaser card on merged Today.
class TodayProtocolTeaser extends StatelessWidget {
  const TodayProtocolTeaser({
    super.key,
    required this.conditions,
    required this.scores,
    required this.onSeePlan,
  });

  final List<String> conditions;
  final ScoreSnapshot scores;
  final VoidCallback onSeePlan;

  ({String title, String body}) _copy() {
    if (_sleepHeartFocus) {
      final sleep = scores.sleepScore?.round();
      return (
        title: 'Protect sleep window',
        body: sleep != null
            ? 'Sleep score $sleep today. Aim for a consistent wind-down if rest was short.'
            : 'Your focus includes sleep and heart recovery. Protect tonight\'s wind-down.',
      );
    }
    return (
      title: 'Daily check-in',
      body: 'Log mood and meds adherence in Journal to keep Maya\'s insight grounded.',
    );
  }

  bool get _sleepHeartFocus {
    final lower = conditions.map((c) => c.toLowerCase()).toList();
    return lower.any(
      (c) =>
          c.contains('epilep') ||
          c.contains('sleep') ||
          c.contains('hypertension') ||
          c.contains('cardio'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final copy = _copy();
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return GlassSurface(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: purple.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Text(
              '1',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: purple,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  copy.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFF2F2F5),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  copy.body,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                        height: 1.4,
                      ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: onSeePlan,
                  child: const Text('See full plan'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Ask Maya starter chips (merged Today shows two).
class TodayAskMayaChips extends StatelessWidget {
  const TodayAskMayaChips({
    super.key,
    required this.conditions,
  });

  final List<String> conditions;

  @override
  Widget build(BuildContext context) {
    final starters = getSuggestedQuestions(conditions, cap: 2);
    if (starters.isEmpty) return const SizedBox.shrink();

    final colors = PurpleTokens.loaded.colorsFor('dark');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'ASK MAYA',
          style: TextStyle(
            fontSize: 11,
            letterSpacing: 0.08,
            fontWeight: FontWeight.w600,
            color: Colors.white.withValues(alpha: 0.55),
          ),
        ),
        const SizedBox(height: 8),
        for (final prompt in starters)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: parseTokenColor(colors.backgroundTertiary),
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: () {
                  final encoded = Uri.encodeComponent(prompt);
                  context.go('${AppRoutes.askMaya}?q=$encoded');
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: parseTokenColor(colors.divider)),
                  ),
                  child: Text(
                    prompt,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          height: 1.35,
                        ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Maya daily insight card (single narrative surface on merged Today).
class TodayMayaCard extends StatelessWidget {
  const TodayMayaCard({super.key, required this.narrative});

  final String narrative;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: purple.withValues(alpha: 0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'MAYA · daily insight',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 0.08,
              fontWeight: FontWeight.w600,
              color: purple,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            narrative.trim(),
            style: PurpleType.bodySerif(
              color: parseTokenColor(colors.textPrimary).withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }
}
