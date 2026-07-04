import 'package:flutter/material.dart';

import 'glass_surface.dart';
import 'tokens.dart';

/// Elevated glass card stub matching `.glass-card` and `.sheet-card`.
///
/// Wraps [GlassSurface] with card padding, highlight gleam, and default radius.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.variant = GlassMaterialVariant.regular,
    this.padding,
    this.margin,
    this.tokens,
    this.appearance = 'dark',
  });

  final Widget child;
  final GlassMaterialVariant variant;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final PurpleTokens? tokens;
  final String appearance;

  @override
  Widget build(BuildContext context) {
    final resolved = tokens ?? PurpleTokens.fallback;
    final radius = resolved.radius;

    return GlassSurface(
      variant: variant,
      includeHighlight: true,
      tokens: resolved,
      appearance: appearance,
      padding: padding ?? EdgeInsets.all(resolved.spacing.md),
      margin: margin,
      borderRadius: BorderRadius.circular(radius.base),
      child: child,
    );
  }
}
