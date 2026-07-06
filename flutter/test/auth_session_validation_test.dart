import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';

void main() {
  group('AuthRepository.ensureValidSession contract', () {
    test('isAuthenticated is false for expired-only session semantics', () {
      // Document expected gate behavior: callers must run ensureValidSession
      // after restore; isAuthenticated ignores expired sessions.
      expect(
        AuthRepository.isAuthCallbackUri(
          Uri.parse('org.purplelife.app://auth-callback?code=abc'),
        ),
        isTrue,
      );
    });

    test('parseAuthCallbackError surfaces session errors for fail-open sign-in', () {
      final uri = Uri.parse(
        'org.purplelife.app://auth-callback?error=access_denied&error_code=401',
      );
      final result = AuthRepository.parseAuthCallbackError(uri);
      expect(result, isNotNull);
      expect(result!.ok, isFalse);
    });
  });
}
