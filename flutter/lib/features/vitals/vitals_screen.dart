import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/metric_constants.dart';
import '../today/today_repository.dart';
import 'sync_status_bar.dart';

/// Vitals metric grid with glass cards. No fake readings when data is absent.
class VitalsScreen extends ConsumerWidget {
  const VitalsScreen({super.key});

  static const _emptyValue = '–';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshotAsync = ref.watch(scoreSnapshotProvider);

    return CanvasBackground(
      child: SizedBox(
        width: double.infinity,
        child: snapshotAsync.when(
        loading: () => const SingleChildScrollView(
          padding: EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: LoadingSkeleton(sectionTitle: 'Vitals', tileCount: 4),
          ),
        ),
        error: (_, __) => ContentColumn(
          child: Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: Text(
              'Could not load vitals.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
            ),
          ),
        ),
        data: (snap) => SingleChildScrollView(
          padding: const EdgeInsets.only(top: 24, bottom: 120),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextButton.icon(
                  onPressed: () => context.go('/today'),
                  icon: Icon(Icons.arrow_back, color: Colors.white.withValues(alpha: 0.55)),
                  label: Text(
                    'Back to Today',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'VITALS',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.45),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your\nbody',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: 'Georgia',
                        height: 1.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                if (!snap.hasData) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Connect a device to see your readings',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  ),
                ],
                const SizedBox(height: 24),
                const SyncStatusBar(),
                const SizedBox(height: 24),
                GlassSurface(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Text(
                    snap.hasData && snap.latestAt != null
                        ? DateFormat.MMMd().format(DateTime.parse(snap.latestAt!))
                        : 'No data yet',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                _MetricSection(
                  title: 'Readiness',
                  icon: Icons.auto_awesome,
                  children: [
                    _MetricCard(
                      title: MetricLabels.readinessScore,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.readiness),
                    ),
                    const _MetricCard(
                      title: MetricLabels.symptomRadar,
                      status: 'No data',
                      value: _emptyValue,
                    ),
                  ],
                ),
                _MetricSection(
                  title: 'Sleep',
                  icon: Icons.nightlight_round,
                  children: [
                    _MetricCard(
                      title: MetricLabels.sleepScore,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.sleepScore),
                    ),
                    const _MetricCard(
                      title: MetricLabels.bodyClock,
                      status: 'No data',
                      value: _emptyValue,
                    ),
                  ],
                ),
                _MetricSection(
                  title: 'Activity',
                  icon: Icons.directions_walk,
                  children: [
                    _MetricCard(
                      title: MetricLabels.activityScore,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.activity),
                    ),
                    _MetricCard(
                      title: MetricLabels.steps,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.steps),
                    ),
                  ],
                ),
                _MetricSection(
                  title: 'Stress',
                  icon: Icons.waves,
                  children: [
                    _MetricCard(
                      title: MetricLabels.daytimeStress,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.stress),
                    ),
                    _MetricCard(
                      title: MetricLabels.spo2,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.spo2),
                      suffix: snap.spo2 == null ? null : MetricUnits.percent,
                    ),
                  ],
                ),
                _MetricSection(
                  title: 'Heart Health',
                  icon: Icons.favorite_outline,
                  children: [
                    _MetricCard(
                      title: MetricLabels.cardioCapacity,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.vo2max),
                      suffix: MetricUnits.vo2Sub,
                    ),
                    _MetricCard(
                      title: MetricLabels.restingHeartRate,
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.restingHr),
                      suffix: snap.restingHr == null ? null : MetricUnits.bpm,
                    ),
                  ],
                ),
                _MetricSection(
                  title: 'Core Metrics',
                  icon: Icons.bar_chart,
                  children: [
                    _MetricCard(
                      title: 'HRV',
                      status: snap.hasData ? 'Latest' : 'No data',
                      value: _fmt(snap.hrvMs),
                      suffix: snap.hrvMs == null ? null : MetricUnits.ms,
                    ),
                    _MetricCard(
                      title: MetricLabels.stepsAvg30,
                      status: snap.hasData ? 'Average' : 'No data',
                      value: _fmt(snap.stepsAvg30),
                    ),
                  ],
                ),
                if (snap.isFromCache) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Showing cached vitals (offline)',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.45),
                        ),
                  ),
                ],
              ],
            ),
          ),
        ),
        ),
      ),
    );
  }

  String _fmt(double? value) {
    if (value == null) return _emptyValue;
    return value.round().toString();
  }
}

class _MetricSection extends StatelessWidget {
  const _MetricSection({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassSurface(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: Colors.white.withValues(alpha: 0.55)),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.92,
            children: children,
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.status,
    required this.value,
    this.suffix,
  });

  final String title;
  final String status;
  final String value;
  final String? suffix;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            status.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.2,
                  color: Colors.amber.withValues(alpha: 0.85),
                ),
          ),
          const Spacer(),
          Text.rich(
            TextSpan(
              text: value,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontFamily: 'Georgia',
                    color: Colors.white.withValues(alpha: 0.95),
                    height: 1,
                  ),
              children: suffix == null
                  ? null
                  : [
                      TextSpan(
                        text: ' $suffix',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
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
