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

    test('parses web Whoop callback path', () {
      final uri = Uri.parse(
        'https://www.purplelife.org/oauth/whoop/callback?code=abc',
      );
      expect(
        WearableOAuth.providerFromCallbackUri(uri),
        WearableOAuthProvider.whoop,
      );
    });
  });
}
