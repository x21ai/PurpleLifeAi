import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/offline/sync_service.dart';

void main() {
  group('SyncService background sync policy', () {
    test('minBackgroundSyncInterval is at least 30 seconds', () {
      expect(
        SyncService.minBackgroundSyncInterval.inSeconds,
        greaterThanOrEqualTo(30),
      );
    });

    test('syncOperationTimeout is positive', () {
      expect(
        SyncService.syncOperationTimeout.inSeconds,
        greaterThan(0),
      );
    });

    test('never throttles before any completed sync', () {
      expect(
        SyncService.shouldThrottleBackgroundSync(
          lastCompletedSyncAt: null,
          elapsed: Duration.zero,
          cacheEmpty: true,
        ),
        isFalse,
      );
    });

    test('does not throttle when cache is empty even within interval', () {
      expect(
        SyncService.shouldThrottleBackgroundSync(
          lastCompletedSyncAt: DateTime.utc(2026, 7, 6),
          elapsed: const Duration(seconds: 10),
          cacheEmpty: true,
        ),
        isFalse,
      );
    });

    test('throttles when cache has data within interval', () {
      expect(
        SyncService.shouldThrottleBackgroundSync(
          lastCompletedSyncAt: DateTime.utc(2026, 7, 6),
          elapsed: const Duration(seconds: 10),
          cacheEmpty: false,
        ),
        isTrue,
      );
    });

    test('does not throttle after interval elapsed', () {
      expect(
        SyncService.shouldThrottleBackgroundSync(
          lastCompletedSyncAt: DateTime.utc(2026, 7, 6),
          elapsed: SyncService.minBackgroundSyncInterval,
          cacheEmpty: false,
        ),
        isFalse,
      );
    });
  });
}
