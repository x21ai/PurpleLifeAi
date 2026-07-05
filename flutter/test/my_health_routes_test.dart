import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/shell/routes.dart';

void main() {
  group('signed-in route parity wave 1', () {
    test('my-health is a protected path', () {
      expect(AppRoutes.protectedPaths.contains(AppRoutes.myHealth), isTrue);
    });

    test('reports upload paths are protected', () {
      expect(
        AppRoutes.protectedPaths.contains(AppRoutes.settingsReportsNew),
        isTrue,
      );
      expect(
        AppRoutes.protectedPaths.contains(AppRoutes.reportsNewRedirect),
        isTrue,
      );
    });

    test('vitals metric helper unchanged', () {
      expect(
        AppRoutes.vitalsMetric('hrv'),
        '/vitals/metric/hrv',
      );
    });
  });
}
