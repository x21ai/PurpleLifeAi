import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/tools/wearable_oauth.dart';

void main() {
  group('WearableOAuth.redirectUri', () {
    test('native Oura uses custom scheme callback', () {
      expect(
        WearableOAuth.redirectUri(WearableOAuthProvider.oura),
        'org.purplelife.app://oauth-oura-callback',
      );
    });

    test('native Whoop uses custom scheme callback', () {
      expect(
        WearableOAuth.redirectUri(WearableOAuthProvider.whoop),
        'org.purplelife.app://oauth-whoop-callback',
      );
    });
  });

  group('WearableOAuth scopes', () {
    test('Oura scope matches web oura-connection.tsx', () {
      expect(
        WearableOAuth.ouraScope,
        'email personal daily heartrate workout tag session spo2',
      );
    });

    test('Whoop scope includes offline for refresh token', () {
      expect(WearableOAuth.whoopScope, contains('offline'));
      expect(WearableOAuth.whoopScope, contains('read:recovery'));
      expect(WearableOAuth.whoopScope, contains('read:sleep'));
    });
  });

  group('WearableOAuth.providerFromCallbackUri', () {
    test('parses native Oura deep link', () {
      final uri = Uri.parse(
        'org.purplelife.app://oauth-oura-callback?code=abc&state=user',
      );
      expect(
        WearableOAuth.providerFromCallbackUri(uri),
        WearableOAuthProvider.oura,
      );
    });

    test('parses web Oura callback path', () {
      final uri = Uri.parse(
        'https://www.purplelife.org/oauth/oura/callback?code=abc',
      );
      expect(
        WearableOAuth.providerFromCallbackUri(uri),
        WearableOAuthProvider.oura,
      );
    });

    test('parses web Whoop callback path', () {
      final uri = Uri.parse(
        'https://www.purplelife.org/oauth/whoop/callback?code=abc',
      );
      expect(
        WearableOAuth.providerFromCallbackUri(uri),
        WearableOAuthProvider.whoop,
      );
    });

    test('parses native Whoop deep link', () {
      final uri = Uri.parse(
        'org.purplelife.app://oauth-whoop-callback?code=abc&state=user',
      );
      expect(
        WearableOAuth.providerFromCallbackUri(uri),
        WearableOAuthProvider.whoop,
      );
    });
  });

  group('ouraFunctionErrorMessage', () {
    test('surfaces redirect URI registration hint', () {
      expect(
        ouraFunctionErrorMessage(
          {'error': 'Oura token exchange failed: 400 invalid redirect_uri'},
        ),
        contains('org.purplelife.app://oauth-oura-callback'),
      );
    });

    test('returns server error with status code', () {
      expect(
        ouraFunctionErrorMessage(null, statusCode: 503),
        contains('503'),
      );
    });
  });

  group('whoopFunctionErrorMessage', () {
    test('surfaces redirect URI registration hint', () {
      expect(
        whoopFunctionErrorMessage(
          {'error': 'invalid redirect_uri'},
        ),
        contains('org.purplelife.app://oauth-whoop-callback'),
      );
    });

    test('returns server error with status code', () {
      expect(
        whoopFunctionErrorMessage(null, statusCode: 502),
        contains('502'),
      );
    });
  });

  group('oauthCallbackQueryErrorMessage', () {
    test('maps access_denied to friendly copy', () {
      expect(
        oauthCallbackQueryErrorMessage('access_denied', null),
        contains('cancelled'),
      );
    });
  });

  group('WearableOAuth.nativeConnectSetupHint', () {
    test('Oura has no setup hint once redirect is registered', () {
      expect(
        WearableOAuth.nativeConnectSetupHint(WearableOAuthProvider.oura),
        isNull,
      );
    });

    test('Whoop hint includes native redirect URI', () {
      expect(
        WearableOAuth.nativeConnectSetupHint(WearableOAuthProvider.whoop),
        contains('org.purplelife.app://oauth-whoop-callback'),
      );
    });
  });
}
