import 'package:flutter/material.dart';

import '../../design/purple_type.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../meds/meds_repository.dart';
import '../meds/models/dose.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../shared/narrative_block.dart';
import '../shared/score_hero.dart';
import '../shared/score_tile.dart';
import '../vitals/sync_status_bar.dart';
import 'date_strip.dart';
import 'models/score_snapshot.dart';
import 'models/today_data.dart';
import 'today_repository.dart';
import 'wearable_sync.dart';

/// Doses for a specific calendar day (`yyyy-MM-dd`), mirroring web
/// `TodayDoses date={selectedDate}` without editing [medsDataProvider].
final medsForDayProvider = FutureProvider.autoDispose
    .family<MedsData, String>((ref, dateYmd) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return MedsData.empty;
  if (dateYmd.split('-').length != 3) return MedsData.empty;
  return ref.watch(medsRepositoryProvider).loadMeds(viewDateYmd: dateYmd);
});

/// Today dashboard ported from `src/routes/_app/today.tsx`:
/// date eyebrow, serif greeting, lede, date strip, three-up score strip with
/// tap-to-expand readiness hero, "Your signals" grid, AI narrative block,
/// quick actions, today's doses, and the "More for today" disclosure.
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  // Web default focus is 'sleep' (persisted per session there).
  String _focus = 'sleep';
  bool _showMore = false;
  DateTime _selectedDate = _startOfDay(DateTime.now());
  int _syncTick = 0;

  /// Session-scoped dismissals mirroring web sessionStorage keys.
  static bool _emptyDismissed = false;
  static bool _wearablesNudgeDismissed = false;

  static DateTime _startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

  static bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  bool get _isToday => _isSameDay(_selectedDate, DateTime.now());

  String get _selectedYmd => DateFormat('yyyy-MM-dd').format(_selectedDate);

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 5) return 'Still up';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  String _conditionPrompt(List<String> conditions) {
    return promptForConditions(conditions);
  }

  void _onSignalTap(TodayVitalItem item) {
    final metric = item.metric;
    if (metric != null) {
      context.go(AppRoutes.vitalsMetric(metric));
      return;
    }
    context.go(AppRoutes.vitals);
  }

  Future<void> _refresh() async {
    await syncConnectedWearables(
      supabase: ref.read(supabaseClientProvider),
      worker: ref.read(workerClientProvider),
    );
    ref.invalidate(todayDataProvider);
    ref.invalidate(medsForDayProvider(_selectedYmd));
    if (!_isToday) ref.invalidate(scoreSnapshotForDayProvider(_selectedYmd));
    if (mounted) setState(() => _syncTick += 1);
    try {
      await Future.wait([
        ref.read(todayDataProvider.future),
        ref.read(medsForDayProvider(_selectedYmd).future),
      ]);
    } catch (_) {
      // Keep pull-to-refresh stable even if one provider fails.
    }
  }

  double? _scoreFor(ScoreSnapshot scores, String focus) {
    switch (focus) {
      case 'readiness':
        return scores.readiness;
      case 'activity':
        return scores.activity;
      default:
        return scores.sleepScore;
    }
  }

  String _labelFor(String focus) {
    switch (focus) {
      case 'readiness':
        return 'Readiness';
      case 'activity':
        return 'Activity';
      default:
        return 'Sleep';
    }
  }

  void _onTileTap(String key, ScoreSnapshot scores, String? narrative) {
    if (_focus == key) {
      final score = _scoreFor(scores, key);
      if (score != null) {
        _showScoreDetail(
          score: score,
          label: _labelFor(key),
          narrative: narrative,
        );
      }
      return;
    }
    setState(() => _focus = key);
  }

  /// Fullscreen focus detail mirroring the web expanded overlay
  /// (dark scrim, close affordance, `ScoreHero`, link to the full reading).
  void _showScoreDetail({
    required double score,
    required String label,
    String? narrative,
  }) {
    final tokens = PurpleTokens.loaded;
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close detail',
      barrierColor: const Color(0xEB0A0710),
      pageBuilder: (dialogContext, _, __) {
        return SafeArea(
          child: Align(
            alignment: Alignment.topCenter,
            child: SingleChildScrollView(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 672),
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: tokens.layout.pagePaddingX,
                    vertical: tokens.spacing.xl,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        height: tokens.touch.minTarget,
                        child: TextButton(
                          onPressed: () => Navigator.of(dialogContext).pop(),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            foregroundColor:
                                Colors.white.withValues(alpha: 0.55),
                          ),
                          child: Text(
                            '← CLOSE',
                            style: TextStyle(
                              fontSize:
                                  tokens.typography.labelSize('labelEyebrow'),
                              letterSpacing: tokens.typography
                                  .letterSpacing('labelEyebrow'),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: tokens.spacing.lg),
                      ScoreHero(
                        score: score,
                        label: label,
                        narrative: narrative,
                      ),
                      SizedBox(height: tokens.spacing.lg),
                      SizedBox(
                        height: tokens.touch.minTarget,
                        child: TextButton(
                          onPressed: () {
                            Navigator.of(dialogContext).pop();
                            context.go(AppRoutes.todayRisk);
                          },
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            foregroundColor:
                                Colors.white.withValues(alpha: 0.7),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('See the full reading'),
                              Icon(Icons.chevron_right, size: 16),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(todayDataProvider);
    final medsAsync = ref.watch(medsForDayProvider(_selectedYmd));
    final tokens = PurpleTokens.loaded;

    return CanvasBackground(
      child: SizedBox(
        width: double.infinity,
        child: todayAsync.when(
          loading: _TodayLoadingView.new,
          error: (_, __) => _TodayLoadError(onRetry: _refresh),
          data: (data) => RefreshIndicator(
            onRefresh: _refresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.only(
                top: tokens.spacing.x2,
                bottom: 120,
              ),
              child: ContentColumn(
                child: _buildBody(context, data, medsAsync),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    TodayData data,
    AsyncValue<MedsData> medsAsync,
  ) {
    final tokens = PurpleTokens.loaded;
    final narrative = data.narrative?.trim();
    final hasNarrative = narrative != null && narrative.isNotEmpty;
    final isToday = _isToday;
    final showEmptyWelcome =
        isToday && data.journalEntryCount == 0 && !_emptyDismissed;

    // Off-today the score strip and signals use the day-filtered snapshot.
    final dayScoresAsync = isToday
        ? null
        : ref.watch(scoreSnapshotForDayProvider(_selectedYmd));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showEmptyWelcome) ...[
          _TodayEmptyWelcome(
            onStart: () => context.go('/journal/new'),
            onDismiss: () => setState(() => _emptyDismissed = true),
          ),
          SizedBox(height: tokens.spacing.xl),
        ],
        _DateEyebrow(date: _selectedDate),
        SizedBox(height: tokens.spacing.lg),
        _Header(
          title: isToday ? _greeting() : 'Looking back',
          firstName: data.firstName,
          isOffline: data.isOffline,
        ),
        if (isToday && !hasNarrative) ...[
          SizedBox(height: tokens.spacing.sm),
          Text(
            "How's today feeling?",
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ],
        SizedBox(height: tokens.spacing.md),
        _Lede(
          text: !isToday
              ? "Here's how ${DateFormat('EEEE, MMMM d').format(_selectedDate)} went."
              : hasNarrative
                  ? narrative
                  : _conditionPrompt(data.conditions),
          emphasized: isToday && hasNarrative,
        ),
        SizedBox(height: tokens.spacing.xl),
        DateStrip(
          value: _selectedDate,
          onChanged: (day) => setState(() => _selectedDate = day),
        ),
        if (!isToday) ...[
          SizedBox(height: tokens.spacing.md),
          _ViewingDayPill(
            date: _selectedDate,
            onBackToToday: () =>
                setState(() => _selectedDate = _startOfDay(DateTime.now())),
          ),
        ],
        SizedBox(height: tokens.spacing.x2),
        if (dayScoresAsync == null)
          _ScoresAndSignals(
            scores: data.scores,
            focus: _focus,
            isToday: true,
            selectedDate: _selectedDate,
            onTileTap: (key) => _onTileTap(key, data.scores, narrative),
            onSignalTap: _onSignalTap,
            onViewAll: () => context.go(AppRoutes.vitals),
            onConnect: () => context.go('/settings'),
          )
        else
          dayScoresAsync.when(
            loading: () => const ScoreTileStripSkeleton(),
            error: (_, __) => _ScoresAndSignals(
              scores: ScoreSnapshot.empty,
              focus: _focus,
              isToday: false,
              selectedDate: _selectedDate,
              onTileTap: (_) {},
              onSignalTap: _onSignalTap,
              onViewAll: () => context.go(AppRoutes.vitals),
              onConnect: () => context.go('/settings'),
            ),
            data: (dayScores) => _ScoresAndSignals(
              scores: dayScores,
              focus: _focus,
              isToday: false,
              selectedDate: _selectedDate,
              onTileTap: (key) => _onTileTap(key, dayScores, narrative),
              onSignalTap: _onSignalTap,
              onViewAll: () => context.go(AppRoutes.vitals),
              onConnect: () => context.go('/settings'),
            ),
          ),
        if (hasNarrative) ...[
          SizedBox(height: tokens.spacing.x2),
          NarrativeBlock(text: narrative),
        ],
        SizedBox(height: tokens.spacing.xl),
        _QuickActions(
          showSeizure: showsSeizureFeatures(data.conditions),
          onJournal: () => context.go('/journal'),
          onMeds: () => context.go('/meds'),
          onSeizure: () => context.go(AppRoutes.seizuresNew),
        ),
        SizedBox(height: tokens.spacing.lg),
        _TodayDosesSection(
          medsAsync: medsAsync,
          medicationCount: data.medicationCount,
          selectedDate: _selectedDate,
          isToday: isToday,
        ),
        SizedBox(height: tokens.spacing.xl),
        _MoreForToday(
          expanded: _showMore,
          onToggle: () => setState(() => _showMore = !_showMore),
          data: data,
          syncTick: _syncTick,
          showWearablesNudge:
              data.showWearablesNudge && !_wearablesNudgeDismissed,
          onDismissWearablesNudge: () =>
              setState(() => _wearablesNudgeDismissed = true),
          onConnectDevice: () => context.go('/tools'),
          onDigDeeper: () => context.go('/vitals'),
          onHydration: () => context.go(AppRoutes.hydration),
        ),
      ],
    );
  }
}

class _TodayLoadingView extends StatelessWidget {
  const _TodayLoadingView();

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.only(top: tokens.spacing.x2, bottom: 120),
      child: ContentColumn(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 160,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            SizedBox(height: tokens.spacing.lg),
            Container(
              width: 240,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            SizedBox(height: tokens.spacing.x2),
            const ScoreTileStripSkeleton(),
            SizedBox(height: tokens.spacing.md),
            const ScoreHeroSkeleton(),
          ],
        ),
      ),
    );
  }
}

class _TodayLoadError extends StatelessWidget {
  const _TodayLoadError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return ContentColumn(
      child: Padding(
        padding: EdgeInsets.only(top: tokens.spacing.x2, bottom: 120),
        child: GlassSurface(
          borderRadius: 24,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'TODAY',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                'Could not load this view',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Pull to refresh or retry now. Empty states are shown only after real data loads.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                      height: 1.45,
                    ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: tokens.touch.minTarget,
                child: FilledButton(
                  onPressed: () => onRetry(),
                  child: const Text('Retry'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// First-run welcome card for users with zero journal entries, mirroring
/// `src/components/today/empty-state.tsx` with `today.empty*` copy.
class _TodayEmptyWelcome extends StatelessWidget {
  const _TodayEmptyWelcome({
    required this.onStart,
    required this.onDismiss,
  });

  final VoidCallback onStart;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'WELCOME TO PURPLE',
            style: TextStyle(
              fontSize: tokens.typography.labelSize('labelEyebrow'),
              letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          SizedBox(height: tokens.spacing.md),
          Text(
            'Start where you are.',
            style: TextStyle(
              fontFamily: PurpleType.serif,
              fontSize: 30,
              height: 1.05,
              color: const Color(0xFFF2F2F5),
            ),
          ),
          SizedBox(height: tokens.spacing.md),
          Text(
            'Write a sentence, speak a thought, or snap a photo. Purple does the rest.',
            style: TextStyle(
              fontFamily: PurpleType.serif,
              fontSize: tokens.typography.labelSize('bodySerif'),
              height: tokens.typography.lineHeight('bodySerif'),
              color: Colors.white.withValues(alpha: 0.75),
            ),
          ),
          SizedBox(height: tokens.spacing.xl),
          // Web uses a wrapping flex row; Wrap keeps narrow widths safe.
          Wrap(
            spacing: 12,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              SizedBox(
                height: 48,
                child: FilledButton.icon(
                  onPressed: onStart,
                  style: FilledButton.styleFrom(
                    backgroundColor: purple,
                    foregroundColor: const Color(0xFF0A0710),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                  ),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Start journaling'),
                ),
              ),
              SizedBox(
                height: tokens.touch.minTarget,
                child: TextButton(
                  onPressed: onDismiss,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.55),
                  ),
                  child: const Text(
                    'Skip for now',
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                    ),
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

class _DateEyebrow extends StatelessWidget {
  const _DateEyebrow({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return Text(
      DateFormat('EEEE, MMMM d').format(date),
      style: TextStyle(
        fontSize: tokens.typography.labelSize('labelEyebrow'),
        letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
        color: Colors.white.withValues(alpha: 0.55),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.title,
    required this.firstName,
    required this.isOffline,
  });

  final String title;
  final String? firstName;
  final bool isOffline;

  @override
  Widget build(BuildContext context) {
    final name = firstName?.trim();
    final text = name == null || name.isEmpty ? '$title.' : '$title, $name.';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontFamily: PurpleType.serif,
              fontSize: 32,
              height: 1.05,
              color: const Color(0xFFF2F2F5),
            ),
          ),
        ),
        if (isOffline)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Text(
              'Offline',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
            ),
          ),
      ],
    );
  }
}

class _Lede extends StatelessWidget {
  const _Lede({required this.text, this.emphasized = false});

  final String text;

  /// Web: AI narrative lede renders at foreground/75, prompt at foreground/55.
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 600),
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: emphasized ? 0.75 : 0.55),
              height: 1.45,
            ),
      ),
    );
  }
}

/// "Viewing {date} / Back to today" glass pill shown when browsing a past day.
class _ViewingDayPill extends StatelessWidget {
  const _ViewingDayPill({
    required this.date,
    required this.onBackToToday,
  });

  final DateTime date;
  final VoidCallback onBackToToday;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final glass = tokens.glassFor('dark');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: parseTokenColor(glass.fillThin),
        borderRadius: BorderRadius.circular(tokens.radius.pill),
        border: Border.all(
          color: parseTokenColor(glass.border),
          width: glass.borderWidthPx,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Viewing ${DateFormat('EEEE, MMMM d').format(date)}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.55),
              ),
            ),
          ),
          SizedBox(
            height: tokens.touch.minTarget,
            child: TextButton(
              onPressed: onBackToToday,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                foregroundColor: const Color(0xFFF2F2F5),
              ),
              child: const Text(
                'Back to today',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Score strip + "Your signals" grid for the selected day.
class _ScoresAndSignals extends StatelessWidget {
  const _ScoresAndSignals({
    required this.scores,
    required this.focus,
    required this.isToday,
    required this.selectedDate,
    required this.onTileTap,
    required this.onSignalTap,
    required this.onViewAll,
    required this.onConnect,
  });

  final ScoreSnapshot scores;
  final String focus;
  final bool isToday;
  final DateTime selectedDate;
  final ValueChanged<String> onTileTap;
  final ValueChanged<TodayVitalItem> onSignalTap;
  final VoidCallback onViewAll;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _ScoreStrip(scores: scores, focus: focus, onTileTap: onTileTap),
        SizedBox(height: tokens.spacing.x2),
        _SignalsSection(
          scores: scores,
          isToday: isToday,
          selectedDate: selectedDate,
          onViewAll: onViewAll,
          onConnect: onConnect,
          onSignalTap: onSignalTap,
        ),
      ],
    );
  }
}

/// Three-up Readiness / Sleep / Activity strip in one glass surface,
/// mirroring the web `glass-surface rounded-[20px] p-2 grid-cols-3` section.
/// Missing scores render as en dashes, never invented values.
class _ScoreStrip extends StatelessWidget {
  const _ScoreStrip({
    required this.scores,
    required this.focus,
    required this.onTileTap,
  });

  final ScoreSnapshot scores;
  final String focus;
  final ValueChanged<String> onTileTap;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(8),
      borderRadius: 20,
      // The page Column provides unbounded height (scroll view), so the
      // stretch row must size itself to the tallest tile via IntrinsicHeight;
      // bare stretch would force infinite height and blank the whole screen.
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ScoreTile(
                label: 'Readiness',
                value: scores.readiness,
                active: focus == 'readiness',
                onTap: () => onTileTap('readiness'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ScoreTile(
                label: 'Sleep',
                value: scores.sleepScore,
                active: focus == 'sleep',
                onTap: () => onTileTap('sleep'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ScoreTile(
                label: 'Activity',
                value: scores.activity,
                active: focus == 'activity',
                onTap: () => onTileTap('activity'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "Your signals" grid ported from `src/components/today/today-vitals.tsx`:
/// only metrics with real values render; a connect prompt (today) or a
/// no-signals-that-day card (past days) shows otherwise.
class _SignalsSection extends StatelessWidget {
  const _SignalsSection({
    required this.scores,
    required this.isToday,
    required this.selectedDate,
    required this.onViewAll,
    required this.onConnect,
    required this.onSignalTap,
  });

  final ScoreSnapshot scores;
  final bool isToday;
  final DateTime selectedDate;
  final VoidCallback onViewAll;
  final VoidCallback onConnect;
  final ValueChanged<TodayVitalItem> onSignalTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final items = buildTodayVitalItems(scores);
    final hasItems = scores.hasData && items.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'YOUR SIGNALS',
                style: TextStyle(
                  fontSize: tokens.typography.labelSize('labelEyebrow'),
                  letterSpacing:
                      tokens.typography.letterSpacing('labelEyebrow'),
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
              ),
            ),
            if (hasItems)
              SizedBox(
                height: tokens.touch.minTarget,
                child: TextButton(
                  onPressed: onViewAll,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    foregroundColor: Colors.white.withValues(alpha: 0.55),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View all', style: TextStyle(fontSize: 12)),
                      Icon(Icons.chevron_right, size: 14),
                    ],
                  ),
                ),
              ),
          ],
        ),
        SizedBox(height: tokens.spacing.sm),
        if (hasItems)
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 600 ? 3 : 2;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  mainAxisExtent: 78,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: items.length,
                itemBuilder: (context, index) => _SignalTile(
                  item: items[index],
                  onTap: () => onSignalTap(items[index]),
                ),
              );
            },
          )
        else if (isToday)
          _ConnectSignalsCard(onConnect: onConnect)
        else
          _NoSignalsForDayCard(date: selectedDate),
      ],
    );
  }
}

class _SignalTile extends StatelessWidget {
  const _SignalTile({required this.item, required this.onTap});

  final TodayVitalItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');

    return Material(
      color: parseTokenColor(colors.backgroundSecondary),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: parseTokenColor(colors.divider)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.label.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: tokens.typography.labelSize('labelSmall'),
                  letterSpacing: 1.3,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
              ),
              // The grid gives tiles a fixed extent; anchor the numeral in the
              // remaining space so font metric differences never overflow.
              Expanded(
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Text.rich(
                    TextSpan(
                      text: _formatValue(item.value),
                      style: TextStyle(
                        fontFamily: PurpleType.serif,
                        fontSize: 24,
                        height: 1.1,
                        color: const Color(0xFFF2F2F5),
                        fontFeatures: [const FontFeature.tabularFigures()],
                      ),
                      children: [
                        if (item.unit != null)
                          TextSpan(
                            text: ' ${item.unit}',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.55),
                            ),
                          ),
                      ],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatValue(double value) {
    if (value == value.roundToDouble()) return value.round().toString();
    return value.toStringAsFixed(1);
  }
}

class _ConnectSignalsCard extends StatelessWidget {
  const _ConnectSignalsCard({required this.onConnect});

  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');

    return Material(
      color: parseTokenColor(colors.backgroundSecondary),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onConnect,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: parseTokenColor(colors.divider)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Connect a device to see your signals',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.93),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Oura, Whoop, or Apple Health: your readings appear here once synced.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Connect',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    size: 14,
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Past-day empty state matching web TodayVitals: "No signals recorded on
/// {date}." with the only-real-readings footnote.
class _NoSignalsForDayCard extends StatelessWidget {
  const _NoSignalsForDayCard({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'No signals recorded on ${DateFormat('EEEE, MMMM d').format(date)}.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.93),
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Purple only shows readings that were actually captured that day.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                ),
          ),
        ],
      ),
    );
  }
}

/// Journal / Meds quick actions mirroring the web `QuickAction` grid
/// (glass cards, icon over 14px semibold label, 80px tall).
class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.showSeizure,
    required this.onJournal,
    required this.onMeds,
    required this.onSeizure,
  });

  final bool showSeizure;
  final VoidCallback onJournal;
  final VoidCallback onMeds;
  final VoidCallback onSeizure;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return Row(
      children: [
        Expanded(
          child: _QuickActionCard(
            icon: Icons.menu_book_outlined,
            label: 'Journal',
            onTap: onJournal,
          ),
        ),
        SizedBox(width: tokens.spacing.sm),
        Expanded(
          child: _QuickActionCard(
            icon: Icons.medication_outlined,
            label: 'Meds',
            onTap: onMeds,
          ),
        ),
        if (showSeizure) ...[
          SizedBox(width: tokens.spacing.sm),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.bolt_outlined,
              label: 'Seizure',
              onTap: onSeizure,
              accentColor: purple,
            ),
          ),
        ],
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.onTap,
    this.accentColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final accent = accentColor;
    return SizedBox(
      height: 80,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          splashColor: Colors.white.withValues(alpha: 0.06),
          highlightColor: Colors.white.withValues(alpha: 0.04),
          child: GlassSurface(
            borderRadius: 18,
            padding: EdgeInsets.zero,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 24,
                  color: accent ?? Colors.white.withValues(alpha: 0.93),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: accent ?? Colors.white.withValues(alpha: 0.93),
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

/// "More for today" disclosure mirroring the web section: full-width glass
/// toggle, then the wearables nudge, team announcement, body measurements
/// row, and the compact sync status with a biometrics deep link.
class _MoreForToday extends StatelessWidget {
  const _MoreForToday({
    required this.expanded,
    required this.onToggle,
    required this.data,
    required this.syncTick,
    required this.showWearablesNudge,
    required this.onDismissWearablesNudge,
    required this.onConnectDevice,
    required this.onDigDeeper,
    required this.onHydration,
  });

  final bool expanded;
  final VoidCallback onToggle;
  final TodayData data;
  final int syncTick;
  final bool showWearablesNudge;
  final VoidCallback onDismissWearablesNudge;
  final VoidCallback onConnectDevice;
  final VoidCallback onDigDeeper;
  final VoidCallback onHydration;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final scores = data.scores;
    final hasMeasurements = scores.hasData &&
        (scores.tempDeviationC != null ||
            scores.respRateBpm != null ||
            scores.spo2 != null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onToggle,
            borderRadius: BorderRadius.circular(20),
            splashColor: Colors.white.withValues(alpha: 0.06),
            highlightColor: Colors.white.withValues(alpha: 0.04),
            child: GlassSurface(
              borderRadius: 20,
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'MORE FOR TODAY',
                      style: TextStyle(
                        fontSize: tokens.typography.labelSize('labelEyebrow'),
                        letterSpacing:
                            tokens.typography.letterSpacing('labelEyebrow'),
                        fontWeight: FontWeight.w600,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: expanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      size: 18,
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (expanded) ...[
          SizedBox(height: tokens.spacing.md),
          if (showWearablesNudge) ...[
            _WearablesNudgeCard(
              onConnect: onConnectDevice,
              onDismiss: onDismissWearablesNudge,
            ),
            SizedBox(height: tokens.spacing.md),
          ],
          if (data.announcement != null) ...[
            _AnnouncementCard(announcement: data.announcement!),
            SizedBox(height: tokens.spacing.md),
          ],
          if (hasMeasurements) ...[
            _BodyMeasurementsRow(scores: scores),
            SizedBox(height: tokens.spacing.md),
          ],
          _HydrationLinkCard(onTap: onHydration),
          SizedBox(height: tokens.spacing.md),
          if (scores.hasData) ...[
            SizedBox(height: tokens.spacing.sm),
            Center(
              child: SyncStatusBar(
                variant: SyncStatusVariant.compact,
                refreshSignal: syncTick,
              ),
            ),
            Center(
              child: SizedBox(
                height: tokens.touch.minTarget,
                child: TextButton.icon(
                  onPressed: onDigDeeper,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.55),
                  ),
                  icon: const Icon(Icons.show_chart, size: 12),
                  label: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Dig deeper into your signals',
                        style: TextStyle(fontSize: 12),
                      ),
                      Icon(Icons.chevron_right, size: 12),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

/// Hydration row in "More for today" mirroring web link to `/hydration`.
class _HydrationLinkCard extends StatelessWidget {
  const _HydrationLinkCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');

    return Material(
      color: parseTokenColor(colors.backgroundSecondary),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: parseTokenColor(colors.divider)),
          ),
          child: Row(
            children: [
              Icon(
                Icons.water_drop_outlined,
                size: 18,
                color: Colors.white.withValues(alpha: 0.55),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hydration',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.93),
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Track water, electrolytes, and déjà vu',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
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
      ),
    );
  }
}

/// Web `ConnectWearablesCard`: gentle nudge to connect a wearable, with the
/// `today.wearablesNudge*` copy, dismissible.
class _WearablesNudgeCard extends StatelessWidget {
  const _WearablesNudgeCard({
    required this.onConnect,
    required this.onDismiss,
  });

  final VoidCallback onConnect;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: parseTokenColor(colors.backgroundTertiary),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.monitor_heart_outlined,
              size: 16,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Connect Oura or Whoop to see how your body affects your patterns.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.93),
                        height: 1.4,
                      ),
                ),
                SizedBox(
                  height: tokens.touch.minTarget,
                  child: TextButton(
                    onPressed: onConnect,
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      foregroundColor: purple,
                    ),
                    child: const Text(
                      'Connect a device',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onDismiss,
            tooltip: 'Dismiss',
            iconSize: 16,
            color: Colors.white.withValues(alpha: 0.55),
            icon: const Icon(Icons.close),
          ),
        ],
      ),
    );
  }
}

/// Team announcement card (`todayPage.fromTeam`).
class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.announcement});

  final TodayAnnouncement announcement;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: parseTokenColor(colors.backgroundSecondary),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: parseTokenColor(colors.divider)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'FROM THE PURPLE TEAM',
            style: TextStyle(
              fontSize: tokens.typography.labelSize('labelEyebrow'),
              letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            announcement.subject,
            style: TextStyle(
              fontFamily: PurpleType.serif,
              fontSize: 18,
              color: const Color(0xFFF2F2F5),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            announcement.body,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.4,
                ),
          ),
        ],
      ),
    );
  }
}

/// Body measurements row (`body-measurements-row.tsx`): Temp deviation,
/// respiratory rate, SpO2 as three large statistics between hairlines.
class _BodyMeasurementsRow extends StatelessWidget {
  const _BodyMeasurementsRow({required this.scores});

  final ScoreSnapshot scores;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final divider = parseTokenColor(colors.divider);

    final temp = scores.tempDeviationC;
    final resp = scores.respRateBpm;
    final spo2 = scores.spo2;

    return Container(
      padding: EdgeInsets.symmetric(vertical: tokens.spacing.x2),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: divider),
          bottom: BorderSide(color: divider),
        ),
      ),
      child: Row(
        children: [
          _Measurement(
            value: temp != null
                ? '${temp > 0 ? '+' : ''}${temp.toStringAsFixed(1)}°'
                : '–',
            label: 'Temp Δ',
          ),
          _Measurement(
            value: resp != null ? resp.round().toString() : '–',
            label: 'Resp /min',
          ),
          _Measurement(
            value: spo2 != null ? '${spo2.round()}%' : '–',
            label: 'SpO₂',
          ),
        ],
      ),
    );
  }
}

class _Measurement extends StatelessWidget {
  const _Measurement({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.w300,
              height: 1.1,
              letterSpacing: tokens.typography.letterSpacing('numericDisplay'),
              color: const Color(0xFFF2F2F5),
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            style: TextStyle(
              fontSize: tokens.typography.labelSize('labelEyebrow'),
              letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayDosesSection extends StatelessWidget {
  const _TodayDosesSection({
    required this.medsAsync,
    required this.medicationCount,
    required this.selectedDate,
    required this.isToday,
  });

  final AsyncValue<MedsData> medsAsync;
  final int medicationCount;
  final DateTime selectedDate;
  final bool isToday;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final sectionTitle = isToday
        ? 'Today'
        : DateFormat('EEEE, MMMM d').format(selectedDate);
    final emptySchedule = isToday
        ? 'No medications scheduled for today.'
        : 'No medications scheduled for ${DateFormat('EEEE, MMMM d').format(selectedDate)}.';

    return medsAsync.when(
      loading: () => GlassCard(
        child: Text(
          'Loading your dose schedule.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.64),
              ),
        ),
      ),
      error: (_, __) => GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Could not load doses right now.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.64),
                  ),
            ),
            SizedBox(
              height: tokens.touch.minTarget,
              child: TextButton(
                onPressed: () => context.go('/meds'),
                child: const Text('Open meds'),
              ),
            ),
          ],
        ),
      ),
      data: (medsData) {
        final doses = medsData.todayDoses;
        final hasMedication = medicationCount > 0 || medsData.hasMeds;

        return GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sectionTitle,
                      style: TextStyle(
                        fontFamily: PurpleType.serif,
                        fontSize: 20,
                        color: const Color(0xFFF2F2F5),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: tokens.touch.minTarget,
                    child: TextButton(
                      onPressed: () => context.go('/meds'),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size(tokens.touch.minTarget, tokens.touch.minTarget),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Medications',
                            style: TextStyle(
                              fontSize: 12,
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
                  ),
                ],
              ),
              if (doses.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.medication_outlined,
                        size: 16,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          hasMedication
                              ? emptySchedule
                              : '$emptySchedule Add one in Meds.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.white.withValues(alpha: 0.64),
                                height: 1.4,
                              ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(top: 8),
                  itemCount: doses.length,
                  separatorBuilder: (_, __) => Divider(
                    height: 1,
                    color: parseTokenColor(colors.divider),
                  ),
                  itemBuilder: (context, index) {
                    return _DoseRow(dose: doses[index]);
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

class _DoseRow extends StatelessWidget {
  const _DoseRow({required this.dose});

  final MedicationDose dose;

  @override
  Widget build(BuildContext context) {
    final colors = PurpleTokens.loaded.colorsFor('dark');
    final medName = dose.medication?.name ?? 'Medication';
    final strength = dose.medication?.strength;
    final timeLabel = DateFormat.jm().format(dose.scheduledAt.toLocal());

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TimePill(time: timeLabel, status: dose.status, colors: colors),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  medName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  softWrap: true,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.93),
                      ),
                ),
                if (strength != null && strength.isNotEmpty)
                  Text(
                    strength,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.55),
                        ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              _statusLabel(dose.status),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: _statusColor(dose.status, colors),
                  ),
            ),
          ),
        ],
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'taken':
        return 'Taken';
      case 'skipped':
        return 'Skipped';
      case 'missed':
        return 'Missed';
      default:
        return 'Pending';
    }
  }

  Color _statusColor(String status, PurpleColorTokens colors) {
    switch (status) {
      case 'taken':
        return parseTokenColor(colors.success);
      case 'missed':
        return parseTokenColor(colors.destructive);
      case 'skipped':
        return Colors.white.withValues(alpha: 0.55);
      default:
        return parseTokenColor(colors.purplePrimary);
    }
  }
}

class _TimePill extends StatelessWidget {
  const _TimePill({
    required this.time,
    required this.status,
    required this.colors,
  });

  final String time;
  final String status;
  final PurpleColorTokens colors;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, ring) = switch (status) {
      'taken' => (
          parseTokenColor(colors.success).withValues(alpha: 0.15),
          parseTokenColor(colors.success),
          parseTokenColor(colors.success).withValues(alpha: 0.3),
        ),
      'missed' => (
          parseTokenColor(colors.destructive).withValues(alpha: 0.15),
          parseTokenColor(colors.destructive),
          parseTokenColor(colors.destructive).withValues(alpha: 0.3),
        ),
      'skipped' => (
          Colors.white.withValues(alpha: 0.08),
          Colors.white.withValues(alpha: 0.55),
          Colors.white.withValues(alpha: 0.12),
        ),
      _ => (
          parseTokenColor(colors.purplePrimary).withValues(alpha: 0.15),
          parseTokenColor(colors.purplePrimary),
          parseTokenColor(colors.purplePrimary).withValues(alpha: 0.3),
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: ring),
      ),
      child: Text(
        time,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: fg,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
      ),
    );
  }
}
