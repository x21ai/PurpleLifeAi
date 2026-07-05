import '../lib/core/offline/supabase_row_parse.dart';

void main() {
  final since = DateTime.now().subtract(const Duration(days: 60));
  print('raw: ${since.toUtc().toIso8601String()}');
  print('filter: ${formatSupabaseFilterTimestamp(since)}');
}
