import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/providers/core_providers.dart';
import '../design/glass_surface.dart';
import '../design/purple_theme.dart';
import '../design/tokens.dart';
import '../features/account/profile_avatar.dart';
import 'routes.dart';

/// Scroll-reactive frosted glass header (ports mobile-top-bar.tsx native variant).
class TopBar extends ConsumerStatefulWidget {
  const TopBar({
    super.key,
    required this.scrolled,
    this.onMenuTap,
  });

  final bool scrolled;
  final VoidCallback? onMenuTap;

  @override
  ConsumerState<TopBar> createState() => _TopBarState();
}

class _TopBarState extends ConsumerState<TopBar> {
  bool _syncing = false;

  Future<void> _syncNow() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      await ref.read(syncServiceProvider).syncAll();
    } catch (_) {
      // Sync retries on its own schedule; the header button is best-effort.
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return GlassSurface(
      variant: GlassMaterialVariant.top,
      includeHighlight: widget.scrolled,
      child: Padding(
        padding: EdgeInsets.only(top: topInset),
        child: ShellContentColumn(
          child: SizedBox(
            height: 48,
            child: Row(
              children: [
                _WordmarkButton(
                  onTap: () => context.go(AppRoutes.today),
                ),
                const Spacer(),
                _SyncButton(
                  syncing: _syncing,
                  onTap: _syncing ? null : _syncNow,
                ),
                _ProfileMenuButton(
                  onTap: () => context.go(AppRoutes.account),
                ),
                _ShellMenuButton(onTap: widget.onMenuTap),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Fixed 44x44 sync control so its hit box cannot overlap the trailing menu.
class _SyncButton extends StatelessWidget {
  const _SyncButton({
    required this.syncing,
    required this.onTap,
  });

  final bool syncing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: onTap != null,
      label: 'Sync',
      identifier: 'top-bar-sync-button',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const ValueKey('top-bar-sync-button'),
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: syncing
                  ? SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: PurpleColors.foregroundTertiary,
                      ),
                    )
                  : Icon(
                      Icons.sync_rounded,
                      size: 22,
                      color: PurpleColors.foregroundTertiary,
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Top-right hamburger: opens [Scaffold.endDrawer] via [TopBar.onMenuTap].
class _ShellMenuButton extends StatelessWidget {
  const _ShellMenuButton({required this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: onTap != null,
      label: 'Open menu',
      identifier: 'top-bar-menu-button',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const ValueKey('top-bar-menu-button'),
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: Icon(
                Icons.menu_rounded,
                size: 22,
                color: PurpleColors.foregroundTertiary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Ports web `ProfileMenu` avatar: photo or initials circle. Tapping opens Account.
class _ProfileMenuButton extends ConsumerWidget {
  const _ProfileMenuButton({required this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(avatarProfileProvider).valueOrNull;

    return Semantics(
      button: true,
      enabled: onTap != null,
      label: 'Open account',
      identifier: 'top-bar-profile-button',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const ValueKey('top-bar-profile-button'),
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: profile == null
                  ? Container(
                      width: 30,
                      height: 30,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: PurpleColors.foreground.withValues(alpha: 0.08),
                      ),
                      child: Icon(
                        Icons.person_outline_rounded,
                        size: 17,
                        color: PurpleColors.foregroundTertiary,
                      ),
                    )
                  : ProfileAvatarCircle(profile: profile, size: 30),
            ),
          ),
        ),
      ),
    );
  }
}

class _WordmarkButton extends StatelessWidget {
  const _WordmarkButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          height: 44,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Purple',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: PurpleColors.foreground,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
