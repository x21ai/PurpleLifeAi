import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../data/data_style.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/narrative_block.dart';
import '../today/models/score_snapshot.dart';
import '../vitals/synced_data_overview.dart';
import '../vitals/synced_data_panel.dart';
import '../vitals/vitals_repository.dart';
import 'condition_catalog.dart';
import 'my_health_repository.dart';

/// Long-view health summary mirroring web `/my-health`: narrative, synced
/// metric rows, wearable coverage, and links into vitals drilldowns.
class MyHealthScreen extends ConsumerWidget {
  const MyHealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshotAsync = ref.watch(vitalsSnapshotProvider);
    final narrativeAsync = ref.watch(healthNarrativeProvider);
    final syncedAsync = ref.watch(syncedDataOverviewProvider);
    final conditionsAsync = ref.watch(userConditionsProvider);

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(vitalsSnapshotProvider);
          ref.invalidate(healthNarrativeProvider);
          ref.invalidate(syncedDataOverviewProvider);
          ref.invalidate(userConditionsProvider);
          await Future.wait([
            ref.read(vitalsSnapshotProvider.future),
            ref.read(healthNarrativeProvider.future),
            ref.read(syncedDataOverviewProvider.future),
            ref.read(userConditionsProvider.future),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 128),
          child: ContentColumn(
            child: snapshotAsync.when(
              loading: () => const LoadingSkeleton(
                sectionTitle: 'My Body',
                tileCount: 4,
              ),
              error: (_, __) => _LoadError(
                onRetry: () {
                  ref.invalidate(vitalsSnapshotProvider);
                  ref.invalidate(syncedDataOverviewProvider);
                },
              ),
              data: (snap) {
                final narrative = narrativeAsync.valueOrNull;
                final synced =
                    syncedAsync.valueOrNull ?? SyncedDataOverview.empty;
                final conditions =
                    getConditions(conditionsAsync.valueOrNull ?? const []);
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _HeaderBar(onTools: () => context.go(AppRoutes.tools)),
                    const SizedBox(height: 32),
                    const DataHeroHeader(
                      eyebrow: 'My body',
                      title: 'The long view of\nyour health.',
                    ),
                    const SizedBox(height: 16),
                    NarrativeBlock(
                      text: narrative ??
                          'Purple is gathering your recent days to summarize your patterns here.',
                    ),
                    if (!snap.hasData) ...[
                      const SizedBox(height: 12),
                      TextButton(
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
                    SyncedDataPanel(
                      overview: synced,
                      anchor: SyncedDataAnchor.myHealth,
                    ),
                    const SizedBox(height: 24),
                    GlassSurface(
                      padding: EdgeInsets.zero,
                      borderRadius: 24,
                      child: Column(
                        children: [
                          _HealthSectionRow(
                            icon: Icons.nightlight_round,
                            title: 'Sleep Health',
                            subtitle: snap.sleepScore != null
                                ? 'Latest sleep score: ${snap.sleepScore!.round()}'
                                : 'No sleep data yet',
                            metricKey: 'sleep_score',
                          ),
                          _sectionDivider(),
                          _HealthSectionRow(
                            icon: Icons.waves,
                            title: 'Stress Management',
                            subtitle: snap.stress != null
                                ? 'Latest stress score: ${snap.stress!.round()}'
                                : 'No stress data yet',
                            metricKey: 'stress',
                          ),
                          _sectionDivider(),
                          _HealthSectionRow(
                            icon: Icons.favorite_outline,
                            title: 'Heart Health',
                            subtitle: snap.restingHr != null
                                ? 'Resting heart rate: ${snap.restingHr!.round()} bpm'
                                : 'No heart data yet',
                            metricKey: 'resting_hr',
                          ),
                          _sectionDivider(),
                          _HealthSectionRow(
                            icon: Icons.directions_walk,
                            title: 'Activity',
                            subtitle: snap.stepsAvg30 != null
                                ? 'Step average: ${_formatSteps(snap.stepsAvg30)} / day'
                                : 'No activity data yet',
                            metricKey: 'steps',
                          ),
                          _sectionDivider(),
                          _HealthSectionRow(
                            icon: Icons.schedule,
                            title: 'Readiness',
                            subtitle: snap.readiness != null
                                ? 'Latest readiness: ${snap.readiness!.round()}'
                                : 'No readiness data yet',
                            metricKey: 'readiness',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    _StepAverageCard(snapshot: snap),
                    const SizedBox(height: 20),
                    GlassCard(
                      onTap: () => context.go(AppRoutes.biometrics),
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Icon(
                            Icons.bar_chart_outlined,
                            color: Colors.white.withValues(alpha: 0.75),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'All biometrics',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(
                                        color: Colors.white.withValues(alpha: 0.95),
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                                Text(
                                  'Every signal Purple is reading from your body.',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: Colors.white.withValues(alpha: 0.55),
                                      ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            size: 18,
                            color: Colors.white.withValues(alpha: 0.4),
                          ),
                        ],
                      ),
                    ),
                    if (conditions.isNotEmpty) ...[
                      const SizedBox(height: 32),
                      _ConditionsSection(conditions: conditions),
                    ],
                    const SizedBox(height: 24),
                    const _DnaInsightsCard(),
                    if (snap.isFromCache) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Showing cached readings (offline)',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  static String _formatSteps(double? value) {
    if (value == null) return '–';
    return NumberFormat.decimalPattern().format(value.round());
  }
}

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({required this.onTools});

  final VoidCallback onTools;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      borderRadius: 16,
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.go(AppRoutes.today),
            tooltip: 'Today',
            icon: Icon(
              Icons.info_outline,
              size: 18,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          Expanded(
            child: Text(
              'My Body',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          IconButton(
            onPressed: onTools,
            tooltip: 'Devices',
            icon: Icon(
              Icons.devices_outlined,
              size: 20,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
        ],
      ),
    );
  }
}

class _HealthSectionRow extends StatelessWidget {
  const _HealthSectionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.metricKey,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String metricKey;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go(AppRoutes.biometricsMetric(metricKey)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      parseTokenColor(
                        PurpleTokens.loaded.colorsFor('dark').info,
                      ).withValues(alpha: 0.25),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Icon(icon, size: 22, color: Colors.white.withValues(alpha: 0.9)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.95),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _sectionDivider() {
  return Divider(height: 1, color: Colors.white.withValues(alpha: 0.08));
}

class _StepAverageCard extends StatelessWidget {
  const _StepAverageCard({required this.snapshot});

  final ScoreSnapshot snapshot;

  @override
  Widget build(BuildContext context) {
    final hasSteps = snapshot.hasData && snapshot.stepsAvg30 != null;
    return GlassSurface(
      padding: const EdgeInsets.all(24),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: parseTokenColor(
                PurpleTokens.loaded.colorsFor('dark').purplePrimary,
              ).withValues(alpha: 0.15),
            ),
            child: Icon(
              Icons.directions_walk,
              size: 20,
              color: parseTokenColor(
                PurpleTokens.loaded.colorsFor('dark').purplePrimary,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'STEP AVERAGE',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.2,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 8),
          Text.rich(
            TextSpan(
              text: hasSteps
                  ? MyHealthScreen._formatSteps(snapshot.stepsAvg30)
                  : '–',
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontFamily: PurpleType.serif,
                    fontSize: 48,
                    height: 1,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
              children: hasSteps
                  ? [
                      TextSpan(
                        text: ' steps / day',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                      ),
                    ]
                  : null,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            hasSteps
                ? 'Daily steps naturally dip sometimes. Focus on the long haul and move when it fits your schedule.'
                : 'Connect a device or keep logging activity to see your step averages here.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                  height: 1.45,
                  fontFamily: PurpleType.serif,
                ),
          ),
          if (hasSteps) ...[
            const SizedBox(height: 20),
            _ProgressLine(
              label: '30-day average',
              value: snapshot.stepsAvg30 ?? 0,
              max: 10000,
              right: MyHealthScreen._formatSteps(snapshot.stepsAvg30),
            ),
            const SizedBox(height: 12),
            _ProgressLine(
              label: '60-day average',
              value: snapshot.stepsAvg60 ?? 0,
              max: 10000,
              right: MyHealthScreen._formatSteps(snapshot.stepsAvg60),
            ),
          ] else ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go(AppRoutes.tools),
              child: const Text('Connect a device'),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProgressLine extends StatelessWidget {
  const _ProgressLine({
    required this.label,
    required this.value,
    required this.max,
    required this.right,
  });

  final String label;
  final double value;
  final double max;
  final String right;

  @override
  Widget build(BuildContext context) {
    final pct = max <= 0 ? 0.0 : (value / max).clamp(0.0, 1.0);
    final warn = parseTokenColor(PurpleTokens.loaded.colorsFor('dark').warning);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
            ),
            Text(
              right,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: Colors.white.withValues(alpha: 0.08),
            color: warn,
          ),
        ),
      ],
    );
  }
}

/// "Your conditions" grid mirroring web `my-health.tsx`. Web deep-links each
/// tile to `/condition/$slug`; that route does not exist in Flutter yet, so
/// these render as non-navigating informational cards for this wave.
class _ConditionsSection extends StatelessWidget {
  const _ConditionsSection({required this.conditions});

  final List<ConditionCatalogEntry> conditions;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'YOUR CONDITIONS',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                letterSpacing: 1.2,
                color: Colors.white.withValues(alpha: 0.45),
              ),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            const spacing = 8.0;
            final twoCol = constraints.maxWidth >= 480;
            final tileWidth = twoCol
                ? (constraints.maxWidth - spacing) / 2
                : constraints.maxWidth;
            return Wrap(
              spacing: spacing,
              runSpacing: spacing,
              children: [
                for (final c in conditions)
                  SizedBox(
                    width: tileWidth,
                    child: _ConditionTile(entry: c),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ConditionTile extends StatelessWidget {
  const _ConditionTile({required this.entry});

  final ConditionCatalogEntry entry;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      borderRadius: 16,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  conditionCategoryLabel(entry.category).toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.0,
                        color: Colors.white.withValues(alpha: 0.45),
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

/// "DNA insights (optional)" card mirroring web `my-health.tsx`. Web links to
/// `/my-health-dna`; that route does not exist in Flutter yet, so this renders
/// as a non-navigating informational card for this wave.
class _DnaInsightsCard extends StatelessWidget {
  const _DnaInsightsCard();

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    return GlassSurface(
      borderRadius: 28,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: purple.withValues(alpha: 0.15),
            ),
            child: Icon(Icons.biotech_outlined, size: 20, color: purple),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DNA insights (optional)',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Upload a raw file. We look at a small, curated set, never your whole genome.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                        height: 1.4,
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

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Could not load My Body',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.95),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pull to refresh or retry in a moment.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
