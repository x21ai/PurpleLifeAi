import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../insights/ai_insights_repository.dart';
import '../reports/reports_repository.dart';
import '../shared/glass_helpers.dart';
import '../today/today_repository.dart';
import 'recommended_catalog.dart';

/// Plan tab: Protocol | Recommended segmented sub-nav (Merged preview parity).
class PlanScreen extends ConsumerStatefulWidget {
  const PlanScreen({super.key, this.initialSegment = PlanSegment.protocol});

  final PlanSegment initialSegment;

  @override
  ConsumerState<PlanScreen> createState() => _PlanScreenState();
}

enum PlanSegment { protocol, recommended }

class _PlanScreenState extends ConsumerState<PlanScreen> {
  late PlanSegment _segment;

  @override
  void initState() {
    super.initState();
    _segment = widget.initialSegment;
  }

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return CanvasBackground(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dailyInsightCardsProvider);
          ref.invalidate(todayDataProvider);
          ref.invalidate(reportsHubProvider);
          await ref.read(dailyInsightCardsProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(top: 24, bottom: 128),
          child: ContentColumn(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PLAN',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.4,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  _segment == PlanSegment.protocol
                      ? 'Your protocol'
                      : 'Recommended for you',
                  style: PurpleType.serifStyle(
                    fontSize: 32,
                    height: 1.05,
                    color: Colors.white.withValues(alpha: 0.95),
                  ),
                ),
                const SizedBox(height: 20),
                _PlanSegmentControl(
                  selected: _segment,
                  activeColor: purple,
                  onSelected: (s) => setState(() => _segment = s),
                ),
                const SizedBox(height: 24),
                if (_segment == PlanSegment.protocol)
                  const _ProtocolSegment()
                else
                  const _RecommendedSegment(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlanSegmentControl extends StatelessWidget {
  const _PlanSegmentControl({
    required this.selected,
    required this.activeColor,
    required this.onSelected,
  });

  final PlanSegment selected;
  final Color activeColor;
  final ValueChanged<PlanSegment> onSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _SegmentPill(
          label: 'Protocol',
          selected: selected == PlanSegment.protocol,
          activeColor: activeColor,
          onTap: () => onSelected(PlanSegment.protocol),
        ),
        const SizedBox(width: 8),
        _SegmentPill(
          label: 'Recommended',
          selected: selected == PlanSegment.recommended,
          activeColor: activeColor,
          onTap: () => onSelected(PlanSegment.recommended),
        ),
      ],
    );
  }
}

class _SegmentPill extends StatelessWidget {
  const _SegmentPill({
    required this.label,
    required this.selected,
    required this.activeColor,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? activeColor.withValues(alpha: 0.2)
          : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 40),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Center(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: selected
                          ? Colors.white.withValues(alpha: 0.95)
                          : Colors.white.withValues(alpha: 0.55),
                      fontWeight:
                          selected ? FontWeight.w600 : FontWeight.w500,
                    ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProtocolSegment extends ConsumerWidget {
  const _ProtocolSegment();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardsAsync = ref.watch(dailyInsightCardsProvider);

    return cardsAsync.when(
      loading: () => const GlassSurface(
        padding: EdgeInsets.all(24),
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      error: (_, __) => const _ProtocolEmpty(
        message:
            'Could not load your protocol right now. Pull to refresh and try again.',
      ),
      data: (result) {
        if (result.cards.isEmpty) {
          return _ProtocolEmpty(
            message: result.error == null
                ? 'Log a few more readings or upload a report to unlock your daily protocol cards.'
                : 'Purple could not generate protocol cards right now. Try again later.',
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (result.headline != null &&
                result.headline!.trim().isNotEmpty) ...[
              Text(
                result.headline!.trim(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.75),
                      height: 1.45,
                    ),
              ),
              const SizedBox(height: 16),
            ],
            for (var i = 0; i < result.cards.length; i++) ...[
              _ProtocolCard(number: i + 1, card: result.cards[i]),
              if (i < result.cards.length - 1) const SizedBox(height: 12),
            ],
          ],
        );
      },
    );
  }
}

class _ProtocolEmpty extends StatelessWidget {
  const _ProtocolEmpty({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.checklist_rtl_outlined,
            size: 20,
            color: Colors.white.withValues(alpha: 0.45),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                    height: 1.5,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProtocolCard extends StatelessWidget {
  const _ProtocolCard({required this.number, required this.card});

  final int number;
  final DailyInsightCard card;

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: purple.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: Text(
              '$number',
              style: PurpleType.sansStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.white.withValues(alpha: 0.92),
              ),
            ),
          ),
          const SizedBox(width: 14),
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
                const SizedBox(height: 6),
                Text(
                  card.body,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                        height: 1.45,
                      ),
                ),
                if (card.metricKey != null) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => context.go(
                      AppRoutes.biometricsMetric(card.metricKey!),
                    ),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      'View metric',
                      style: TextStyle(color: purple),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RecommendedSegment extends ConsumerWidget {
  const _RecommendedSegment();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(todayDataProvider);
    final hub = ref.watch(reportsHubProvider);
    final conditions = today.valueOrNull?.conditions ?? const [];
    final hasLabs = (hub.valueOrNull?.documents.length ?? 0) > 0;
    final items = rankedRecommendedItems(
      conditions: conditions,
      ctx: RecommendedContext(hasLabs: hasLabs),
    );

    if (items.isEmpty) {
      return GlassSurface(
        borderRadius: 20,
        padding: const EdgeInsets.all(20),
        child: Text(
          'Set your focus conditions in Account to unlock personalized recommendations.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.7),
                height: 1.5,
              ),
        ),
      );
    }

    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          _RecommendedCard(item: items[i]),
          if (i < items.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _RecommendedCard extends StatelessWidget {
  const _RecommendedCard({required this.item});

  final RecommendedItem item;

  IconData _iconFor(String name) => switch (name) {
        'ring' => Icons.watch_outlined,
        'doc' => Icons.description_outlined,
        'moon' => Icons.nightlight_outlined,
        'heart' => Icons.favorite_outline,
        'journal' => Icons.edit_note_outlined,
        'people' => Icons.people_outline,
        'bp' => Icons.monitor_heart_outlined,
        _ => Icons.auto_awesome_outlined,
      };

  @override
  Widget build(BuildContext context) {
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );

    return GlassSurface(
      borderRadius: 20,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                _iconFor(item.iconName),
                size: 20,
                color: purple.withValues(alpha: 0.85),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.category.toUpperCase(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.1,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (item.disclaimer != null) ...[
            const SizedBox(height: 8),
            Text(
              item.disclaimer!,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.45),
                    height: 1.35,
                  ),
            ),
          ],
          const SizedBox(height: 14),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.tonal(
              onPressed: () => context.go(item.route),
              style: FilledButton.styleFrom(
                backgroundColor: purple.withValues(alpha: 0.18),
                foregroundColor: Colors.white.withValues(alpha: 0.92),
              ),
              child: Text(item.cta),
            ),
          ),
        ],
      ),
    );
  }
}
