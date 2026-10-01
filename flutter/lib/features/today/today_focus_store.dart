import 'package:shared_preferences/shared_preferences.dart';

/// Same key as web Today `localStorage` `purple-today-focus`.
const todayFocusStorageKey = 'purple-today-focus';

const todayFocusFallback = 'sleep';

/// `readiness`, `sleep`, or `activity`. Anything else is Sleep.
String normalizeTodayFocus(String? raw) {
  if (raw == 'readiness' || raw == 'sleep' || raw == 'activity') return raw!;
  return todayFocusFallback;
}

Future<String> readTodayFocus() async {
  final prefs = await SharedPreferences.getInstance();
  return normalizeTodayFocus(prefs.getString(todayFocusStorageKey));
}

Future<void> writeTodayFocus(String focus) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(todayFocusStorageKey, normalizeTodayFocus(focus));
}
