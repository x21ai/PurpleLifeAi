import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';
import '../../shell/routes.dart';
import '../shared/condition_prompts.dart';
import '../shared/glass_helpers.dart';
import '../today/today_repository.dart';

/// Ask Maya landing: greeting, condition-aware prompt chips, upload labs CTA.
class AskMayaScreen extends ConsumerWidget {
  const AskMayaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todayAsync = ref.watch(todayDataProvider);
    final firstName = todayAsync.valueOrNull?.firstName?.trim();
    final conditions = todayAsync.valueOrNull?.conditions ?? const [];
    final starters = getSuggestedQuestions(conditions, cap: 5);
    final deepLinkPrompt =
        GoRouterState.of(context).uri.queryParameters['q']?.trim();
    final purple = parseTokenColor(
      PurpleTokens.loaded.colorsFor('dark').purplePrimary,
    );
    final greetingName = (firstName != null && firstName.isNotEmpty)
        ? firstName
        : 'there';

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 128),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ASK MAYA',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.4,
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Ask Maya',
                style: PurpleType.serifStyle(
                  fontSize: 32,
                  height: 1.05,
                  color: Colors.white.withValues(alpha: 0.95),
                ),
              ),
              const SizedBox(height: 20),
              GlassSurface(
                borderRadius: 20,
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ASK MAYA',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 1.2,
                            color: purple.withValues(alpha: 0.85),
                          ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Hi $greetingName — I know your conditions and wearable '
                      'data. What would you like to explore?',
                      style: PurpleType.bodySerif(
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final prompt in starters)
                    _PromptChip(
                      label: prompt,
                      activeColor: purple,
                      highlighted: deepLinkPrompt != null &&
                          deepLinkPrompt == prompt,
                      onTap: () => _openChat(context, prompt),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              GlassSurface(
                borderRadius: 20,
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Upload past labs',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Add PDF lab reports to populate report metrics and '
                      'unlock biomarker trends.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.7),
                            height: 1.45,
                          ),
                    ),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: () => context.go(AppRoutes.reportsNew),
                      child: const Text('Go to Reports upload'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go(AppRoutes.chat),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white.withValues(alpha: 0.85),
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.12),
                    ),
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: const Text('Open chat'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openChat(BuildContext context, String prompt) {
    final uri = Uri(
      path: AppRoutes.chat,
      queryParameters: {'q': prompt},
    );
    context.go(uri.toString());
  }
}

class _PromptChip extends StatelessWidget {
  const _PromptChip({
    required this.label,
    required this.activeColor,
    required this.onTap,
    this.highlighted = false,
  });

  final String label;
  final Color activeColor;
  final VoidCallback onTap;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: highlighted
          ? activeColor.withValues(alpha: 0.18)
          : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 40),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Text(
              label,
              style: PurpleType.sansStyle(
                fontSize: 13,
                color: Colors.white.withValues(alpha: 0.85),
                height: 1.3,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
