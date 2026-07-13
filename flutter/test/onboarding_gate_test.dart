import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/auth/onboarding_gate.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    clearOnboardingGateMemoryCache();
    SharedPreferences.setMockInitialValues({});
  });

  group('profileIsOnboarded', () {
    test('false for null profile', () {
      expect(profileIsOnboarded(null), isFalse);
    });

    test('true when onboarded_at is set', () {
      expect(
        profileIsOnboarded({'onboarded_at': '2026-07-12T00:00:00Z'}),
        isTrue,
      );
    });

    test('true when first_name is non-empty', () {
      expect(profileIsOnboarded({'first_name': 'Devyn'}), isTrue);
    });

    test('false when first_name is blank and onboarded_at null', () {
      expect(
        profileIsOnboarded({'first_name': '  ', 'onboarded_at': null}),
        isFalse,
      );
    });

    test('false for empty profile row', () {
      expect(
        profileIsOnboarded({'id': 'x', 'first_name': null, 'onboarded_at': null}),
        isFalse,
      );
    });
  });

  group('onboarded cache', () {
    test('mark then read returns true', () async {
      const userId = 'bb160030-2ed6-45d7-8a5a-7f6f7879e9bb';
      expect(await readOnboardedCache(userId), isFalse);
      await markOnboardedCache(userId);
      expect(await readOnboardedCache(userId), isTrue);
    });

    test('clear removes cache', () async {
      const userId = '0012113e-0000-0000-0000-000000000001';
      await markOnboardedCache(userId);
      await clearOnboardedCache(userId);
      clearOnboardingGateMemoryCache();
      expect(await readOnboardedCache(userId), isFalse);
    });

    test('cache is per user id', () async {
      await markOnboardedCache('user-a');
      expect(await readOnboardedCache('user-a'), isTrue);
      expect(await readOnboardedCache('user-b'), isFalse);
    });
  });
}
