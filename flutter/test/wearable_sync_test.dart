import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:purple_app/features/today/wearable_sync.dart';

void main() {
  test('guardWearableSyncStep returns onTimeout when future never completes',
      () async {
    final result = await guardWearableSyncStep<String>(
      Completer<String>().future,
      label: 'hanging step',
      onTimeout: 'timed-out',
      timeout: const Duration(milliseconds: 50),
    );
    expect(result, 'timed-out');
  });

  test('guardWearableSyncStep returns value when future completes', () async {
    final result = await guardWearableSyncStep<String>(
      Future.value('ok'),
      label: 'fast step',
      timeout: const Duration(seconds: 1),
    );
    expect(result, 'ok');
  });

  test('guardWearableSyncStep returns null on error', () async {
    final result = await guardWearableSyncStep<String>(
      Future<String>.error(StateError('boom')),
      label: 'error step',
      timeout: const Duration(seconds: 1),
    );
    expect(result, isNull);
  });

  test('wearableSyncTimeout is finite and bounded', () {
    expect(wearableSyncTimeout.inSeconds, greaterThan(0));
    expect(wearableSyncTimeout.inSeconds, lessThanOrEqualTo(30));
  });
}
