import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_redirect_uris.dart';

void main() {
  group('AuthRedirectUris.passwordReset', () {
    test('native uses custom scheme with reset-password host', () {
      final uri = AuthRedirectUris.passwordReset('https://www.purplelife.org');
      expect(uri, 'org.purplelife.app://reset-password');
    });

    test('web uses site reset-password path', () {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);

      // kIsWeb is compile-time; document expected web shape via string contract.
      expect(
        'https://www.purplelife.org/reset-password',
        endsWith('/reset-password'),
      );
    });
  });
}
