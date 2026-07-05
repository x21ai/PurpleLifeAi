import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../design/purple_type.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';
import 'settings_hub.dart';
import 'platform_flags.dart';
import 'settings_sections.dart' show
    AboutSection,
    AiProviderSection,
    ConditionHistorySection,
    DataSection,
    PreferencesSection,
    SettingsProfileFlags,
    WhatITrackSection,
    openPurpleUrl,
    settingsProfileFlagsProvider;

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
    final platform = ref.watch(platformFlagsProvider).valueOrNull ??
        const PlatformFlags();

    return CanvasBackground(
      child: SingleChildScrollView(
        primary: true,
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
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
              const SettingsHubCards(current: 'settings'),
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
                    onTap: () => context.go(AppRoutes.reportsRedirect),
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
                    onTap: () => context.go(AppRoutes.settingsSharing),
                  ),
                  if (platform.community)
                    _SettingsRow(
                      icon: Icons.groups_outlined,
                      title: 'Community',
                      subtitle: 'Share experiences and find resources',
                      onTap: () => openPurpleUrl('/community-new'),
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
                    onTap: () => context.go(AppRoutes.settingsTravel),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _PastHistoryCard(showSeizure: flags.showSeizure),
              const SizedBox(height: 28),
              const PreferencesSection(key: Key('settings-preferences')),
              const SizedBox(height: 20),
              const AiProviderSection(key: Key('settings-ai-provider')),
              const SizedBox(height: 20),
              const WhatITrackSection(key: Key('settings-what-i-track')),
              const SizedBox(height: 20),
              const ConditionHistorySection(key: Key('settings-health-history')),
              const SizedBox(height: 28),
              const _GroupLabel(title: 'Data'),
              const DataSection(key: Key('settings-data')),
              const SizedBox(height: 28),
              const _GroupLabel(title: 'Help'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.chat_bubble_outline,
                    title: 'Contact the team',
                    subtitle: 'Questions, feedback, anything',
                    onTap: () => context.go(AppRoutes.settingsContact),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const AboutSection(key: Key('settings-about')),
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
                      onTap: () async {
                        try {
                          await openPurpleUrl('/admin');
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Could not open admin console'),
                              ),
                            );
                          }
                        }
                      },
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
              Expanded(
                child: Text(
                  'Add past history',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontFamily: PurpleType.serif,
                        color: Colors.white.withValues(alpha: 0.95),
                      ),
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
                  onTap: () => context.go('${AppRoutes.meds}?add=past'),
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

class _GroupLabel extends StatelessWidget {
  const _GroupLabel({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 32, bottom: 10),
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
