import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../data/data_style.dart';
import '../reports/models/report_row.dart';
import '../reports/reports_repository.dart';
import '../seizures/seizure_repository.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import '../shared/narrative_block.dart';
import '../today/models/score_snapshot.dart';
import '../today/today_repository.dart';
import '../vitals/vitals_repository.dart';
import 'ai_insights_repository.dart';
import 'insights_widgets.dart';

/// Patterns hub mirroring web `/insights`: narrative header, observation
/// cards, wearable trends, latest vitals, health-record counts, and tabbed
/// deeper views (seizures heatmap, trend chart, patterns).
///
/// AI-generated cards ("What Purple is noticing") call the real
/// `getDailyInsightCards` server logic via `/api/ai/daily-insight-cards`
/// (see `ai_insights_repository.dart`). Pattern cards (`computeUserPatterns`)
/// remain a SERVER-ONLY function with no Flutter Worker route yet — that
/// block still renders an honest "generated on web" state rather than
/// fabricated content.
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
          ref.invalidate(vitalsSnapshotProvider);
          ref.invalidate(reportsHubProvider);
          ref.invalidate(recentSeizuresProvider);
          ref.invalidate(dailyInsightCardsProvider);
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
                const DataHeroHeader(
                  eyebrow: 'Patterns',
                  title: 'What your body\nhas been saying.',
                ),
                const SizedBox(height: 16),
                const NarrativeBlock(
                  text:
                      'Purple watches quietly. When something shifts around a hard day, it remembers, so you do not have to.',
                ),
                const SizedBox(height: 32),
                const InsightsSectionHeader(
                  eyebrow: 'For you',
                  title: 'What Purple is noticing',
                ),
                const SizedBox(height: 12),
                // Real AI cards via `/api/ai/daily-insight-cards` (mirrors web
                // `getDailyInsightCards`, cached server-side once per day).
                _NoticingCards(cards: ref.watch(dailyInsightCardsProvider)),
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
                const InsightsSectionHeader(
                  eyebrow: 'Vitals',
                  title: 'Latest readings',
                ),
                const SizedBox(height: 12),
                _VitalsSection(
                  snapshot: ref.watch(vitalsSnapshotProvider),
                  onOpenVitals: () => context.go(AppRoutes.vitals),
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    const Expanded(
                      child: InsightsSectionHeader(
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
                const SizedBox(height: 12),
                _HealthRecordsSection(
                  hub: ref.watch(reportsHubProvider),
                  onOpenReports: () => context.go(AppRoutes.reportsDocuments),
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
                _InsightsTabViews(
                  controller: tabController,
                  tracksSeizures: tracksSeizures,
                  seizures: ref.watch(recentSeizuresProvider),
                  sleepTrend: sleepTrend,
                  hrvTrend: hrvTrend,
                  rhrTrend: rhrTrend,
                  onLogSeizure: () => context.go(AppRoutes.seizuresNew),
                  onConnect: () => context.go(AppRoutes.tools),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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

/// "What Purple is noticing" AI cards, backed by the real
/// `dailyInsightCardsProvider` (`/api/ai/daily-insight-cards`). Renders a
/// loading placeholder while the (server-cached, once-per-day) AI call runs,
/// an honest empty state when there is not yet enough data, and the real
/// headline + cards once generated.
class _NoticingCards extends StatelessWidget {
  const _NoticingCards({required this.cards});

  final AsyncValue<DailyInsightCardsResult> cards;

  @override
  Widget build(BuildContext context) {
    return cards.when(
      loading: () => const _NoticingLoadingCard(),
      error: (_, __) => const _NoticingEmptyCard(
        message: 'Could not load your observations right now.',
      ),
      data: (result) {
        if (result.cards.isEmpty) {
          return _NoticingEmptyCard(
            message: result.error == null
                ? 'Log a few more readings or upload a report to unlock personalised observations.'
                : 'Purple could not generate observations right now. Try again later.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (result.headline != null && result.headline!.trim().isNotEmpty) ...[
              Text(
                result.headline!.trim(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.75),
                      height: 1.4,
                    ),
              ),
              const SizedBox(height: 12),
            ],
            for (final card in result.cards) ...[
              _NoticingCardTile(card: card),
              const SizedBox(height: 8),
            ],
          ],
        );
      },
    );
  }
}

class _NoticingLoadingCard extends StatelessWidget {
  const _NoticingLoadingCard();

  @override
  Widget build(BuildContext context) {
    return const GlassSurface(
      padding: EdgeInsets.all(20),
      child: SizedBox(
        height: 40,
        child: Center(
          child: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
    );
  }
}

class _NoticingEmptyCard extends StatelessWidget {
  const _NoticingEmptyCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.auto_awesome_outlined,
            size: 18,
            color: Colors.white.withValues(alpha: 0.45),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.65),
                    height: 1.5,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoticingCardTile extends StatelessWidget {
  const _NoticingCardTile({required this.card});

  final DailyInsightCard card;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final Color toneColor = switch (card.tone) {
      'attention' => parseTokenColor(colors.danger),
      'watch' => parseTokenColor(colors.warning),
      _ => parseTokenColor(colors.purplePrimary),
    };
    return GlassSurface(
      padding: const EdgeInsets.all(16),
      borderRadius: 18,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(top: 6),
            decoration: BoxDecoration(color: toneColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  card.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  card.body,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.65),
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

/// Latest-vitals tiles derived from the wearable [ScoreSnapshot].
///
/// NOTE / DATA-GAP: web `getVitalsSnapshot` (health-vitals.functions.ts)
/// surfaces weight, blood pressure, and glucose from uploaded reports + manual
/// logs. Those are NOT part of the Flutter `ScoreSnapshot` (wearable-only:
/// SpO2, skin temp deviation, respiratory rate). We render the wearable-derived
/// vitals honestly and point users to the web/Vitals for the rest, rather than
/// showing fabricated or perpetually-empty weight/BP/glucose tiles.
class _VitalsSection extends StatelessWidget {
  const _VitalsSection({required this.snapshot, required this.onOpenVitals});

  final AsyncValue<ScoreSnapshot> snapshot;
  final VoidCallback onOpenVitals;

  @override
  Widget build(BuildContext context) {
    return snapshot.when(
      loading: () => const _VitalsGridPlaceholder(),
      error: (_, __) => _VitalsCaption(onOpenVitals: onOpenVitals),
      data: (snap) {
        final tiles = <VitalTile>[
          VitalTile(
            label: 'Blood oxygen',
            value: snap.spo2 != null
                ? '${snap.spo2!.toStringAsFixed(1)}%'
                : '–',
            sub: snap.spo2 != null ? 'SpO₂' : 'no reading yet',
          ),
          VitalTile(
            label: 'Skin temp',
            value: snap.tempDeviationC != null
                ? '${snap.tempDeviationC! >= 0 ? '+' : ''}${snap.tempDeviationC!.toStringAsFixed(1)}°C'
                : '–',
            sub: snap.tempDeviationC != null ? 'deviation' : 'no reading yet',
          ),
          VitalTile(
            label: 'Respiratory rate',
            value: snap.respRateBpm != null
                ? snap.respRateBpm!.toStringAsFixed(0)
                : '–',
            sub: snap.respRateBpm != null ? 'breaths / min' : 'no reading yet',
          ),
          VitalTile(
            label: 'Resting HR',
            value: snap.restingHr != null
                ? snap.restingHr!.round().toString()
                : '–',
            sub: snap.restingHr != null ? 'bpm' : 'no reading yet',
          ),
        ];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            VitalTilesGrid(tiles: tiles),
            const SizedBox(height: 12),
            _VitalsCaption(onOpenVitals: onOpenVitals),
          ],
        );
      },
    );
  }
}

class _VitalsCaption extends StatelessWidget {
  const _VitalsCaption({required this.onOpenVitals});

  final VoidCallback onOpenVitals;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'From your connected wearable. Weight, blood pressure, and glucose live '
          'on the web app and in Vitals.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: onOpenVitals,
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.white.withValues(alpha: 0.85),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
            shape: const StadiumBorder(),
          ),
          child: const Text('Open Vitals'),
        ),
      ],
    );
  }
}

class _VitalsGridPlaceholder extends StatelessWidget {
  const _VitalsGridPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 120,
      child: Center(child: CircularProgressIndicator()),
    );
  }
}

/// Health-records category counts derived client-side from `reportsHubProvider`
/// documents grouped by `report_category` (mirrors web `getHealthRecordsCounts`).
class _HealthRecordsSection extends StatelessWidget {
  const _HealthRecordsSection({required this.hub, required this.onOpenReports});

  final AsyncValue<ReportsHubData> hub;
  final VoidCallback onOpenReports;

  @override
  Widget build(BuildContext context) {
    return hub.when(
      loading: () => const SizedBox(
        height: 120,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Text(
        'Could not load your records right now.',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.55),
            ),
      ),
      data: (data) {
        final counts = <String, int>{};
        for (final doc in data.documents) {
          final slug = (doc.reportCategory == null ||
                  doc.reportCategory!.trim().isEmpty)
              ? 'other'
              : doc.reportCategory!;
          counts[slug] = (counts[slug] ?? 0) + 1;
        }
        return GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.92,
          children: [
            for (final cat in kReportCategories)
              CategoryTile(
                label: cat.label,
                count: counts[cat.slug] ?? 0,
                icon: cat.icon,
                onTap: onOpenReports,
              ),
          ],
        );
      },
    );
  }
}

class _InsightsTabViews extends StatelessWidget {
  const _InsightsTabViews({
    required this.controller,
    required this.tracksSeizures,
    required this.seizures,
    required this.sleepTrend,
    required this.hrvTrend,
    required this.rhrTrend,
    required this.onLogSeizure,
    required this.onConnect,
  });

  final TabController controller;
  final bool tracksSeizures;
  final AsyncValue<List<SeizureEvent>> seizures;
  final AsyncValue<MetricTrendResult> sleepTrend;
  final AsyncValue<MetricTrendResult> hrvTrend;
  final AsyncValue<MetricTrendResult> rhrTrend;
  final VoidCallback onLogSeizure;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    // Sized so the tallest tab (seizures list) can grow; keep a floor.
    return SizedBox(
      height: 420,
      child: TabBarView(
        controller: controller,
        children: [
          if (tracksSeizures)
            _SeizuresTab(events: seizures, onLog: onLogSeizure),
          _TrendsTab(
            sleep: sleepTrend,
            hrv: hrvTrend,
            rhr: rhrTrend,
            onConnect: onConnect,
          ),
          const _PatternsWebOnlyTab(),
        ],
      ),
    );
  }
}

class _SeizuresTab extends StatelessWidget {
  const _SeizuresTab({required this.events, required this.onLog});

  final AsyncValue<List<SeizureEvent>> events;
  final VoidCallback onLog;

  @override
  Widget build(BuildContext context) {
    return events.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => _SeizuresEmpty(onLog: onLog),
      data: (all) {
        final cutoff = DateTime.now().subtract(const Duration(days: 90));
        final recent = all
            .where((e) => e.startedAt.toLocal().isAfter(cutoff))
            .toList();
        return ListView(
          padding: EdgeInsets.zero,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Last 90 days',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: PurpleType.serif,
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                OutlinedButton.icon(
                  onPressed: onLog,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Log'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.85),
                    side:
                        BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SeizureHeatmap(events: recent, days: 90),
            const SizedBox(height: 20),
            Text(
              'All events',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontFamily: PurpleType.serif,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
            ),
            const SizedBox(height: 12),
            if (recent.isEmpty)
              _SeizuresEmpty(onLog: onLog)
            else
              for (final e in recent) ...[
                SeizureListItem(event: e),
                const SizedBox(height: 8),
              ],
          ],
        );
      },
    );
  }
}

class _SeizuresEmpty extends StatelessWidget {
  const _SeizuresEmpty({required this.onLog});

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

class _TrendsTab extends StatelessWidget {
  const _TrendsTab({
    required this.sleep,
    required this.hrv,
    required this.rhr,
    required this.onConnect,
  });

  final AsyncValue<MetricTrendResult> sleep;
  final AsyncValue<MetricTrendResult> hrv;
  final AsyncValue<MetricTrendResult> rhr;
  final VoidCallback onConnect;

  bool _has(AsyncValue<MetricTrendResult> v) =>
      (v.valueOrNull?.stats.count ?? 0) > 0;

  @override
  Widget build(BuildContext context) {
    final loading = sleep.isLoading || hrv.isLoading || rhr.isLoading;
    final hasData = _has(sleep) || _has(hrv) || _has(rhr);

    if (loading && !hasData) {
      return const Center(child: CircularProgressIndicator());
    }
    if (!hasData) {
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

    return SingleChildScrollView(
      padding: EdgeInsets.zero,
      child: InsightsTrendChart(
        sleep: sleep.valueOrNull ??
            const MetricTrendResult(points: [], stats: MetricTrendStats.empty),
        hrv: hrv.valueOrNull ??
            const MetricTrendResult(points: [], stats: MetricTrendStats.empty),
        rhr: rhr.valueOrNull ??
            const MetricTrendResult(points: [], stats: MetricTrendStats.empty),
      ),
    );
  }
}

/// Honest empty state for pattern cards (server compute only).
class _PatternsWebOnlyTab extends StatelessWidget {
  const _PatternsWebOnlyTab();

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
            'Patterns are computed on the web',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFamily: PurpleType.serif,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Purple correlates seizures, journal entries, and biometrics on the '
            'web app. Keep logging and open Insights there to see your patterns.',
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
              Expanded(
                  child: _MetricTile(
                      label: 'Avg sleep score', value: sleepLabel)),
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
