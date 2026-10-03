import 'package:flutter/material.dart';

/// Live Ploy pilot colors from `ploy-staging` `.purplelife-pilot`.
///
/// Hex values are the sRGB rendering of those oklch tokens. The signed-in
/// Flutter shell uses this palette instead of the old dark liquid-glass set.
class PloyColors {
  PloyColors._();

  static const canvas = Color(0xFFF8F7FA);
  static const surface = Color(0xFFFFFFFF);
  static const rail = Color(0xFFF1EFF4);
  static const tint = Color(0xFFF0E9FB);
  static const line = Color(0xFFDDDBE1);
  static const ink = Color(0xFF18161D);
  static const muted = Color(0xFF67646F);
  static const accent = Color(0xFF8E61CF);
  static const pink = Color(0xFFF070BE);
  static const coral = Color(0xFFFF7769);
  static const blue = Color(0xFF009BF0);
  static const mint = Color(0xFF3BC693);
  static const yellow = Color(0xFFFDBF32);
  static const shieldShadow = Color(0xFF6C59D6);

  /// Maps a former white-on-dark alpha to a Ploy light-canvas color.
  ///
  /// High alphas were primary or secondary text. Low alphas were faint
  /// fills and hairline borders on the old black canvas.
  static Color fromWhiteAlpha(double alpha) {
    if (alpha >= 0.8) return ink;
    if (alpha >= 0.4) return muted;
    if (alpha >= 0.12) return line;
    return rail;
  }
}
