import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../design/purple_type.dart';
import '../../design/tokens.dart';

/// Journal route styling. Web `journal.index.tsx` is the one always-light
/// route: `#faf8fb` canvas (light `backgroundSecondary` token) with a
/// lavender radial glow (light `purpleSoft` = #ede4f4 at 0.85). Everything
/// here resolves from `design/tokens.json`, no hardcoded hexes.
class JournalPalette {
  JournalPalette._(this._colors, this._glass);

  factory JournalPalette.light() {
    final tokens = PurpleTokens.loaded;
    return JournalPalette._(
      tokens.colorsFor('light'),
      tokens.glassFor('light'),
    );
  }

  factory JournalPalette.dark() {
    final tokens = PurpleTokens.loaded;
    return JournalPalette._(
      tokens.colorsFor('dark'),
      tokens.glassFor('dark'),
    );
  }

  final PurpleColorTokens _colors;
  final PurpleGlassTokens _glass;

  Color get canvas => parseTokenColor(_colors.backgroundSecondary);
  Color get surface => parseTokenColor(_colors.backgroundPrimary);
  Color get glow => parseTokenColor(_colors.purpleSoft);
  Color get textPrimary => parseTokenColor(_colors.textPrimary);
  Color get textSecondary => parseTokenColor(_colors.textSecondary);
  Color get textTertiary => parseTokenColor(_colors.textTertiary);
  Color get textQuaternary => parseTokenColor(_colors.textQuaternary);
  Color get purplePrimary => parseTokenColor(_colors.purplePrimary);
  Color get purpleSoft => parseTokenColor(_colors.purpleSoft);
  Color get warning => parseTokenColor(_colors.warning);
  Color get destructive => parseTokenColor(_colors.destructive);
  Color get divider => parseTokenColor(_colors.divider);
  Color get backgroundTertiary => parseTokenColor(_colors.backgroundTertiary);

  Color get glassFill => parseTokenColor(_glass.fill);
  Color get glassBorderOuter => parseTokenColor(_glass.borderOuter);
  List<BoxShadow> get glassShadow => glassShadowsFromTokens(_glass.shadow);
}

/// Serif per tokens (`typography.fontSerif` = Source Serif 4), replacing the
/// previous hardcoded system serif.
TextStyle journalSerif({
  double fontSize = 15,
  double height = 1.5,
  Color? color,
  FontWeight fontWeight = FontWeight.w400,
  FontStyle fontStyle = FontStyle.normal,
  double? letterSpacing,
}) {
  return PurpleType.serifStyle(
    fontSize: fontSize,
    height: height,
    color: color,
    fontWeight: fontWeight,
    fontStyle: fontStyle,
    letterSpacing: letterSpacing,
  );
}

TextStyle journalSans({
  double fontSize = 14,
  double height = 1.45,
  Color? color,
  FontWeight fontWeight = FontWeight.w400,
  double? letterSpacing,
  TextDecoration? decoration,
}) {
  return GoogleFonts.inter(
    fontSize: fontSize,
    height: height,
    color: color,
    fontWeight: fontWeight,
    letterSpacing: letterSpacing,
    decoration: decoration,
  );
}

/// Light Journal canvas: `#faf8fb` + lavender radial glow, mirroring
/// `bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(237,228,244,0.85),transparent_55%)]`.
class JournalLightCanvas extends StatelessWidget {
  const JournalLightCanvas({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = JournalPalette.light();
    return SizedBox.expand(
      child: Stack(
        fit: StackFit.expand,
        children: [
          ColoredBox(color: palette.canvas),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -1.15),
                radius: 1.1,
                colors: [
                  palette.glow.withValues(alpha: 0.85),
                  palette.glow.withValues(alpha: 0),
                ],
                stops: const [0, 0.55],
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

/// `.glass-surface` on the light journal canvas: token fill, hairline outer
/// border, soft shadow (no blur needed over the flat light canvas).
class JournalGlassSurface extends StatelessWidget {
  const JournalGlassSurface({
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
    final palette = JournalPalette.light();
    return Container(
      decoration: BoxDecoration(
        color: palette.glassFill,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: palette.glassBorderOuter),
        boxShadow: palette.glassShadow,
      ),
      padding: padding,
      child: child,
    );
  }
}

/// Pressable `.glass-card` on the light canvas.
class JournalGlassCard extends StatelessWidget {
  const JournalGlassCard({
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
    final card = JournalGlassSurface(
      padding: padding,
      borderRadius: borderRadius,
      child: child,
    );
    if (onTap == null) return card;
    final palette = JournalPalette.light();
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        splashColor: palette.purplePrimary.withValues(alpha: 0.06),
        highlightColor: palette.purplePrimary.withValues(alpha: 0.04),
        child: card,
      ),
    );
  }
}

/// Small glass pill (tab container, chips) on the light canvas.
class JournalGlassPill extends StatelessWidget {
  const JournalGlassPill({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(4),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final palette = JournalPalette.light();
    return Container(
      decoration: BoxDecoration(
        color: palette.glassFill,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: palette.glassBorderOuter),
        boxShadow: palette.glassShadow,
      ),
      padding: padding,
      child: child,
    );
  }
}
