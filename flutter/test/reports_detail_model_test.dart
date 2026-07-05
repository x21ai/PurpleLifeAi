import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/reports/models/report_row.dart';

void main() {
  group('ReportMetricRow', () {
    test('parses embedded report_documents(title) join', () {
      final row = ReportMetricRow.fromMap({
        'id': 'm1',
        'metric_key': 'ldl',
        'value': 120,
        'report_id': 'r1',
        'report_documents': {'title': 'Quest lipid panel'},
      });
      expect(row.reportTitle, 'Quest lipid panel');
    });

    test('tolerates missing join', () {
      final row = ReportMetricRow.fromMap({
        'id': 'm1',
        'metric_key': 'ldl',
        'value': 120,
        'report_id': 'r1',
      });
      expect(row.reportTitle, isNull);
    });

    test('copyWith attaches panel without touching other fields', () {
      const row = ReportMetricRow(
        id: 'm1',
        metricKey: 'ldl',
        value: 120,
        reportId: 'r1',
      );
      final withPanel = row.copyWith(panel: 'lipids');
      expect(withPanel.panel, 'lipids');
      expect(withPanel.metricKey, 'ldl');
      expect(withPanel.value, 120);
    });
  });

  group('ReportDetailData.metricsByPanel', () {
    ReportMetricRow metric(String key, String? panel) => ReportMetricRow(
          id: key,
          metricKey: key,
          reportId: 'r1',
          value: 1,
          panel: panel,
        );

    test('groups by panel and falls back to other when null', () {
      final data = ReportDetailData(
        document: const ReportDocumentRow(
          id: 'r1',
          title: 'Panel',
          fileMime: 'application/pdf',
          status: 'ready',
          createdAt: '2026-01-01',
        ),
        metrics: [
          metric('ldl', 'lipids'),
          metric('hdl', 'lipids'),
          metric('mystery', null),
        ],
      );
      final grouped = data.metricsByPanel;
      expect(grouped['lipids']!.length, 2);
      expect(grouped['other']!.single.metricKey, 'mystery');
    });
  });

  group('ReportDocumentRow', () {
    test('reads ai_summary and error_message columns', () {
      final row = ReportDocumentRow.fromMap({
        'id': 'r1',
        'title': 'CBC',
        'file_mime': 'application/pdf',
        'status': 'failed',
        'created_at': '2026-01-01',
        'ai_summary': 'Looks stable overall.',
        'error_message': 'unreadable scan',
      });
      expect(row.aiSummary, 'Looks stable overall.');
      expect(row.errorMessage, 'unreadable scan');
    });
  });
}
