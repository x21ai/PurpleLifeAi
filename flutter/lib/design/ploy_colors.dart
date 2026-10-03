import 'package:flutter/material.dart';

/// Live Ploy pilot colors. Light matches `.purplelife-pilot`.
/// Dark matches the Ploy `.dark` neutral ramp so Appearance actually switches.
class PloyPalette {
  const PloyPalette({
    required this.canvas,
    required this.surface,
    required this.rail,
    required this.tint,
    required this.line,
    required this.ink,
    required this.muted,
    required this.accent,
    required this.pink,
    required this.coral,
    required this.blue,
    required this.mint,
    required this.yellow,
    required this.shieldShadow,
  });

  final Color canvas;
  final Color surface;
  final Color rail;
  final Color tint;
  final Color line;
  final Color ink;
  final Color muted;
  final Color accent;
  final Color pink;
  final Color coral;
  final Color blue;
  final Color mint;
  final Color yellow;
  final Color shieldShadow;

  static const light = PloyPalette(
    canvas: Color(0xFFF8F7FA),
    surface: Color(0xFFFFFFFF),
    rail: Color(0xFFF1EFF4),
    tint: Color(0xFFF0E9FB),
    line: Color(0xFFDDDBE1),
    ink: Color(0xFF18161D),
    muted: Color(0xFF67646F),
    accent: Color(0xFF8E61CF),
    pink: Color(0xFFF070BE),
    coral: Color(0xFFFF7769),
    blue: Color(0xFF009BF0),
    mint: Color(0xFF3BC693),
    yellow: Color(0xFFFDBF32),
    shieldShadow: Color(0xFF6C59D6),
  );

  static const dark = PloyPalette(
    canvas: Color(0xFF1C1722),
    surface: Color(0xFF2A2433),
    rail: Color(0xFF322B3C),
    tint: Color(0xFF3A2C4C),
    line: Color(0xFF3C3546),
    ink: Color(0xFFF6F4F8),
    muted: Color(0xFFB7B2C0),
    accent: Color(0xFFC4A6E8),
    pink: Color(0xFFF070BE),
    coral: Color(0xFFFF7769),
    blue: Color(0xFF4DB6F5),
    mint: Color(0xFF3BC693),
    yellow: Color(0xFFFDBF32),
    shieldShadow: Color(0xFF6C59D6),
  );
}

/// Active palette. [bind] runs from the app builder when appearance changes.
class PloyColors {
  PloyColors._();

  static PloyPalette _active = PloyPalette.light;

  static void bind(Brightness brightness) {
    _active = brightness == Brightness.dark ? PloyPalette.dark : PloyPalette.light;
  }

  static String get appearance =>
      identical(_active, PloyPalette.dark) ? 'dark' : 'light';

  static Color get canvas => _active.canvas;
  static Color get surface => _active.surface;
  static Color get rail => _active.rail;
  static Color get tint => _active.tint;
  static Color get line => _active.line;
  static Color get ink => _active.ink;
  static Color get muted => _active.muted;
  static Color get accent => _active.accent;
  static Color get pink => _active.pink;
  static Color get coral => _active.coral;
  static Color get blue => _active.blue;
  static Color get mint => _active.mint;
  static Color get yellow => _active.yellow;
  static Color get shieldShadow => _active.shieldShadow;

  /// Maps a former white-on-dark alpha to the active Ploy text or line color.
  static Color fromWhiteAlpha(double alpha) {
    if (alpha >= 0.8) return ink;
    if (alpha >= 0.4) return muted;
    if (alpha >= 0.12) return line;
    return rail;
  }
}
