/// Normalizes Supabase row values across web/native clients.
DateTime? parseSupabaseDateTime(Object? raw) {
  if (raw == null) return null;
  if (raw is DateTime) return raw.toUtc();
  if (raw is String && raw.isNotEmpty) return DateTime.tryParse(raw)?.toUtc();
  return null;
}

String? formatSupabaseDateTime(Object? raw) {
  final parsed = parseSupabaseDateTime(raw);
  return parsed == null ? null : formatSupabaseFilterTimestamp(parsed);
}

/// UTC ISO-8601 for PostgREST range filters. Uses a `Z` suffix so `+` is never
/// sent unencoded in query strings (Postgres rejects `"… 00:00"` timestamps).
String formatSupabaseFilterTimestamp(DateTime dateTime) {
  final iso = dateTime.toUtc().toIso8601String();
  if (iso.endsWith('+00:00')) {
    return iso.replaceFirst('+00:00', 'Z');
  }
  return iso;
}
