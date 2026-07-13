import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/wearable_sync.dart';

void main() {
  final now = DateTime.utc(2026, 7, 12, 18, 0);

  group('shouldVisitSyncProvider', () {
    test('defaults missing sync_mode to visit and syncs when never synced', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: null,
          lastSyncAt: null,
          updatedAt: null,
          now: now,
        ),
        isTrue,
      );
    });

    test('skips non-visit modes', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: 'manual',
          lastSyncAt: null,
          updatedAt: null,
          now: now,
        ),
        isFalse,
      );
      expect(
        shouldVisitSyncProvider(
          syncMode: 'pull',
          lastSyncAt: null,
          updatedAt: null,
          now: now,
        ),
        isFalse,
      );
      expect(
        shouldVisitSyncProvider(
          syncMode: 'interval',
          lastSyncAt: null,
          updatedAt: null,
          now: now,
        ),
        isFalse,
      );
    });

    test('throttles visit sync within 3 hours', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: 'visit',
          lastSyncAt: now.subtract(const Duration(hours: 1)).toIso8601String(),
          updatedAt: null,
          now: now,
        ),
        isFalse,
      );
    });

    test('allows visit sync after 3 hours', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: 'visit',
          lastSyncAt: now.subtract(const Duration(hours: 3, minutes: 1)).toIso8601String(),
          updatedAt: null,
          now: now,
        ),
        isTrue,
      );
    });

    test('force bypasses throttle', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: 'visit',
          lastSyncAt: now.subtract(const Duration(minutes: 5)).toIso8601String(),
          updatedAt: null,
          now: now,
          force: true,
        ),
        isTrue,
      );
    });

    test('uses updated_at when last_sync_at is missing', () {
      expect(
        shouldVisitSyncProvider(
          syncMode: 'visit',
          lastSyncAt: null,
          updatedAt: now.subtract(const Duration(hours: 1)).toIso8601String(),
          now: now,
        ),
        isFalse,
      );
    });
  });
}
