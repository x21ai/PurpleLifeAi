import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/observability/luciq_bootstrap.dart';
import '../../design/purple_type.dart';
import 'settings_style.dart';
import '../shared/glass_helpers.dart' show ContentColumn;

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
    final palette = context.sheet;
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
            color: active ? palette.hubActiveFill : palette.hubInactiveFill,
            border: Border.all(
              color: active ? palette.hubActiveBorder : palette.hubInactiveBorder,
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
                      color: palette.textHigh,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: palette.textSubtle,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Help rows on the Settings hub: Luciq report (native TF) + contact.
class SettingsHelpSection extends StatelessWidget {
  const SettingsHelpSection({super.key, required this.onContactTap});

  final VoidCallback onContactTap;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: luciqInitNotifier,
      builder: (context, _, __) {
        final rows = <Widget>[
          if (luciqReportConfigured())
            const _SettingsHubActionRow(
              icon: Icons.bug_report_outlined,
              title: 'Report a problem',
              subtitle: 'Send a bug report with optional screenshot',
              onTap: showLuciqReport,
            ),
          _SettingsHubActionRow(
            icon: Icons.chat_bubble_outline,
            title: 'Contact the team',
            subtitle: 'Questions, feedback, anything',
            onTap: onContactTap,
          ),
        ];

        return _SettingsHubSection(children: rows);
      },
    );
  }
}

class _SettingsHubSection extends StatelessWidget {
  const _SettingsHubSection({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final palette = context.sheet;

    return SheetGlass(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                color: palette.divider.withValues(alpha: 0.65),
              ),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _SettingsHubActionRow extends StatelessWidget {
  const _SettingsHubActionRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = context.sheet;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 64),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: palette.iconChipFill,
                ),
                child: Icon(icon, size: 18, color: palette.iconChipIcon),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontFamily: PurpleType.serif,
                            color: palette.textBody,
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: palette.textSubtle,
                          ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, size: 18, color: palette.chevron),
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
    final palette = context.sheet;

    return SheetCanvas(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 32),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextButton.icon(
                onPressed: () => context.go('/settings'),
                icon: Icon(Icons.arrow_back, color: palette.textSubtle),
                label: Text('Settings', style: TextStyle(color: palette.textSubtle)),
              ),
              const SizedBox(height: 16),
              SettingsHubCards(current: hub),
              const SizedBox(height: 24),
              Text(
                title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      color: palette.textHigh,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                body,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: palette.textSubtle,
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
