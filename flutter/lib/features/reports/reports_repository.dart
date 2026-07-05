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
          'status, created_at, summary',
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
            'status, created_at, summary',
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

      return (response as List)
          .cast<Map<String, dynamic>>()
          .map(ReportMetricRow.fromMap)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  Future<ReportDetailData?> loadReportDetail(String reportId) async {
    final document = await loadDocument(reportId);
    if (document == null) return null;
    final metrics = await loadMetricsForReport(reportId);
    return ReportDetailData(document: document, metrics: metrics);
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
            'reference_low, reference_high, flag, measured_at, report_id',
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
