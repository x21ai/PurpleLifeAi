/// Uploaded lab report or clinician document from `report_documents`.
class ReportDocumentRow {
  const ReportDocumentRow({
    required this.id,
    required this.title,
    this.reportType,
    this.reportCategory,
    this.reportDate,
    required this.fileMime,
    required this.status,
    required this.createdAt,
    this.summary,
    this.metricCount = 0,
  });

  final String id;
  final String title;
  final String? reportType;
  final String? reportCategory;
  final String? reportDate;
  final String fileMime;
  final String status;
  final String createdAt;
  final String? summary;
  final int metricCount;

  String get displayTitle {
    final trimmed = title.trim();
    if (trimmed.isEmpty) return 'Untitled upload';
    if (!RegExp(r'\s').hasMatch(trimmed) &&
        trimmed.length > 28 &&
        RegExp(r'[A-Za-z]').hasMatch(trimmed) &&
        RegExp(r'[0-9]').hasMatch(trimmed)) {
      return 'Untitled upload';
    }
    return trimmed;
  }

  String get dateLabel {
    final raw = reportDate ?? createdAt;
    if (raw.isEmpty) return '';
    return raw.split('T').first;
  }

  factory ReportDocumentRow.fromMap(
    Map<String, dynamic> map, {
    int metricCount = 0,
  }) {
    return ReportDocumentRow(
      id: map['id'] as String,
      title: (map['title'] as String?) ?? '',
      reportType: map['report_type'] as String?,
      reportCategory: map['report_category'] as String?,
      reportDate: map['report_date'] as String?,
      fileMime: (map['file_mime'] as String?) ?? 'application/pdf',
      status: (map['status'] as String?) ?? 'ready',
      createdAt: (map['created_at'] as String?) ?? '',
      summary: map['summary'] as String?,
      metricCount: metricCount,
    );
  }
}

/// Generated medical history PDF from `medical_reports`.
class MedicalReportRow {
  const MedicalReportRow({
    required this.id,
    required this.windowFrom,
    required this.windowTo,
    required this.createdAt,
    this.summary,
  });

  final String id;
  final String windowFrom;
  final String windowTo;
  final String createdAt;
  final String? summary;

  String get windowLabel {
    final from = windowFrom.split('T').first;
    final to = windowTo.split('T').first;
    return '$from to $to';
  }

  factory MedicalReportRow.fromMap(Map<String, dynamic> map) {
    return MedicalReportRow(
      id: map['id'] as String,
      windowFrom: (map['window_from'] as String?) ?? '',
      windowTo: (map['window_to'] as String?) ?? '',
      createdAt: (map['created_at'] as String?) ?? '',
      summary: map['summary'] as String?,
    );
  }
}

class ReportsHubData {
  const ReportsHubData({
    required this.documents,
    required this.medicalReports,
    this.loadError,
  });

  final List<ReportDocumentRow> documents;
  final List<MedicalReportRow> medicalReports;
  final String? loadError;

  bool get isEmpty => documents.isEmpty && medicalReports.isEmpty;

  static const empty = ReportsHubData(
    documents: [],
    medicalReports: [],
  );
}
