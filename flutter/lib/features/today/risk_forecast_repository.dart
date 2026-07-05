import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/providers/core_providers.dart';

class RiskFactor {
  const RiskFactor({
    required this.key,
    required this.label,
    required this.detail,
    required this.weight,
  });

  final String key;
  final String label;
  final String detail;
  final int weight;

  factory RiskFactor.fromMap(Map<String, dynamic> map) {
    return RiskFactor(
      key: map['key'] as String? ?? '',
      label: map['label'] as String? ?? '',
      detail: map['detail'] as String? ?? '',
      weight: (map['weight'] as num?)?.round() ?? 0,
    );
  }
}

class RiskForecast {
  const RiskForecast({
    required this.riskScore,
    required this.band,
    this.aiNarrative,
    this.topFactors = const [],
    this.modelVersion,
    this.computedAt,
    this.forDate,
  });

  final int riskScore;
  final String band;
  final String? aiNarrative;
  final List<RiskFactor> topFactors;
  final String? modelVersion;
  final DateTime? computedAt;
  final String? forDate;

  int get readinessScore => (100 - riskScore).clamp(0, 100);

  factory RiskForecast.fromMap(Map<String, dynamic> map) {
    final factorsRaw = map['top_factors'];
    final factors = <RiskFactor>[];
    if (factorsRaw is List) {
      for (final item in factorsRaw) {
        if (item is Map) {
          factors.add(
            RiskFactor.fromMap(Map<String, dynamic>.from(item)),
          );
        }
      }
    } else if (factorsRaw is String && factorsRaw.isNotEmpty) {
      try {
        final decoded = jsonDecode(factorsRaw);
        if (decoded is List) {
          for (final item in decoded) {
            if (item is Map) {
              factors.add(
                RiskFactor.fromMap(Map<String, dynamic>.from(item)),
              );
            }
          }
        }
      } catch (_) {}
    }

    final computedRaw = map['computed_at'] as String?;
    return RiskForecast(
      riskScore: (map['risk_score'] as num?)?.round() ?? 0,
      band: map['band'] as String? ?? 'low',
      aiNarrative: (map['ai_narrative'] as String?)?.trim(),
      topFactors: factors,
      modelVersion: map['model_version'] as String?,
      computedAt:
          computedRaw == null ? null : DateTime.tryParse(computedRaw)?.toLocal(),
      forDate: map['for_date'] as String?,
    );
  }
}

class RiskForecastRepository {
  RiskForecastRepository({required SupabaseClient supabase})
      : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<RiskForecast?> loadLatest() async {
    final userId = _userId;
    if (userId == null) return null;

    try {
      final row = await _supabase
          .from('risk_forecasts')
          .select(
            'risk_score, band, ai_narrative, top_factors, model_version, computed_at, for_date',
          )
          .eq('user_id', userId)
          .order('for_date', ascending: false)
          .limit(1)
          .maybeSingle();
      if (row == null) return null;
      return RiskForecast.fromMap(Map<String, dynamic>.from(row));
    } catch (error, stack) {
      debugPrint('[RiskForecastRepository] loadLatest failed: $error\n$stack');
      return null;
    }
  }
}

final riskForecastRepositoryProvider = Provider<RiskForecastRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return RiskForecastRepository(supabase: ref.watch(supabaseClientProvider));
});

final latestRiskForecastProvider =
    FutureProvider.autoDispose<RiskForecast?>((ref) async {
  ref.keepAlive();
  await ref.watch(authRepositoryProvider.future);
  final session = ref.watch(authSessionProvider).valueOrNull;
  if (session == null) return null;
  return ref.watch(riskForecastRepositoryProvider).loadLatest();
});
