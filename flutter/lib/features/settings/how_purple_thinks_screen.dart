import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// "How Purple thinks" article (web `settings.how-purple-thinks.tsx`).
class HowPurpleThinksScreen extends StatelessWidget {
  const HowPurpleThinksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go(AppRoutes.settings),
                icon: Icon(Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55)),
                label: Text(
                  'Settings',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'HOW PURPLE THINKS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Reads gently.\nActs only when you say.',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.05,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              const _ThinkCard(
                icon: Icons.visibility_outlined,
                title: 'What Purple sees',
                body:
                    'When you ask a question, Purple reads the last 7 days of '
                    'biometrics, 14 days of journal entries, 90 days of seizure '
                    'events, your current medications, and the latest risk '
                    'forecast. Nothing else.',
              ),
              const SizedBox(height: 12),
              const _ThinkCard(
                icon: Icons.psychology_outlined,
                title: 'How patterns are found',
                body:
                    'Every night, a small job looks across 8 signals, sleep, '
                    'HRV, temperature, activity, missed doses, mood, location, '
                    'and seizure history, for repeating combinations. New patterns '
                    'surface in Patterns on the web app.',
              ),
              const SizedBox(height: 12),
              const _ThinkCard(
                icon: Icons.auto_awesome_outlined,
                title: 'When Purple proposes an action',
                body:
                    'If Purple wants to add a medication, log a seizure, or '
                    'change a setting on your behalf, it shows a Confirm card '
                    'first. Nothing is written until you tap Confirm.',
              ),
              const SizedBox(height: 12),
              const _ThinkCard(
                icon: Icons.lock_outline,
                title: 'What stays private',
                body:
                    'Your data lives in your account. Purple never trains models '
                    'on it, never shares it with anyone, and you can export or '
                    'delete everything from Settings → Data.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ThinkCard extends StatelessWidget {
  const _ThinkCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: primary.withValues(alpha: 0.12),
                ),
                child: Icon(icon, size: 16, color: primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: PurpleType.serif,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.75),
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }
}
