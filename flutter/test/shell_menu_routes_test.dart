import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/shell/routes.dart';

/// Static audit of endDrawer burger destinations.
/// Widget pumping of [ShellMenuPanel] is covered indirectly by shell wiring;
/// this suite locks the route contract Account / Settings / Tools / Care / Sign out.
void main() {
  group('endDrawer burger route contract', () {
    test('Account Settings Tools Care Sign out paths are stable', () {
      expect(AppRoutes.account, '/account');
      expect(AppRoutes.settings, '/settings');
      expect(AppRoutes.tools, '/tools');
      expect(AppRoutes.careIndex, '/care');
      expect(AppRoutes.signIn, '/sign-in');
    });

    test('Account Settings Tools Care remain protected paths', () {
      for (final path in [
        AppRoutes.account,
        AppRoutes.settings,
        AppRoutes.tools,
        AppRoutes.careIndex,
      ]) {
        expect(
          AppRoutes.protectedPaths.any(
            (route) => path == route || path.startsWith('$route/'),
          ),
          isTrue,
          reason: '$path must stay behind auth',
        );
      }
    });

    test('account remains a known deep-link path', () {
      expect(AppRoutes.protectedPaths.contains(AppRoutes.account), isTrue);
    });
  });
}
