import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/auth_repository.dart';

void main() {
  group('AuthRepository.isAuthCallbackUri', () {
    test('detects PKCE code query param', () {
      final uri = Uri.parse(
        'org.purplelife.app://reset-password?code=abc123',
      );
      expect(AuthRepository.isAuthCallbackUri(uri), isTrue);
    });

    test('detects implicit access_token fragment', () {
      final uri = Uri.parse(
        'org.purplelife.app://reset-password#access_token=abc&refresh_token=def',
      );
      expect(AuthRepository.isAuthCallbackUri(uri), isTrue);
    });

    test('returns false for bare reset-password deep link', () {
      final uri = Uri.parse('org.purplelife.app://reset-password');
      expect(AuthRepository.isAuthCallbackUri(uri), isFalse);
    });
  });

  group('AuthRepository.parseAuthCallbackError', () {
    test('marks otp_expired as expired', () {
      final uri = Uri.parse(
        'org.purplelife.app://reset-password?error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      );
      final result = AuthRepository.parseAuthCallbackError(uri);
      expect(result, isNotNull);
      expect(result!.expired, isTrue);
      expect(result.ok, isFalse);
      expect(result.message, contains('invalid'));
    });

    test('parses hash error params', () {
      final uri = Uri.parse(
        'org.purplelife.app://reset-password#error=access_denied&error_code=otp_expired',
      );
      final result = AuthRepository.parseAuthCallbackError(uri);
      expect(result?.expired, isTrue);
    });

    test('returns null when no error params', () {
      final uri = Uri.parse(
        'org.purplelife.app://reset-password?code=abc',
      );
      expect(AuthRepository.parseAuthCallbackError(uri), isNull);
    });
  });
}
