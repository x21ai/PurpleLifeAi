import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

/// One hydration log row from `hydration_intake`.
class HydrationRow {
  const HydrationRow({
    required this.id,
    required this.consumedAt,
    required this.volumeMl,
    required this.kind,
    this.electrolyteBrand,
    this.sodiumMg,
    this.notes,
    this.createdByKind,
  });

  final String id;
  final DateTime consumedAt;
  final int volumeMl;
  final String kind;
  final String? electrolyteBrand;
  final int? sodiumMg;
  final String? notes;
  final String? createdByKind;

  factory HydrationRow.fromMap(Map<String, dynamic> map) {
    final consumedRaw = map['consumed_at'] as String?;
    return HydrationRow(
      id: map['id'] as String? ?? '',
      consumedAt: consumedRaw == null
          ? DateTime.now()
          : DateTime.parse(consumedRaw).toLocal(),
      volumeMl: (map['volume_ml'] as num?)?.toInt() ?? 0,
      kind: map['kind'] as String? ?? 'water',
      electrolyteBrand: map['electrolyte_brand'] as String?,
      sodiumMg: (map['sodium_mg'] as num?)?.toInt(),
      notes: map['notes'] as String?,
      createdByKind: map['created_by_kind'] as String?,
    );
  }

  String get displayLabel {
    if (kind == 'electrolyte' && electrolyteBrand != null) {
      return electrolyteBrand!;
    }
    return switch (kind) {
      'water' => 'Water',
      'electrolyte' => 'Electrolytes',
      'coffee' => 'Coffee',
      'tea' => 'Tea',
      _ => 'Drink',
    };
  }
}

class HydrationDayData {
  const HydrationDayData({
    required this.rows,
    required this.goalMl,
    required this.isOffline,
  });

  final List<HydrationRow> rows;
  final int goalMl;
  final bool isOffline;

  int get totalMl =>
      rows.fold(0, (sum, row) => sum + row.volumeMl);

  double get progress =>
      goalMl <= 0 ? 0 : (totalMl / goalMl).clamp(0.0, 1.0);
}

/// Reads and writes hydration intake via Supabase (fail-open on read errors).
class HydrationRepository {
  HydrationRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<HydrationDayData> loadDay(DateTime day) async {
    final userId = _userId;
    if (userId == null) {
      return const HydrationDayData(rows: [], goalMl: 2000, isOffline: false);
    }

    final start = DateTime(day.year, day.month, day.day);
    final end = start.add(const Duration(days: 1));
    final goal = await _fetchGoalSafe(userId);

    try {
      final response = await _supabase
          .from('hydration_intake')
          .select(
            'id, consumed_at, volume_ml, kind, electrolyte_brand, sodium_mg, notes, created_by_kind',
          )
          .eq('user_id', userId)
          .gte('consumed_at', start.toUtc().toIso8601String())
          .lt('consumed_at', end.toUtc().toIso8601String())
          .order('consumed_at', ascending: true);
      final rows = (response as List)
          .map((row) => HydrationRow.fromMap(Map<String, dynamic>.from(row as Map)))
          .toList();
      return HydrationDayData(rows: rows, goalMl: goal, isOffline: false);
    } catch (error, stack) {
      debugPrint('[HydrationRepository] loadDay failed: $error\n$stack');
      return HydrationDayData(rows: const [], goalMl: goal, isOffline: true);
    }
  }

  Future<int> _fetchGoalSafe(String userId) async {
    try {
      final row = await _supabase
          .from('profiles')
          .select('daily_water_goal_ml')
          .eq('id', userId)
          .maybeSingle();
      return (row?['daily_water_goal_ml'] as num?)?.toInt() ?? 2000;
    } catch (_) {
      return 2000;
    }
  }

  Future<void> logIntake({
    required int volumeMl,
    required String kind,
    String? electrolyteBrand,
    int? sodiumMg,
    DateTime? consumedAt,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Sign in to log hydration');
    }
    if (volumeMl <= 0 || volumeMl > 5000) {
      throw ArgumentError('volume_ml must be between 1 and 5000');
    }

    await _supabase.from('hydration_intake').insert({
      'user_id': userId,
      'consumed_at': (consumedAt ?? DateTime.now()).toUtc().toIso8601String(),
      'volume_ml': volumeMl,
      'kind': kind,
      'electrolyte_brand': electrolyteBrand,
      'sodium_mg': sodiumMg,
      'created_by_kind': 'self',
      'created_by_id': userId,
    });
  }

  Future<void> deleteEntry(String id) async {
    await _supabase.from('hydration_intake').delete().eq('id', id);
  }
}

final hydrationRepositoryProvider = Provider<HydrationRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return HydrationRepository(supabase: ref.watch(supabaseClientProvider));
});

final hydrationDayProvider = FutureProvider.autoDispose
    .family<HydrationDayData, DateTime>((ref, day) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) {
    return const HydrationDayData(rows: [], goalMl: 2000, isOffline: false);
  }
  final normalized = DateTime(day.year, day.month, day.day);
  return ref.watch(hydrationRepositoryProvider).loadDay(normalized);
});
