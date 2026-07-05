import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'tokens.dart';
import 'purple_type.dart';

/// Canonical dark canvas from React `.auth-canvas` / app shell.
const Color purpleCanvasDark = Color(0xFF0A0710);

/// Foreground on dark canvas (`--foreground` / `textPrimary`).
const Color purpleForegroundDark = Color(0xFFFAFAFC);

/// Dark-default [ThemeData] mapped from [design/tokens.json].
class PurpleTheme {
  PurpleTheme._();

  static ThemeData dark({PurpleTokens? tokens}) {
    return buildPurpleDarkTheme(tokens: tokens);
  }

  static ThemeData light({PurpleTokens? tokens}) {
    return _build(appearance: 'light', tokens: tokens ?? PurpleTokens.loaded);
  }

  static ThemeData _build({
    required String appearance,
    required PurpleTokens tokens,
  }) {
    final colors = tokens.colorsFor(appearance);
    final typography = tokens.typography;
    final radius = tokens.radius;
    final touch = tokens.touch;

    Color parseColor(String value, Color fallback) {
      try {
        return parseTokenColor(value);
      } on Object {
        return fallback;
      }
    }

    final canvas = appearance == 'dark'
        ? parseColor(colors.canvas, purpleCanvasDark)
        : parseColor(colors.canvas, Colors.white);
    final bgPrimary = appearance == 'dark'
        ? parseColor(colors.backgroundPrimary, purpleCanvasDark)
        : parseColor(colors.backgroundPrimary, Colors.white);
    final bgSecondary = appearance == 'dark'
        ? parseColor(colors.backgroundSecondary, const Color(0xFF14101C))
        : parseColor(colors.backgroundSecondary, const Color(0xFFFAF8FB));
    final bgTertiary = appearance == 'dark'
        ? parseColor(colors.backgroundTertiary, const Color(0xFF1F1A2B))
        : parseColor(colors.backgroundTertiary, const Color(0xFFF2EEF5));
    final purple = parseColor(
      colors.purplePrimary,
      appearance == 'dark' ? const Color(0xFFB084D1) : const Color(0xFF5B2C82),
    );
    final textPrimary = appearance == 'dark'
        ? parseColor(colors.textPrimary, purpleForegroundDark)
        : parseColor(colors.textPrimary, const Color(0xFF0A0A0F));
    final textSecondary = appearance == 'dark'
        ? parseColor(colors.textSecondary, const Color(0xFFD8D8DD))
        : parseColor(colors.textSecondary, const Color(0xFF4A4A52));
    final divider = parseColor(
      colors.divider,
      appearance == 'dark' ? const Color(0xFF25202F) : const Color(0xFFECECEF),
    );

    final colorScheme = (appearance == 'dark'
            ? ColorScheme.dark(
                primary: purple,
                onPrimary: canvas,
                primaryContainer: parseColor(
                  colors.purpleSoft,
                  const Color(0x1FB084D1),
                ),
                onPrimaryContainer: purple,
                secondary: parseColor(
                  colors.purpleDeep,
                  const Color(0xFF6E3FA0),
                ),
                onSecondary: textPrimary,
                tertiary: parseColor(
                  colors.accentWarm,
                  const Color(0xFFE8C39E),
                ),
                onTertiary: canvas,
                error: parseColor(
                  colors.destructive,
                  const Color(0xFFE8745C),
                ),
                onError: Colors.white,
                surface: bgPrimary,
                onSurface: textPrimary,
                onSurfaceVariant: textSecondary,
                outline: divider,
                outlineVariant: divider,
                surfaceContainerLowest: canvas,
                surfaceContainerLow: bgSecondary,
                surfaceContainer: bgSecondary,
                surfaceContainerHigh: bgTertiary,
                surfaceContainerHighest: bgTertiary,
              )
            : ColorScheme.light(
                primary: purple,
                onPrimary: Colors.white,
                surface: bgPrimary,
                onSurface: textPrimary,
                error: parseColor(
                  colors.destructive,
                  const Color(0xFFB8453A),
                ),
                onError: Colors.white,
              ))
        .copyWith(surfaceTint: Colors.transparent);

    final weights = typography.weights;

    final baseText = TextTheme(
      bodyLarge: GoogleFonts.inter(
        fontWeight: _fontWeight(weights.regular),
        fontSize: 16,
        height: 1.5,
        color: textPrimary,
      ),
      bodyMedium: GoogleFonts.inter(
        fontWeight: _fontWeight(weights.regular),
        fontSize: 14,
        height: 1.45,
        color: textSecondary,
      ),
      labelLarge: GoogleFonts.inter(
        fontWeight: _fontWeight(weights.semibold),
        fontSize: typography.labelSize('labelEyebrow'),
        letterSpacing: typography.letterSpacing('labelEyebrow') * 12,
        color: parseColor(
          colors.textTertiary,
          appearance == 'dark'
              ? const Color(0xFF8B8B92)
              : const Color(0xFF6B6B73),
        ),
      ),
      labelSmall: GoogleFonts.inter(
        fontWeight: _fontWeight(weights.medium),
        fontSize: typography.labelSize('labelSmall'),
        letterSpacing: typography.letterSpacing('labelSmall') * 11,
        color: parseColor(
          colors.textTertiary,
          appearance == 'dark'
              ? const Color(0xFF8B8B92)
              : const Color(0xFF6B6B73),
        ),
      ),
      displayLarge: GoogleFonts.inter(
        fontWeight: _fontWeight(weights.display),
        fontFeatures: const [FontFeature.tabularFigures(), FontFeature.liningFigures()],
        letterSpacing: typography.letterSpacing('numericDisplay') * 44,
        height: typography.lineHeight('numericDisplay'),
        color: textPrimary,
      ),
      titleMedium: PurpleType.serifStyle(
        fontWeight: _fontWeight(weights.regular),
        fontSize: typography.labelSize('bodySerif'),
        height: typography.lineHeight('bodySerif'),
        color: textSecondary,
      ),
      headlineMedium: PurpleType.serifStyle(
        fontWeight: _fontWeight(weights.regular),
        fontSize: 28,
        height: 1.15,
        color: textPrimary,
      ),
    );

    final isDark = appearance == 'dark';

    return ThemeData(
      useMaterial3: true,
      brightness: isDark ? Brightness.dark : Brightness.light,
      scaffoldBackgroundColor: canvas,
      canvasColor: canvas,
      colorScheme: colorScheme,
      dividerColor: divider,
      textTheme: baseText,
      fontFamily: GoogleFonts.inter().fontFamily,
      splashFactory: InkRipple.splashFactory,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      extensions: [
        PurpleThemeExtension(
          appearance: appearance,
          tokens: tokens,
          colors: colors,
          minTouchTarget: touch.minTarget,
        ),
      ],
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: bgSecondary,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius.base),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: bgSecondary,
        surfaceTintColor: Colors.transparent,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: bgSecondary,
        surfaceTintColor: Colors.transparent,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: bgTertiary,
        contentTextStyle: baseText.bodyMedium?.copyWith(color: textPrimary),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: purple,
        linearTrackColor: isDark
            ? Colors.white.withValues(alpha: 0.12)
            : divider.withValues(alpha: 0.35),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : bgTertiary,
        labelStyle: TextStyle(color: textSecondary),
        floatingLabelStyle: TextStyle(color: textSecondary),
        hintStyle: TextStyle(
          color: isDark
              ? Colors.white.withValues(alpha: 0.42)
              : textSecondary.withValues(alpha: 0.75),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius.md),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.14)
                : divider,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius.md),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.14)
                : divider,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius.md),
          borderSide: BorderSide(
            color: isDark
                ? const Color(0x8CB084D1)
                : purple,
            width: 1.5,
          ),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: tokens.spacing.md,
          vertical: tokens.spacing.sm + 4,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: purple,
          foregroundColor: isDark ? Colors.white : Colors.white,
          minimumSize: Size(touch.minTarget, touch.minTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius.pill),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.18)
                : divider,
          ),
          minimumSize: Size(touch.minTarget, touch.minTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius.pill),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: isDark ? purpleForegroundDark : purple,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: purple,
          foregroundColor: Colors.white,
          minimumSize: Size(touch.minTarget, touch.minTarget),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius.pill),
          ),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: textPrimary,
          minimumSize: Size(touch.minTarget, touch.minTarget),
        ),
      ),
    );
  }

  static FontWeight _fontWeight(int value) {
    switch (value) {
      case 300:
        return FontWeight.w300;
      case 400:
        return FontWeight.w400;
      case 500:
        return FontWeight.w500;
      case 600:
        return FontWeight.w600;
      default:
        return FontWeight.w400;
    }
  }
}

/// Builds the production dark theme from loaded [design/tokens.json] values.
ThemeData buildPurpleDarkTheme({PurpleTokens? tokens}) {
  return PurpleTheme._build(
    appearance: 'dark',
    tokens: tokens ?? PurpleTokens.loaded,
  );
}

/// Light theme for Account appearance preference (web `.sheet-canvas` light).
ThemeData buildPurpleLightTheme({PurpleTokens? tokens}) {
  return PurpleTheme.light(tokens: tokens);
}

/// Theme extension for token access inside widgets.
class PurpleThemeExtension extends ThemeExtension<PurpleThemeExtension> {
  const PurpleThemeExtension({
    required this.appearance,
    required this.tokens,
    required this.colors,
    required this.minTouchTarget,
  });

  final String appearance;
  final PurpleTokens tokens;
  final PurpleColorTokens colors;
  final double minTouchTarget;

  PurpleGlassTokens get glass => tokens.glassFor(appearance);

  @override
  PurpleThemeExtension copyWith({
    String? appearance,
    PurpleTokens? tokens,
    PurpleColorTokens? colors,
    double? minTouchTarget,
  }) {
    return PurpleThemeExtension(
      appearance: appearance ?? this.appearance,
      tokens: tokens ?? this.tokens,
      colors: colors ?? this.colors,
      minTouchTarget: minTouchTarget ?? this.minTouchTarget,
    );
  }

  @override
  PurpleThemeExtension lerp(PurpleThemeExtension? other, double t) {
    return t < 0.5 ? this : other ?? this;
  }

  static PurpleThemeExtension of(BuildContext context) {
    return Theme.of(context).extension<PurpleThemeExtension>()!;
  }
}

/// Max content width matching web `max-w-3xl` (768px).
double get purpleMaxContentWidth => PurpleTokens.loaded.layout.contentMaxWidth;

/// Semantic colors for shell chrome (dark-default token mapping).
abstract final class PurpleColors {
  static PurpleColorTokens get _colors =>
      PurpleTokens.loaded.colorsFor('dark');

  static PurpleGlassTokens get _glass => PurpleTokens.loaded.glassFor('dark');

  static Color get background => parseTokenColor(_colors.backgroundPrimary);

  static Color get backgroundTertiary =>
      parseTokenColor(_colors.backgroundTertiary);

  static Color get foreground => parseTokenColor(_colors.textPrimary);

  static Color get foregroundTertiary => parseTokenColor(_colors.textTertiary);

  static Color get purplePrimary => parseTokenColor(_colors.purplePrimary);

  static Color get glassNavBorder => parseTokenColor(_glass.navBorder);
}

/// Centered page column capped at [purpleMaxContentWidth].
class ShellContentColumn extends StatelessWidget {
  const ShellContentColumn({
    super.key,
    required this.child,
    this.padding,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final layout = PurpleTokens.loaded.layout;
    return Align(
      alignment: Alignment.topCenter,
      widthFactor: 1,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: layout.contentMaxWidth),
        child: Padding(
          padding: padding ??
              EdgeInsets.symmetric(horizontal: layout.pagePaddingX),
          child: child,
        ),
      ),
    );
  }
}
