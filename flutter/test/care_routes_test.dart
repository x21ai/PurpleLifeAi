import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/shell/routes.dart';

void main() {
  group('care routes', () {
    test('care inbox is a protected path', () {
      expect(AppRoutes.protectedPaths.contains('/care'), isTrue);
      expect(AppRoutes.careInbox, '/care/inbox');
    });

    test('care inbox route is covered by /care prefix guard', () {
      expect(
        AppRoutes.protectedPaths.any(
          (route) =>
              AppRoutes.careInbox == route ||
              AppRoutes.careInbox.startsWith('$route/'),
        ),
        isTrue,
      );
    });

    test('care dashboard helper unchanged', () {
      expect(
        AppRoutes.careDashboard('abc-123'),
        '/care/abc-123',
      );
    });
  });
}
