import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Layer 0 canvas background matching React Today/Vitals and `.auth-canvas`.
class CanvasBackground extends StatelessWidget {
  const CanvasBackground({
    super.key,
    required this.child,
    this.auth = false,
  });

  final Widget child;

  /// When true, paints the sign-in/register atmospheric gradient from React.
  final bool auth;

  static const canvasColor = Color(0xFF0A0710);
  static const authBaseColor = Color(0xFF050505);
  static const gradientCenter = Color(0x24B084D1);

  static const _authGradient = BoxDecoration(
    color: authBaseColor,
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [authBaseColor, canvasColor],
    ),
  );

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Stack(
        fit: StackFit.expand,
        children: [
          const ColoredBox(color: canvasColor),
          if (auth) ...[
            const DecoratedBox(decoration: _authGradient),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(-0.6, -1.1),
                  radius: 1.1,
                  colors: [Color(0x387C3AED), Colors.transparent],
                  stops: [0, 0.55],
                ),
              ),
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0.8, 1.2),
                  radius: 1.0,
                  colors: [Color(0x294F46E5), Colors.transparent],
                  stops: [0, 0.5],
                ),
              ),
            ),
          ] else
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(0, -0.85),
                  radius: 1.2,
                  colors: [gradientCenter, Colors.transparent],
                  stops: [0, 0.58],
                ),
              ),
            ),
          child,
        ],
      ),
    );
  }
}

/// Frosted glass container approximating `.glass-surface` from `src/styles.css`.
class GlassSurface extends StatelessWidget {
  const GlassSurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 20,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final decoration = BoxDecoration(
      color: kIsWeb ? const Color(0xCC0E0A14) : const Color(0x990E0A14),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
    );

    final padded = Padding(padding: padding, child: child);

    if (kIsWeb) {
      return DecoratedBox(
        decoration: decoration,
        child: padded,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: DecoratedBox(
          decoration: decoration,
          child: padded,
        ),
      ),
    );
  }
}

/// Pressable glass card approximating `.glass-card.glass-press`.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 20,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final card = GlassSurface(
      padding: padding,
      borderRadius: borderRadius,
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        splashColor: Colors.white.withValues(alpha: 0.06),
        highlightColor: Colors.white.withValues(alpha: 0.04),
        child: card,
      ),
    );
  }
}

/// Centered content column capped at max-w-3xl (768px).
class ContentColumn extends StatelessWidget {
  const ContentColumn({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 20),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  static const maxWidth = 768.0;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      widthFactor: 1,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: maxWidth),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}
