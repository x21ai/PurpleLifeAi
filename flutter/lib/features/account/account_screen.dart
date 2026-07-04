import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_state.dart';
import '../../core/providers/core_providers.dart';
import '../../design/purple_theme.dart';
import '../../shell/routes.dart';
import '../shared/glass_helpers.dart';

/// Account settings sheet (mirrors web `account.tsx` sections).
class AccountScreen extends ConsumerStatefulWidget {
  const AccountScreen({super.key});

  @override
  ConsumerState<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends ConsumerState<AccountScreen> {
  bool _loadingProfile = true;
  String? _firstName;
  String? _email;
  String _appearance = 'dark';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final userId = ref.read(authProvider).userId;
    if (userId == null) {
      if (mounted) setState(() => _loadingProfile = false);
      return;
    }

    try {
      final supabase = ref.read(supabaseClientProvider);
      final row = await supabase
          .from('profiles')
          .select('first_name, locale, country, timezone')
          .eq('id', userId)
          .maybeSingle();
      final session = ref.read(authSessionProvider).valueOrNull;
      if (mounted) {
        setState(() {
          _firstName = row?['first_name'] as String?;
          _email = session?.user.email;
          _loadingProfile = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingProfile = false);
    }
  }

  Future<void> _signOut() async {
    final auth = await ref.read(authRepositoryProvider.future);
    await auth.signOut();
    if (mounted) context.go(AppRoutes.signIn);
  }

  @override
  Widget build(BuildContext context) {
    return CanvasBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 24, bottom: 120),
        child: ShellContentColumn(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Account',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontFamily: 'Georgia',
                      color: Colors.white.withValues(alpha: 0.95),
                    ),
              ),
              const SizedBox(height: 24),
              const _SectionLabel('Profile'),
              _SheetCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _loadingProfile
                          ? 'Loading profile…'
                          : (_firstName?.trim().isNotEmpty == true
                              ? _firstName!.trim()
                              : 'Your profile'),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Avatar and profile fields integration point',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Security'),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Password',
                  subtitle: 'Change your password',
                ),
              ),
              const SizedBox(height: 12),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Two-factor authentication',
                  subtitle: 'Add an extra layer of security',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Language & region'),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Region & language',
                  subtitle: 'Country, timezone, and language preferences',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Appearance'),
              _SheetCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Appearance',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Choose how Purple looks across every page.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        for (final opt in _appearanceOptions)
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: _AppearanceTile(
                                label: opt.label,
                                description: opt.description,
                                selected: _appearance == opt.value,
                                onTap: () => setState(() => _appearance = opt.value),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Subscription'),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Your plan',
                  subtitle: 'Subscription management integration point',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Invite'),
              const _SheetCard(
                child: _PlaceholderRow(
                  title: 'Get an invite code',
                  subtitle: 'Share Purple with someone who could use a calmer health journal',
                ),
              ),
              const SizedBox(height: 20),
              const _SectionLabel('Session'),
              _SheetCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Signed in as',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _email ?? '–',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.55),
                          ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: _signOut,
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

class _AppearanceOption {
  const _AppearanceOption({
    required this.value,
    required this.label,
    required this.description,
  });

  final String value;
  final String label;
  final String description;
}

const _appearanceOptions = [
  _AppearanceOption(value: 'dark', label: 'Dark', description: 'Default'),
  _AppearanceOption(value: 'light', label: 'Light', description: 'Always light'),
  _AppearanceOption(value: 'system', label: 'System', description: 'Match device'),
];

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              letterSpacing: 1.1,
              color: Colors.white.withValues(alpha: 0.45),
            ),
      ),
    );
  }
}

class _SheetCard extends StatelessWidget {
  const _SheetCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: child,
    );
  }
}

class _PlaceholderRow extends StatelessWidget {
  const _PlaceholderRow({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.9),
              ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.55),
              ),
        ),
      ],
    );
  }
}

class _AppearanceTile extends StatelessWidget {
  const _AppearanceTile({
    required this.label,
    required this.description,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String description;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      borderRadius: 16,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: selected
              ? Border.all(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.5))
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.5),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
