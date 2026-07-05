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

  static const pendingTypeLabels = <String, String>{
    'add_journal_comment': 'Note appended to a journal entry',
    'add_meds_note': 'Note appended to a medication',
  };

  Future<CareInboxData> loadCareInbox() async {
    final userId = _caregiverId;
    if (userId == null) {
      return const CareInboxData(
        changes: [],
        incomingInvites: [],
        loadError: 'Sign in to view your inbox.',
      );
    }

    if (!_connectivity.isOnline) {
      return const CareInboxData(
        changes: [],
        incomingInvites: [],
        loadError: 'Offline. Reconnect to load your inbox.',
      );
    }

    try {
      final changes = await _loadPendingChangesDetailed(userId);
      final incomingInvites = await _loadIncomingCareInvites(userId);
      return CareInboxData(
        changes: changes,
        incomingInvites: incomingInvites,
      );
    } catch (_) {
      return const CareInboxData(
        changes: [],
        incomingInvites: [],
        loadError: 'Could not load your inbox right now.',
      );
    }
  }

  Future<void> decidePendingChange({
    required String changeId,
    required String decision,
    String? note,
  }) async {
    final userId = _caregiverId;
    if (userId == null) {
      throw CareAccessException('Sign in to decide pending changes.');
    }

    final change = await _supabase
        .from('pending_changes')
        .select('*')
        .eq('id', changeId)
        .maybeSingle();
    if (change == null) {
      throw CareAccessException('Change not found.');
    }
    if (change['owner_id'] != userId) {
      throw CareAccessException('Change not found.');
    }
    if (change['status'] != 'pending') {
      throw CareAccessException('Already decided.');
    }

    if (decision == 'approved') {
      await _applyPendingChange(change);
    }

    await _supabase.from('pending_changes').update({
      'status': decision,
      'decided_at': DateTime.now().toUtc().toIso8601String(),
      'decision_note': note,
    }).eq('id', changeId);

    await _supabase.from('care_audit_log').insert({
      'relationship_id': change['relationship_id'],
      'owner_id': userId,
      'actor_id': userId,
      'action': decision,
      'resource_type': 'pending_change',
      'resource_id': changeId,
      'metadata': {'type': change['type']},
    });
  }

  Future<BulkDecideResult> decidePendingChangesBulk({
    required List<String> ids,
    required String decision,
    String? note,
  }) async {
    var ok = 0;
    var failed = 0;
    for (final id in ids) {
      try {
        await decidePendingChange(changeId: id, decision: decision, note: note);
        ok++;
      } catch (_) {
        failed++;
      }
    }
    return BulkDecideResult(ok: ok, failed: failed);
  }

  Future<void> declineIncomingCareInvite(String relationshipId) async {
    final userId = _caregiverId;
    final email = _currentUserEmail();
    if (userId == null || email == null) {
      throw CareAccessException('Sign in to decline this invite.');
    }

    final rel = await _supabase
        .from('care_relationships')
        .select('id, status, invite_email')
        .eq('id', relationshipId)
        .maybeSingle();
    if (rel == null) {
      throw CareAccessException('Invite not found.');
    }
    if (rel['status'] != 'pending') {
      throw CareAccessException('Invite is no longer pending.');
    }
    final inviteEmail = (rel['invite_email'] as String?)?.trim().toLowerCase();
    if (inviteEmail != email) {
      throw CareAccessException('This invite was sent to a different email address.');
    }

    await _supabase
        .from('care_relationships')
        .update({'status': 'revoked'})
        .eq('id', relationshipId);
  }

  Future<List<PendingChangeDetail>> _loadPendingChangesDetailed(
    String ownerId,
  ) async {
    final response = await _supabase
        .from('pending_changes')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('status', 'pending')
        .order('created_at', ascending: false)
        .limit(100);

    final rows = (response as List).cast<Map<String, dynamic>>();
    final caregiverIds = rows
        .map((row) => row['caregiver_id'] as String?)
        .whereType<String>()
        .toSet();
    final profiles = await _loadCaregiverProfiles(caregiverIds);

    final detailed = <PendingChangeDetail>[];
    for (final row in rows) {
      final type = row['type'] as String? ?? '';
      final targetId = row['target_id'] as String?;
      String? currentValue;
      if (type == 'add_journal_comment' && targetId != null) {
        final entry = await _supabase
            .from('journal_entries')
            .select('text')
            .eq('id', targetId)
            .eq('user_id', ownerId)
            .maybeSingle();
        currentValue = entry?['text'] as String?;
      } else if (type == 'add_meds_note' && targetId != null) {
        final med = await _supabase
            .from('medications')
            .select('name, notes')
            .eq('id', targetId)
            .eq('user_id', ownerId)
            .maybeSingle();
        if (med != null) {
          final name = med['name'] as String? ?? '';
          final notes = med['notes'] as String? ?? '';
          currentValue = '$name\n$notes';
        }
      }

      final payload = row['payload'];
      final proposedText = payload is Map
          ? (payload['text'] as String? ?? '')
          : '';

      final caregiverId = row['caregiver_id'] as String?;
      detailed.add(
        PendingChangeDetail(
          id: row['id'] as String,
          type: type,
          typeLabel: pendingTypeLabels[type] ?? type,
          createdAt: row['created_at'] as String? ?? '',
          currentValue: currentValue,
          proposedText: proposedText,
          caregiverProfile:
              caregiverId != null ? profiles[caregiverId] : null,
        ),
      );
    }
    return detailed;
  }

  Future<List<IncomingCareInvite>> _loadIncomingCareInvites(
    String userId,
  ) async {
    final email = _currentUserEmail();
    if (email == null || email.isEmpty) return const [];

    final nowIso = DateTime.now().toUtc().toIso8601String();
    final response = await _supabase
        .from('care_relationships')
        .select(
          'id, owner_id, role, invite_email, created_at, expires_at',
        )
        .eq('status', 'pending')
        .ilike('invite_email', email)
        .or('expires_at.is.null,expires_at.gt.$nowIso')
        .order('created_at', ascending: false);

    final rows = (response as List).cast<Map<String, dynamic>>();
    if (rows.isEmpty) return const [];

    final ownerIds = rows.map((row) => row['owner_id'] as String).toSet();
    final ownerNames = await _loadOwnerDisplayNames(ownerIds);

    return rows.map((row) {
      final role = row['role'] as String? ?? CareRole.caregiver.name;
      final parsedRole = parseCareRole(role);
      return IncomingCareInvite(
        id: row['id'] as String,
        ownerId: row['owner_id'] as String,
        role: role,
        roleLabel: parsedRole != null
            ? careRoleLabels[parsedRole]!
            : role,
        ownerName: ownerNames[row['owner_id'] as String] ?? 'A Purple member',
        createdAt: row['created_at'] as String? ?? '',
      );
    }).toList();
  }

  Future<Map<String, CaregiverProfileSummary>> _loadCaregiverProfiles(
    Set<String> caregiverIds,
  ) async {
    if (caregiverIds.isEmpty) return const {};
    try {
      final response = await _supabase
          .from('profiles')
          .select('id, first_name, last_name, community_display_name')
          .inFilter('id', caregiverIds.toList());
      final profiles = <String, CaregiverProfileSummary>{};
      for (final row in (response as List).cast<Map<String, dynamic>>()) {
        profiles[row['id'] as String] = CaregiverProfileSummary.fromMap(row);
      }
      return profiles;
    } catch (_) {
      return const {};
    }
  }

  Future<void> _applyPendingChange(Map<String, dynamic> change) async {
    final type = change['type'] as String? ?? '';
    final targetId = change['target_id'] as String?;
    final ownerId = change['owner_id'] as String;
    final payload = change['payload'];
    final text = payload is Map ? (payload['text'] as String? ?? '') : '';

    if (type == 'add_journal_comment' && targetId != null) {
      final note = text.length > 2000 ? text.substring(0, 2000) : text;
      final stamp =
          '\n\n- Caregiver note (approved ${DateTime.now().toUtc().toIso8601String().substring(0, 10)}):\n$note';
      final entry = await _supabase
          .from('journal_entries')
          .select('text')
          .eq('id', targetId)
          .eq('user_id', ownerId)
          .maybeSingle();
      if (entry == null) {
        throw CareAccessException('Target journal entry not found.');
      }
      final newText = '${entry['text'] ?? ''}$stamp';
      await _supabase
          .from('journal_entries')
          .update({'text': newText})
          .eq('id', targetId)
          .eq('user_id', ownerId);
    } else if (type == 'add_meds_note' && targetId != null) {
      final note = text.length > 1000 ? text.substring(0, 1000) : text;
      final med = await _supabase
          .from('medications')
          .select('notes')
          .eq('id', targetId)
          .eq('user_id', ownerId)
          .maybeSingle();
      if (med == null) {
        throw CareAccessException('Target medication not found.');
      }
      final newNotes = '${med['notes'] ?? ''}\n- Caregiver: $note'.trim();
      await _supabase
          .from('medications')
          .update({'notes': newNotes})
          .eq('id', targetId)
          .eq('user_id', ownerId);
    }
  }

  String? _currentUserEmail() {
    return _supabase.auth.currentUser?.email?.trim().toLowerCase();
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

class CaregiverProfileSummary {
  const CaregiverProfileSummary({
    this.firstName,
    this.lastName,
    this.communityDisplayName,
  });

  final String? firstName;
  final String? lastName;
  final String? communityDisplayName;

  String displayName() {
    final community = communityDisplayName?.trim();
    if (community != null && community.isNotEmpty) return community;
    final parts = [firstName, lastName]
        .whereType<String>()
        .where((part) => part.trim().isNotEmpty)
        .join(' ')
        .trim();
    return parts.isEmpty ? 'A caregiver' : parts;
  }

  factory CaregiverProfileSummary.fromMap(Map<String, dynamic> map) {
    return CaregiverProfileSummary(
      firstName: map['first_name'] as String?,
      lastName: map['last_name'] as String?,
      communityDisplayName: map['community_display_name'] as String?,
    );
  }
}

class PendingChangeDetail {
  const PendingChangeDetail({
    required this.id,
    required this.type,
    required this.typeLabel,
    required this.createdAt,
    required this.proposedText,
    this.currentValue,
    this.caregiverProfile,
  });

  final String id;
  final String type;
  final String typeLabel;
  final String createdAt;
  final String proposedText;
  final String? currentValue;
  final CaregiverProfileSummary? caregiverProfile;

  String filterBucket() {
    if (type.contains('meds')) return 'meds';
    if (type.contains('journal')) return 'journal';
    return 'other';
  }
}

class IncomingCareInvite {
  const IncomingCareInvite({
    required this.id,
    required this.ownerId,
    required this.role,
    required this.roleLabel,
    required this.ownerName,
    required this.createdAt,
  });

  final String id;
  final String ownerId;
  final String role;
  final String roleLabel;
  final String ownerName;
  final String createdAt;
}

class CareInboxData {
  const CareInboxData({
    required this.changes,
    required this.incomingInvites,
    this.loadError,
  });

  final List<PendingChangeDetail> changes;
  final List<IncomingCareInvite> incomingInvites;
  final String? loadError;
}

class BulkDecideResult {
  const BulkDecideResult({required this.ok, required this.failed});

  final int ok;
  final int failed;
}

final careInboxProvider = FutureProvider.autoDispose<CareInboxData>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(careRepositoryProvider).loadCareInbox();
});
