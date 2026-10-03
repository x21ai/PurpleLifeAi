import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/account/theme_preference.dart';

void main() {
  test('dark and system follow the requested brightness', () {
    expect(parseThemeMode('dark'), PurpleThemeMode.dark);
    expect(parseThemeMode('system'), PurpleThemeMode.system);
    expect(parseThemeMode('light'), PurpleThemeMode.light);
    expect(resolveThemeBrightness(PurpleThemeMode.dark), Brightness.dark);
    expect(
      resolveThemeBrightness(
        PurpleThemeMode.system,
        platform: Brightness.dark,
      ),
      Brightness.dark,
    );
    expect(
      resolveThemeBrightness(
        PurpleThemeMode.system,
        platform: Brightness.light,
      ),
      Brightness.light,
    );
    expect(themeModeFor(PurpleThemeMode.dark), ThemeMode.dark);
    expect(themeModeFor(PurpleThemeMode.system), ThemeMode.system);
    expect(themeModeFor(PurpleThemeMode.light), ThemeMode.light);
  });
}
