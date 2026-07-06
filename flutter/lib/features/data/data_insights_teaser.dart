import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shell/routes.dart';
import '../insights/ai_insights_repository.dart';
import 'data_style.dart';

/// Compact "What Purple is noticing" teaser folded into the Data tab.
class DataInsightsTeaser extends ConsumerWidget {
  const DataInsightsTeaser({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cardsAsync = ref.watch(dailyInsightCardsProvider);
    final p = DataPalette.dark();

    return cardsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (result) {
        if (result.cards.isEmpty) return const SizedBox.shrink();
        final headline = result.headline?.trim();
        final first = result.cards.first;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const DataSectionHead(title: 'Patterns · insights'),
            DataCardShell(
              onTap: () => context.go(AppRoutes.insights),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'WHAT PURPLE IS NOTICING',
                    style: dataEyebrow(palette: p),
                  ),
                  const SizedBox(height: 8),
                  if (headline != null && headline.isNotEmpty)
                    Text(
                      headline,
                      style: dataSans(
                        fontSize: 14,
                        height: 1.4,
                        color: p.textSecondary,
                      ),
                    ),
                  if (headline != null && headline.isNotEmpty)
                    const SizedBox(height: 8),
                  Text(
                    first.title,
                    style: dataSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: p.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    first.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: dataSans(
                      fontSize: 13,
                      height: 1.4,
                      color: p.textTertiary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'See all patterns',
                    style: dataSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: p.purplePrimary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}
