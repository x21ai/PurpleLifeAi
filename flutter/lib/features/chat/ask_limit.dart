import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Free-tier Ask-Purple daily limit (mirrors web `chat.tsx`).
/// Stamps are epoch-ms timestamps in a JSON array; only the last 24h count.
class AskLimit {
  AskLimit._();

  static const freeDailyLimit = 10;
  static const storageKey = 'purple-ask-message-stamps';
  static const _windowMs = 24 * 60 * 60 * 1000;

  /// Timestamps from the last 24h. Prunes stale stamps as a side effect.
  static Future<List<int>> _readStamps(SharedPreferences prefs) async {
    final raw = prefs.getString(storageKey);
    if (raw == null || raw.isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      final cutoff = DateTime.now().millisecondsSinceEpoch - _windowMs;
      return decoded
          .whereType<num>()
          .map((n) => n.toInt())
          .where((n) => n > cutoff)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// Number of messages used in the last 24h.
  static Future<int> usedToday() async {
    final prefs = await SharedPreferences.getInstance();
    return (await _readStamps(prefs)).length;
  }

  /// Records one send now.
  static Future<void> pushStamp() async {
    final prefs = await SharedPreferences.getInstance();
    final next = [...await _readStamps(prefs), DateTime.now().millisecondsSinceEpoch];
    await prefs.setString(storageKey, jsonEncode(next));
  }
}
