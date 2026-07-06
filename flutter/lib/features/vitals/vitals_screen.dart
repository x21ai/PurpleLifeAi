import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';
import '../../design/glass_surface.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../data/data_style.dart';
import '../today/wearable_sync.dart';
import '../shared/glass_helpers.dart' hide GlassSurface;
import '../shared/loading_skeleton.dart';
import '../shared/metric_constants.dart';
import 'metric_detail_screen.dart';
import 'synced_data_panel.dart';
import 'vitals_repository.dart';

/// Status band colors mirroring web `BAND_COLOR` (data-good/info/warn/alert).
enum MetricBand { excellent, good, fair, attention }

Color _bandColor(MetricBand band) {
  final colors = PurpleTokens.loaded.colorsFor('dark');
  return switch (band) {
    MetricBand.excellent => parseTokenColor(colors.success),
    MetricBand.good => parseTokenColor(colors.info),
    MetricBand.fair => parseTokenColor(colors.warning),
    MetricBand.attention => parseTokenColor(colors.danger),
  };
}

/// Vitals metric grid ported from `src/routes/_app/vitals.tsx`.
/// No fake readings when data is absent.
class VitalsScreen extends ConsumerStatefulWidget {
  const VitalsScreen({super.key});

  @override
  ConsumerState<VitalsScreen> createState() => _VitalsScreenState();
}

class _VitalsScreenState extends ConsumerState<VitalsScreen> {
  static const _emptyValue = '–';
  int _refreshSignal = 0;

  void _openMetric(String? metricKey) {
    if (metricKey == null || metricMetaForKey(metricKey) == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Full detail for this signal ships in a later phase.'),
        ),
      );
      return;
    }
    context.go(AppRoutes.vitalsMetric(metricKey));
  }

  Future<void> _refresh() async {
    await syncConnectedWearables(
      supabase: ref.read(supabaseClientProvider),
      worker: ref.read(workerClientProvider),
    );
    ref.invalidate(vitalsSnapshotProvider);
    ref.invalidate(syncedDataOverviewProvider);
    await ref.read(vitalsSnapshotProvider.future);
    if (!mounted) return;
    setState(() => _refreshSignal += 1);
  }

  @override
  Widget build(BuildContext context) {
    final snapshotAsync = ref.watch(vitalsSnapshotProvider);
    final syncedAsync = ref.watch(syncedDataOverviewProvider);

    return CanvasBackground(
      child: SizedBox(
        width: double.infinity,
        child: snapshotAsync.when(
          // Bottom padding is a small buffer only: NativeAppShell already
          // reserves shellTabBarInset() worth of space for the floating nav
          // bar, so stacking another ~128px here doubled up as excess
          // whitespace (tf-bottom-whitespace).
          loading: () => const SingleChildScrollView(
            padding: EdgeInsets.only(top: 32, bottom: 32),
            child: ContentColumn(
              child: LoadingSkeleton(sectionTitle: 'Vitals', tileCount: 4),
            ),
          ),
          error: (error, _) => _VitalsLoadError(
            onRetry: _refresh,
            message: error is PostgrestException
                ? 'Could not load vitals from the server. Check your connection and retry.'
                : 'Could not load vitals right now. Pull to refresh or retry.',
          ),
          data: (snap) => RefreshIndicator(
            onRefresh: _refresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(top: 32, bottom: 32),
              child: ContentColumn(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    DataBackLink(label: 'Today', onTap: () => context.go('/today')),
                    const SizedBox(height: 32),
                    _buildHeaderRow(context),
                    const SizedBox(height: 12),
                    const DataHeroHeader(
                      eyebrow: 'Vitals',
                      title: 'How your body is\nreading today.',
                    ),
                    syncedAsync.when(
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                      data: (overview) {
                        if (!overview.hasAnyReadings &&
                            !overview.hasAnyConnection) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: SyncedDataCompactStrip(overview: overview),
                        );
                      },
                    ),
                    if (!snap.hasData) ...[
                      const SizedBox(height: 16),
                      _buildConnectLink(context),
                    ] else ...[
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () => context.go(AppRoutes.myHealth),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'See all synced data in My Body',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.55),
                                  ),
                            ),
                            Icon(
                              Icons.chevron_right,
                              size: 16,
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    _LatestReadingMarker(
                      label: snap.hasData && snap.latestAt != null
                          ? DateFormat.MMMd()
                              .format(DateTime.parse(snap.latestAt!))
                          : 'No data yet',
                    ),
                    _MetricSection(
                      title: 'Readiness',
                      icon: Icons.auto_awesome,
                      children: [
                        _MetricCard(
                          title: MetricLabels.readinessScore,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.fair,
                          value: _fmt(snap.readiness),
                          metricKey: 'readiness',
                          onTap: () => _openMetric('readiness'),
                        ),
                        const _MetricCard(
                          title: MetricLabels.symptomRadar,
                          status: 'No data',
                          band: MetricBand.fair,
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
                          band: MetricBand.fair,
                          value: _fmt(snap.sleepScore),
                          metricKey: 'sleep_score',
                          onTap: () => _openMetric('sleep_score'),
                        ),
                        const _MetricCard(
                          title: MetricLabels.bodyClock,
                          status: 'No data',
                          band: MetricBand.fair,
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
                          band: MetricBand.excellent,
                          value: _fmt(snap.activity),
                          metricKey: 'activity_score',
                          onTap: () => _openMetric('activity_score'),
                        ),
                        _MetricCard(
                          title: MetricLabels.steps,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.fair,
                          value: _fmt(snap.steps),
                          metricKey: 'steps',
                          onTap: () => _openMetric('steps'),
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
                          band: MetricBand.good,
                          value: _fmt(snap.stress),
                          metricKey: 'stress',
                          onTap: () => _openMetric('stress'),
                        ),
                        _MetricCard(
                          title: MetricLabels.spo2,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.good,
                          value: _fmt(snap.spo2),
                          suffix: snap.spo2 == null ? null : MetricUnits.percent,
                          metricKey: 'spo2',
                          onTap: () => _openMetric('spo2'),
                        ),
                      ],
                    ),
                    const _MetricSection(
                      title: 'Metabolic Health',
                      icon: Icons.restaurant_outlined,
                      children: [
                        _MetricCard(
                          title: MetricLabels.glucose,
                          status: 'No data',
                          band: MetricBand.fair,
                          value: _emptyValue,
                        ),
                        _MetricCard(
                          title: MetricLabels.meals,
                          status: 'Log a meal',
                          band: MetricBand.fair,
                          value: _emptyValue,
                        ),
                      ],
                    ),
                    const _HydrationSection(),
                    _MetricSection(
                      title: 'Heart Health',
                      icon: Icons.favorite_outline,
                      children: [
                        _MetricCard(
                          title: MetricLabels.cardioCapacity,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.fair,
                          value: _fmt(snap.vo2max),
                          suffix: snap.vo2max == null ? null : MetricUnits.vo2Sub,
                          onTap: () => _openMetric(null),
                        ),
                        _MetricCard(
                          title: MetricLabels.restingHeartRate,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.good,
                          value: _fmt(snap.restingHr),
                          suffix:
                              snap.restingHr == null ? null : MetricUnits.bpm,
                          metricKey: 'resting_hr',
                          onTap: () => _openMetric('resting_hr'),
                        ),
                      ],
                    ),
                    _MetricSection(
                      title: 'Core Metrics',
                      icon: Icons.bar_chart,
                      children: [
                        _MetricCard(
                          title: MetricLabels.hrv,
                          status: snap.hasData ? 'Latest' : 'No data',
                          band: MetricBand.good,
                          value: _fmtHrv(snap.hrvMs),
                          suffix: snap.hrvMs == null ? null : MetricUnits.ms,
                          metricKey: 'hrv',
                          onTap: () => _openMetric('hrv'),
                        ),
                        _MetricCard(
                          title: MetricLabels.stepsAvg30,
                          status: snap.hasData ? 'Average' : 'No data',
                          band: MetricBand.good,
                          value: _fmt(snap.stepsAvg30),
                          onTap: () => _openMetric('steps'),
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
      ),
    );
  }

  /// Web: back link to Today with copy from `vitals.back` ("Today").
  // Kept for reference; header uses [DataBackLink] inline.

  /// Web: eyebrow label on the left, edit affordance on the right.
  Widget _buildHeaderRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'VITALS',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        SizedBox(
          width: 36,
          height: 36,
          child: IconButton(
            onPressed: () => context.go(AppRoutes.tools),
            padding: EdgeInsets.zero,
            tooltip: 'Devices',
            icon: Icon(
              Icons.edit_outlined,
              size: 16,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
        ),
      ],
    );
  }

  /// Web copy from en.json: vitals.title1 + vitals.title2.
  // Title rendered via [DataHeroHeader] in build().

  Widget _buildConnectLink(BuildContext context) {
    final muted = Colors.white.withValues(alpha: 0.55);
    return TextButton(
      onPressed: () => context.go(AppRoutes.tools),
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Connect a device to see your readings',
            style:
                Theme.of(context).textTheme.bodyMedium?.copyWith(color: muted),
          ),
          const SizedBox(width: 6),
          Icon(Icons.chevron_right, size: 16, color: muted),
        ],
      ),
    );
  }

  String _fmt(double? value) {
    if (value == null) return _emptyValue;
    return value.round().toString();
  }

  /// HRV uses one decimal place max, matching web biometrics rounding.
  String _fmtHrv(double? value) {
    if (value == null) return _emptyValue;
    final rounded = (value * 10).round() / 10;
    if (rounded == rounded.roundToDouble()) {
      return rounded.round().toString();
    }
    return rounded.toStringAsFixed(1);
  }
}

/// Web "Latest reading marker": glass strip with a purple-underlined date tab.
class _LatestReadingMarker extends StatelessWidget {
  const _LatestReadingMarker({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: purple, width: 2)),
            ),
            child: Text(
              label,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _VitalsLoadError extends StatelessWidget {
  const _VitalsLoadError({
    required this.onRetry,
    required this.message,
  });

  final Future<void> Function() onRetry;
  final String message;

  @override
  Widget build(BuildContext context) {
    return ContentColumn(
      child: Padding(
        padding: const EdgeInsets.only(top: 24, bottom: 32),
        child: GlassSurface(
          borderRadius: BorderRadius.circular(24),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'VITALS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                'Could not load vitals',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                      height: 1.45,
                    ),
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: onRetry,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
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
      padding: const EdgeInsets.only(top: 48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(title: title, icon: icon),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1 / 1.1,
            children: children,
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
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
    );
  }
}

/// Web "Hydration & auras" section: header pill plus a wide link card.
class _HydrationSection extends StatelessWidget {
  const _HydrationSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionHeader(
            title: 'Hydration & auras',
            icon: Icons.water_drop_outlined,
          ),
          const SizedBox(height: 16),
          GlassCard(
            onTap: () => context.go(AppRoutes.hydration),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Open hydration day view',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.55),
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'TRACK WATER, ELECTROLYTES, DÉJÀ VU',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  letterSpacing: 1.44,
                                  fontWeight: FontWeight.w500,
                                  color: _bandColor(MetricBand.good),
                                ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      size: 16,
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'Hourly + minute-precision timeline',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontFamily: PurpleType.serif,
                        fontSize: 28,
                        height: 1.2,
                        color: Colors.white.withValues(alpha: 0.95),
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

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.title,
    required this.status,
    required this.band,
    required this.value,
    this.suffix,
    this.metricKey,
    this.onTap,
  });

  final String title;
  final String status;
  final MetricBand band;
  final String value;
  final String? suffix;
  final String? metricKey;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      child: Stack(
        children: [
          Positioned(
            top: 0,
            right: 0,
            child: Icon(
              Icons.chevron_right,
              size: 16,
              color: Colors.white.withValues(alpha: 0.4),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 20),
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                status.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.44,
                      fontWeight: FontWeight.w500,
                      color: _bandColor(band),
                    ),
              ),
              const Spacer(),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.bottomLeft,
                child: Text.rich(
                  TextSpan(
                    text: value,
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontFamily: PurpleType.serif,
                          fontSize: 44,
                          color: Colors.white.withValues(alpha: 0.95),
                          height: 1,
                        ),
                    children: suffix == null
                        ? null
                        : [
                            TextSpan(
                              text: ' $suffix',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(
                                    color:
                                        Colors.white.withValues(alpha: 0.55),
                                  ),
                            ),
                          ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
