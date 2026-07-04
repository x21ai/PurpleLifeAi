import 'package:flutter/material.dart';

import 'glass_surface.dart';
import 'tokens.dart';

/// Bottom tab bar stub matching `.nav-glass-bar` and `.glass-nav`.
///
/// Floating frosted capsule with nav-specific blur, saturate, and shadow.
class GlassNavBar extends StatelessWidget {
  const GlassNavBar({
    super.key,
    required this.child,
    this.tokens,
    this.appearance = 'dark',
    this.floating = true,
  });

  final Widget child;
  final PurpleTokens? tokens;
  final String appearance;
  final bool floating;

  @override
  Widget build(BuildContext context) {
    final resolved = tokens ?? PurpleTokens.fallback;
    final glass = resolved.glassFor(appearance);
    final layout = resolved.layout;
    final minHeight = layout.nativeNavBarHeight;
    final radius = floating
        ? BorderRadius.circular(glass.navBarRadiusPx)
        : BorderRadius.zero;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: resolved.spacing.md,
          vertical: resolved.spacing.sm,
        ),
        child: GlassSurface(
          variant: GlassMaterialVariant.nav,
          tokens: resolved,
          appearance: appearance,
          includeHighlight: true,
          borderRadius: radius,
          child: Container(
            constraints: BoxConstraints(minHeight: minHeight),
            alignment: Alignment.center,
            child: child,
          ),
        ),
      ),
    );
  }
}
