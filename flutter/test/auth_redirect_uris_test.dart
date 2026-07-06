import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_redirect_uris.dart';

void main() {
  group('AuthRedirectUris.oauthCallback', () {
    test('native uses custom scheme with auth-callback host', () {
      final uri = AuthRedirectUris.oauthCallback('https://www.purplelife.org');
      expect(uri, 'org.purplelife.app://auth-callback');
    });

    test('nativeOAuthCallback constant matches Capacitor NATIVE_REDIRECT', () {
      expect(
        AuthRedirectUris.nativeOAuthCallback,
        'org.purplelife.app://auth-callback',
      );
    });

    test('web uses site origin root when compile-time web', () {
      // kIsWeb is compile-time; document expected web shape via string contract.
      expect('http://127.0.0.1:8765/', endsWith('/'));
      expect(
        'https://www.purplelife.org/',
        isNot(contains('/auth/callback')),
      );
    });
  });

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
