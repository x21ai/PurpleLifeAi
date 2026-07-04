import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'tokens.dart';

/// Liquid glass surface matching `.glass-surface`, `.glass-card`, `.glass-thick`,
/// and `.glass-thin` from `src/styles.css`.
///
/// Uses [BackdropFilter] for blur + saturation when [useBackdrop] is true.
/// Falls back to opaque [PurpleGlassTokens.fillFallback] when reduced
/// transparency is requested or backdrop is disabled.
class GlassSurface extends StatelessWidget {
  const GlassSurface({
    super.key,
    required this.child,
    this.variant = GlassMaterialVariant.regular,
    this.borderRadius,
    this.padding,
    this.margin,
    this.useBackdrop = true,
    this.includeHighlight = false,
    this.tokens,
    this.appearance = 'dark',
  });

  final Widget child;
  final GlassMaterialVariant variant;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final bool useBackdrop;
  final bool includeHighlight;
  final PurpleTokens? tokens;
  final String appearance;

  @override
  Widget build(BuildContext context) {
    final resolvedTokens = tokens ?? PurpleTokens.fallback;
    final glass = resolvedTokens.glassFor(appearance);
    final radius = resolvedTokens.radius;
    final mediaQuery = MediaQuery.maybeOf(context);
    final reduceTransparency = mediaQuery?.disableAnimations == true &&
        mediaQuery?.accessibleNavigation == true;
    // Web and reduced-transparency: BackdropFilter is unreliable; use opaque fill.
    final supportsBackdrop = useBackdrop && !reduceTransparency && !kIsWeb;

    final effectiveRadius = borderRadius ?? BorderRadius.circular(radius.base);
    final fill = _fillForVariant(glass, variant);
    final blur = _blurForVariant(glass, variant);
    final saturate = _saturateForVariant(glass, variant);
    final fallbackColor = parseTokenColor(glass.fillFallback);
    final fillColor = parseTokenColor(fill);
    final borderColor = parseTokenColor(glass.border);

    final decoration = BoxDecoration(
      color: supportsBackdrop ? fillColor : fallbackColor,
      borderRadius: effectiveRadius,
      border: Border.all(
        color: borderColor,
        width: glass.borderWidthPx,
      ),
      boxShadow: glassShadowsFromTokens(
        glass.shadow,
        includeHighlight: includeHighlight,
        highlight: includeHighlight ? glass.highlight : null,
      ),
    );

    Widget content = Container(
      padding: padding,
      decoration: decoration,
      child: child,
    );

    if (supportsBackdrop) {
      content = ClipRRect(
        borderRadius: effectiveRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: blur / 2,
            sigmaY: blur / 2,
          ),
          child: ColorFiltered(
            colorFilter: ColorFilter.matrix(_saturationMatrix(saturate)),
            child: content,
          ),
        ),
      );
    }

    if (includeHighlight && glass.highlight.inset) {
      content = DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: effectiveRadius,
          border: Border(
            top: BorderSide(
              color: parseTokenColor(glass.highlight.color),
              width: glass.borderWidthPx,
            ),
          ),
        ),
        child: content,
      );
    }

    if (margin != null) {
      content = Padding(padding: margin!, child: content);
    }

    return content;
  }

  String _fillForVariant(PurpleGlassTokens glass, GlassMaterialVariant v) {
    switch (v) {
      case GlassMaterialVariant.regular:
        return glass.fill;
      case GlassMaterialVariant.thick:
        return glass.fillThick;
      case GlassMaterialVariant.thin:
        return glass.fillThin;
      case GlassMaterialVariant.top:
      case GlassMaterialVariant.sheet:
      case GlassMaterialVariant.nav:
        return glass.navFill;
    }
  }

  double _blurForVariant(PurpleGlassTokens glass, GlassMaterialVariant v) {
    switch (v) {
      case GlassMaterialVariant.regular:
        return glass.blurPx;
      case GlassMaterialVariant.thick:
        return glass.blurThickPx;
      case GlassMaterialVariant.thin:
        return glass.blurThinPx;
      case GlassMaterialVariant.top:
        return glass.navBlurPx(GlassMaterialVariant.top);
      case GlassMaterialVariant.sheet:
        return glass.navBlurPx(GlassMaterialVariant.sheet);
      case GlassMaterialVariant.nav:
        return glass.navBlurPx(GlassMaterialVariant.nav);
    }
  }

  double _saturateForVariant(PurpleGlassTokens glass, GlassMaterialVariant v) {
    switch (v) {
      case GlassMaterialVariant.regular:
      case GlassMaterialVariant.thick:
        return glass.saturate;
      case GlassMaterialVariant.top:
        return 1.25;
      case GlassMaterialVariant.sheet:
      case GlassMaterialVariant.nav:
        return glass.navSaturate;
      case GlassMaterialVariant.thin:
        return glass.saturate * glass.thinSaturateMultiplier;
    }
  }

  /// CSS `saturate(n)` approximation via color matrix.
  List<double> _saturationMatrix(double amount) {
    const lumR = 0.2126;
    const lumG = 0.7152;
    const lumB = 0.0722;
    final inv = 1 - amount;
    final r = inv * lumR;
    final g = inv * lumG;
    final b = inv * lumB;
    return [
      r + amount, g, b, 0, 0,
      r, g + amount, b, 0, 0,
      r, g, b + amount, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }
}

/// Press feedback matching `.glass-press` (scale 0.97 on active).
class GlassPressable extends StatefulWidget {
  const GlassPressable({
    super.key,
    required this.child,
    required this.onTap,
    this.tokens,
  });

  final Widget child;
  final VoidCallback? onTap;
  final PurpleTokens? tokens;

  @override
  State<GlassPressable> createState() => _GlassPressableState();
}

class _GlassPressableState extends State<GlassPressable> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final touch = (widget.tokens ?? PurpleTokens.fallback).touch;
    final scale = _pressed ? touch.pressScale : 1.0;
    final duration = Duration(milliseconds: touch.pressDurationMs);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: widget.onTap == null ? null : (_) => setState(() => _pressed = true),
      onTapUp: widget.onTap == null ? null : (_) => setState(() => _pressed = false),
      onTapCancel: widget.onTap == null ? null : () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: scale,
        duration: duration,
        curve: Cubic(
          touch.pressCurve[0],
          touch.pressCurve[1],
          touch.pressCurve[2],
          touch.pressCurve[3],
        ),
        child: widget.child,
      ),
    );
  }
}
