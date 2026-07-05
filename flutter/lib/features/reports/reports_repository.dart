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
