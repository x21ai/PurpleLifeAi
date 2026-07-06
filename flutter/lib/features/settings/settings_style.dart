import 'package:flutter/material.dart';

import '../../design/glass_surface.dart';
import '../../design/purple_theme.dart';
import '../../design/purple_type.dart';
import '../../design/tokens.dart';

/// Theme-aware palette for Settings, Account, and Tools sheet routes.
///
/// Resolves [design/tokens.json] light/dark colors so merged-mode purple
/// accents (#5b2c82, #ede4f4) appear in light appearance without hardcoded
/// white-on-dark assumptions.
class SheetPalette {
  SheetPalette._(this.colors, this.appearance);

  factory SheetPalette.of(BuildContext context) {
    final ext = PurpleThemeExtension.of(context);
    return SheetPalette._(ext.colors, ext.appearance);
  }

  final PurpleColorTokens colors;
  final String appearance;

  bool get isLight => appearance == 'light';

  Color get canvas => parseTokenColor(colors.canvas);
  Color get backgroundSecondary => parseTokenColor(colors.backgroundSecondary);
  Color get backgroundTertiary => parseTokenColor(colors.backgroundTertiary);
  Color get textPrimary => parseTokenColor(colors.textPrimary);
  Color get textSecondary => parseTokenColor(colors.textSecondary);
  Color get textMuted => parseTokenColor(colors.textTertiary);
  Color get textEyebrow => parseTokenColor(colors.textQuaternary);
  Color get divider => parseTokenColor(colors.divider);
  Color get purple => parseTokenColor(colors.purplePrimary);
  Color get purpleSoft => parseTokenColor(colors.purpleSoft);
  Color get destructive => parseTokenColor(colors.destructive);
  Color get success => parseTokenColor(colors.success);

  Color get textHigh => textPrimary.withValues(alpha: isLight ? 1 : 0.95);
  Color get textBody => textPrimary.withValues(alpha: isLight ? 0.92 : 0.92);
  Color get textSubtle => isLight ? textMuted : textPrimary.withValues(alpha: 0.55);
  Color get textFaint => isLight ? textEyebrow : textPrimary.withValues(alpha: 0.45);
  Color get chevron => isLight ? textEyebrow : textPrimary.withValues(alpha: 0.35);

  Color get iconChipFill =>
      isLight ? backgroundTertiary : textPrimary.withValues(alpha: 0.08);
  Color get iconChipIcon =>
      isLight ? textSecondary : textPrimary.withValues(alpha: 0.8);

  Color get cardFill =>
      isLight ? backgroundSecondary : textPrimary.withValues(alpha: 0.03);
  Color get cardBorder =>
      isLight ? divider : textPrimary.withValues(alpha: 0.1);

  Color get hubActiveFill => purple.withValues(alpha: isLight ? 0.08 : 0.05);
  Color get hubActiveBorder => purple.withValues(alpha: isLight ? 0.45 : 0.6);
  Color get hubInactiveFill => cardFill;
  Color get hubInactiveBorder => cardBorder;

  Color get inputFill =>
      isLight ? backgroundTertiary : textPrimary.withValues(alpha: 0.04);
  Color get inputBorder => cardBorder;
  Color get dropdownSurface =>
      isLight ? backgroundSecondary : const Color(0xFF1A1224);
  Color get modalSurface =>
      isLight ? backgroundSecondary : const Color(0xFF14101C);

  Color get chipInactiveFill => inputFill;
  Color get chipInactiveBorder =>
      isLight ? divider : textPrimary.withValues(alpha: 0.15);
}

extension SheetContext on BuildContext {
  SheetPalette get sheet => SheetPalette.of(this);
  String get sheetAppearance => PurpleThemeExtension.of(this).appearance;
}

/// Atmospheric sheet canvas (web `.sheet-canvas` + settings hub glow).
class SheetCanvas extends StatelessWidget {
  const SheetCanvas({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final palette = context.sheet;
    return SizedBox.expand(
      child: Stack(
        fit: StackFit.expand,
        children: [
          ColoredBox(color: palette.canvas),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.85),
                radius: 1.2,
                colors: [
                  palette.isLight
                      ? palette.purpleSoft.withValues(alpha: 0.85)
                      : palette.purple.withValues(alpha: 0.14),
                  Colors.transparent,
                ],
                stops: const [0, 0.58],
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}

/// Token-aware glass card for sheet routes.
class SheetGlass extends StatelessWidget {
  const SheetGlass({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      appearance: context.sheetAppearance,
      padding: padding,
      borderRadius: borderRadius,
      child: child,
    );
  }
}

TextStyle sheetSectionTitleStyle(BuildContext context) {
  return PurpleType.serifStyle(
    fontSize: 20,
    height: 1.2,
    color: context.sheet.textHigh,
  );
}

TextStyle sheetSectionRowTitleStyle(BuildContext context) {
  return PurpleType.serifStyle(
    fontSize: 16,
    height: 1.25,
    color: context.sheet.textBody,
  );
}

TextStyle sheetSectionMutedStyle(BuildContext context) {
  return Theme.of(context).textTheme.bodySmall!.copyWith(
        color: context.sheet.textSubtle,
        height: 1.45,
      );
}

TextStyle sheetEyebrowStyle(BuildContext context) {
  return Theme.of(context).textTheme.labelSmall!.copyWith(
        letterSpacing: 1.2,
        color: context.sheet.textFaint,
      );
}

TextStyle sheetInputStyle(BuildContext context) {
  return TextStyle(fontSize: 15, color: context.sheet.textBody);
}

InputDecoration sheetInputDecoration(BuildContext context, String hint) {
  final palette = context.sheet;
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: palette.inputBorder),
  );
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(color: palette.textFaint.withValues(alpha: 0.75)),
    filled: true,
    fillColor: palette.inputFill,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    enabledBorder: border,
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: palette.isLight ? palette.purple : palette.textPrimary.withValues(alpha: 0.25),
      ),
    ),
    disabledBorder: border,
  );
}

Widget sheetRowDivider(BuildContext context) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Divider(height: 1, color: context.sheet.divider.withValues(alpha: 0.65)),
  );
}
