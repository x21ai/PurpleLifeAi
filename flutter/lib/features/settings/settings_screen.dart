import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_state.dart';
import '../../core/providers/core_providers.dart';
import '../shared/glass_helpers.dart';

/// Settings hub with navigation rows for account, sharing, tools, and health links.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

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
                'Your\nspace',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontFamily: 'Georgia',
                      height: 1.02,
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Account, preferences, and tools for your health journey.',
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
                    subtitle: 'Doses, reminders, and library',
                    onTap: () => context.go('/meds'),
                  ),
                  _SettingsRow(
                    icon: Icons.description_outlined,
                    title: 'Labs and reports',
                    subtitle: 'Upload and review documents',
                    onTap: () => context.go('/settings/reports'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const _GroupLabel(title: 'People'),
              _SettingsSection(
                children: [
                  _SettingsRow(
                    icon: Icons.favorite_outline,
                    title: 'Sharing',
                    subtitle: 'Caregivers and trusted contacts',
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
                    title: 'Travel',
                    subtitle: 'Time zone and trip mode',
                    onTap: () => context.go('/settings/travel'),
                  ),
                  _SettingsRow(
                    icon: Icons.mail_outline,
                    title: 'Contact',
                    subtitle: 'Questions and feedback',
                    onTap: () => context.go('/settings/contact'),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              GlassSurface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.person_outline,
                          size: 20,
                          color: Colors.white.withValues(alpha: 0.65),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Signed in',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                        ),
                      ],
                    ),
                    if (auth.userId != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        auth.userId!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.white.withValues(alpha: 0.45),
                            ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () async {
                        final authRepo =
                            await ref.read(authRepositoryProvider.future);
                        await authRepo.signOut();
                        if (context.mounted) context.go('/sign-in');
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white.withValues(alpha: 0.85),
                        side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.2),
                        ),
                      ),
                      child: const Text('Sign out'),
                    ),
                  ],
                ),
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 520;
        final cards = [
          _HubCard(
            icon: Icons.account_circle_outlined,
            title: 'Account',
            subtitle: 'Profile and security',
            active: current == 'account',
            onTap: () => context.go('/account'),
          ),
          _HubCard(
            icon: Icons.settings_outlined,
            title: 'Settings',
            subtitle: 'Preferences and data',
            active: current == 'settings',
            onTap: () => context.go('/settings'),
          ),
          _HubCard(
            icon: Icons.build_outlined,
            title: 'Tools',
            subtitle: 'Integrations and devices',
            active: current == 'tools',
            onTap: () => context.go('/tools'),
          ),
        ];

        if (wide) {
          return Row(
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
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(
            icon,
            color: active
                ? Theme.of(context).colorScheme.primary
                : Colors.white.withValues(alpha: 0.65),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Text(
                  subtitle,
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

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: Colors.white.withValues(alpha: 0.65)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontWeight: FontWeight.w500,
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
                      fontFamily: 'Georgia',
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
