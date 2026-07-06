import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/glass_surface.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../plan/recommended_catalog.dart';
import '../shared/condition_prompts.dart';
import 'models/score_snapshot.dart';

bool sleepHeartFocusForConditions(List<String> conditions) {
  final lower = conditions.map((c) => c.toLowerCase()).toList();
  return lower.any(
    (c) =>
        c.contains('epilep') ||
        c.contains('sleep') ||
        c.contains('hypertension') ||
        c.contains('cardio'),
  );
}

/// Onboarding / personalization pill (Merged preview `onboarding-pill`).
class TodayPersonalizationStrip extends StatelessWidget {
  const TodayPersonalizationStrip({
    super.key,
    required this.conditions,
    required this.hasWearableData,
    required this.hasLabs,
    required this.onTap,
  });

  final List<String> conditions;
  final bool hasWearableData;
  final bool hasLabs;
  final VoidCallback onTap;

  int get _completed {
    var n = 0;
    if (conditions.isNotEmpty) n++;
    if (hasWearableData) n++;
    if (hasLabs) n++;
    return n;
  }

  String get _detail {
    final parts = <String>[];
    if (hasWearableData) parts.add('wearables');
    if (hasLabs) parts.add('labs');
    if (conditions.isNotEmpty) parts.add('conditions');
    return parts.isEmpty ? 'complete your profile' : parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    if (_completed == 0) return const SizedBox.shrink();

    final colors = PurpleTokens.loaded.colorsFor('dark');
    final complete = _completed >= 3;

    return Material(
      color: parseTokenColor(colors.backgroundTertiary),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: parseTokenColor(colors.divider)),
          ),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: complete
                      ? parseTokenColor(colors.success)
                      : parseTokenColor(colors.purplePrimary),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  complete
                      ? 'Onboarding complete · 3/3 · $_detail'
                      : 'Setup · $_completed/3 · $_detail',
                  style: PurpleType.sansStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dual score hero: readiness gauge + sleep card (Expanded preview `hero-scores`).
class TodayDualScoreHero extends StatelessWidget {
  const TodayDualScoreHero({
    super.key,
    required this.scores,
    required this.conditions,
    this.onMetricTap,
  });

  final ScoreSnapshot scores;
  final List<String> conditions;
  final ValueChanged<String>? onMetricTap;

  bool get _sleepHeartFocus => sleepHeartFocusForConditions(conditions);

  @override
  Widget build(BuildContext context) {
    final readiness = scores.readiness;
    final sleep = scores.sleepScore;
    if (readiness == null && sleep == null) return const SizedBox.shrink();

    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (readiness != null)
          Expanded(
            child: _ReadinessGaugeCard(
              score: readiness,
              purple: purple,
              colors: colors,
              onTap: onMetricTap == null
                  ? null
                  : () => onMetricTap!('readiness'),
            ),
          ),
        if (readiness != null && sleep != null) const SizedBox(width: 10),
        if (sleep != null)
          Expanded(
            child: _SleepScoreCard(
              score: sleep.round(),
              focused: _sleepHeartFocus,
              purple: purple,
              onTap: onMetricTap == null
                  ? null
                  : () => onMetricTap!('sleep_score'),
            ),
          ),
      ],
    );
  }
}

class _ReadinessGaugeCard extends StatelessWidget {
  const _ReadinessGaugeCard({
    required this.score,
    required this.purple,
    required this.colors,
    this.onTap,
  });

  final double score;
  final Color purple;
  final PurpleColorTokens colors;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: purple.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: purple.withValues(alpha: 0.45)),
      ),
      child: Column(
        children: [
          SizedBox(
            width: 120,
            height: 64,
            child: ClipRect(
              child: Align(
                alignment: Alignment.topCenter,
                heightFactor: 0.55,
                child: CustomPaint(
                  size: const Size(120, 120),
                  painter: _ReadinessArcPainter(
                    score: score.clamp(0, 100),
                    trackColor: parseTokenColor(colors.backgroundTertiary),
                    progressColor: purple,
                  ),
                ),
              ),
            ),
          ),
          Text(
            'READINESS',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 0.06,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            score.round().toString(),
            style: PurpleType.displayStyle(
              fontSize: 36,
              height: 1,
              color: purple,
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: card,
      ),
    );
  }
}

class _ReadinessArcPainter extends CustomPainter {
  _ReadinessArcPainter({
    required this.score,
    required this.trackColor,
    required this.progressColor,
  });

  final double score;
  final Color trackColor;
  final Color progressColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;
    final rect = Rect.fromCircle(center: center, radius: radius);
    const startAngle = math.pi;
    const sweep = math.pi;

    final track = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, startAngle, sweep, false, track);

    final progress = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      rect,
      startAngle,
      sweep * (score / 100),
      false,
      progress,
    );
  }

  @override
  bool shouldRepaint(covariant _ReadinessArcPainter oldDelegate) =>
      oldDelegate.score != score;
}

class _SleepScoreCard extends StatelessWidget {
  const _SleepScoreCard({
    required this.score,
    required this.focused,
    required this.purple,
    this.onTap,
  });

  final int score;
  final bool focused;
  final Color purple;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final card = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: focused
            ? purple.withValues(alpha: 0.12)
            : parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: focused
              ? purple.withValues(alpha: 0.45)
              : parseTokenColor(colors.divider),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 28),
          Text(
            'SLEEP',
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 0.06,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '$score',
            style: PurpleType.displayStyle(
              fontSize: 36,
              height: 1,
              color: purple,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'last night',
            style: PurpleType.sansStyle(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
        ],
      ),
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: card,
      ),
    );
  }
}

/// Top recommended card inline on merged Today (preview `rec-inline`).
class TodayRecommendedInline extends StatelessWidget {
  const TodayRecommendedInline({
    super.key,
    required this.conditions,
    required this.hasLabs,
  });

  final List<String> conditions;
  final bool hasLabs;

  @override
  Widget build(BuildContext context) {
    final items = rankedRecommendedItems(
      conditions: conditions,
      ctx: RecommendedContext(hasLabs: hasLabs),
    );
    if (items.isEmpty) return const SizedBox.shrink();

    final item = items.first;
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Divider(height: 28),
        Row(
          children: [
            Text(
              'RECOMMENDED',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 0.08,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => context.go('${AppRoutes.plan}?segment=recommended'),
              child: Text(
                'see all',
                style: PurpleType.sansStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: purple,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Material(
          color: purple.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: () => context.go('${AppRoutes.plan}?segment=recommended'),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: purple.withValues(alpha: 0.35)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.category.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 0.06,
                      color: purple.withValues(alpha: 0.85),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFF2F2F5),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'See on Plan',
                    style: PurpleType.sansStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: purple,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Horizontal metric strip for merged Today (sleep/HRV/efficiency/rest HR focus).
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

  bool get _sleepHeartFocus => sleepHeartFocusForConditions(conditions);

  static const _emptyValue = '—';

  String _formatSleep() {
    final score = scores.sleepScore;
    if (score == null) return _emptyValue;
    return score.round().toString();
  }

  String _formatHrv() {
    final hrv = scores.hrvMs;
    if (hrv == null) return _emptyValue;
    return '${hrv.round()} ms';
  }

  String _formatEfficiency() {
    final pct = scores.sleepEfficiencyPct;
    if (pct == null) return _emptyValue;
    return '${pct.round()}%';
  }

  String _formatRestHr() {
    final hr = scores.restingHr;
    if (hr == null) return _emptyValue;
    return hr.round().toString();
  }

  String _formatReadiness() {
    final ready = scores.readiness;
    if (ready == null) return _emptyValue;
    return ready.round().toString();
  }

  String _formatActivity() {
    final activity = scores.activity;
    if (activity == null) return _emptyValue;
    return activity.round().toString();
  }

  List<_StripChip> _chips() {
    if (_sleepHeartFocus) {
      return [
        _StripChip(
          label: 'Sleep',
          value: _formatSleep(),
          focused: scores.sleepScore != null,
          metricKey: scores.sleepScore != null ? 'sleep_score' : null,
        ),
        _StripChip(
          label: 'HRV',
          value: _formatHrv(),
          focused: scores.hrvMs != null,
          metricKey: scores.hrvMs != null ? 'hrv' : null,
        ),
        _StripChip(
          label: 'Efficiency',
          value: _formatEfficiency(),
          focused: scores.sleepEfficiencyPct != null,
          metricKey:
              scores.sleepEfficiencyPct != null ? 'sleep_efficiency' : null,
        ),
        _StripChip(
          label: 'Rest HR',
          value: _formatRestHr(),
          focused: scores.restingHr != null,
          metricKey: scores.restingHr != null ? 'resting_hr' : null,
        ),
      ];
    }

    return [
      _StripChip(
        label: 'Ready',
        value: _formatReadiness(),
        focused: scores.readiness != null,
        metricKey: scores.readiness != null ? 'readiness' : null,
      ),
      _StripChip(
        label: 'Sleep',
        value: _formatSleep(),
        focused: false,
        metricKey: scores.sleepScore != null ? 'sleep_score' : null,
      ),
      _StripChip(
        label: 'Activity',
        value: _formatActivity(),
        focused: false,
        metricKey: scores.activity != null ? 'activity_score' : null,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final chips = _chips();
    if (chips.isEmpty) return const SizedBox.shrink();

    final colors = PurpleTokens.loaded.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final muted = Colors.white.withValues(alpha: 0.45);

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
                          color: chip.value == _emptyValue
                              ? muted
                              : Colors.white.withValues(alpha: 0.95),
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

  bool get _sleepHeartFocus => sleepHeartFocusForConditions(conditions);

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
