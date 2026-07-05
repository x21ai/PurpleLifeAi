import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

class MyHealthRepository {
  MyHealthRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<String?> loadNarrative() async {
    final userId = _userId;
    if (userId == null) return null;

    final forecast = await _supabase
        .from('risk_forecasts')
        .select('ai_narrative')
        .eq('user_id', userId)
        .order('for_date', ascending: false)
        .limit(1)
        .maybeSingle();
    final forecastText = (forecast?['ai_narrative'] as String?)?.trim();
    if (forecastText != null && forecastText.isNotEmpty) return forecastText;

    final today = DateTime.now().toUtc();
    final dayKey =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    final rows = await _supabase
        .from('health_narratives')
        .select('narrative, for_date, created_at')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(30);

    final list = (rows as List).cast<Map<String, dynamic>>();
    for (final row in list) {
      final narrative = (row['narrative'] as String?)?.trim();
      if (narrative == null || narrative.isEmpty) continue;
      final rowDay = (row['for_date'] as String?)?.split('T').first;
      if (rowDay == dayKey) return narrative;
    }
    for (final row in list) {
      final narrative = (row['narrative'] as String?)?.trim();
      if (narrative != null && narrative.isNotEmpty) return narrative;
    }
    return null;
  }
}

final myHealthRepositoryProvider = Provider<MyHealthRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return MyHealthRepository(supabase: ref.watch(supabaseClientProvider));
});

final healthNarrativeProvider = FutureProvider.autoDispose<String?>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return null;
  return ref.watch(myHealthRepositoryProvider).loadNarrative();
});
