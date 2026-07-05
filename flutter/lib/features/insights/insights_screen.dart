import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import '../shared/narrative_block.dart';
import '../today/today_repository.dart';
import '../vitals/vitals_repository.dart';

/// Patterns hub mirroring web `/insights`: narrative header, observation
/// cards, wearable trends, and tabbed deeper views. Full AI cards and quick-log
/// sheets ship later; empty states stay honest when data is absent.
class InsightsScreen extends ConsumerStatefulWidget {
  const InsightsScreen({super.key});

  @override
  ConsumerState<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends ConsumerState<InsightsScreen>
    with SingleTickerProviderStateMixin {
  TabController? _tabController;
  bool? _tracksSeizures;

  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }

  void _syncTabs(bool tracksSeizures) {
    if (_tracksSeizures == tracksSeizures) return;
    _tracksSeizures = tracksSeizures;
    _tabController?.dispose();
    final length = tracksSeizures ? 3 : 2;
    _tabController = TabController(length: length, vsync: this);
    if (tracksSeizures) {
      _tabController!.index = 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(todayDataProvider);
    final conditions = todayAsync.valueOrNull?.conditions ?? const [];
    final tracksSeizures = showsSeizureFeatures(conditions);
    _syncTabs(tracksSeizures);

    final hrvTrend = ref.watch(
      metricTrendProvider(const MetricTrendQuery(metricKey: 'hrv', days: 14)),
    );
    final rhrTrend = ref.watch(
      metricTrendProvider(
        const MetricTrendQuery(metricKey: 'resting_hr', days: 14),
      ),
    );
    final sleepTrend = ref.watch(
      metricTrendProvider(
        const MetricTrendQuery(metricKey: 'sleep_score', days: 14),
      ),
    );

    final tabController = _tabController;
    if (tabController == null) {
      return const CanvasBackground(
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(todayDataProvider);
          ref.invalidate(metricTrendProvider);
          await Future.wait([
            ref.read(todayDataProvider.future),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 128),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PATTERNS',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.4,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'What your body\nhas been saying.',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontFamily: PurpleType.serif,
                        fontSize: 44,
                        height: 1.02,
                        letterSpacing: 44 * -0.02,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 16),
                const NarrativeBlock(
                  text:
                      'Purple watches quietly. When something shifts around a hard day, it remembers, so you do not have to.',
                ),
                const SizedBox(height: 32),
                _SectionHeader(
                  eyebrow: 'For you',
                  title: 'What Purple is noticing',
                ),
                const SizedBox(height: 12),
                GlassSurface(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    'Log a few more readings or upload a report and Purple will start surfacing patterns here.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.65),
                          height: 1.5,
                        ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Observations only, never a diagnosis. Share with your clinician for context.',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.45),
                        fontSize: 11,
                      ),
                ),
                const SizedBox(height: 32),
                _TrendsSummaryRow(
                  sleepLabel: _formatSleepAvg(sleepTrend),
                  hrvLabel: _formatMetricAvg(hrvTrend),
                  rhrLabel: _formatMetricAvg(rhrTrend),
                ),
                const SizedBox(height: 32),
                _SectionHeader(eyebrow: 'Vitals', title: 'Latest readings'),
                const SizedBox(height: 12),
                Text(
                  'Pulled from uploaded reports and connected wearables. Open Vitals to log readings and see trends.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => context.go(AppRoutes.vitals),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.85),
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text('Open Vitals'),
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: _SectionHeader(
                        eyebrow: 'Health records',
                        title: 'By category',
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.go(AppRoutes.reportsDocuments),
                      child: Text(
                        'All reports',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Upload lab PDFs and imaging on the web app today. Counts and category tiles ship in a later Flutter pass.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 24),
                TabBar(
                  controller: tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  labelColor: Colors.white.withValues(alpha: 0.95),
                  unselectedLabelColor: Colors.white.withValues(alpha: 0.55),
                  indicatorColor: Theme.of(context).colorScheme.primary,
                  dividerColor: Colors.white.withValues(alpha: 0.08),
                  tabs: [
                    if (tracksSeizures) const Tab(text: 'Seizures'),
                    const Tab(text: 'Trends'),
                    const Tab(text: 'Patterns'),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 220,
                  child: TabBarView(
                    controller: tabController,
                    children: [
                      if (tracksSeizures) _SeizuresTabEmpty(onLog: () {
                        context.go(AppRoutes.seizuresNew);
                      }),
                      _TrendsTabEmpty(
                        hasWearableData: _hasAnyTrendData(
                          hrvTrend,
                          rhrTrend,
                          sleepTrend,
                        ),
                        onConnect: () => context.go(AppRoutes.tools),
                      ),
                      const _PatternsTabEmpty(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static bool _hasAnyTrendData(
    AsyncValue<MetricTrendResult> hrv,
    AsyncValue<MetricTrendResult> rhr,
    AsyncValue<MetricTrendResult> sleep,
  ) {
    bool has(AsyncValue<MetricTrendResult> value) =>
        value.valueOrNull?.stats.count != null &&
        (value.valueOrNull?.stats.count ?? 0) > 0;
    return has(hrv) || has(rhr) || has(sleep);
  }

  static String _formatMetricAvg(AsyncValue<MetricTrendResult> trend) {
    final mean = trend.valueOrNull?.stats.mean;
    if (mean == null) return '–';
    return mean.round().toString();
  }

  static String _formatSleepAvg(AsyncValue<MetricTrendResult> trend) {
    final mean = trend.valueOrNull?.stats.mean;
    if (mean == null) return '–';
    return mean.round().toString();
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.eyebrow, required this.title});

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

class _TrendsSummaryRow extends StatelessWidget {
  const _TrendsSummaryRow({
    required this.sleepLabel,
    required this.hrvLabel,
    required this.rhrLabel,
  });

  final String sleepLabel;
  final String hrvLabel;
  final String rhrLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _MetricTile(label: 'Avg sleep score', value: sleepLabel)),
              Expanded(child: _MetricTile(label: 'HRV ms', value: hrvLabel)),
              Expanded(child: _MetricTile(label: 'Rest BPM', value: rhrLabel)),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Last 14 nights · from your connected ring',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.1,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontFamily: PurpleType.serif,
                color: Colors.white.withValues(alpha: 0.95),
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
      ],
    );
  }
}

class _SeizuresTabEmpty extends StatelessWidget {
  const _SeizuresTabEmpty({required this.onLog});

  final VoidCallback onLog;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bolt_outlined, color: Colors.white.withValues(alpha: 0.45)),
          const SizedBox(height: 8),
          Text(
            'No events logged.',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'When something happens, log it. It only takes a tap.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onLog,
            style: FilledButton.styleFrom(shape: const StadiumBorder()),
            child: const Text('Log seizure'),
          ),
        ],
      ),
    );
  }
}

class _TrendsTabEmpty extends StatelessWidget {
  const _TrendsTabEmpty({
    required this.hasWearableData,
    required this.onConnect,
  });

  final bool hasWearableData;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    if (hasWearableData) {
      return GlassSurface(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            'Wearable trends are loading. Interactive charts ship in a later Flutter pass.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
        ),
      );
    }
    return GlassSurface(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Connect a wearable to start seeing your trends.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.65),
                ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: onConnect,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white.withValues(alpha: 0.85),
              side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
              shape: const StadiumBorder(),
            ),
            child: const Text('Open Tools'),
          ),
        ],
      ),
    );
  }
}

class _PatternsTabEmpty extends StatelessWidget {
  const _PatternsTabEmpty();

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.auto_awesome_outlined,
              color: Colors.white.withValues(alpha: 0.45)),
          const SizedBox(height: 8),
          Text(
            'Not enough data yet',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Keep logging seizures, journal entries, and wearing your tracker. Patterns appear once there is enough signal.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.45,
                ),
          ),
        ],
      ),
    );
  }
}
