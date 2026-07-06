import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/api/worker_client.dart';
import '../../core/config/app_config.dart';
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

/// Caregiver "Today" tab: mirrors `caregiverReadToday` -> `{ forecast, alerts }`.
class CareTodaySnapshot {
  const CareTodaySnapshot({
    required this.scopeGranted,
    this.forecast,
    this.alerts = const [],
    this.isFromCache = false,
    this.loadError,
  });

  final bool scopeGranted;
  final Map<String, dynamic>? forecast;
  final List<Map<String, dynamic>> alerts;
  final bool isFromCache;
  final String? loadError;
}

/// Caregiver "Meds" tab: mirrors `caregiverReadMeds` -> `{ meds, doses }`.
class CareMedsSnapshot {
  const CareMedsSnapshot({
    required this.scopeGranted,
    this.meds = const [],
    this.doses = const [],
    this.isFromCache = false,
    this.loadError,
  });

  final bool scopeGranted;
  final List<Map<String, dynamic>> meds;
  final List<Map<String, dynamic>> doses;
  final bool isFromCache;
  final String? loadError;
}

/// Caregiver "Journal" tab: mirrors `caregiverReadJournal` -> `{ entries }`.
class CareJournalSnapshot {
  const CareJournalSnapshot({
    required this.scopeGranted,
    this.entries = const [],
    this.isFromCache = false,
    this.loadError,
  });

  final bool scopeGranted;
  final List<Map<String, dynamic>> entries;
  final bool isFromCache;
  final String? loadError;
}

/// Caregiver "Seizures" tab: mirrors `caregiverReadSeizures` -> `{ events }`.
class CareSeizuresSnapshot {
  const CareSeizuresSnapshot({
    required this.scopeGranted,
    this.events = const [],
    this.isFromCache = false,
    this.loadError,
  });

  final bool scopeGranted;
  final List<Map<String, dynamic>> events;
  final bool isFromCache;
  final String? loadError;
}

/// Caregiver "Reports" tab list: mirrors `caregiverReadReports` -> `{ reports }`.
class CareReportsSnapshot {
  const CareReportsSnapshot({
    required this.scopeGranted,
    this.reports = const [],
    this.isFromCache = false,
    this.loadError,
  });

  final bool scopeGranted;
  final List<Map<String, dynamic>> reports;
  final bool isFromCache;
  final String? loadError;
}

/// Caregiver single-report detail: mirrors `caregiverReadReport` ->
/// `{ report, metrics }`.
class CareReportDetail {
  const CareReportDetail({required this.report, required this.metrics});

  final Map<String, dynamic> report;
  final List<Map<String, dynamic>> metrics;
}

/// Direct Supabase queries against care tables with offline overview cache.
class CareRepository {
  CareRepository({
    required SupabaseClient supabase,
    required ConnectivityService connectivity,
    required AppConfig config,
    required WorkerClient worker,
    http.Client? httpClient,
  })  : _supabase = supabase,
        _connectivity = connectivity,
        _config = config,
        _worker = worker,
        _http = httpClient ?? http.Client();

  final SupabaseClient _supabase;
  final ConnectivityService _connectivity;
  final AppConfig _config;
  final WorkerClient _worker;
  final http.Client _http;
  final Map<String, CareOverview> _overviewCache = {};
  final Map<String, CareBiometricsSnapshot> _biometricsCache = {};
  final Map<String, CareTodaySnapshot> _todayCache = {};
  final Map<String, CareMedsSnapshot> _medsCache = {};
  final Map<String, CareJournalSnapshot> _journalCache = {};
  final Map<String, CareSeizuresSnapshot> _seizuresCache = {};
  final Map<String, CareReportsSnapshot> _reportsCache = {};

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

  /// Caregiver "Today" tab. Calls `POST /api/care/today` (fronts
  /// `caregiverReadToday`, scope-checked server-side by `assertScope`).
  Future<CareTodaySnapshot> loadOwnerToday({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.todayRead)) {
      return const CareTodaySnapshot(scopeGranted: false);
    }
    if (!_connectivity.isOnline) {
      final cached = _todayCache[ownerId];
      if (cached != null) return cached.copyWith(isFromCache: true);
      return const CareTodaySnapshot(
        scopeGranted: true,
        loadError: 'Offline. Reconnect to load today.',
      );
    }
    try {
      final decoded = await _worker.postCareToday(ownerId: ownerId);
      final snapshot = CareTodaySnapshot(
        scopeGranted: true,
        forecast: decoded['forecast'] as Map<String, dynamic>?,
        alerts: (decoded['alerts'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
      );
      _todayCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      return CareTodaySnapshot(
        scopeGranted: true,
        loadError: _friendlyWorkerError(e, "Couldn't load today."),
      );
    }
  }

  /// Caregiver "Meds" tab. Calls `POST /api/care/meds` (fronts
  /// `caregiverReadMeds`).
  Future<CareMedsSnapshot> loadOwnerMeds({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.medsRead)) {
      return const CareMedsSnapshot(scopeGranted: false);
    }
    if (!_connectivity.isOnline) {
      final cached = _medsCache[ownerId];
      if (cached != null) return cached.copyWith(isFromCache: true);
      return const CareMedsSnapshot(
        scopeGranted: true,
        loadError: 'Offline. Reconnect to load medications.',
      );
    }
    try {
      final decoded = await _worker.postCareMeds(ownerId: ownerId);
      final snapshot = CareMedsSnapshot(
        scopeGranted: true,
        meds: (decoded['meds'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
        doses: (decoded['doses'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
      );
      _medsCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      return CareMedsSnapshot(
        scopeGranted: true,
        loadError: _friendlyWorkerError(e, "Couldn't load medications."),
      );
    }
  }

  /// Caregiver "Journal" tab. Calls `POST /api/care/journal` (fronts
  /// `caregiverReadJournal`).
  Future<CareJournalSnapshot> loadOwnerJournal({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.journalRead)) {
      return const CareJournalSnapshot(scopeGranted: false);
    }
    if (!_connectivity.isOnline) {
      final cached = _journalCache[ownerId];
      if (cached != null) return cached.copyWith(isFromCache: true);
      return const CareJournalSnapshot(
        scopeGranted: true,
        loadError: 'Offline. Reconnect to load journal entries.',
      );
    }
    try {
      final decoded = await _worker.postCareJournal(ownerId: ownerId);
      final snapshot = CareJournalSnapshot(
        scopeGranted: true,
        entries: (decoded['entries'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
      );
      _journalCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      return CareJournalSnapshot(
        scopeGranted: true,
        loadError: _friendlyWorkerError(e, "Couldn't load journal entries."),
      );
    }
  }

  /// Caregiver "Seizures" tab. Calls `POST /api/care/seizures` (fronts
  /// `caregiverReadSeizures`).
  Future<CareSeizuresSnapshot> loadOwnerSeizures({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.seizuresRead)) {
      return const CareSeizuresSnapshot(scopeGranted: false);
    }
    if (!_connectivity.isOnline) {
      final cached = _seizuresCache[ownerId];
      if (cached != null) return cached.copyWith(isFromCache: true);
      return const CareSeizuresSnapshot(
        scopeGranted: true,
        loadError: 'Offline. Reconnect to load seizure events.',
      );
    }
    try {
      final decoded = await _worker.postCareSeizures(ownerId: ownerId);
      final snapshot = CareSeizuresSnapshot(
        scopeGranted: true,
        events: (decoded['events'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
      );
      _seizuresCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      return CareSeizuresSnapshot(
        scopeGranted: true,
        loadError: _friendlyWorkerError(e, "Couldn't load seizure events."),
      );
    }
  }

  /// Caregiver "Reports" tab list. Calls `POST /api/care/reports` (fronts
  /// `caregiverReadReports`).
  Future<CareReportsSnapshot> loadOwnerReports({
    required String ownerId,
    required CareOverview overview,
  }) async {
    if (!overview.hasScope(CareScopes.reportsRead)) {
      return const CareReportsSnapshot(scopeGranted: false);
    }
    if (!_connectivity.isOnline) {
      final cached = _reportsCache[ownerId];
      if (cached != null) return cached.copyWith(isFromCache: true);
      return const CareReportsSnapshot(
        scopeGranted: true,
        loadError: 'Offline. Reconnect to load reports.',
      );
    }
    try {
      final decoded = await _worker.postCareReports(ownerId: ownerId);
      final snapshot = CareReportsSnapshot(
        scopeGranted: true,
        reports: (decoded['reports'] as List? ?? const [])
            .cast<Map<String, dynamic>>(),
      );
      _reportsCache[ownerId] = snapshot;
      return snapshot;
    } catch (e) {
      return CareReportsSnapshot(
        scopeGranted: true,
        loadError: _friendlyWorkerError(e, "Couldn't load reports."),
      );
    }
  }

  /// Caregiver single-report detail. Calls `POST /api/care/report` (fronts
  /// `caregiverReadReport`, which writes the mandatory `phi_access_log`
  /// `caregiver_view` audit row server-side on success). Not cached: this is
  /// a PHI-audited read and should reflect a fresh access each time.
  Future<CareReportDetail> loadOwnerReport({
    required String ownerId,
    required String reportId,
  }) async {
    if (!_connectivity.isOnline) {
      throw CareAccessException('Offline. Reconnect to load this report.');
    }
    try {
      final decoded = await _worker.postCareReport(
        ownerId: ownerId,
        reportId: reportId,
      );
      final report = decoded['report'] as Map<String, dynamic>?;
      if (report == null) {
        throw CareAccessException("Couldn't load this report.");
      }
      final metrics = (decoded['metrics'] as List? ?? const [])
          .cast<Map<String, dynamic>>();
      return CareReportDetail(report: report, metrics: metrics);
    } on CareAccessException {
      rethrow;
    } catch (e) {
      throw CareAccessException(
        _friendlyWorkerError(e, "Couldn't load this report."),
      );
    }
  }

  String _friendlyWorkerError(Object e, String fallback) {
    if (e is WorkerApiException && e.message.trim().isNotEmpty) {
      return e.message;
    }
    return fallback;
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

  /// Count of pending caregiver changes awaiting the signed-in owner's review.
  ///
  /// Mirrors web `getPendingChangesCount` (`pending_changes` where
  /// `owner_id = me AND status = 'pending'`). Read directly under the
  /// `pending_owner_all` RLS policy (`auth.uid() = owner_id`), so no service
  /// role is required. Returns 0 when signed out or offline.
  Future<int> pendingChangesCount() async {
    final userId = _caregiverId;
    if (userId == null) return 0;
    if (!_connectivity.isOnline) return 0;

    try {
      final rows = await _supabase
          .from('pending_changes')
          .select('id')
          .eq('owner_id', userId)
          .eq('status', 'pending');
      return (rows as List).length;
    } catch (_) {
      return 0;
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

  /// Decline a pending care invite addressed to the signed-in user's email.
  ///
  /// SECURITY: like [acceptInvite], the status flip to `revoked` requires
  /// service role -- RLS's `care_rel_caregiver_select` is SELECT-only and
  /// scoped to `auth.uid() = caregiver_id`, which is NULL on a still-pending
  /// invite. A direct client `.update()` here is a silent 0-row no-op, so
  /// this goes through the `/api/care/decline` Worker route instead (mirrors
  /// [acceptInvite]'s `/api/care/accept` call).
  Future<void> declineIncomingCareInvite(String relationshipId) async {
    final session = _supabase.auth.currentSession;
    final accessToken = session?.accessToken;
    if (accessToken == null || accessToken.isEmpty) {
      throw CareAccessException('Sign in to decline this invite.');
    }

    if (!_connectivity.isOnline) {
      throw CareAccessException('Offline. Reconnect to decline this invite.');
    }

    final headers = <String, String>{
      'Authorization': 'Bearer $accessToken',
      'Accept': 'application/json',
      if (!kIsWeb) 'Content-Type': 'application/json',
    };

    http.Response response;
    try {
      response = await _http.post(
        Uri.parse('${_config.workerApiBaseUrl}/care/decline'),
        headers: headers,
        body: jsonEncode({'relationship_id': relationshipId}),
      );
    } catch (_) {
      throw CareAccessException(
        "Couldn't reach Purple to decline this invite. Try again.",
      );
    }

    Map<String, dynamic> decoded;
    try {
      decoded = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      decoded = <String, dynamic>{};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message =
          decoded['error'] as String? ?? "Couldn't decline this invite.";
      throw CareAccessException(message);
    }
  }

  /// Accept a caregiver invite by its single-use token.
  ///
  /// Mirrors the web `acceptInvite` server contract exactly (marketing
  /// `src/routes/care.accept.tsx` -> `src/lib/care.functions.ts` `acceptInvite`):
  /// an authenticated `POST { invite_token }`. The mutation flips the
  /// relationship to `active`, verifies the accepter's email matches the
  /// invite, and writes the audit-log row.
  ///
  /// SECURITY: the accept UPDATE requires service role — RLS gives caregivers
  /// SELECT-only on `care_relationships` (`care_rel_caregiver_select`; there is
  /// no caregiver UPDATE policy). So this must go through the server, never a
  /// direct client `.update()`. We call the Worker API route that fronts the
  /// server function, mirroring the established WorkerClient pattern
  /// (`/api/health/whoop-sync`, `/api/account/personal-share-code`).
  ///
  /// Returns the accepted relationship's `ownerId` so callers can route into
  /// that owner's dashboard.
  Future<String> acceptInvite(String inviteToken) async {
    final token = inviteToken.trim();
    if (token.length < 20 || token.length > 128) {
      throw CareAccessException('This invite link is invalid or incomplete.');
    }

    final session = _supabase.auth.currentSession;
    final accessToken = session?.accessToken;
    if (accessToken == null || accessToken.isEmpty) {
      throw CareAccessException('Sign in to accept this invite.');
    }

    if (!_connectivity.isOnline) {
      throw CareAccessException('Offline. Reconnect to accept this invite.');
    }

    final headers = <String, String>{
      'Authorization': 'Bearer $accessToken',
      'Accept': 'application/json',
      // Match WorkerClient: skip Content-Type on web to avoid CORS preflight.
      if (!kIsWeb) 'Content-Type': 'application/json',
    };

    http.Response response;
    try {
      response = await _http.post(
        Uri.parse('${_config.workerApiBaseUrl}/care/accept'),
        headers: headers,
        body: jsonEncode({'invite_token': token}),
      );
    } catch (_) {
      throw CareAccessException(
        "Couldn't reach Purple to accept this invite. Try again.",
      );
    }

    Map<String, dynamic> decoded;
    try {
      decoded = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      decoded = <String, dynamic>{};
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded['error'] as String? ??
          "Couldn't accept this invite.";
      throw CareAccessException(message);
    }

    final ownerId = decoded['owner_id'] as String?;
    if (ownerId == null || ownerId.isEmpty) {
      // Contract fulfilled but shape unexpected: surface a safe generic error.
      throw CareAccessException("Couldn't accept this invite.");
    }
    return ownerId;
  }

  void dispose() => _http.close();

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

  /// List pending care invites addressed to the signed-in user's email.
  ///
  /// SECURITY: like [acceptInvite]/[declineIncomingCareInvite], a direct
  /// client-side SELECT here is silently RLS-blocked -- `care_rel_caregiver_select`
  /// only permits `auth.uid() = caregiver_id`, which is NULL on a pending
  /// (not-yet-accepted) invite. So this calls the service-role
  /// `/api/care/incoming-invites` Worker route (mirrors web's `listIncomingCareInvites`
  /// server fn) instead of querying `care_relationships` directly.
  Future<List<IncomingCareInvite>> _loadIncomingCareInvites(
    String userId,
  ) async {
    final session = _supabase.auth.currentSession;
    final accessToken = session?.accessToken;
    if (accessToken == null || accessToken.isEmpty) return const [];

    final headers = <String, String>{
      'Authorization': 'Bearer $accessToken',
      'Accept': 'application/json',
    };

    http.Response response;
    try {
      response = await _http.get(
        Uri.parse('${_config.workerApiBaseUrl}/care/incoming-invites'),
        headers: headers,
      );
    } catch (_) {
      return const [];
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return const [];
    }

    Map<String, dynamic> decoded;
    try {
      decoded = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return const [];
    }

    final rawInvites = decoded['invites'];
    if (rawInvites is! List) return const [];

    return rawInvites.whereType<Map<String, dynamic>>().map((row) {
      final role = row['role'] as String? ?? CareRole.caregiver.name;
      return IncomingCareInvite(
        id: row['id'] as String,
        ownerId: row['owner_id'] as String,
        role: role,
        roleLabel: row['role_label'] as String? ?? role,
        ownerName: row['owner_name'] as String? ?? 'A Purple member',
        createdAt: row['created_at'] as String? ?? '',
        inviteToken: row['invite_token'] as String?,
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

extension _CareTodayCopy on CareTodaySnapshot {
  CareTodaySnapshot copyWith({bool? isFromCache}) => CareTodaySnapshot(
        scopeGranted: scopeGranted,
        forecast: forecast,
        alerts: alerts,
        isFromCache: isFromCache ?? this.isFromCache,
        loadError: loadError,
      );
}

extension _CareMedsCopy on CareMedsSnapshot {
  CareMedsSnapshot copyWith({bool? isFromCache}) => CareMedsSnapshot(
        scopeGranted: scopeGranted,
        meds: meds,
        doses: doses,
        isFromCache: isFromCache ?? this.isFromCache,
        loadError: loadError,
      );
}

extension _CareJournalCopy on CareJournalSnapshot {
  CareJournalSnapshot copyWith({bool? isFromCache}) => CareJournalSnapshot(
        scopeGranted: scopeGranted,
        entries: entries,
        isFromCache: isFromCache ?? this.isFromCache,
        loadError: loadError,
      );
}

extension _CareSeizuresCopy on CareSeizuresSnapshot {
  CareSeizuresSnapshot copyWith({bool? isFromCache}) => CareSeizuresSnapshot(
        scopeGranted: scopeGranted,
        events: events,
        isFromCache: isFromCache ?? this.isFromCache,
        loadError: loadError,
      );
}

extension _CareReportsCopy on CareReportsSnapshot {
  CareReportsSnapshot copyWith({bool? isFromCache}) => CareReportsSnapshot(
        scopeGranted: scopeGranted,
        reports: reports,
        isFromCache: isFromCache ?? this.isFromCache,
        loadError: loadError,
      );
}

final careRepositoryProvider = Provider<CareRepository>((ref) {
  ref.watch(authRepositoryProvider);
  final repo = CareRepository(
    supabase: ref.watch(supabaseClientProvider),
    connectivity: ref.watch(connectivityServiceProvider),
    config: ref.watch(appConfigProvider),
    worker: ref.watch(workerClientProvider),
  );
  ref.onDispose(repo.dispose);
  return repo;
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

final careTodayProvider = FutureProvider.autoDispose
    .family<CareTodaySnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerToday(ownerId: ownerId, overview: overview);
});

final careMedsProvider = FutureProvider.autoDispose
    .family<CareMedsSnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerMeds(ownerId: ownerId, overview: overview);
});

final careJournalProvider = FutureProvider.autoDispose
    .family<CareJournalSnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerJournal(ownerId: ownerId, overview: overview);
});

final careSeizuresProvider = FutureProvider.autoDispose
    .family<CareSeizuresSnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerSeizures(ownerId: ownerId, overview: overview);
});

final careReportsProvider = FutureProvider.autoDispose
    .family<CareReportsSnapshot, String>((ref, ownerId) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  final overview = await ref.watch(careOverviewProvider(ownerId).future);
  return repo.loadOwnerReports(ownerId: ownerId, overview: overview);
});

/// Composite key for the single-report detail provider.
class CareReportKey {
  const CareReportKey(this.ownerId, this.reportId);

  final String ownerId;
  final String reportId;

  @override
  bool operator ==(Object other) =>
      other is CareReportKey &&
      other.ownerId == ownerId &&
      other.reportId == reportId;

  @override
  int get hashCode => Object.hash(ownerId, reportId);
}

final careReportDetailProvider = FutureProvider.autoDispose
    .family<CareReportDetail, CareReportKey>((ref, key) async {
  ref.watch(authSessionProvider);
  final repo = ref.watch(careRepositoryProvider);
  return repo.loadOwnerReport(ownerId: key.ownerId, reportId: key.reportId);
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
    this.inviteToken,
  });

  final String id;
  final String ownerId;
  final String role;
  final String roleLabel;
  final String ownerName;
  final String createdAt;

  /// Single-use invite token used to accept via the server contract. Null once
  /// the invite is no longer pending (DB trigger clears it on status change).
  final String? inviteToken;
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

/// Pending caregiver-change count for the top-bar inbox badge.
///
/// Mirrors web `PendingInboxBadge` (`getPendingChangesCount`). Kept alive so
/// the header badge stays warm across screens; refreshed on auth changes.
final carePendingCountProvider = FutureProvider<int>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(careRepositoryProvider).pendingChangesCount();
});
