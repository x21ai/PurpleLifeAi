import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/network/connectivity_service.dart';
import '../../core/offline/supabase_row_parse.dart';
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

  String? get _caregiverId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

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

    final overview = await _fetchOverview(ownerId, caregiverId);
    _overviewCache[ownerId] = overview;
    return overview;
  }

  Future<CareOverview> _fetchOverview(
      String ownerId, String caregiverId) async {
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
    if (expiresAt != null &&
        DateTime.parse(expiresAt).isBefore(DateTime.now())) {
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
            : [firstName, lastName]
                .whereType<String>()
                .where((s) => s.trim().isNotEmpty)
                .join(' ')
                .trim();
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
      final since = formatSupabaseFilterTimestamp(
        DateTime.now().subtract(const Duration(days: 30)),
      );
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
      return const CareBiometricsSnapshot(
        rows: [],
        scopeGranted: true,
        loadError: 'Could not load biometrics right now. Pull to retry.',
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

  Future<SharingListData> loadSharingLists() async {
    final userId = _caregiverId;
    if (userId == null) {
      return const SharingListData(
        myCaregivers: [],
        sharingWithMe: [],
        loadError: 'Sign in to view sharing settings.',
      );
    }

    try {
      final results = await Future.wait([
        _listRelationships(ownerId: userId),
        _listRelationships(caregiverId: userId),
      ]);
      return SharingListData(
        myCaregivers: results[0],
        sharingWithMe: results[1],
      );
    } catch (_) {
      return const SharingListData(
        myCaregivers: [],
        sharingWithMe: [],
        loadError: 'Could not load care relationships right now.',
      );
    }
  }

  Future<CareIndexData> loadCareIndex() async {
    final userId = _caregiverId;
    if (userId == null) {
      return const CareIndexData(
        owners: [],
        pendingInvites: [],
        myCaregivers: [],
        loadError: 'Sign in to view care.',
      );
    }

    try {
      final caregiverRows = await _listRelationships(caregiverId: userId);
      final activeOwners =
          caregiverRows.where((row) => row.status == 'active').toList();
      final pendingInvites =
          caregiverRows.where((row) => row.status == 'pending').toList();
      final ownerNames = await _loadOwnerDisplayNames(
        activeOwners.map((row) => row.ownerId).toSet(),
      );
      final owners = activeOwners
          .map(
            (row) => CareRelationshipRow(
              id: row.id,
              ownerId: row.ownerId,
              caregiverId: row.caregiverId,
              inviteEmail: row.inviteEmail,
              role: row.role,
              status: row.status,
              relationshipLabel: row.relationshipLabel,
              createdAt: row.createdAt,
              acceptedAt: row.acceptedAt,
              expiresAt: row.expiresAt,
              inviteToken: row.inviteToken,
              ownerDisplayName: ownerNames[row.ownerId],
            ),
          )
          .toList();
      final myCaregivers = await _listRelationships(ownerId: userId);
      return CareIndexData(
        owners: owners,
        pendingInvites: pendingInvites,
        myCaregivers: myCaregivers,
      );
    } catch (_) {
      return const CareIndexData(
        owners: [],
        pendingInvites: [],
        myCaregivers: [],
        loadError: 'Could not load care relationships right now.',
      );
    }
  }

  Future<List<CareRelationshipRow>> _listRelationships({
    String? ownerId,
    String? caregiverId,
  }) async {
    var query = _supabase
        .from('care_relationships')
        .select(
          'id, owner_id, caregiver_id, invite_email, role, status, '
          'relationship_label, created_at, accepted_at, expires_at, invite_token',
        )
        .isFilter('archived_at', null);

    if (ownerId != null) {
      query = query.eq('owner_id', ownerId);
    }
    if (caregiverId != null) {
      query = query.eq('caregiver_id', caregiverId);
    }

    final response = await query.order('created_at', ascending: false);
    return (response as List)
        .cast<Map<String, dynamic>>()
        .map(CareRelationshipRow.fromMap)
        .where((row) => row.status == 'active' || row.status == 'pending')
        .toList();
  }

  Future<Map<String, String>> _loadOwnerDisplayNames(Set<String> ownerIds) async {
    if (ownerIds.isEmpty) return const {};

    try {
      final response = await _supabase
          .from('profiles')
          .select('id, first_name, last_name, community_display_name')
          .inFilter('id', ownerIds.toList());
      final names = <String, String>{};
      for (final row in (response as List).cast<Map<String, dynamic>>()) {
        final id = row['id'] as String;
        final community = row['community_display_name'] as String?;
        final first = row['first_name'] as String?;
        final last = row['last_name'] as String?;
        final display = community?.trim().isNotEmpty == true
            ? community!.trim()
            : [first, last]
                .whereType<String>()
                .where((part) => part.trim().isNotEmpty)
                .join(' ')
                .trim();
        if (display.isNotEmpty) names[id] = display;
      }
      return names;
    } catch (_) {
      return const {};
    }
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

/// Row from `care_relationships` for list screens.
class CareRelationshipRow {
  const CareRelationshipRow({
    required this.id,
    required this.ownerId,
    this.caregiverId,
    required this.inviteEmail,
    required this.role,
    required this.status,
    this.relationshipLabel,
    this.createdAt,
    this.acceptedAt,
    this.expiresAt,
    this.inviteToken,
    this.ownerDisplayName,
  });

  final String id;
  final String ownerId;
  final String? caregiverId;
  final String inviteEmail;
  final String role;
  final String status;
  final String? relationshipLabel;
  final String? createdAt;
  final String? acceptedAt;
  final String? expiresAt;
  final String? inviteToken;
  final String? ownerDisplayName;

  String get subtitle {
    final label = relationshipLabel?.trim();
    if (label != null && label.isNotEmpty) return label;
    final role = parseCareRole(this.role);
    if (role != null) return careRoleLabels[role]!;
    return this.role;
  }

  String get primaryLabel {
    final name = ownerDisplayName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final email = inviteEmail.trim();
    if (email.isNotEmpty) return email;
    return 'Care relationship';
  }

  factory CareRelationshipRow.fromMap(
    Map<String, dynamic> map, {
    String? ownerDisplayName,
  }) {
    return CareRelationshipRow(
      id: map['id'] as String,
      ownerId: map['owner_id'] as String,
      caregiverId: map['caregiver_id'] as String?,
      inviteEmail: (map['invite_email'] as String?) ?? '',
      role: (map['role'] as String?) ?? CareRole.caregiver.name,
      status: (map['status'] as String?) ?? 'pending',
      relationshipLabel: map['relationship_label'] as String?,
      createdAt: map['created_at'] as String?,
      acceptedAt: map['accepted_at'] as String?,
      expiresAt: map['expires_at'] as String?,
      inviteToken: map['invite_token'] as String?,
      ownerDisplayName: ownerDisplayName,
    );
  }
}

class CareIndexData {
  const CareIndexData({
    required this.owners,
    required this.pendingInvites,
    required this.myCaregivers,
    this.loadError,
  });

  final List<CareRelationshipRow> owners;
  final List<CareRelationshipRow> pendingInvites;
  final List<CareRelationshipRow> myCaregivers;
  final String? loadError;

  static const empty = CareIndexData(
    owners: [],
    pendingInvites: [],
    myCaregivers: [],
  );
}

class SharingListData {
  const SharingListData({
    required this.myCaregivers,
    required this.sharingWithMe,
    this.loadError,
  });

  final List<CareRelationshipRow> myCaregivers;
  final List<CareRelationshipRow> sharingWithMe;
  final String? loadError;

  static const empty = SharingListData(
    myCaregivers: [],
    sharingWithMe: [],
  );
}

final sharingListProvider = FutureProvider.autoDispose<SharingListData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(careRepositoryProvider).loadSharingLists();
});

final careIndexProvider = FutureProvider.autoDispose<CareIndexData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(careRepositoryProvider).loadCareIndex();
});
