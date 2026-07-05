import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'tokens.dart';

/// Canonical typography from [design/tokens.json] (`typography.fontSerif`).
class PurpleType {
  PurpleType._();

  /// Source Serif 4 (`typography.fontSerif`), loaded via google_fonts.
  static String get serif => GoogleFonts.sourceSerif4().fontFamily!;

  /// Serif [TextStyle] with optional overrides.
  static TextStyle serifStyle({
    double? fontSize,
    double? height,
    Color? color,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    double? letterSpacing,
    TextDecoration? decoration,
  }) {
    return GoogleFonts.sourceSerif4(
      fontSize: fontSize,
      height: height,
      color: color,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      letterSpacing: letterSpacing,
      decoration: decoration,
    );
  }

  /// Token-backed body serif defaults (`bodySerif` size and line height).
  static TextStyle bodySerif({
    Color? color,
    FontWeight? fontWeight,
    double? letterSpacing,
  }) {
    final typography = PurpleTokens.loaded.typography;
    return serifStyle(
      fontSize: typography.labelSize('bodySerif'),
      height: typography.lineHeight('bodySerif'),
      color: color,
      fontWeight: fontWeight,
      letterSpacing: letterSpacing,
    );
  }
}
