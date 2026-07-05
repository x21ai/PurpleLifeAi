import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_state.dart';
import '../design/glass_surface.dart';
import '../design/purple_theme.dart';
import '../design/tokens.dart';
import '../features/account/profile_avatar.dart';
import 'routes.dart';

const _kTopBarHeight = 48.0;
const _kMenuDrawerWidth = 280.0;
const _kMenuMinWidthPhone = 260.0;
const _kMenuWidthFraction = 0.72;
const _kMenuMaxWidthTablet = 320.0;
const _kMenuTabletBreakpoint = 768.0;

/// Apple-style trailing menu width: ~280px on phone, capped on tablet.
double shellMenuDrawerWidth(double viewportWidth) {
  if (viewportWidth < _kMenuTabletBreakpoint) {
    return math.min(viewportWidth, _kMenuDrawerWidth);
  }
  const cap = _kMenuMaxWidthTablet;
  final ratioWidth = viewportWidth * _kMenuWidthFraction;
  final clamped = math.max(_kMenuMinWidthPhone, math.min(cap, ratioWidth));
  return math.min(viewportWidth, clamped);
}

/// Right-edge app menu drawer used by [Scaffold.endDrawer].
class ShellMenuEndDrawer extends StatelessWidget {
  const ShellMenuEndDrawer({
    super.key,
    required this.location,
  });

  final String location;

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final viewportWidth = mediaQuery.size.width;
    final topOffset = mediaQuery.padding.top + _kTopBarHeight;
    final drawerWidth = shellMenuDrawerWidth(viewportWidth);

    return Drawer(
      width: drawerWidth,
      elevation: 0,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final panelHeight = math.max(0.0, constraints.maxHeight - topOffset);
          return Padding(
            padding: EdgeInsets.only(top: topOffset),
            child: SizedBox(
              width: drawerWidth,
              height: panelHeight,
              child: ShellMenuPanel(
                location: location,
                onDismiss: () => Navigator.of(context).maybePop(),
              ),
            ),
          );
        },
      ),
    );
  }
}

class ShellMenuPanel extends ConsumerWidget {
  const ShellMenuPanel({
    super.key,
    required this.location,
    required this.onDismiss,
  });

  final String location;
  final VoidCallback onDismiss;

  bool _matchesRoute(String target, {bool exact = false}) {
    if (exact) return location == target;
    return location == target || location.startsWith('$target/');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final radius = PurpleTokens.loaded.radius.sheetCard;
    final glassBorder =
        parseTokenColor(PurpleTokens.loaded.glassFor('dark').border);

    Future<void> navigateTo(String target) async {
      onDismiss();
      if (context.mounted) {
        context.go(target);
      }
    }

    Future<void> signOut() async {
      onDismiss();
      await ref.read(signOutSessionProvider)();
      if (context.mounted) {
        context.go(AppRoutes.signIn);
      }
    }

    return GlassSurface(
      variant: GlassMaterialVariant.sheet,
      includeHighlight: true,
      borderRadius: BorderRadius.horizontal(left: Radius.circular(radius)),
      padding: EdgeInsets.zero,
      child: Material(
        color: Colors.transparent,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
              child: Row(
                children: [
                  Expanded(
                    child: _DrawerIdentityHeader(
                      onTap: () => navigateTo(AppRoutes.account),
                    ),
                  ),
                  IconButton(
                    onPressed: onDismiss,
                    icon: const Icon(Icons.close_rounded, size: 18),
                    color: PurpleColors.foregroundTertiary,
                    tooltip: 'Close menu',
                    constraints:
                        const BoxConstraints(minWidth: 44, minHeight: 44),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: glassBorder),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                children: [
                  _ShellMenuItem(
                    icon: Icons.account_circle_outlined,
                    label: 'Account',
                    selected: _matchesRoute(AppRoutes.account, exact: true),
                    onTap: () => navigateTo(AppRoutes.account),
                  ),
                  _ShellMenuRowDivider(color: glassBorder),
                  _ShellMenuItem(
                    icon: Icons.settings_outlined,
                    label: 'Settings',
                    selected: _matchesRoute(AppRoutes.settings),
                    onTap: () => navigateTo(AppRoutes.settings),
                  ),
                  _ShellMenuRowDivider(color: glassBorder),
                  _ShellMenuItem(
                    icon: Icons.build_outlined,
                    label: 'Tools',
                    selected: _matchesRoute(AppRoutes.tools),
                    onTap: () => navigateTo(AppRoutes.tools),
                  ),
                  _ShellMenuRowDivider(color: glassBorder),
                  _ShellMenuItem(
                    icon: Icons.favorite_outline,
                    label: 'Care',
                    selected: _matchesRoute('/care') ||
                        _matchesRoute(AppRoutes.settingsSharing),
                    onTap: () => navigateTo(AppRoutes.careIndex),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: glassBorder),
            SafeArea(
              top: false,
              minimum: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              child: _ShellMenuItem(
                icon: Icons.logout_rounded,
                label: 'Sign out',
                onTap: signOut,
                destructive: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Drawer identity header, ported from the web `ProfileMenu` dropdown header:
/// avatar (photo or initials), display name, and email. Tapping opens
/// /account like the web Account entry.
class _DrawerIdentityHeader extends ConsumerWidget {
  const _DrawerIdentityHeader({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile =
        ref.watch(avatarProfileProvider).valueOrNull ?? AvatarProfile.empty;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: [
              ProfileAvatarCircle(profile: profile, size: 40),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      profile.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: PurpleColors.foreground,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (profile.email?.isNotEmpty == true)
                      Text(
                        profile.email!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: PurpleColors.foregroundTertiary,
                          fontSize: 11,
                        ),
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

class _ShellMenuItem extends StatelessWidget {
  const _ShellMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final error = Theme.of(context).colorScheme.error;
    final foreground = destructive
        ? error.withValues(alpha: 0.95)
        : selected
            ? PurpleColors.foreground
            : PurpleColors.foreground.withValues(alpha: 0.9);
    final iconColor = destructive
        ? error.withValues(alpha: 0.85)
        : selected
            ? PurpleColors.foreground
            : PurpleColors.foregroundTertiary;
    final selectedBg = PurpleColors.foreground.withValues(alpha: 0.05);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOutCubic,
          constraints: const BoxConstraints(minHeight: 52),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: selected && !destructive ? selectedBg : Colors.transparent,
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: iconColor),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: foreground,
                    fontSize: 15,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShellMenuRowDivider extends StatelessWidget {
  const _ShellMenuRowDivider({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Divider(
        height: 1,
        thickness: 0.5,
        color: color.withValues(alpha: 0.8),
      ),
    );
  }
}
