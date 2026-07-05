import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'settings_sections.dart';

/// Settings hub ported from web `src/routes/_app/settings.tsx`.
///
/// Section order and copy mirror the web page: hub cards, Your health,
/// People, App, Add past history, Preferences, AI provider, What I track,
/// Health history, Data, Help + About, the "moved" footnote, and Admin.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flags = ref.watch(settingsProfileFlagsProvider).valueOrNull ??
        const SettingsProfileFlags();

    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SETTINGS',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'All in your\ncontrol.',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: PurpleType.serif,
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Account, privacy, integrations, and how Purple talks to you.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.65),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 24),
              const _HubCards(current: 'settings'),
              const SizedBox(height: 28),
              const _GroupLabel(title: 'Your health'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.medication_outlined,
                    title: 'Medications',
                    subtitle: 'Schedules, reminders, and adherence',
                    onTap: () => context.go('/meds'),
                  ),
                  _SettingsRow(
                    icon: Icons.description_outlined,
                    title: 'Lab reports',
                    subtitle:
                        'Upload labs as PDF or photo. See trends. Educational only.',
                    onTap: () => context.go('/settings/reports'),
                  ),
                  if (flags.showSeizure)
                    _SettingsRow(
                      icon: Icons.bolt_outlined,
                      title: 'Past episodes',
                      subtitle: 'Log seizures from any date or time',
                      iconTone: _RowIconTone.destructive,
                      onTap: () => context.go(AppRoutes.seizuresNew),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              const _GroupLabel(title: 'People'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.favorite_outline,
                    title: 'Sharing & access',
                    subtitle:
                        'Invite caregivers, set what they see, approve edits',
                    onTap: () => context.go('/settings/sharing'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const _GroupLabel(title: 'App'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.flight_outlined,
                    title: 'Travel mode',
                    subtitle: 'Plan trips, anchor doses to home time',
                    onTap: () => context.go('/settings/travel'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _PastHistoryCard(showSeizure: flags.showSeizure),
              const SizedBox(height: 20),
              const PreferencesSection(),
              const SizedBox(height: 20),
              const AiProviderSection(),
              const SizedBox(height: 20),
              const WhatITrackSection(),
              const SizedBox(height: 20),
              const ConditionHistorySection(),
              const SizedBox(height: 20),
              const _GroupLabel(title: 'Data'),
              const DataSection(),
              const SizedBox(height: 20),
              const _GroupLabel(title: 'Help'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.chat_bubble_outline,
                    title: 'Contact the team',
                    subtitle: 'Questions, feedback, anything',
                    onTap: () => context.go('/settings/contact'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const AboutSection(),
              const SizedBox(height: 32),
              Text(
                'Looking for connections, alarms, or your device? They moved '
                'to Tools. Name, password, 2FA, region, language, and '
                'appearance live in Account.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.45),
                      height: 1.5,
                    ),
              ),
              if (flags.isAdmin) ...[
                const SizedBox(height: 20),
                const _GroupLabel(title: 'Admin'),
                _SettingsSection(
                  children: [
                    _SettingsRow(
                      icon: Icons.shield_outlined,
                      title: 'Admin console',
                      subtitle: 'Manage users, messages, and community',
                      iconTone: _RowIconTone.primary,
                      onTap: () => showWebOnlySheet(
                        context,
                        title: 'Admin console',
                        message:
                            'The admin console lives in the web app at '
                            'purplelife.org/admin.',
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// "Add past history" card ported from the web settings page.
class _PastHistoryCard extends StatelessWidget {
  const _PastHistoryCard({required this.showSeizure});

  final bool showSeizure;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.history,
                size: 18,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Add past history',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontFamily: PurpleType.serif,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Backfill old medications and past episodes so Purple can see '
            'your full story. Each form lets you pick any date.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.55),
                  height: 1.5,
                ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final wide = constraints.maxWidth >= 520;
              final tiles = <Widget>[
                _PastHistoryTile(
                  icon: Icons.medication_outlined,
                  iconColor: Theme.of(context).colorScheme.primary,
                  title: 'Old medications',
                  subtitle: 'Set start & end dates in the past',
                  onTap: () => context.go('/meds'),
                ),
                if (showSeizure)
                  _PastHistoryTile(
                    icon: Icons.bolt_outlined,
                    iconColor: Theme.of(context).colorScheme.error,
                    title: 'Past episodes',
                    subtitle: 'Log seizures from any date or time',
                    onTap: () => context.go(AppRoutes.seizuresNew),
                  ),
              ];
              if (wide && tiles.length > 1) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: tiles[0]),
                    const SizedBox(width: 12),
                    Expanded(child: tiles[1]),
                  ],
                );
              }
              return Column(
                children: [
                  for (var i = 0; i < tiles.length; i++) ...[
                    if (i > 0) const SizedBox(height: 10),
                    tiles[i],
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _PastHistoryTile extends StatelessWidget {
  const _PastHistoryTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.1),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: iconColor),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontFamily: PurpleType.serif,
                            color: Colors.white.withValues(alpha: 0.92),
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HubCards extends StatelessWidget {
  const _HubCards({required this.current});

  final String current;

  @override
  Widget build(BuildContext context) {
    final cards = [
      _HubCard(
        icon: Icons.account_circle_outlined,
        title: 'Account',
        subtitle: 'Profile, security, language, appearance',
        active: current == 'account',
        onTap: () => context.go('/account'),
      ),
      _HubCard(
        icon: Icons.settings_outlined,
        title: 'Settings',
        subtitle: 'Preferences, sharing, data',
        active: current == 'settings',
        onTap: () => context.go('/settings'),
      ),
      _HubCard(
        icon: Icons.build_outlined,
        title: 'Tools',
        subtitle: 'Devices, alarms, integrations',
        active: current == 'tools',
        onTap: () => context.go('/tools'),
      ),
    ];

    return Column(
      children: [
        for (var i = 0; i < cards.length; i++) ...[
          if (i > 0) const SizedBox(height: 12),
          cards[i],
        ],
      ],
    );
  }
}

/// Hub card matching web `HubCard`: icon above title above subtitle, active
/// card carries a primary border and soft primary tint.
class _HubCard extends StatelessWidget {
  const _HubCard({
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

class _GroupLabel extends StatelessWidget {
  const _GroupLabel({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1.2,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            children[i],
          ],
        ],
      ),
    );
  }
}

enum _RowIconTone { standard, primary, destructive }

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.iconTone = _RowIconTone.standard,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final _RowIconTone iconTone;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final Color chipColor;
    final Color iconColor;
    switch (iconTone) {
      case _RowIconTone.primary:
        chipColor = scheme.primary.withValues(alpha: 0.12);
        iconColor = scheme.primary;
      case _RowIconTone.destructive:
        chipColor = scheme.error.withValues(alpha: 0.12);
        iconColor = scheme.error;
      case _RowIconTone.standard:
        chipColor = Colors.white.withValues(alpha: 0.08);
        iconColor = Colors.white.withValues(alpha: 0.8);
    }

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
                  color: chipColor,
                ),
                child: Icon(icon, size: 18, color: iconColor),
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
                            color: Colors.white.withValues(alpha: 0.92),
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.5),
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                size: 18,
                color: Colors.white.withValues(alpha: 0.35),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Re-export hub layout for account and tools placeholder screens.
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
        padding: const EdgeInsets.only(top: 24, bottom: 120),
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
              _HubCards(current: hub),
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
