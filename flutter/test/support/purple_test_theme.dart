import 'package:flutter/material.dart';

/// Widget-test ThemeData that avoids Material 3 [InkSparkle] (missing
/// `shaders/ink_sparkle.frag` under `flutter test` on some SDK builds).
ThemeData purpleTestTheme({Brightness brightness = Brightness.light}) {
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
  );
}
