import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/health/health_service.dart';

void main() {
  group('NativeHealthDay', () {
    test('toSyncJson omits null fields and uses snake_case keys', () {
      const day = NativeHealthDay(
        date: '2026-07-04',
        source: kAppleHealthSource,
        steps: 4200,
        restingHrBpm: 58,
      );

      expect(
        day.toSyncJson(),
        {
          'date': '2026-07-04',
          'resting_hr_bpm': 58,
          'steps': 4200,
        },
      );
    });

    test('merge preserves existing values', () {
      const day = NativeHealthDay(
        date: '2026-07-04',
        source: kAppleHealthSource,
        steps: 1000,
      );

      final merged = day.merge(steps: 2000, hrBpm: 72);
      expect(merged.steps, 2000);
      expect(merged.hrBpm, 72);
      expect(merged.date, '2026-07-04');
    });
  });

  group('isNativeHealthPlatform', () {
    test('is false on Flutter test VM (web/desktop CI)', () {
      expect(isNativeHealthPlatform, isFalse);
    });
  });
}
