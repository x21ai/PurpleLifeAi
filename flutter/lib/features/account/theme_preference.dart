import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mirrors web `theme-provider.tsx` storage key and modes.
enum PurpleThemeMode { dark, light, system }

const _storageKey = 'purple-theme';

PurpleThemeMode parseThemeMode(String? raw) {
  switch (raw) {
    case 'light':
      return PurpleThemeMode.light;
    case 'system':
      return PurpleThemeMode.system;
    default:
      return PurpleThemeMode.dark;
  }
}

String themeModeToStorage(PurpleThemeMode mode) {
  switch (mode) {
    case PurpleThemeMode.light:
      return 'light';
    case PurpleThemeMode.system:
      return 'system';
    case PurpleThemeMode.dark:
      return 'dark';
  }
}

String themeModeLabel(PurpleThemeMode mode) {
  switch (mode) {
    case PurpleThemeMode.light:
      return 'Light';
    case PurpleThemeMode.system:
      return 'System';
    case PurpleThemeMode.dark:
      return 'Dark';
  }
}

String themeModeDescription(PurpleThemeMode mode) {
  switch (mode) {
    case PurpleThemeMode.light:
      return 'Always light';
    case PurpleThemeMode.system:
      return 'Match device';
    case PurpleThemeMode.dark:
      return 'Default';
  }
}

Brightness resolveThemeBrightness(PurpleThemeMode mode) {
  switch (mode) {
    case PurpleThemeMode.light:
      return Brightness.light;
    case PurpleThemeMode.system:
      final platform = WidgetsBinding.instance.platformDispatcher;
      return platform.platformBrightness;
    case PurpleThemeMode.dark:
      return Brightness.dark;
  }
}

class ThemePreferenceNotifier extends StateNotifier<PurpleThemeMode> {
  ThemePreferenceNotifier() : super(PurpleThemeMode.dark) {
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      state = parseThemeMode(prefs.getString(_storageKey));
    } catch (_) {
      state = PurpleThemeMode.dark;
    }
  }

  Future<void> setMode(PurpleThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, themeModeToStorage(mode));
    } catch (_) {
      // Preference still updated in memory for UI parity.
    }
  }
}

final themePreferenceProvider =
    StateNotifierProvider<ThemePreferenceNotifier, PurpleThemeMode>(
  (ref) => ThemePreferenceNotifier(),
);
