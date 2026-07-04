import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/providers/core_providers.dart';
import 'care_scopes.dart';

class CareAccessException implements Exception {
  CareAccessException(this.message);

  final String message;

  @override
  String toString() => message;
}

class CareOverview {
  const CareOverview({
    required this.relationshipId,
    required this.ownerId,
    required this.role,
    required this.scopes,
    required this.caregiverHiddenFeatures,
    this.relationshipLabel,
    this.expiresAt,
    this.displayName,
    this.firstName,
    this.phone,
    this.isFromCache = false,
  });

  final String relationshipId;
  final String ownerId;
  final String role;
  final List<String> scopes;
  final List<String> caregiverHiddenFeatures;
  final String? relationshipLabel;
  final String? expiresAt;
  final String? displayName;
  final String? firstName;
  final String? phone;
  final bool isFromCache;

  bool hasScope(String scope) => scopes.contains(scope);

  List<CareTabDefinition> scopedTabs({bool respectHidden = true}) {
    final hidden = respectHidden ? caregiverHiddenFeatures.toSet() : <String>{};
    return careTabDefinitions
        .where((tab) => hasScope(tab.scope))
        .where((tab) => !hidden.contains(careTabKeyName(tab.key)))
        .toList();
  }

  String dashboardTitle() {
    final name = firstName?.trim();
    if (name != null && name.isNotEmpty) {
      final suffix = name.endsWith('s') ? "'" : "'s";
      return '$name$suffix Dashboard';
    }
    final display = displayName?.trim();
    if (display != null && display.isNotEmpty) {
      final suffix = display.endsWith('s') ? "'" : "'s";
      return '$display$suffix Dashboard';
    }
    return 'Their Dashboard';
  }
}

class CareBiometricsSnapshot {
  const CareBiometricsSnapshot({
    required this.rows,
    required this.scopeGranted,
    this.isFromCache = false,
    this.loadError,
  });

  final List<Map<String, dynamic>> rows;
  final bool scopeGranted;
  final bool isFromCache;
  final String? loadError;
}

/// Direct Supabase queries against care tables with offline overview cache.
class CareRepository {
  CareRepository({
    required SupabaseClient supabase,
    required ConnectivityService connectivity,
  })  : _supabase = supabase,
        _connectivity = connectivity;

  final SupabaseClient _supabase;
  final ConnectivityService _connectivity;
  final Map<String, CareOverview> _overviewCache = {};
  final Map<String, CareBiometricsSnapshot> _biometricsCache = {};

  String? get _caregiverId => _supabase.auth.currentUser?.id;

  Future<CareOverview> loadOverview(String ownerId) async {
    final caregiverId = _caregiverId;
    if (caregiverId == null) {
      throw CareAccessException('Sign in to view care dashboards.');
    }

    if (!_connectivity.isOnline) {
      final cached = _overviewCache[ownerId];
      if (cached != null) {
        return cached.copyWith(isFromCache: true);
      }
      throw CareAccessException('Offline. Reconnect to load this dashboard.');
    }

    try {
      final overview = await _fetchOverview(ownerId, caregiverId);
      _overviewCache[ownerId] = overview;
      return overview;
    } catch (e) {
      final cached = _overviewCache[ownerId];
      if (cached != null) {
        return cached.copyWith(isFromCache: true);
      }
      rethrow;
    }
  }

  Future<CareOverview> _fetchOverview(String ownerId, String caregiverId) async {
    final rel = await _supabase
        .from('care_relationships')
        .select(
          'id, role, status, expires_at, relationship_label, '
          'caregiver_hidden_features, invite_email',
        )
        .eq('owner_id', ownerId)
        .eq('caregiver_id', caregiverId)
        .eq('status', 'active')
        .maybeSingle();

    if (rel == null) {
      throw CareAccessException(
        'No active relationship. Ask them to grant access in Settings, Sharing.',
      );
    }

    final expiresAt = rel['expires_at'] as String?;
    if (expiresAt != null && DateTime.parse(expiresAt).isBefore(DateTime.now())) {
      throw CareAccessException('Access expired.');
    }

    final relationshipId = rel['id'] as String;
    final scopeRows = await _supabase
        .from('care_scopes')
        .select('scope, granted')
        .eq('relationship_id', relationshipId);

    final scopes = (scopeRows as List)
        .cast<Map<String, dynamic>>()
        .where((row) => row['granted'] == true)
        .map((row) => row['scope'] as String)
        .toList();

    final hiddenRaw = rel['caregiver_hidden_features'];
    final hidden = _parseHiddenFeatures(hiddenRaw);

    String? firstName;
    String? displayName;
    String? phone;
    try {
      final profile = await _supabase
          .from('profiles')
          .select(
            'first_name, last_name, community_display_name, phone',
          )
          .eq('id', ownerId)
          .maybeSingle();
      if (profile != null) {
        firstName = profile['first_name'] as String?;
        final lastName = profile['last_name'] as String?;
        final community = profile['community_display_name'] as String?;
        displayName = community?.trim().isNotEmpty == true
            ? community!.trim()
            : [firstName, lastName].whereType<String>().where((s) => s.trim().isNotEmpty).join(' ').trim();
        if (displayName.isEmpty) displayName = null;
        phone = profile['phone'] as String?;
      }
    } catch (_) {
      // Profile RLS may block caregiver reads; fall back to relationship label.
    }

    displayName ??= (rel['invite_email'] as String?) ?? 'Their account';

    return CareOverview(
      relationshipId: relationshipId,
      ownerId: ownerId,
      role: rel['role'] as String? ?? CareRole.caregiver.name,
      scopes: scopes,
      caregiverHiddenFeatures: hidden,
      relationshipLabel: rel['relationship_label'] as String?,
      expiresAt: expiresAt,
      displayName: displayName,
      firstName: firstName,
      phone: phone,
    );
  }

  Future<CareBiometricsSnapshot> loadOwnerBiometrics({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.biometricsRead)) {
      return const CareBiometricsSnapshot(
        rows: [],
        scopeGranted: false,
      );
    }

    if (!_connectivity.isOnline) {
      final cached = _biometricsCache[ownerId];
      if (cached != null) {
        return cached.copyWith(isFromCache: true);
      }
      return const CareBiometricsSnapshot(
        rows: [],
        scopeGranted: true,
        loadError: 'Offline. Biometrics will load when you reconnect.',
      );
    }

    try {
      final since = DateTime.now()
          .subtract(const Duration(days: 30))
          .toUtc()
          .toIso8601String();
      final response = await _supabase
          .from('biometrics')
          .select('id, recorded_at, oura_readiness_score, sleep_score, '
              'oura_activity_score, hrv_rmssd_ms, resting_hr_bpm, steps')
          .eq('user_id', ownerId)
          .gte('recorded_at', since)
          .order('recorded_at', ascending: true)
          .limit(500);

      final rows = (response as List).cast<Map<String, dynamic>>();
      final snapshot = CareBiometricsSnapshot(
        rows: rows,
        scopeGranted: true,
      );
      _biometricsCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      final cached = _biometricsCache[ownerId];
      if (cached != null) {
        return cached.copyWith(isFromCache: true);
      }
      return const CareBiometricsSnapshot(
        rows: [],
        scopeGranted: true,
        loadError: 'Could not load biometrics yet.',
      );
    }
  }

  Future<void> setHiddenFeatures({
    required String relationshipId,
    required List<String> hidden,
  }) async {
    await _supabase
        .from('care_relationships')
        .update({'caregiver_hidden_features': hidden})
        .eq('id', relationshipId)
        .eq('caregiver_id', _caregiverId ?? '');
  }

  List<String> _parseHiddenFeatures(Object? raw) {
    if (raw is List) {
      return raw.whereType<String>().toList();
    }
    return const [];
  }
}

extension _CareOverviewCopy on CareOverview {
  CareOverview copyWith({bool? isFromCache}) {
    return CareOverview(
      relationshipId: relationshipId,
      ownerId: ownerId,
      role: role,
      scopes: scopes,
      caregiverHiddenFeatures: caregiverHiddenFeatures,
      relationshipLabel: relationshipLabel,
      expiresAt: expiresAt,
      displayName: displayName,
      firstName: firstName,
      phone: phone,
      isFromCache: isFromCache ?? this.isFromCache,
    );
  }
}

extension _CareBiometricsCopy on CareBiometricsSnapshot {
  CareBiometricsSnapshot copyWith({
    bool? isFromCache,
    String? loadError,
  }) {
    return CareBiometricsSnapshot(
      rows: rows,
      scopeGranted: scopeGranted,
      isFromCache: isFromCache ?? this.isFromCache,
      loadError: loadError ?? this.loadError,
    );
  }
}

final careRepositoryProvider = Provider<CareRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return CareRepository(
    supabase: ref.watch(supabaseClientProvider),
    connectivity: ref.watch(connectivityServiceProvider),
  );
});

final careOverviewProvider =
    FutureProvider.autoDispose.family<CareOverview, String>((ref, ownerId) {
  ref.watch(authSessionProvider);
  return ref.watch(careRepositoryProvider).loadOverview(ownerId);
});

final careBiometricsProvider = FutureProvider.autoDispose
    .family<CareBiometricsSnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerBiometrics(ownerId: ownerId, overview: overview);
});
