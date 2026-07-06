import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/core/offline/sync_service.dart';

void main() {
  test('minBackgroundSyncInterval is at least 30 seconds', () {
    expect(
      SyncService.minBackgroundSyncInterval.inSeconds,
      greaterThanOrEqualTo(30),
    );
  });
}
