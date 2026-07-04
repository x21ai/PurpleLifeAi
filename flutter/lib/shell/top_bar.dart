import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../design/glass_surface.dart';
import '../design/purple_theme.dart';
import '../design/tokens.dart';
import 'routes.dart';

/// Scroll-reactive frosted glass header (ports mobile-top-bar.tsx native variant).
class TopBar extends StatelessWidget {
  const TopBar({
    super.key,
    required this.scrolled,
    this.onMenuTap,
  });

  final bool scrolled;
  final VoidCallback? onMenuTap;

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return GlassSurface(
      variant: GlassMaterialVariant.top,
      includeHighlight: scrolled,
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
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.sync_rounded, size: 22),
                  color: PurpleColors.foregroundTertiary,
                  tooltip: 'Sync',
                  constraints: const BoxConstraints(
                    minWidth: 44,
                    minHeight: 44,
                  ),
                ),
                IconButton(
                  onPressed: onMenuTap,
                  icon: const Icon(Icons.menu_rounded, size: 22),
                  color: PurpleColors.foregroundTertiary,
                  tooltip: 'Open menu',
                  constraints: const BoxConstraints(
                    minWidth: 44,
                    minHeight: 44,
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
