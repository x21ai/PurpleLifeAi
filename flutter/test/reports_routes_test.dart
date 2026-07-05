import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/shell/routes.dart';

void main() {
  group('Reports child routes (web parity)', () {
    test('reports paths are protected', () {
      for (final path in [
        AppRoutes.reports,
        AppRoutes.reportsMetrics,
        AppRoutes.reportsDocuments,
        AppRoutes.reportsMedicalHistory,
        AppRoutes.reportsNew,
      ]) {
        expect(
          AppRoutes.protectedPaths.contains(path) ||
              AppRoutes.protectedPaths.any((p) => path.startsWith(p)),
          isTrue,
          reason: '$path should be reachable when signed in',
        );
      }
    });

    test('settings reports aliases redirect targets exist', () {
      expect(AppRoutes.settingsReports, '/settings/reports');
      expect(AppRoutes.reportsMetrics, '/reports/metrics');
      expect(AppRoutes.settingsReportsNew, '/settings/reports/new');
      expect(AppRoutes.reportsNew, '/reports/new');
    });

    test('report detail and trend helpers match web paths', () {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(AppRoutes.reportDetail(id), '/reports/$id');
      expect(AppRoutes.isReportId(id), isTrue);
      expect(AppRoutes.isReportId('not-a-uuid'), isFalse);
      expect(AppRoutes.reportTrend('ldl'), '/reports/trends/ldl');
    });

    test('reports prefix covers nested paths', () {
      expect(
        AppRoutes.protectedPaths.contains('/reports/'),
        isTrue,
      );
      expect(
        AppRoutes.protectedPaths.contains(AppRoutes.reportsTrendsPrefix),
        isTrue,
      );
    });
  });
}
