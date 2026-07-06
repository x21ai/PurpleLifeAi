import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../design/purple_type.dart';
import '../shared/glass_helpers.dart';

/// Hub cards (Account / Settings / Tools) from web `settings.tsx` `HubCard`.
class SettingsHubCards extends StatelessWidget {
  const SettingsHubCards({super.key, required this.current});

  final String current;

  static const _wideBreakpoint = 520.0;

  @override
  Widget build(BuildContext context) {
    final cards = [
      SettingsHubCard(
        icon: Icons.account_circle_outlined,
        title: 'Account',
        subtitle: 'Profile, security, language, appearance',
        active: current == 'account',
        onTap: () => context.go('/account'),
      ),
      SettingsHubCard(
        icon: Icons.settings_outlined,
        title: 'Settings',
        subtitle: 'Preferences, sharing, data',
        active: current == 'settings',
        onTap: () => context.go('/settings'),
      ),
      SettingsHubCard(
        icon: Icons.build_outlined,
        title: 'Tools',
        subtitle: 'Devices, alarms, integrations',
        active: current == 'tools',
        onTap: () => context.go('/tools'),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= _wideBreakpoint;
        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < cards.length; i++) ...[
                if (i > 0) const SizedBox(width: 12),
                Expanded(child: cards[i]),
              ],
            ],
          );
        }
        return Column(
          children: [
            for (var i = 0; i < cards.length; i++) ...[
              if (i > 0) const SizedBox(height: 12),
              cards[i],
            ],
          ],
        );
      },
    );
  }
}

class SettingsHubCard extends StatelessWidget {
  const SettingsHubCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: active
                ? primary.withValues(alpha: 0.05)
                : Colors.white.withValues(alpha: 0.03),
            border: Border.all(
              color: active
                  ? primary.withValues(alpha: 0.6)
                  : Colors.white.withValues(alpha: 0.1),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: primary),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontFamily: PurpleType.serif,
                      color: Colors.white.withValues(alpha: 0.95),
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.55),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Back link + hub cards layout for sub-routes that share the settings chrome.
class SettingsHubLayout extends StatelessWidget {
  const SettingsHubLayout({
    super.key,
    required this.hub,
    required this.title,
    required this.body,
  });

  final String hub;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        // Bottom padding is a small buffer only: NativeAppShell already
        // reserves shellTabBarInset() worth of space for the floating nav
        // bar, so stacking another ~120px here doubled up as excess
        // whitespace (tf-bottom-whitespace).
        padding: const EdgeInsets.only(top: 24, bottom: 32),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/settings'),
                icon: Icon(Icons.arrow_back,
                    color: Colors.white.withValues(alpha: 0.55)),
                label: Text(
                  'Settings',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.55)),
                ),
              ),
              const SizedBox(height: 16),
              SettingsHubCards(current: hub),
              const SizedBox(height: 24),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.5,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
