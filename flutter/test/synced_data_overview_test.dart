import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/vitals/synced_data_overview.dart';
import 'package:purple_app/features/vitals/vitals_repository.dart';

void main() {
  group('SyncedDataOverview.merge', () {
    test('combines coverage days with token last sync', () {
      final overview = SyncedDataOverview.merge(
        coverage: const WearableCoverage(
          daysBySource: {'oura': 42, 'apple_health': 10},
          lastReadingBySource: {
            'oura': '2026-07-04T08:00:00Z',
            'apple_health': '2026-07-03T12:00:00Z',
          },
        ),
        tokenLastSync: {
          'oura': '2026-07-05T06:00:00Z',
          'whoop': null,
          'apple_health': '2026-07-02T09:00:00Z',
        },
        tokenConnected: {
          'oura': true,
          'whoop': false,
          'apple_health': true,
        },
      );

      expect(overview.sources.length, 2);
      expect(overview.daysForSource('oura'), 42);
      expect(overview.daysForSource('apple_health'), 10);
      expect(
        overview.sources.firstWhere((s) => s.sourceKey == 'oura').lastSyncAt,
        '2026-07-05T06:00:00Z',
      );
      expect(
        overview.sources.firstWhere((s) => s.sourceKey == 'apple_health').lastSyncAt,
        '2026-07-03T12:00:00Z',
      );
    });

    test('includes connected sources without readings', () {
      final overview = SyncedDataOverview.merge(
        coverage: WearableCoverage.empty,
        tokenLastSync: {'whoop': '2026-07-01T10:00:00Z'},
        tokenConnected: {'whoop': true},
      );

      expect(overview.sources.length, 1);
      expect(overview.sources.single.sourceKey, 'whoop');
      expect(overview.sources.single.connected, isTrue);
      expect(overview.sources.single.coverageDays, 0);
    });
  });

  group('syncedRelativeTime', () {
    test('formats recent sync', () {
      final now = DateTime.now().toUtc();
      expect(syncedRelativeTime(now.toIso8601String()), 'just now');
    });

    test('handles null', () {
      expect(syncedRelativeTime(null), 'never');
    });
  });
}
