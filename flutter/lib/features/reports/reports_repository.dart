import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../core/providers/core_providers.dart';
import 'models/report_row.dart';

/// Read-only reports list from Supabase (`report_documents`, `medical_reports`).
class ReportsRepository {
  ReportsRepository({required SupabaseClient supabase}) : _supabase = supabase;

  final SupabaseClient _supabase;

  String? get _userId =>
      _supabase.auth.currentSession?.user.id ?? _supabase.auth.currentUser?.id;

  Future<ReportsHubData> loadHub() async {
    if (_userId == null) {
      return const ReportsHubData(
        documents: [],
        medicalReports: [],
        loadError: 'Sign in to view reports.',
      );
    }

    try {
      final documents = await _loadDocuments();
      final medicalReports = await _loadMedicalReports();
      return ReportsHubData(
        documents: documents,
        medicalReports: medicalReports,
      );
    } catch (_) {
      return const ReportsHubData(
        documents: [],
        medicalReports: [],
        loadError: 'Could not load reports right now.',
      );
    }
  }

  Future<List<ReportDocumentRow>> _loadDocuments() async {
    final response = await _supabase
        .from('report_documents')
        .select(
          'id, title, report_type, report_category, report_date, file_mime, '
          'status, created_at, summary, ai_summary, error_message',
        )
        .order('report_date', ascending: false);

    final rows = (response as List).cast<Map<String, dynamic>>();
    if (rows.isEmpty) return const [];

    final ids = rows.map((row) => row['id'] as String).toList();
    final counts = await _metricCounts(ids);

    return rows
        .map(
          (row) => ReportDocumentRow.fromMap(
            row,
            metricCount: counts[row['id'] as String] ?? 0,
          ),
        )
        .toList();
  }

  Future<Map<String, int>> _metricCounts(List<String> reportIds) async {
    if (reportIds.isEmpty) return const {};

    try {
      final response = await _supabase
          .from('report_metrics')
          .select('report_id')
          .inFilter('report_id', reportIds);
      final counts = <String, int>{};
      for (final row in (response as List).cast<Map<String, dynamic>>()) {
        final id = row['report_id'] as String;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    } catch (_) {
      return const {};
    }
  }

  Future<List<MedicalReportRow>> _loadMedicalReports() async {
    final response = await _supabase
        .from('medical_reports')
        .select('id, window_from, window_to, created_at, summary')
        .order('created_at', ascending: false)
        .limit(50);

    return (response as List)
        .cast<Map<String, dynamic>>()
        .map(MedicalReportRow.fromMap)
        .toList();
  }

  Future<ReportDocumentRow?> loadDocument(String reportId) async {
    if (_userId == null) return null;

    try {
      final response = await _supabase
          .from('report_documents')
          .select(
            'id, title, report_type, report_category, report_date, file_mime, '
            'status, created_at, summary, ai_summary, error_message',
          )
          .eq('id', reportId)
          .maybeSingle();
      if (response == null) return null;

      final row = Map<String, dynamic>.from(response);
      final counts = await _metricCounts([reportId]);
      return ReportDocumentRow.fromMap(
        row,
        metricCount: counts[reportId] ?? 0,
      );
    } catch (_) {
      return null;
    }
  }

  Future<List<ReportMetricRow>> loadMetricsForReport(String reportId) async {
    if (_userId == null) return const [];

    try {
      final response = await _supabase
          .from('report_metrics')
          .select(
            'id, metric_key, display_name, value, value_text, unit, '
            'reference_low, reference_high, flag, measured_at, report_id',
          )
          .eq('report_id', reportId)
          .order('display_name');

      final metrics = (response as List)
          .cast<Map<String, dynamic>>()
          .map(ReportMetricRow.fromMap)
          .toList();
      return _attachPanels(metrics);
    } catch (_) {
      return const [];
    }
  }

  /// Load `metric_dictionary.panel` for the given metric keys and return the
  /// metrics with their `panel` attached, so the detail screen can group
  /// values by panel (mirrors web `getReport`'s dictionary join). Best-effort:
  /// on any failure the original metrics are returned unchanged.
  Future<List<ReportMetricRow>> _attachPanels(
    List<ReportMetricRow> metrics,
  ) async {
    if (metrics.isEmpty) return metrics;
    final keys = metrics.map((m) => m.metricKey).toSet().toList();
    try {
      final response = await _supabase
          .from('metric_dictionary')
          .select('metric_key, panel')
          .inFilter('metric_key', keys);
      final panelByKey = <String, String?>{};
      for (final row in (response as List).cast<Map<String, dynamic>>()) {
        panelByKey[row['metric_key'] as String] = row['panel'] as String?;
      }
      if (panelByKey.isEmpty) return metrics;
      return metrics
          .map((m) => m.copyWith(panel: panelByKey[m.metricKey] ?? 'other'))
          .toList();
    } catch (_) {
      return metrics;
    }
  }

  Future<ReportDetailData?> loadReportDetail(String reportId) async {
    final document = await loadDocument(reportId);
    if (document == null) return null;
    final metrics = await loadMetricsForReport(reportId);
    return ReportDetailData(document: document, metrics: metrics);
  }

  /// Short-lived (5 min) signed URL for the uploaded report file — mirrors web
  /// `getReportFileUrl` (reports.functions.ts). Client-doable: the auth'd
  /// Supabase client is RLS-scoped to the owner's storage objects, so this is
  /// equivalent to the server fn (which also uses the non-admin client).
  /// Returns null when the report has no file or the URL cannot be signed.
  Future<ReportFileRef?> getReportFileUrl(String reportId) async {
    if (_userId == null) return null;
    try {
      final doc = await _supabase
          .from('report_documents')
          .select('file_path, file_mime, title')
          .eq('id', reportId)
          .maybeSingle();
      final path = doc?['file_path'] as String?;
      if (path == null || path.isEmpty) return null;
      final url = await _supabase.storage
          .from('reports')
          .createSignedUrl(path, 300);
      return ReportFileRef(
        url: url,
        mime: doc?['file_mime'] as String?,
        title: doc?['title'] as String?,
      );
    } catch (_) {
      return null;
    }
  }

  /// Delete a report file + row + audit entry — mirrors web `deleteReport`
  /// (reports.functions.ts). Client-doable via RLS (same non-admin client the
  /// server fn uses). Throws on failure so the UI can surface an honest error;
  /// if RLS blocks the delete this throws a [PostgrestException] rather than
  /// silently succeeding.
  Future<void> deleteReport(String reportId) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Sign in to delete reports.');
    }

    // Remove the storage object first (best-effort; row delete is the source
    // of truth and is what RLS actually guards).
    try {
      final doc = await _supabase
          .from('report_documents')
          .select('file_path')
          .eq('id', reportId)
          .maybeSingle();
      final path = doc?['file_path'] as String?;
      if (path != null && path.isNotEmpty) {
        await _supabase.storage.from('reports').remove([path]);
      }
    } catch (_) {
      // Storage removal is non-fatal; proceed to delete the row.
    }

    await _supabase.from('report_documents').delete().eq('id', reportId);

    // Best-effort PHI audit parity with the web fn. Never block delete on it.
    try {
      await _supabase.from('phi_access_log').insert({
        'user_id': userId,
        'actor_id': userId,
        'action': 'delete',
        'resource_type': 'report_document',
        'resource_id': reportId,
      });
    } catch (_) {
      // Audit insert is advisory; ignore RLS/schema differences.
    }
  }

  Future<List<TrackedMetricSummary>> loadTrackedMetrics() async {
    if (_userId == null) return const [];

    try {
      final response = await _supabase
          .from('report_metrics')
          .select(
            'metric_key, display_name, value, unit, measured_at, created_at',
          )
          .order('measured_at', ascending: false);

      final rows = (response as List).cast<Map<String, dynamic>>();
      final byKey = <String, List<Map<String, dynamic>>>{};
      for (final row in rows) {
        final key = row['metric_key'] as String;
        (byKey[key] ??= []).add(row);
      }

      return byKey.entries.map((entry) {
        final latest = entry.value.first;
        return TrackedMetricSummary(
          metricKey: entry.key,
          displayName: (latest['display_name'] as String?)?.trim().isNotEmpty ==
                  true
              ? (latest['display_name'] as String).trim()
              : entry.key.replaceAll('_', ' '),
          readingCount: entry.value.length,
          latestValue: (latest['value'] as num?)?.toDouble(),
          unit: latest['unit'] as String?,
          latestAt: (latest['measured_at'] as String?) ??
              (latest['created_at'] as String?),
        );
      }).toList()
        ..sort((a, b) => a.displayName.compareTo(b.displayName));
    } catch (_) {
      return const [];
    }
  }

  Future<List<ReportMetricRow>> loadMetricSeries(
    String metricKey, {
    int? days,
  }) async {
    if (_userId == null) return const [];

    try {
      var query = _supabase
          .from('report_metrics')
          .select(
            'id, metric_key, display_name, value, value_text, unit, '
            'reference_low, reference_high, flag, measured_at, report_id, '
            'report_documents(title)',
          )
          .eq('metric_key', metricKey);

      if (days != null) {
        final since = DateTime.now().toUtc().subtract(Duration(days: days));
        query = query.gte('measured_at', since.toIso8601String());
      }

      final response = await query.order('measured_at', ascending: true);
      return (response as List)
          .cast<Map<String, dynamic>>()
          .map(ReportMetricRow.fromMap)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// One-shot fetch of every numeric reading grouped by `metric_key`, oldest
  /// first — used to draw per-metric sparklines on the metrics grid without a
  /// query per metric. Non-numeric rows are dropped by the caller.
  Future<Map<String, List<ReportMetricRow>>> loadAllMetricSeries() async {
    if (_userId == null) return const {};
    try {
      final response = await _supabase
          .from('report_metrics')
          .select(
            'id, metric_key, display_name, value, value_text, unit, '
            'reference_low, reference_high, flag, measured_at, report_id',
          )
          .order('measured_at', ascending: true);

      final byKey = <String, List<ReportMetricRow>>{};
      for (final map in (response as List).cast<Map<String, dynamic>>()) {
        final row = ReportMetricRow.fromMap(map);
        (byKey[row.metricKey] ??= []).add(row);
      }
      return byKey;
    } catch (_) {
      return const {};
    }
  }

  static const _maxUploadBytes = 15 * 1024 * 1024;

  /// Upload a lab PDF or image to storage and insert a `report_documents` row.
  Future<void> uploadReport({
    required String filename,
    required List<int> bytes,
    required String mimeType,
  }) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Sign in to upload reports.');
    }
    if (bytes.length > _maxUploadBytes) {
      throw StateError('File is over 15 MB.');
    }

    final ext = filename.contains('.')
        ? filename.split('.').last.toLowerCase()
        : 'bin';
    final path =
        '$userId/${DateTime.now().millisecondsSinceEpoch}-${const Uuid().v4()}.$ext';

    await _supabase.storage.from('reports').uploadBinary(
          path,
          Uint8List.fromList(bytes),
          fileOptions: FileOptions(
            contentType: mimeType.isNotEmpty ? mimeType : 'application/octet-stream',
            upsert: false,
          ),
        );

    var placeholderTitle = filename.replaceAll(RegExp(r'\.[^.]+$'), '').trim();
    if (placeholderTitle.isEmpty) placeholderTitle = 'Untitled report';
    if (placeholderTitle.length > 200) {
      placeholderTitle = placeholderTitle.substring(0, 200);
    }

    await _supabase.from('report_documents').insert({
      'user_id': userId,
      'title': placeholderTitle,
      'file_path': path,
      'file_mime': mimeType.isNotEmpty ? mimeType : 'application/octet-stream',
      'status': 'processing',
    });
  }
}

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) {
  ref.watch(authRepositoryProvider);
  return ReportsRepository(supabase: ref.watch(supabaseClientProvider));
});

final reportsHubProvider = FutureProvider.autoDispose<ReportsHubData>((ref) {
  ref.keepAlive();
  ref.watch(authSessionProvider);
  return ref.watch(reportsRepositoryProvider).loadHub();
});

final trackedMetricsProvider =
    FutureProvider.autoDispose<List<TrackedMetricSummary>>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(reportsRepositoryProvider).loadTrackedMetrics();
});

final reportDetailProvider = FutureProvider.autoDispose
    .family<ReportDetailData?, String>((ref, reportId) {
  ref.watch(authSessionProvider);
  return ref.watch(reportsRepositoryProvider).loadReportDetail(reportId);
});

final metricSeriesProvider = FutureProvider.autoDispose
    .family<List<ReportMetricRow>, String>((ref, metricKey) {
  ref.watch(authSessionProvider);
  return ref.watch(reportsRepositoryProvider).loadMetricSeries(metricKey);
});

/// All numeric metric series grouped by `metric_key`, for the metrics-grid
/// sparklines. One query, cached for the grid's lifetime.
final allMetricSeriesProvider = FutureProvider.autoDispose<
    Map<String, List<ReportMetricRow>>>((ref) {
  ref.watch(authSessionProvider);
  return ref.watch(reportsRepositoryProvider).loadAllMetricSeries();
});
