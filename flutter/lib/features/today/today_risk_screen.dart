import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/tokens.dart';
import '../shared/glass_helpers.dart';

/// Stub for web `/today/risk` until full risk detail ships in Wave 1+.
class TodayRiskScreen extends StatelessWidget {
  const TodayRiskScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tokens = PurpleTokens.loaded;

    return CanvasBackground(
      child: ContentColumn(
        child: Padding(
          padding: EdgeInsets.only(
            top: tokens.spacing.x2,
            bottom: tokens.spacing.x2,
          ),
          child: GlassSurface(
            borderRadius: 24,
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: tokens.touch.minTarget,
                  child: TextButton.icon(
                    onPressed: () => context.go('/today'),
                    icon: const Icon(Icons.chevron_left, size: 18),
                    label: const Text('Today'),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "TODAY'S READING",
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Full risk reading',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Risk score, band, and factor breakdown from your latest forecast will appear here.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.7),
                        height: 1.45,
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
