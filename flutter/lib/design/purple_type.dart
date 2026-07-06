import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'tokens.dart';

/// Apple system typography from [design/tokens.json].
///
/// UI/body uses the platform sans stack (SF Pro Text on Apple, Roboto on Android).
/// Display titles use SF Pro Display weight via [serifStyle] (name kept for call sites).
class PurpleType {
  PurpleType._();

  static const List<String> _systemFallback = [
    '.AppleSystemUIFont',
    '-apple-system',
    'BlinkMacSystemFont',
    'SF Pro Text',
    'SF Pro Display',
    'system-ui',
    'Roboto',
    'sans-serif',
  ];

  static const List<String> _displayFallback = [
    '.AppleSystemUIFont',
    '-apple-system',
    'BlinkMacSystemFont',
    'SF Pro Display',
    'SF Pro Text',
    'system-ui',
    'Roboto',
    'sans-serif',
  ];

  /// Primary UI font family (`null` lets the platform pick SF Pro / Roboto).
  static String? get sansFamily {
    if (kIsWeb) return null;
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
        return '.AppleSystemUIFont';
      case TargetPlatform.android:
        return 'Roboto';
      default:
        return null;
    }
  }

  /// Display/title family. Kept as [serif] for existing call sites.
  static String get serif => sansFamily ?? 'system-ui';

  /// UI sans [TextStyle].
  static TextStyle sansStyle({
    double? fontSize,
    double? height,
    Color? color,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    double? letterSpacing,
    TextDecoration? decoration,
    List<FontFeature>? fontFeatures,
  }) {
    return TextStyle(
      fontFamily: sansFamily,
      fontFamilyFallback: _systemFallback,
      fontSize: fontSize,
      height: height,
      color: color,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      letterSpacing: letterSpacing,
      decoration: decoration,
      fontFeatures: fontFeatures,
    );
  }

  /// Display title style (SF Pro Display semibold on Apple).
  static TextStyle serifStyle({
    double? fontSize,
    double? height,
    Color? color,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    double? letterSpacing,
    TextDecoration? decoration,
    List<FontFeature>? fontFeatures,
  }) {
    return TextStyle(
      fontFamily: sansFamily,
      fontFamilyFallback: _displayFallback,
      fontSize: fontSize,
      height: height,
      color: color,
      fontWeight: fontWeight ?? FontWeight.w600,
      fontStyle: fontStyle,
      letterSpacing: letterSpacing,
      decoration: decoration,
      fontFeatures: fontFeatures,
    );
  }

  /// Alias for large titles / hero greetings.
  static TextStyle displayStyle({
    double? fontSize,
    double? height,
    Color? color,
    FontWeight? fontWeight,
    FontStyle? fontStyle,
    double? letterSpacing,
    TextDecoration? decoration,
  }) =>
      serifStyle(
        fontSize: fontSize,
        height: height,
        color: color,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        letterSpacing: letterSpacing,
        decoration: decoration,
      );

  /// Narrative body (regular-weight system sans).
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
      fontWeight: fontWeight ?? FontWeight.w400,
      letterSpacing: letterSpacing,
    );
  }
}
