import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/auth/sign_in_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  group('friendlyAuthError', () {
    test('maps invalid login credentials to a plain-language message', () {
      const error = AuthApiException(
        'Invalid login credentials',
        statusCode: '400',
      );
      expect(friendlyAuthError(error), 'Email or password is incorrect.');
    });

    test('maps email_not_confirmed code', () {
      const error = AuthApiException(
        'Email not confirmed',
        statusCode: '400',
        code: 'email_not_confirmed',
      );
      expect(
        friendlyAuthError(error),
        'Please confirm your email first. Check your inbox for the link.',
      );
    });

    test('maps user_already_exists code to a sign-in nudge', () {
      const error = AuthApiException(
        'User already registered',
        statusCode: '422',
        code: 'user_already_exists',
      );
      expect(
        friendlyAuthError(error),
        'An account with this email already exists. Try signing in instead.',
      );
    });

    test('maps rate limit codes to a wait-and-retry message', () {
      const error = AuthApiException(
        'Email rate limit exceeded',
        statusCode: '429',
        code: 'over_email_send_rate_limit',
      );
      expect(
        friendlyAuthError(error),
        'Too many attempts. Please wait a moment and try again.',
      );
    });

    test('maps retryable network fetch failures', () {
      final error = AuthRetryableFetchException();
      expect(
        friendlyAuthError(error),
        'Network error. Check your connection and try again.',
      );
    });

    test('falls back to the server message for unmapped auth errors', () {
      const error = AuthApiException(
        'Something specific from the server.',
        statusCode: '400',
      );
      expect(friendlyAuthError(error), 'Something specific from the server.');
    });

    test('never surfaces a raw exception toString for non-auth errors', () {
      final error = Exception('some internal detail');
      final message = friendlyAuthError(error);
      expect(message, isNot(contains('Exception')));
      expect(message, 'Something went wrong. Please try again.');
    });

    test('detects network errors from generic exceptions by message', () {
      final error = Exception('SocketException: Failed host lookup');
      expect(
        friendlyAuthError(error),
        'Network error. Check your connection and try again.',
      );
    });
  });
}
