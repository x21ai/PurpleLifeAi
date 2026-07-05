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

    test('marketing home is public and not protected', () {
      expect(AppRoutes.marketingHome, '/');
      expect(AppRoutes.protectedPaths.contains('/'), isFalse);
    });

    test('recognizes marketing paths for deep links', () {
      for (final path in AppRoutes.marketingPaths) {
        expect(
          AppRoutes.protectedPaths.contains(path),
          isFalse,
          reason: '$path must stay public for cold links',
        );
      }
    });
  });
}
