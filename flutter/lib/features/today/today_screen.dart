import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../design/glass_surface.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../reports/reports_repository.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart' hide GlassSurface;
import '../shared/loading_skeleton.dart';
import 'date_strip.dart';
import 'models/score_snapshot.dart';
import 'models/today_data.dart';
import 'today_meds_section.dart';
import 'today_merged_widgets.dart';
import 'today_repository.dart';
import 'wearable_sync.dart';

/// Merged Today dashboard: date strip, dual score hero, personalization pill,
/// metric strip, single Maya narrative (`personalized-dashboard-preview.html`).
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  static bool _emptyDismissed = false;

  DateTime _selectedDate = _startOfDay(DateTime.now());

  static DateTime _startOfDay(DateTime d) => DateTime(d.year, d.month, d.day);

  static bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  String get _dateYmd => DateFormat('yyyy-MM-dd').format(_selectedDate);

  bool get _isToday => _isSameDay(_selectedDate, DateTime.now());

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 5) return 'Still up';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  Future<void> _refresh() async {
    await syncConnectedWearables(
      supabase: ref.read(supabaseClientProvider),
      worker: ref.read(workerClientProvider),
    );
    ref.invalidate(todayDataProvider);
    ref.invalidate(medsForDayProvider(_dateYmd));
    if (!_isToday) {
      ref.invalidate(scoreSnapshotForDayProvider(_dateYmd));
    }
    try {
      await Future.wait([
        ref.read(todayDataProvider.future),
        ref.read(medsForDayProvider(_dateYmd).future),
        if (!_isToday) ref.read(scoreSnapshotForDayProvider(_dateYmd).future),
      ]);
    } catch (_) {
      // Keep pull-to-refresh stable even if one provider fails.
    }
  }

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(todayDataProvider);
    final hub = ref.watch(reportsHubProvider);

    return CanvasBackground(
      child: SizedBox(
        width: double.infinity,
        child: todayAsync.when(
          loading: _TodayLoadingView.new,
          error: (_, __) => _MergedTodayScrollView(
            onRefresh: _refresh,
            child: _MergedTodayBody(
              data: TodayData.empty.copyWith(
                loadError: todayLoadErrorBannerMessage,
              ),
              scores: ScoreSnapshot.empty,
              scoresLoading: false,
              selectedDate: _selectedDate,
              isToday: _isToday,
              hasLabs: hub.valueOrNull?.documents.isNotEmpty ?? false,
              greeting: _greeting(),
              showEmptyWelcome: !_emptyDismissed,
              onDismissWelcome: () => setState(() => _emptyDismissed = true),
              onDateChanged: (day) =>
                  setState(() => _selectedDate = _startOfDay(day)),
            ),
          ),
          data: (data) {
            final dayScoresAsync = _isToday
                ? null
                : ref.watch(scoreSnapshotForDayProvider(_dateYmd));
            final scores = _isToday
                ? data.scores
                : (dayScoresAsync?.valueOrNull ?? ScoreSnapshot.empty);
            final scoresLoading =
                !_isToday && (dayScoresAsync?.isLoading ?? false);
            final hasLabs = (hub.valueOrNull?.documents.length ?? 0) > 0;

            return _MergedTodayScrollView(
              onRefresh: _refresh,
              child: _MergedTodayBody(
                data: data,
                scores: scores,
                scoresLoading: scoresLoading,
                selectedDate: _selectedDate,
                isToday: _isToday,
                hasLabs: hasLabs,
                greeting: _greeting(),
                showEmptyWelcome:
                    data.journalEntryCount == 0 && !_emptyDismissed,
                onDismissWelcome: () =>
                    setState(() => _emptyDismissed = true),
                onDateChanged: (day) =>
                    setState(() => _selectedDate = _startOfDay(day)),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MergedTodayScrollView extends StatelessWidget {
  const _MergedTodayScrollView({
    required this.onRefresh,
    required this.child,
  });

  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.only(
          top: tokens.spacing.x2,
          bottom: tokens.spacing.xl,
        ),
        child: ContentColumn(child: child),
      ),
    );
  }
}

class _MergedTodayBody extends StatelessWidget {
  const _MergedTodayBody({
    required this.data,
    required this.scores,
    required this.scoresLoading,
    required this.selectedDate,
    required this.isToday,
    required this.hasLabs,
    required this.greeting,
    required this.showEmptyWelcome,
    required this.onDismissWelcome,
    required this.onDateChanged,
  });

  final TodayData data;
  final ScoreSnapshot scores;
  final bool scoresLoading;
  final DateTime selectedDate;
  final bool isToday;
  final bool hasLabs;
  final String greeting;
  final bool showEmptyWelcome;
  final VoidCallback onDismissWelcome;
  final ValueChanged<DateTime> onDateChanged;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final narrative = isToday ? data.narrative?.trim() : null;
    final hasNarrative = narrative != null && narrative.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (data.loadError != null) ...[
          _TodayLoadErrorBanner(message: data.loadError!),
          SizedBox(height: tokens.spacing.lg),
        ],
        if (showEmptyWelcome && isToday) ...[
          _TodayEmptyWelcome(
            onStart: () => context.go(AppRoutes.journalNew),
            onDismiss: onDismissWelcome,
          ),
          SizedBox(height: tokens.spacing.xl),
        ],
        DateStrip(value: selectedDate, onChanged: onDateChanged),
        SizedBox(height: tokens.spacing.lg),
        _Header(
          title: greeting,
          firstName: data.firstName,
          isOffline: data.isOffline,
        ),
        if (!isToday) ...[
          SizedBox(height: tokens.spacing.sm),
          Text(
            'Here\'s how ${DateFormat('EEEE, MMMM d').format(selectedDate)} went.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.45,
                ),
          ),
        ] else if (!hasNarrative) ...[
          SizedBox(height: tokens.spacing.sm),
          Text(
            promptForConditions(data.conditions),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.45,
                ),
          ),
        ],
        SizedBox(height: tokens.spacing.lg),
        if (isToday)
          TodayPersonalizationStrip(
            conditions: data.conditions,
            hasWearableData: data.scores.hasData,
            hasLabs: hasLabs,
            onTap: () => context.go(AppRoutes.plan),
          ),
        if (isToday) SizedBox(height: tokens.spacing.md),
        if (scoresLoading)
          const _ScoresLoadingPlaceholder()
        else
          TodayMetricStrip(
            scores: scores,
            conditions: data.conditions,
            onMetricTap: (key) => context.go(AppRoutes.biometricsMetric(key)),
          ),
        if (hasNarrative) ...[
          SizedBox(height: tokens.spacing.x2),
          TodayMayaCard(narrative: narrative),
        ],
        SizedBox(height: tokens.spacing.x2),
        TodayProtocolTeaser(
          conditions: data.conditions,
          scores: scores,
          onSeePlan: () => context.go(AppRoutes.plan),
        ),
        if (isToday) ...[
          SizedBox(height: tokens.spacing.lg),
          TodayAskMayaChips(conditions: data.conditions),
          TodayRecommendedInline(
            conditions: data.conditions,
            hasLabs: hasLabs,
          ),
        ],
        SizedBox(height: tokens.spacing.xl),
        _QuickActions(
          showSeizure: showsSeizureFeatures(data.conditions),
          onJournal: () => context.go(AppRoutes.journal),
          onMeds: () => context.go(AppRoutes.meds),
          onSeizure: () => context.go(AppRoutes.seizuresNew),
          onData: () => context.go(AppRoutes.data),
        ),
        SizedBox(height: tokens.spacing.lg),
        TodayMedsSection(
          selectedDate: selectedDate,
          isToday: isToday,
          medicationCount: data.medicationCount,
        ),
        SizedBox(height: tokens.spacing.md),
        if (scores.hasData)
          Center(
            child: TextButton.icon(
              onPressed: () => context.go(AppRoutes.data),
              style: TextButton.styleFrom(
                foregroundColor: Colors.white.withValues(alpha: 0.55),
              ),
              icon: const Icon(Icons.show_chart, size: 12),
              label: const Text(
                'View all data',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ),
      ],
    );
  }
}

class _ScoresLoadingPlaceholder extends StatelessWidget {
  const _ScoresLoadingPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 140,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            height: 140,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
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
      padding: EdgeInsets.only(top: tokens.spacing.x2, bottom: tokens.spacing.xl),
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
            const LoadingSkeleton(sectionTitle: 'Today', tileCount: 3),
          ],
        ),
      ),
    );
  }
}

class _TodayLoadErrorBanner extends StatelessWidget {
  const _TodayLoadErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.error;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

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
            style: PurpleType.displayStyle(
              fontSize: 30,
              height: 1.05,
              color: const Color(0xFFF2F2F5),
            ),
          ),
          SizedBox(height: tokens.spacing.md),
          Text(
            'Write a sentence, speak a thought, or snap a photo. Purple does the rest.',
            style: PurpleType.bodySerif(
              color: Colors.white.withValues(alpha: 0.75),
            ),
          ),
          SizedBox(height: tokens.spacing.xl),
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
                    style: TextStyle(decoration: TextDecoration.underline),
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
            style: PurpleType.displayStyle(
              fontSize: 28,
              height: 1.1,
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

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.showSeizure,
    required this.onJournal,
    required this.onMeds,
    required this.onSeizure,
    required this.onData,
  });

  final bool showSeizure;
  final VoidCallback onJournal;
  final VoidCallback onMeds;
  final VoidCallback onSeizure;
  final VoidCallback onData;

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
        ] else ...[
          SizedBox(width: tokens.spacing.sm),
          Expanded(
            child: _QuickActionCard(
              icon: Icons.insights_outlined,
              label: 'Data',
              onTap: onData,
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
            borderRadius: BorderRadius.circular(18),
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
