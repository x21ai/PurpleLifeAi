import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/shell/routes.dart';

void main() {
  group('resolvePlatformInitialLocation', () {
    test('falls back to sign-in when no deep link', () {
      expect(resolvePlatformInitialLocation(), AppRoutes.signIn);
    });

    test('recognizes account as a known app path', () {
      expect(
        AppRoutes.protectedPaths.contains(AppRoutes.account),
        isTrue,
      );
    });

    test('recognizes marketing paths for deep links', () {
      for (final path in AppRoutes.marketingPaths) {
        expect(
          AppRoutes.marketingPaths.contains(path),
          isTrue,
          reason: '$path should be a marketing route',
        );
      }
    });
  });
}
