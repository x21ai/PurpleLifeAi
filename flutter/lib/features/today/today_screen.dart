import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/providers/core_providers.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../hydration/today_hydration_panel.dart';
import '../reports/reports_repository.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../vitals/sync_status_bar.dart';
import 'date_strip.dart';
import 'missed_dose_catchup.dart';
import 'models/score_snapshot.dart';
import 'models/today_data.dart';
import 'today_meds_section.dart';
import 'today_merged_layout.dart';
import 'today_merged_widgets.dart';
import 'today_quick_log_panel.dart';
import 'today_repository.dart';
import 'wearable_sync.dart';

/// Merged Today dashboard matching `personalized-dashboard-preview.html`
/// layout=merged: greeting → date strip → score tiles → signals → narrative →
/// icon expanders (Meds open by default) → Last 7 days.
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  static bool _emptyDismissed = false;
  static bool _wearablesNudgeDismissed = false;

  /// First visit / cold start: Meds panel open (preview contract).
  TodayExpandPanel? _expanded = TodayExpandPanel.meds;
  DateTime _selectedDate = _startOfDay(DateTime.now());
  int _syncTick = 0;

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

  void _toggleExpand(TodayExpandPanel panel) {
    // Meds / Hydration / Log / Wearables taps and panel close: drop any
    // leftover focus so the soft keyboard cannot block dose actions.
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      if (_expanded == panel) {
        _expanded = null;
      } else {
        _expanded = panel;
      }
    });
  }

  void _openMedsPanel() {
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() => _expanded = TodayExpandPanel.meds);
  }

  void _openLogPanel() {
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() => _expanded = TodayExpandPanel.log);
  }

  void _onWearablesSynced() {
    ref.invalidate(todayDataProvider);
    ref.invalidate(medsForDayProvider(_dateYmd));
    if (!_isToday) {
      ref.invalidate(scoreSnapshotForDayProvider(_dateYmd));
    }
    if (mounted) setState(() => _syncTick += 1);
  }

  Future<void> _refresh() async {
    // Wearable sync is fail-open with its own timeout; never block refresh forever.
    await syncConnectedWearables(
      supabase: ref.read(supabaseClientProvider),
      worker: ref.read(workerClientProvider),
    );
    _onWearablesSynced();
    try {
      await Future.wait([
        ref.read(todayDataProvider.future),
        ref.read(medsForDayProvider(_dateYmd).future),
        if (!_isToday) ref.read(scoreSnapshotForDayProvider(_dateYmd).future),
      ]).timeout(todayProviderTimeout);
    } catch (_) {
      // Keep pull-to-refresh stable even if one provider fails or times out.
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
          // Keep prior Today content visible while pull-to-refresh reloads;
          // otherwise invalidate flashes the full-screen loading skeleton (blank).
          skipLoadingOnReload: true,
          skipLoadingOnRefresh: true,
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
              expanded: _expanded,
              onToggleExpand: _toggleExpand,
              onOpenMedsPanel: _openMedsPanel,
              onOpenLogPanel: _openLogPanel,
              syncTick: _syncTick,
              onWearablesSynced: _onWearablesSynced,
              showWearablesNudge:
                  TodayData.empty.showWearablesNudge && !_wearablesNudgeDismissed,
              onDismissWearablesNudge: () =>
                  setState(() => _wearablesNudgeDismissed = true),
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
                expanded: _expanded,
                onToggleExpand: _toggleExpand,
                onOpenMedsPanel: _openMedsPanel,
                onOpenLogPanel: _openLogPanel,
                syncTick: _syncTick,
                onWearablesSynced: _onWearablesSynced,
                showWearablesNudge:
                    data.showWearablesNudge && !_wearablesNudgeDismissed,
                onDismissWearablesNudge: () =>
                    setState(() => _wearablesNudgeDismissed = true),
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
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
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
    required this.expanded,
    required this.onToggleExpand,
    required this.onOpenMedsPanel,
    required this.onOpenLogPanel,
    required this.syncTick,
    required this.onWearablesSynced,
    required this.showWearablesNudge,
    required this.onDismissWearablesNudge,
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
  final TodayExpandPanel? expanded;
  final ValueChanged<TodayExpandPanel> onToggleExpand;
  final VoidCallback onOpenMedsPanel;
  final VoidCallback onOpenLogPanel;
  final int syncTick;
  final VoidCallback onWearablesSynced;
  final bool showWearablesNudge;
  final VoidCallback onDismissWearablesNudge;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final narrative = isToday ? data.narrative?.trim() : null;
    final hasNarrative = narrative != null && narrative.isNotEmpty;
    final dateEyebrow = DateFormat('EEEE, MMM d').format(selectedDate);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (data.loadError != null) ...[
          _TodayLoadErrorBanner(message: data.loadError!),
          SizedBox(height: tokens.spacing.lg),
        ],
        if (isToday)
          MissedDoseCatchupBanner(
            onExpandMeds: onOpenMedsPanel,
          ),
        if (showEmptyWelcome && isToday) ...[
          _TodayEmptyWelcome(
            onStart: () => context.go(AppRoutes.journalNew),
            onDismiss: onDismissWelcome,
          ),
          SizedBox(height: tokens.spacing.xl),
        ],
        Text(
          dateEyebrow,
          style: TextStyle(
            fontSize: tokens.typography.labelSize('labelEyebrow'),
            letterSpacing: tokens.typography.letterSpacing('labelEyebrow'),
            fontWeight: FontWeight.w600,
            color: Colors.white.withValues(alpha: 0.45),
          ),
        ),
        SizedBox(height: tokens.spacing.sm),
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
        DateStrip(value: selectedDate, onChanged: onDateChanged),
        SizedBox(height: tokens.spacing.lg),
        if (scoresLoading)
          const _ScoresLoadingPlaceholder()
        else
          TodayScoreTiles(
            scores: scores,
            onTapData: () => context.go(AppRoutes.data),
          ),
        SizedBox(height: tokens.spacing.xl),
        TodayYourSignals(
          scores: scores,
          onViewAll: () => context.go(AppRoutes.data),
          onMetricTap: (key) => context.go(AppRoutes.biometricsMetric(key)),
        ),
        if (hasNarrative) ...[
          SizedBox(height: tokens.spacing.x2),
          TodayMayaCard(narrative: narrative),
        ],
        if (isToday && data.announcement != null) ...[
          SizedBox(height: tokens.spacing.lg),
          _AnnouncementBanner(
            announcement: data.announcement!,
            onTap: onOpenLogPanel,
          ),
        ],
        SizedBox(height: tokens.spacing.xl),
        TodayIconActionRow(
          expanded: expanded,
          onSelect: onToggleExpand,
        ),
        if (expanded != null) ...[
          SizedBox(height: tokens.spacing.md),
          if (expanded == TodayExpandPanel.meds)
            TodayExpandPanelShell(
              title: "Today's doses",
              onClose: () => onToggleExpand(TodayExpandPanel.meds),
              child: TodayMedsSection(
                selectedDate: selectedDate,
                isToday: isToday,
                medicationCount: data.medicationCount,
              ),
            )
          else if (expanded == TodayExpandPanel.hydration)
            TodayExpandPanelShell(
              title: 'Hydration',
              onClose: () => onToggleExpand(TodayExpandPanel.hydration),
              trailing: TextButton(
                onPressed: () => context.go(AppRoutes.hydration),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white.withValues(alpha: 0.55),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size(
                    tokens.touch.minTarget,
                    tokens.touch.minTarget,
                  ),
                ),
                child: const Text('Day view ›', style: TextStyle(fontSize: 12)),
              ),
              child: TodayHydrationPanel(
                onOpenDayView: () => context.go(AppRoutes.hydration),
              ),
            )
          else if (expanded == TodayExpandPanel.wearables)
            TodayExpandPanelShell(
              title: 'Wearables',
              onClose: () => onToggleExpand(TodayExpandPanel.wearables),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (showWearablesNudge) ...[
                    _WearablesNudgeCard(
                      onConnect: () => context.go(AppRoutes.tools),
                      onDismiss: onDismissWearablesNudge,
                    ),
                    SizedBox(height: tokens.spacing.md),
                  ],
                  TodayWearablesExpandBody(
                    onOpenTools: () => context.go(AppRoutes.tools),
                  ),
                  SizedBox(height: tokens.spacing.sm),
                  SyncStatusBar(
                    variant: SyncStatusVariant.compact,
                    refreshSignal: syncTick,
                    onSynced: onWearablesSynced,
                  ),
                ],
              ),
            )
          else if (expanded == TodayExpandPanel.log)
            TodayExpandPanelShell(
              title: 'Quick log',
              onClose: () => onToggleExpand(TodayExpandPanel.log),
              child: TodayLogExpandBody(
                showSeizure: showsSeizureFeatures(data.conditions),
                selectedDate: selectedDate,
                onJournal: () => context.go(AppRoutes.journalNew),
                onSeizure: () => context.go(AppRoutes.seizuresNew),
              ),
            ),
        ],
        SizedBox(height: tokens.spacing.xl),
        TodayLastSevenDaysCard(
          onOpenData: () => context.go(AppRoutes.data),
        ),
        if (isToday) ...[
          SizedBox(height: tokens.spacing.md),
          TodayRecommendedInline(
            conditions: data.conditions,
            hasLabs: hasLabs,
          ),
        ],
        SizedBox(height: tokens.spacing.lg),
        Center(
          child: TextButton.icon(
            onPressed: () => context.go(AppRoutes.plan),
            style: TextButton.styleFrom(
              foregroundColor: Colors.white.withValues(alpha: 0.45),
            ),
            icon: const Icon(Icons.checklist, size: 14),
            label: const Text('Open Plan', style: TextStyle(fontSize: 12)),
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
    Widget box() => Expanded(
          child: Container(
            height: 120,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        );

    return Row(
      children: [
        box(),
        const SizedBox(width: 8),
        box(),
        const SizedBox(width: 8),
        box(),
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

/// Preview `apple-banner`: team announcement opens Quick log expander.
class _AnnouncementBanner extends StatelessWidget {
  const _AnnouncementBanner({
    required this.announcement,
    required this.onTap,
  });

  final TodayAnnouncement announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;
    final colors = tokens.colorsFor('dark');
    final purple = parseTokenColor(colors.purplePrimary);
    final subject = announcement.subject.trim();
    final body = announcement.body.trim();
    final copy = body.isEmpty
        ? subject
        : (subject.isEmpty ? body : '$subject. $body');

    return Material(
      color: parseTokenColor(colors.backgroundSecondary),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: parseTokenColor(colors.divider)),
          ),
          child: Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: purple.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'New',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: purple,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  copy,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                        height: 1.35,
                      ),
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.45),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
