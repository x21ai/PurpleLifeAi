import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../shared/empty_state.dart';
import '../shared/glass_helpers.dart';
import '../shared/loading_skeleton.dart';
import '../vitals/sync_status_bar.dart';
import 'models/score_snapshot.dart';
import 'today_repository.dart';

/// Today dashboard with Layer 0 canvas, glass sections, and honest empty states.
class TodayScreen extends ConsumerStatefulWidget {
  const TodayScreen({super.key});

  @override
  ConsumerState<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends ConsumerState<TodayScreen> {
  bool _emptyDismissed = false;
  String _focus = 'sleep';

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 5) return 'Still up';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final todayAsync = ref.watch(todayDataProvider);

    return CanvasBackground(
      child: SizedBox(
        width: double.infinity,
        child: todayAsync.when(
        loading: () => const ContentColumn(
          child: Padding(
            padding: EdgeInsets.only(top: 24, bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ScoreHeroSkeleton(),
                SizedBox(height: 32),
                LoadingSkeleton(),
              ],
            ),
          ),
        ),
        error: (error, _) => ContentColumn(
          child: Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: EmptyState(
              eyebrow: 'Today',
              title: 'Could not load today',
              body: 'Check your connection and try again.',
              primaryActionLabel: 'Retry',
              onPrimaryAction: () => ref.invalidate(todayDataProvider),
            ),
          ),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(todayDataProvider);
            await ref.read(todayDataProvider.future);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(top: 24, bottom: 120),
            child: ContentColumn(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Header(
                    greeting: _greeting(),
                    firstName: data.firstName,
                    isOffline: data.isOffline,
                  ),
                  const SizedBox(height: 16),
                  const SyncStatusBar(variant: SyncStatusVariant.compact),
                  const SizedBox(height: 24),
                  if (data.showEmptyWelcome && !_emptyDismissed) ...[
                    EmptyState(
                      eyebrow: 'Welcome',
                      title: 'Your calm space starts here',
                      body:
                          'Capture what is happening today. Purple only shows readings that were actually recorded.',
                      primaryActionLabel: 'Write first entry',
                      onPrimaryAction: () => context.go('/journal'),
                      secondaryActionLabel: 'Skip for now',
                      onSecondaryAction: () => setState(() => _emptyDismissed = true),
                    ),
                    const SizedBox(height: 24),
                  ],
                  _ScoreHeroSection(
                    scores: data.scores,
                    focus: _focus,
                    onFocusChanged: (value) => setState(() => _focus = value),
                  ),
                  if (data.narrative != null && data.narrative!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    GlassSurface(
                      child: Text(
                        data.narrative!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.82),
                              height: 1.5,
                            ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                  _SignalsSection(
                    scores: data.scores,
                    onConnect: () => context.go('/settings'),
                  ),
                ],
              ),
            ),
          ),
        ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.greeting,
    required this.firstName,
    required this.isOffline,
  });

  final String greeting;
  final String? firstName;
  final bool isOffline;

  @override
  Widget build(BuildContext context) {
    final name = firstName?.trim();
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name == null || name.isEmpty ? greeting : '$greeting, $name',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontFamily: 'Georgia',
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'How is today feeling?',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
            ],
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

class _ScoreHeroSection extends StatelessWidget {
  const _ScoreHeroSection({
    required this.scores,
    required this.focus,
    required this.onFocusChanged,
  });

  final ScoreSnapshot scores;
  final String focus;
  final ValueChanged<String> onFocusChanged;

  @override
  Widget build(BuildContext context) {
    if (!scores.hasData) {
      return GlassCard(
        onTap: null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'YOUR FOCUS',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                    color: Colors.white.withValues(alpha: 0.45),
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'Connect a device to see scores',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Oura, Whoop, or Apple Health readings appear here once synced.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
            ),
          ],
        ),
      );
    }

    final focusScore = switch (focus) {
      'readiness' => scores.readiness,
      'activity' => scores.activity,
      _ => scores.sleepScore,
    };
    final focusLabel = switch (focus) {
      'readiness' => 'Readiness',
      'activity' => 'Activity',
      _ => 'Sleep',
    };

    return GlassSurface(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            children: [
              _FocusChip(
                label: 'Sleep',
                selected: focus == 'sleep',
                onTap: () => onFocusChanged('sleep'),
              ),
              _FocusChip(
                label: 'Readiness',
                selected: focus == 'readiness',
                onTap: () => onFocusChanged('readiness'),
              ),
              _FocusChip(
                label: 'Activity',
                selected: focus == 'activity',
                onTap: () => onFocusChanged('activity'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            focusLabel.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 1.2,
                  color: Colors.white.withValues(alpha: 0.45),
                ),
          ),
          const SizedBox(height: 8),
          Text(
            focusScore?.round().toString() ?? '–',
            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontFamily: 'Georgia',
                  color: Colors.white.withValues(alpha: 0.96),
                  height: 1,
                ),
          ),
        ],
      ),
    );
  }
}

class _FocusChip extends StatelessWidget {
  const _FocusChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
      visualDensity: VisualDensity.compact,
      backgroundColor: Colors.white.withValues(alpha: 0.06),
      selectedColor: Colors.white.withValues(alpha: 0.14),
      labelStyle: TextStyle(
        color: Colors.white.withValues(alpha: selected ? 0.95 : 0.65),
      ),
      side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
    );
  }
}

class _SignalsSection extends StatelessWidget {
  const _SignalsSection({
    required this.scores,
    required this.onConnect,
  });

  final ScoreSnapshot scores;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final items = buildTodayVitalItems(scores);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'YOUR SIGNALS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
            ),
            if (items.isNotEmpty)
              TextButton(
                onPressed: () => context.go('/vitals'),
                child: const Text('View all'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (items.isEmpty)
          GlassCard(
            onTap: onConnect,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Connect a device to see your signals',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Purple only shows readings that were actually captured.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.55,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return GlassCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.label.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const Spacer(),
                    Text.rich(
                      TextSpan(
                        text: item.value.round().toString(),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontFamily: 'Georgia',
                              color: Colors.white.withValues(alpha: 0.95),
                            ),
                        children: item.unit == null
                            ? null
                            : [
                                TextSpan(
                                  text: ' ${item.unit}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: Colors.white.withValues(alpha: 0.55),
                                      ),
                                ),
                              ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        if (scores.latestAt != null) ...[
          const SizedBox(height: 8),
          Text(
            'Latest ${DateFormat.MMMd().format(DateTime.parse(scores.latestAt!))}',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.4),
                ),
          ),
        ],
      ],
    );
  }
}
